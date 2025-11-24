// Minimal AI-powered task management API for Cloudflare assignment
// Uses only Cloudflare Workers AI - no external APIs needed

interface Env {
  AI: any; // Cloudflare AI binding
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
      const { message } = await request.json() as any;
      
      let aiContent;
      
      // Use Cloudflare Workers AI for research synthesis
      if (env.AI) {
        try {
          const aiResponse = await env.AI.run('@cf/meta/llama-3.1-70b-instruct', {
            messages: [
              { 
                role: 'system', 
                content: `You are an expert research assistant that helps users find and synthesize academic sources. When given a research question or topic:
1. Suggest relevant search terms and databases
2. Explain what types of sources would be most valuable
3. Guide users on evaluating source credibility
4. Help synthesize information from multiple perspectives
5. Identify gaps in current research

Be scholarly but accessible. Cite general research principles and methodologies.` 
              },
              { role: 'user', content: message }
            ]
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
        aiContent = `I'm your AI research synthesis assistant. You said: "${message}". I can help you find relevant sources, evaluate their credibility, and synthesize insights for your research question. What would you like to explore?`;
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