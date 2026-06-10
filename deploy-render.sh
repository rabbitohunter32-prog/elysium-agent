#!/bin/bash

# Elysium Agent - Automated Render.com Deployment Script
# This script automatically deploys your platform to Render.com
# No manual configuration needed!

set -e

echo "🚀 Elysium Agent - Automated Render Deployment"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get Render API key
echo -e "${BLUE}📝 Enter your Render API Key:${NC}"
echo "   (Get it from: https://dashboard.render.com/account/api-tokens)"
read -s RENDER_API_KEY

if [ -z "$RENDER_API_KEY" ]; then
    echo -e "${RED}❌ API key is required${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📝 Enter your GitHub repository URL:${NC}"
echo "   (e.g., https://github.com/rabbitohunter32-prog/elysium-agent)"
read GITHUB_REPO_URL

if [ -z "$GITHUB_REPO_URL" ]; then
    echo -e "${RED}❌ Repository URL is required${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Configuration received${NC}"
echo ""
echo -e "${BLUE}🔧 Creating deployment on Render.com...${NC}"

# Create the service using Render API
RESPONSE=$(curl -s -X POST https://api.render.com/v1/services \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "web_service",
    "name": "elysium-agent",
    "ownerId": "tea_user",
    "repo": "'"$GITHUB_REPO_URL"'",
    "branch": "main",
    "rootDir": "",
    "buildCommand": "pnpm install && pnpm build",
    "startCommand": "pnpm start",
    "envVars": [
      {
        "key": "NODE_ENV",
        "value": "production"
      },
      {
        "key": "JWT_SECRET",
        "value": "elysium-agent-secret-2024-production"
      },
      {
        "key": "OAUTH_SERVER_URL",
        "value": "https://api.manus.im"
      },
      {
        "key": "VITE_OAUTH_PORTAL_URL",
        "value": "https://auth.manus.im"
      },
      {
        "key": "BUILT_IN_FORGE_API_URL",
        "value": "https://api.manus.im/forge"
      },
      {
        "key": "VITE_FRONTEND_FORGE_API_URL",
        "value": "https://api.manus.im/forge"
      }
    ],
    "plan": "free",
    "region": "singapore"
  }')

# Check if deployment was successful
if echo "$RESPONSE" | grep -q "id"; then
    SERVICE_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}✅ Service created successfully!${NC}"
    echo ""
    echo -e "${BLUE}📍 Service ID: $SERVICE_ID${NC}"
    echo ""
    echo -e "${BLUE}⏳ Waiting for deployment (this takes 5-10 minutes)...${NC}"
    echo ""
    
    # Poll for deployment status
    MAX_ATTEMPTS=60
    ATTEMPT=0
    
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        STATUS=$(curl -s -X GET "https://api.render.com/v1/services/$SERVICE_ID" \
          -H "Authorization: Bearer $RENDER_API_KEY" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        
        if [ "$STATUS" = "live" ]; then
            echo -e "${GREEN}✅ Service is LIVE!${NC}"
            
            # Get the service URL
            SERVICE_URL=$(curl -s -X GET "https://api.render.com/v1/services/$SERVICE_ID" \
              -H "Authorization: Bearer $RENDER_API_KEY" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
            
            echo ""
            echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
            echo ""
            echo -e "${BLUE}📍 Your platform is live at:${NC}"
            echo -e "${GREEN}$SERVICE_URL${NC}"
            echo ""
            echo -e "${BLUE}🎊 Next steps:${NC}"
            echo "   1. Open the URL in your browser"
            echo "   2. Sign in with your Manus account"
            echo "   3. Start creating AI tasks!"
            echo ""
            exit 0
        elif [ "$STATUS" = "build_failed" ] || [ "$STATUS" = "runtime_error" ]; then
            echo -e "${RED}❌ Deployment failed with status: $STATUS${NC}"
            exit 1
        fi
        
        ATTEMPT=$((ATTEMPT + 1))
        echo -ne "\r⏳ Waiting... ($ATTEMPT/60) Status: $STATUS"
        sleep 10
    done
    
    echo ""
    echo -e "${RED}❌ Deployment timeout. Please check Render dashboard.${NC}"
    exit 1
else
    ERROR=$(echo "$RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
    echo -e "${RED}❌ Deployment failed: $ERROR${NC}"
    echo ""
    echo -e "${BLUE}💡 Troubleshooting:${NC}"
    echo "   1. Make sure your API key is correct"
    echo "   2. Check that your GitHub repository is public"
    echo "   3. Verify your GitHub token has repo permissions"
    exit 1
fi
