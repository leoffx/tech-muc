# Tech MUC

Project created for the [{Tech: Europe} Munich Hackathon](https://luma.com/munich-hack).

**AI-Powered Project Management and Ticket Automation System**

This is an intelligent project management platform that combines real-time collaboration with AI-driven development automation. Built for the modern development workflow, it enables teams to plan, track, and automatically implement features through natural language ticket descriptions.

---

## 👀 Overview

Tech MUC streamlines software development by:

- **AI Agent Automation**: Automatically implements tickets using OpenCode AI agents
- **Real-Time Collaboration**: Live updates via Convex backend
- **GitHub Integration**: Creates pull requests automatically from completed work
- **Project Management**: Kanban-style boards with drag-and-drop ticket organization

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ and npm 10+
- **Convex Account**: [Sign up at convex.dev](https://convex.dev)
- **OpenAI API Key**: [Get from platform.openai.com](https://platform.openai.com)
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
```

Visit **http://localhost:9000** (production) or **http://localhost:3000** (development).

---

## 🤖 AI Agent Workflow

### 1. Planning Phase

User creates a ticket with description → AI agent analyzes requirements → Generates implementation plan (markdown) → Saves to `ticket.plan`

### 2. Implementation Phase

Agent executes plan → Writes code in linked GitHub repository → Runs tests and checks

### 3. PR Creation

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
```
