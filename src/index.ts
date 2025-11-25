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

// Function to format papers for AI context
function formatPapersForAI(papers: any[]) {
  if (!papers || papers.length === 0) return "No papers found.";
  
  return papers.map((paper, idx) => {
    const authors = paper.authors?.map((a: any) => a.name).join(', ') || 'Unknown authors';
    return `${idx + 1}. "${paper.title}" by ${authors} (${paper.year || 'N/A'})
   Citations: ${paper.citationCount || 0} | Venue: ${paper.venue || 'N/A'}
   URL: https://www.semanticscholar.org/paper/${paper.paperId}
   Abstract: ${paper.abstract?.substring(0, 200) || 'No abstract available'}...`;
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
      
      // Check if user is asking for papers and search Semantic Scholar
      const askingForPapers = /\b(papers?|articles?|research|studies|publications?|find|search|sources?)\b/i.test(message);
      let papersContext = "";
      
      if (askingForPapers) {
        console.log('Searching for papers on:', message);
        const papers = await searchPapers(message, 5);
        console.log('Papers found:', papers ? papers.length : 0);
        if (papers && papers.length > 0) {
          papersContext = `\n\nI found these relevant papers from Semantic Scholar:\n\n${formatPapersForAI(papers)}\n\n`;
          console.log('Papers context length:', papersContext.length);
        }
      }
      
      // Use Cloudflare Workers AI for research synthesis
      if (env.AI) {
        try {
          const messages = [
            { 
              role: 'system', 
              content: `You are an expert research assistant with access to Semantic Scholar's academic paper database. When users ask about research topics:

1. If I provide papers from Semantic Scholar, present them clearly with titles, authors, years, and links
2. Help users understand which papers are most relevant and why
3. Suggest additional search strategies and databases
4. Guide on evaluating source credibility (citation counts, venues, methodology)
5. Synthesize insights across multiple papers

Format your responses clearly. When presenting papers, make sure to include the Semantic Scholar URLs I provide.` 
            }
          ];
          
          // Add conversation history if provided
          if (history && Array.isArray(history)) {
            messages.push(...history);
          }
          
          // Add current message with papers context if available
          const userMessage = papersContext 
            ? `${message}${papersContext}` 
            : message;
          messages.push({ role: 'user', content: userMessage });
          
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