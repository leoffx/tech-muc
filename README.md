# Tech MUC

Project created for the [{Tech: Europe} Munich Hackathon](https://luma.com/munich-hack).

**AI-Powered Project Management and Ticket Automation System**

This is an intelligent project management platform that combines real-time collaboration with AI-driven development automation. Built for the modern development workflow, it enables teams to plan, track, and automatically implement features through natural language ticket descriptions.

---

## 🎯 Target Architecture

```mermaid
graph TB
 subgraph Frontend["Frontend Layer"]
App["React/Next.js"]
end

    subgraph Backend["Backend Layer"]
        tRPC["tRPC API"]
        WorkspaceManager["Workspace Management Module"]
    end

    subgraph External["External Services"]
        Weaviate["Weaviate<br/>(Vector DB)"]
        Convex["Database / Convex"]
    end

    subgraph Workers["Isolated Workers"]
        MicroVMs["MicroVM Based Workers<br/>(Horizontally Scalable)"]
        WorkerOpenCode["OpenAI API + OpenCode Instance<br/>(Plan & Run Implementation)"]
    end

    App --> tRPC
    tRPC -->|API Calls| Convex
    tRPC -->|Manages Workspaces| WorkspaceManager
    WorkspaceManager -->|Creates/Manages| MicroVMs
    MicroVMs -->|Uses| WorkerOpenCode
    tRPC -.->|Vector Search| Weaviate

    classDef frontend fill:#1a1a2e,stroke:#16213e,color:#eee
    classDef api fill:#0f3460,stroke:#16213e,color:#eee
    classDef backend fill:#0a2647,stroke:#16213e,color:#eee
    classDef external fill:#144272,stroke:#16213e,color:#eee
    classDef client fill:#2c2c54,stroke:#16213e,color:#eee
    classDef static fill:#1a1a3e,stroke:#16213e,color:#eee
    classDef workers fill:#2e0a47,stroke:#16213e,color:#eee

    class Browser client
    class App,Components,Styles frontend
    class tRPC,Endpoints api
    class Convex,Schema,ServerFns,WorkspaceManager backend
    class Weaviate,OpenCode external
    class Public static
    class MicroVMs,WorkerOpenCode workers
```

---

## 😈 Vulnerability Report

79 critical + 109 high + 15 medium + 9 low = 212 vulnerabilities!

<img src="aikido/vulns.png">

---

## 👀 Overview

Tech MUC streamlines software development by:

- **AI Agent Automation**: Automatically implements tickets using OpenCode AI agents
- **Real-Time Collaboration**: Live updates via Convex backend
- **Preview Deployments**: Automatic static build previews for every implementation
- **GitHub Integration**: Creates pull requests automatically from completed work
- **Project Management**: Kanban-style boards with drag-and-drop ticket organization

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ and npm 10+
- **Convex Account**: [Sign up at convex.dev](https://convex.dev)
- **OpenAI API Key**: [Get from platform.openai.com](https://platform.openai.com)
- **AWS S3** (optional): For preview deployments
- **GitHub Token** (optional): For automatic PR creation

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/leoffx/tech-muc.git
cd tech-muc

# 2. Install dependencies
npm install

# 3. Deploy Convex backend
npx convex deploy --yes
# Follow prompts to create/select your Convex project

# 4. Configure environment variables
cp .env.example .env
# Edit .env with your credentials:
# - CONVEX_URL (from Convex dashboard)
# - OPENAI_API_KEY (for AI agent)
# - GH_TOKEN (optional, for GitHub PR creation)
# - PREVIEW_BUCKET, PREVIEW_REGION (optional, for S3 previews)
```

Visit **http://localhost:9000** (production) or **http://localhost:3000** (development).

---

## 🏗️ Architecture

### Project Structure

```
tech-muc/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── _components/          # Shared UI components
│   │   ├── projects/             # Projects routes
│   │   ├── tickets/              # Tickets routes
│   │   └── api/                  # API routes
│   ├── server/                   # tRPC server
│   │   ├── api/routers/          # tRPC routers
│   │   └── agent/                # OpenCode AI integration
│   ├── lib/                      # Utilities and helpers
│   ├── trpc/                     # tRPC client setup
│   └── styles/                   # Global styles
├── convex/                       # Convex backend
│   ├── schema.ts                 # Database schema
│   ├── tickets.ts                # Ticket operations
│   ├── projects.ts               # Project operations
│   └── authors.ts                # Author operations
├── public/                       # Static assets
├── scripts/                      # Build/deployment scripts
└── docker-compose.yml            # Production container config
```

---

## 🤖 AI Agent Workflow

### 1. Planning Phase

User creates a ticket with description → AI agent analyzes requirements → Generates implementation plan (markdown) → Saves to `ticket.plan`

### 2. Implementation Phase

Agent executes plan → Writes code in linked GitHub repository → Runs tests and checks → Builds static preview

### 3. Preview Deployment

Builds project (`npm run preview:build`) → Uploads to S3 bucket → Stores URL in `ticket.previewUrl` → Creates `/latest/` mirror

### 4. PR Creation

Creates GitHub PR with changes → Links PR URL to `ticket.pullRequestUrl` → Marks ticket as done

---

## 🔒 Environment Variables

### Required

```env
CONVEX_URL=https://your-deployment.convex.cloud
OPENAI_API_KEY=sk-...
```

### Optional

```env
# GitHub Integration
GH_TOKEN=ghp_...                              # For automatic PR creation

# OpenCode Configuration
OPENCODE_MODEL=openai/gpt-5-codex             # Default AI model
OPENCODE_ENDPOINT=https://custom.endpoint     # Override OpenCode API

# Preview Deployments
PREVIEW_BUCKET=tech-munich                    # S3 bucket name
PREVIEW_REGION=eu-central-1                   # AWS region
PREVIEW_WEBSITE_BASE_URL=https://previews.example.com  # Custom domain
```
