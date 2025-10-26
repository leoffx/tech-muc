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

# Build preview artifact + upload to S3 (manual helper)
npm run preview:deploy -- --ticket TCK-123
# Optional: override defaults
npm run preview:deploy -- --project tech-muc --ticket TCK-123 --build-command "npm run build"

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
- `PREVIEW_BUCKET` - S3 bucket for preview artifacts (default: tech-munich)
- `PREVIEW_REGION` - AWS region for the preview bucket (default: eu-central-1)
- `PREVIEW_WEBSITE_BASE_URL` - Optional website endpoint if different from the default S3 URL

## Preview Deployments

The implementation agent now builds and uploads static previews automatically once it finishes a ticket.

- Set `PREVIEW_BUCKET` and `PREVIEW_REGION` in your environment as needed (defaults: `tech-munich` / `eu-central-1`). Optionally set `PREVIEW_WEBSITE_BASE_URL` if you front S3 with a custom domain.
- Every repository only needs a build script that emits static files into `dist/` (e.g. `npm run build` or `npm run preview:build`). The agent prefers a `preview:build` script when present and falls back to `build`.
- On successful runs, artifacts are synced to `s3://<bucket>/<project_id>/<ticket_id>/<commit>/` and mirrored to `/latest/`; the commit and latest URLs are logged alongside the agent response.
- For manual verification you can still run `npm run preview:build` locally and sync with your own tooling before invoking `opencode`.
