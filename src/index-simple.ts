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

    // Chat endpoint - the main AI functionality
    if (path === "/api/chat" && request.method === "POST") {
      try {
        const { message } = await request.json() as any;
        
        // Use Cloudflare Workers AI
        const aiResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct', {
          messages: [
            { 
              role: 'system', 
              content: `You are a helpful AI task management assistant. Help users create and manage tasks through natural conversation. Be concise and helpful.` 
            },
            { role: 'user', content: message }
          ]
        });

        return new Response(JSON.stringify({
          message: {
            id: Date.now(),
            content: aiResponse.response,
            timestamp: new Date().toISOString(),
            type: "agent"
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          message: {
            id: Date.now(),
            content: `I'm here to help with task management! You said: "${(await request.json() as any).message}". What specific task would you like to create or manage?`,
            timestamp: new Date().toISOString(),
            type: "agent"
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
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