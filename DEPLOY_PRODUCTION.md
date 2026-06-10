# Production Deployment Guide - Elysium Agent

## Quick Start (5 minutes)

### Prerequisites
- GitHub account with repository access
- Render.com account (free)
- Manus API credentials

### Step 1: Create GitHub Repository

```bash
cd /home/ubuntu/elysium_agent
git init
git add .
git commit -m "Initial commit: Elysium Agent platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/elysium-agent.git
git push -u origin main
```

### Step 2: Deploy to Render.com

1. Go to [render.com](https://render.com)
2. Sign in with GitHub
3. Click "New +"
4. Select "Web Service"
5. Connect your GitHub repository
6. Fill in settings:
   - **Name**: `elysium-agent`
   - **Runtime**: Node
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start`
   - **Plan**: Free

### Step 3: Create Database

1. In Render dashboard, click "New +"
2. Select "PostgreSQL"
3. Choose "Free" plan
4. Name: `elysium-db`
5. Region: Singapore
6. Create database

### Step 4: Configure Environment Variables

In Render web service settings, add:

```
NODE_ENV=production
DATABASE_URL=[Copy from PostgreSQL service]
JWT_SECRET=[Generate: openssl rand -hex 32]
VITE_APP_ID=[Your Manus App ID]
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
OWNER_OPEN_ID=[Your Manus User ID]
OWNER_NAME=[Your Name]
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
BUILT_IN_FORGE_API_KEY=[Your Manus API Key]
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge
VITE_FRONTEND_FORGE_API_KEY=[Your Manus Frontend API Key]
```

### Step 5: Deploy

1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Your app will be available at `https://elysium-agent.onrender.com`

---

## Detailed Deployment Steps

### Getting Manus Credentials

1. **VITE_APP_ID**: From Manus OAuth app settings
2. **OWNER_OPEN_ID**: Your Manus user ID
3. **BUILT_IN_FORGE_API_KEY**: From Manus API settings

### Database URL Format

PostgreSQL connection string:
```
postgresql://user:password@host:port/database
```

### Generating JWT_SECRET

```bash
# On Mac/Linux
openssl rand -hex 32

# On Windows (PowerShell)
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

---

## Verification Checklist

After deployment, verify:

- [ ] Website loads at deployment URL
- [ ] Login page displays
- [ ] Can sign in with Manus account
- [ ] Dashboard shows correctly
- [ ] Can create a task
- [ ] Can upload a file
- [ ] Admin panel accessible (if admin user)
- [ ] Settings page works
- [ ] Document center displays files
- [ ] No errors in browser console

---

## Monitoring & Logs

### View Logs
```
Render Dashboard → Service → Logs
```

### Common Issues

**Database Connection Error**
- Verify DATABASE_URL is correct
- Check database is running
- Verify network access

**OAuth Error**
- Verify VITE_APP_ID is correct
- Check OAUTH_SERVER_URL is reachable
- Verify redirect URL configured

**Build Failure**
- Check Node version (18+)
- Verify pnpm install works locally
- Check build command output

---

## Performance Optimization

### For Free Tier
- Database: 256MB storage (sufficient for testing)
- Server: Shared CPU (may have cold starts)
- Bandwidth: Unlimited

### Upgrade Path
When you outgrow free tier:
1. Upgrade Render service to paid
2. Upgrade database to paid
3. Add caching layer
4. Implement CDN

---

## Security Checklist

- [ ] All environment variables set
- [ ] No secrets in code
- [ ] HTTPS enforced
- [ ] Database credentials secure
- [ ] API keys rotated
- [ ] Logs monitored
- [ ] Backups configured

---

## Backup & Recovery

### Database Backups
Render automatically backs up PostgreSQL daily.

To restore:
1. Render Dashboard → Database → Backups
2. Select backup point
3. Click "Restore"

### Code Backups
GitHub automatically backs up your code.

To restore:
1. GitHub → Repository → Releases
2. Download source code
3. Deploy new version

---

## Scaling Considerations

### When to Scale
- Free tier hits resource limits
- Response times exceed 500ms
- Database storage near limit
- Cold starts become problematic

### Scaling Options
1. **Render Paid Tier**: $7/month (recommended)
2. **Railway.app**: $5 credit/month
3. **AWS**: Pay-as-you-go
4. **DigitalOcean**: $5-6/month

---

## Custom Domain

### Add Custom Domain
1. Render Dashboard → Service → Settings
2. Custom Domain section
3. Enter your domain
4. Update DNS records
5. Verify domain

### DNS Configuration
```
CNAME: your-domain.com → elysium-agent.onrender.com
```

---

## Support & Troubleshooting

### Getting Help
- Render Support: [render.com/support](https://render.com/support)
- Manus Help: [help.manus.im](https://help.manus.im)
- GitHub Issues: Create issue in repository

### Debugging
1. Check Render logs
2. Check browser console
3. Check network tab
4. Verify environment variables
5. Test locally first

---

## Maintenance

### Regular Tasks
- Monitor logs weekly
- Check performance metrics
- Update dependencies monthly
- Rotate API keys quarterly
- Review security settings monthly

### Scheduled Maintenance
- Database backups: Daily (automatic)
- Log cleanup: Weekly (automatic)
- Certificate renewal: Automatic

---

## Cost Breakdown

| Service | Free Tier | Cost |
|---------|-----------|------|
| Render Web | Limited | $0 |
| PostgreSQL | 256MB | $0 |
| Total | - | $0 |

**Upgrade Costs (if needed)**
| Service | Starter | Cost |
|---------|---------|------|
| Render Web | Standard | $7/month |
| PostgreSQL | Starter | $15/month |
| Total | - | $22/month |

---

## Deployment Complete! 🎉

Your Elysium Agent platform is now live and ready to use.

**Next Steps:**
1. Share deployment URL with users
2. Monitor performance
3. Gather feedback
4. Plan enhancements
5. Scale as needed

For support, visit [help.manus.im](https://help.manus.im)
