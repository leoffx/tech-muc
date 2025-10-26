# Tech MUC

AI-powered project management and ticket automation system.

## Quick Start

**New to the project?** See [GETTING_STARTED.md](./GETTING_STARTED.md) for a detailed walkthrough.

### TL;DR

```bash
# 1. Install and deploy Convex
npm install
npx convex deploy --yes

# 2. Configure
cp .env.example .env
# Edit .env with your CONVEX_URL and OPENAI_API_KEY

# 3. Run
./deploy.sh
# Or: docker-compose up -d
```

Visit **http://localhost:9000**

### Development

```bash
# Local development (without Docker)
npm run dev

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild
docker-compose up -d --build
```

## Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Detailed deployment guide
- **[DOCKER.md](./DOCKER.md)** - Docker configuration details
- **[AGENTS.md](./AGENTS.md)** - Repository guidelines and coding standards

## Environment Variables

Required:
- `CONVEX_URL` - Your Convex deployment URL
- `OPENAI_API_KEY` - OpenAI API key

Optional:
- `GH_TOKEN` - GitHub token for PR creation
- `OPENCODE_MODEL` - OpenCode model (default: openai/gpt-5-codex)
- `OPENCODE_ENDPOINT` - Custom OpenCode endpoint
