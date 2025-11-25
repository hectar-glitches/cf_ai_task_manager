interface Env {
  AI: any;
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
      
      // Use Cloudflare Workers AI for research synthesis
      if (env.AI) {
        try {
          const messages = [
            { 
              role: 'system', 
              content: `You are an expert research assistant helping users with academic research. You provide guidance on:

- Search strategies: Suggest search terms, Boolean operators, and databases (PubMed, Google Scholar, JSTOR, Web of Science, Scopus)
- Source types: Recommend peer-reviewed journals, conference papers, systematic reviews, meta-analyses
- Credibility assessment: Explain how to evaluate methodology, author credentials, publication venue, citation counts
- Research synthesis: Help identify themes, gaps, and connections across literature
- Methodological advice: Suggest appropriate research frameworks and approaches

IMPORTANT LIMITATIONS: You cannot access databases or provide real paper links/DOIs. Guide users on WHERE and HOW to search instead.

Format responses clearly without excessive markdown symbols. Use simple, readable text.` 
            }
          ];
          
          // Add conversation history if provided
          if (history && Array.isArray(history)) {
            messages.push(...history);
          } else {
            messages.push({ role: 'user', content: message });
          }
          
          const aiResponse = await env.AI.run('@cf/qwen/qwen1.5-14b-chat-awq', {
            messages,
            max_tokens: 2048,  // Increase from default 512 to allow longer responses
            temperature: 0.7   // Add some creativity while staying factual
          }) as any;
          
          aiContent = aiResponse.response || aiResponse.result?.response || aiResponse;
          
          if (aiContent && typeof aiContent === 'string') {
            console.log('AI Response received successfully');
          } else {
            console.error('Unexpected AI response format:', aiResponse);
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