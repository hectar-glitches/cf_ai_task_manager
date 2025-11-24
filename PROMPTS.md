# AI Prompts Used in Development

## Development Approach
I built this AI-powered task management application primarily through hands-on coding and configuration. AI assistance was used strategically for debugging specific technical issues and understanding Cloudflare platform requirements.

**Development Breakdown:**
- Manual Implementation: ~85%
- AI Debugging Assistance: ~15%

## Key AI Debugging Sessions

### 1. Node.js Version Compatibility
**Issue:** Wrangler requiring Node.js 20+ but system using v16
**Prompt:** "How do I use conda to create an environment with Node.js 20 for Cloudflare Workers development?"
**Resolution:** Created conda environment with Node.js 20.19.4

### 2. TypeScript Configuration Errors
**Issue:** `Cannot redeclare block-scoped variable 'console'` in env.ts
**Prompt:** "TypeScript error about redeclaring console variable in my environment types file"
**Resolution:** Removed duplicate console declaration from env.ts

### 3. Vite Development Server Issues
**Issue:** `crypto$2.getRandomValues is not a function` when starting frontend
**Prompt:** "Vite failing with crypto getRandomValues error on Node 16"
**Resolution:** Ensured frontend also runs in conda environment with Node 20

### 4. WebSocket Complexity Removal
**Issue:** WebSocket implementation adding unnecessary complexity
**Prompt:** "Is WebSocket required for Cloudflare assignment or can I use HTTP-only chat?"
**Resolution:** Simplified to HTTP-only implementation, removed WebSocket code

### 5. Cloudflare Workers AI Local Development
**Issue:** AI binding showing "not supported" in local mode
**Prompt:** "Why does env.AI show 'not supported' when running wrangler dev --local?"
**Resolution:** Removed `--local` flag to enable remote AI binding access

### 6. Write documentation on the project
**Issue:** Too laborous to comment and create the readme.md
**Prompt:** "Can you create a README for this project and add comments where necessary for production?""

**Total Development Time:** ~8 hours as I was not fully familiar with the whole worker and agent ecosystem.

**AI was used for:**
- Resolving 6 specific technical issues
- Understanding Cloudflare platform constraints
- Code readability