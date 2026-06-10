# Deploying Elysium Agent to Free Hosting

This guide covers deploying Elysium Agent to free hosting services with a free database.

## Option 1: Render.com (Recommended)

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub account
3. Connect your GitHub repository

### Step 2: Create Database
1. In Render dashboard, click "New +"
2. Select "PostgreSQL"
3. Choose "Free" plan
4. Name: `elysium-db`
5. Region: Singapore (or closest to you)
6. Create database

### Step 3: Deploy Web Service
1. Click "New +"
2. Select "Web Service"
3. Connect your GitHub repository
4. Fill in settings:
   - **Name**: `elysium-agent`
   - **Runtime**: Node
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start`
   - **Plan**: Free

### Step 4: Add Environment Variables
In the "Environment" section, add:
```
NODE_ENV=production
DATABASE_URL=[from PostgreSQL service]
JWT_SECRET=[generate a random string]
VITE_APP_ID=[your Manus app ID]
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
OWNER_OPEN_ID=[your Manus user ID]
OWNER_NAME=[your name]
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
BUILT_IN_FORGE_API_KEY=[your Manus API key]
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge
VITE_FRONTEND_FORGE_API_KEY=[your Manus frontend API key]
```

### Step 5: Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Your app will be available at `https://elysium-agent.onrender.com`

---

## Option 2: Railway.app

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create new project

### Step 2: Add Database
1. Click "Add Service"
2. Select "PostgreSQL"
3. Create database

### Step 3: Deploy from GitHub
1. Click "Add Service"
2. Select "GitHub Repo"
3. Connect your repository
4. Select `main` branch

### Step 4: Configure Environment
In Railway dashboard, add environment variables (same as Render)

### Step 5: Deploy
Railway automatically deploys on push to `main` branch

---

## Option 3: Vercel (Frontend Only)

**Note**: Vercel is frontend-only. Use with a separate backend (Render or Railway).

### Step 1: Prepare Frontend
```bash
# Build frontend only
pnpm build:client
```

### Step 2: Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Step 3: Configure API Endpoint
Set `VITE_API_URL` to your backend URL (Render or Railway)

---

## Free Database Options

### PlanetScale (MySQL)
- **Free tier**: 5GB storage, unlimited queries
- **Setup**: 
  1. Create account at [planetscale.com](https://planetscale.com)
  2. Create database
  3. Copy connection string
  4. Use as `DATABASE_URL`

### Supabase (PostgreSQL)
- **Free tier**: 500MB storage, 2GB bandwidth
- **Setup**:
  1. Create account at [supabase.com](https://supabase.com)
  2. Create project
  3. Copy connection string
  4. Use as `DATABASE_URL`

### Render PostgreSQL
- **Free tier**: 256MB storage
- **Setup**: Included in Render deployment above

---

## Monitoring & Maintenance

### View Logs
- **Render**: Dashboard → Service → Logs
- **Railway**: Dashboard → Deployments → Logs

### Check Health
```bash
curl https://your-deployed-url/api/health
```

### Database Backups
- **PlanetScale**: Automatic daily backups
- **Supabase**: Automatic backups (7-day retention)
- **Render**: Manual backups available

---

## Troubleshooting

### Build Fails
1. Check Node version: `node --version` (should be 18+)
2. Check dependencies: `pnpm install`
3. Check build: `pnpm build`

### Database Connection Error
1. Verify `DATABASE_URL` is correct
2. Check database credentials
3. Ensure database is running

### OAuth Not Working
1. Verify `VITE_APP_ID` is correct
2. Check `OAUTH_SERVER_URL` is reachable
3. Verify redirect URL is configured in Manus

### Performance Issues
- Free tier has limited resources
- Consider upgrading to paid tier for production
- Implement caching strategies
- Optimize database queries

---

## Cost Estimates

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Render | $0 (limited) | $7/month |
| Railway | $5 credit/month | $0.50/GB |
| PlanetScale | Free | $39/month |
| Supabase | Free | $25/month |

---

## Next Steps

1. Deploy to free hosting
2. Test all features
3. Monitor logs and performance
4. Upgrade to paid tier if needed
5. Set up custom domain (optional)

For support, visit [help.manus.im](https://help.manus.im)
