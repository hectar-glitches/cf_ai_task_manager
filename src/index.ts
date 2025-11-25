interface Env {
  AI: any;
}

// Function to search Semantic Scholar for papers
async function searchPapers(query: string, limit: number = 5) {
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodedQuery}&limit=${limit}&fields=title,authors,year,abstract,url,citationCount,venue,paperId`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      console.error('Semantic Scholar API error:', response.status);
      return null;
    }
    
    const data = await response.json() as any;
    return data.data || [];
  } catch (error) {
    console.error('Error searching papers:', error);
    return null;
  }
}

// Function to format papers in APA for AI context
function formatPapersForAI(papers: any[]) {
  if (!papers || papers.length === 0) return "No papers found.";
  
  return papers.map((paper, idx) => {
    const authors = paper.authors?.map((a: any) => a.name).join(', ') || 'Unknown';
    const year = paper.year || 'n.d.';
    const title = paper.title;
    const venue = paper.venue || 'No venue';
    const citations = paper.citationCount || 0;
    const link = `https://www.semanticscholar.org/paper/${paper.paperId}`;
    
    // Format with numbering and markdown
    return `**${idx + 1}. ${authors} (${year})**\n*${title}*\n${venue} • ${citations} citations\n[View on Semantic Scholar](${link})`;
  }).join('\n\n');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (path === "/" || path === "/api/health") {
      return new Response(JSON.stringify({ 
        status: "healthy", 
        timestamp: new Date().toISOString(),
        ai_available: !!env.AI
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Chat endpoint - Research Synthesis Agent
    if (path === "/api/chat" && request.method === "POST") {
      const { message, history } = await request.json() as any;
      
      let aiContent;
      
      // Use AI to determine if user wants papers and extract topic
      const intentCheckPrompt = `You are a research assistant intent detector. Analyze this user message and determine:
1. Does the user want academic papers/articles/research? (yes/no)
2. If yes, what is the research topic? (extract just the topic, no extra words)

User message: "${message}"

Respond in this exact format:
WANTS_PAPERS: yes/no
TOPIC: [topic or "none"]`;

      let wantsPapers = false;
      let researchTopic = "";
      
      if (env.AI) {
        try {
          const intentResponse = await env.AI.run('@cf/meta/llama-3.1-70b-instruct', {
            messages: [
              { role: 'system', content: 'You are a helpful intent classifier. Be concise.' },
              { role: 'user', content: intentCheckPrompt }
            ],
            max_tokens: 100
          }) as any;
          
          const intentText = intentResponse?.response || '';
          console.log('Intent check response:', intentText);
          
          wantsPapers = /WANTS_PAPERS:\s*yes/i.test(intentText);
          const topicMatch = intentText.match(/TOPIC:\s*(.+?)(?:\n|$)/i);
          researchTopic = topicMatch ? topicMatch[1].trim().replace(/["']/g, '') : message;
          
          console.log('Wants papers:', wantsPapers, 'Topic:', researchTopic);
        } catch (error) {
          console.error('Intent check error:', error);
          // Fallback to regex
          wantsPapers = /\b(papers?|articles?|research|studies|publications?|sources?)\b/i.test(message);
          researchTopic = message;
        }
      }
      
      if (wantsPapers && researchTopic && researchTopic !== 'none') {
        console.log('Searching for papers on:', researchTopic);
        const papers = await searchPapers(researchTopic, 5);
        console.log('Papers found:', papers ? papers.length : 0);
        if (papers && papers.length > 0) {
          // Return papers directly without AI to avoid hallucination
          console.log('RETURNING PAPERS DIRECTLY - BYPASSING AI');
          const formattedPapers = formatPapersForAI(papers);
          aiContent = `## Research Papers on "${researchTopic}"\n\nI found ${papers.length} relevant papers from Semantic Scholar:\n\n${formattedPapers}\n\n---\n*Tip: Click the links to view full papers with abstracts and citations.*`;
          
          return new Response(JSON.stringify({
            message: {
              id: Date.now(),
              content: aiContent,
              timestamp: new Date().toISOString(),
              type: 'agent'
            }
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }
      
      let systemPrompt = "You are a helpful research assistant.";
      
      // Use Cloudflare Workers AI for research synthesis
      if (env.AI) {
        try {
          const messages = [
            { 
              role: 'system', 
              content: systemPrompt
            }
          ];
          
          // Add conversation history if provided
          if (history && Array.isArray(history)) {
            messages.push(...history);
          }
          
          // Add current message
          messages.push({ role: 'user', content: message });
          
          const aiResponse = await env.AI.run('@cf/meta/llama-3.1-70b-instruct', {
            messages,
            max_tokens: 2048
          }) as any;
          
          console.log('Raw AI response:', JSON.stringify(aiResponse).substring(0, 200));
          
          // Try multiple ways to extract the content
          aiContent = aiResponse?.response || 
                     aiResponse?.result?.response || 
                     aiResponse?.choices?.[0]?.message?.content ||
                     aiResponse?.content ||
                     null;
          
          console.log('Extracted aiContent:', aiContent ? 'Success' : 'Failed', typeof aiContent);
          
          if (aiContent && typeof aiContent === 'string') {
            console.log('AI Response received successfully, length:', aiContent.length);
          } else {
            console.error('Unexpected AI response format. Full response:', JSON.stringify(aiResponse));
            aiContent = null;
          }
        } catch (error) {
          console.error('AI call error:', error);
          aiContent = null;
        }
      } else {
        console.error('AI binding not available');
      }

      // Fallback response
      if (!aiContent || typeof aiContent !== 'string') {
        aiContent = `I'm your research synthesis assistant. You asked: "${message}". I can help you find credible sources, evaluate academic literature, and synthesize research insights. What research topic would you like to explore?`;
      }

      return new Response(JSON.stringify({
        message: {
          id: Date.now(),
          content: aiContent,
          timestamp: new Date().toISOString(),
          type: "agent"
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Simple empty responses for other endpoints (for UI compatibility)
    if (path === "/api/tasks") {
      return new Response(JSON.stringify({ tasks: [], total: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (path === "/api/analytics") {
      return new Response(JSON.stringify({
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        productivityScore: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response("Not Found", { status: 404 });
  }
};