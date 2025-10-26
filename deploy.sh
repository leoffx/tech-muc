#!/bin/bash
set -e

# Tech MUC Deployment Script
echo "🚀 Tech MUC Deployment"
echo "====================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create .env from .env.example:"
    echo "  cp .env.example .env"
    echo "  # Then edit .env with your secrets"
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

# Check if CONVEX_URL is set
if [ -z "$CONVEX_URL" ]; then
    echo "❌ CONVEX_URL not set in .env"
    echo ""
    echo "Step 1: Deploy Convex functions"
    echo "  npx convex deploy --yes"
    echo ""
    echo "Step 2: Add CONVEX_URL to your .env file"
    echo "  CONVEX_URL=https://your-deployment.convex.cloud"
    exit 1
fi

echo "✅ Environment configured"
echo "📦 Convex URL: $CONVEX_URL"
echo ""
echo "🏗️  Building and starting services..."
echo ""

# Build and start with docker-compose
if docker-compose up -d --build; then
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "🌐 Application: http://localhost:9000"
    echo "📋 View logs:   docker-compose logs -f"
    echo "🛑 Stop:        docker-compose down"
else
    echo "❌ Deployment failed"
    exit 1
fi

