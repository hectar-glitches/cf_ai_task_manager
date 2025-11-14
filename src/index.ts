// Simple mock API for testing - works without complex Durable Objects
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace("/api", "");

    // Add CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      switch (path) {
        case "/health":
          return new Response(JSON.stringify({ 
            status: "healthy", 
            timestamp: new Date().toISOString(),
            version: "demo-mode"
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });

        case "/tasks":
          if (request.method === "GET") {
            // Mock tasks
            const mockTasks = [
              {
                id: "task_demo_1",
                title: "Welcome Demo Task",
                description: "This is a demo task showing the interface works!",
                priority: "medium",
                status: "pending",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                tags: ["demo", "welcome"]
              }
            ];
            
            return new Response(JSON.stringify({ 
              tasks: mockTasks, 
              total: mockTasks.length 
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
          break;

        case "/chat":
          if (request.method === "POST") {
            const body = await request.json() as any;
            const { userId, message } = body;
            
            // Mock AI response
            const mockResponse = {
              id: `msg_${Date.now()}_demo`,
              userId,
              content: `🤖 Demo Mode: I received your message "${message}". In the full version deployed to Cloudflare, I would use Llama 3.3 70B to provide intelligent responses and create tasks automatically! This shows the chat interface works perfectly.`,
              timestamp: new Date().toISOString(),
              type: "agent",
              metadata: {
                action: "demo_response",
                confidence: 1.0
              }
            };
            
            return new Response(JSON.stringify({ message: mockResponse }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
          break;

        case "/analytics":
          if (request.method === "GET") {
            // Mock analytics
            const mockAnalytics = {
              totalTasks: 1,
              completedTasks: 0,
              pendingTasks: 1,
              overdueTasks: 0,
              productivityScore: 0
            };
            
            return new Response(JSON.stringify(mockAnalytics), {
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
          break;

        default:
          // Handle task updates like PATCH /api/tasks/:id
          if (path.startsWith("/tasks/") && request.method === "PATCH") {
            const taskId = path.split("/")[2];
            
            return new Response(JSON.stringify({ 
              success: true, 
              message: `Demo: Task ${taskId} would be updated in full version` 
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
          
          return new Response(JSON.stringify({ error: "Not found" }), { 
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
      }
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: "Internal server error",
        message: "Demo mode - simplified error handling" 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
};