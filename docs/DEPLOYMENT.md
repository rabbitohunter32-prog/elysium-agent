# Elysium Agent Deployment Guide

## Overview

This guide covers deploying Elysium Agent to production environments. The platform is built on Node.js and uses MySQL/TiDB for data storage.

---

## Pre-Deployment Checklist

Before deploying to production, verify:

- [ ] All tests pass: `pnpm test`
- [ ] TypeScript compilation succeeds: `pnpm check`
- [ ] Code is formatted: `pnpm format`
- [ ] Environment variables are configured
- [ ] Database is set up and migrated
- [ ] Backups are configured
- [ ] SSL certificates are valid
- [ ] Domain is configured
- [ ] Monitoring is set up

---

## Environment Setup

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `DATABASE_URL` | Database connection | `mysql://user:pass@host/db` |
| `JWT_SECRET` | Session signing key | Auto-generated |
| `VITE_APP_ID` | OAuth app ID | Auto-provided |
| `OAUTH_SERVER_URL` | OAuth server URL | `https://api.manus.im` |
| `OWNER_OPEN_ID` | Platform owner ID | Auto-set |
| `OWNER_NAME` | Platform owner name | Auto-set |
| `BUILT_IN_FORGE_API_URL` | LLM API URL | Auto-provided |
| `BUILT_IN_FORGE_API_KEY` | LLM API key | Auto-provided |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `LOG_LEVEL` | Logging level | `info` |
| `SESSION_TIMEOUT` | Session timeout (ms) | `31536000000` (1 year) |

---

## Database Setup

### MySQL/TiDB Configuration

1. **Create database:**
   ```sql
   CREATE DATABASE elysium_agent CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Create database user:**
   ```sql
   CREATE USER 'elysium'@'%' IDENTIFIED BY 'strong_password';
   GRANT ALL PRIVILEGES ON elysium_agent.* TO 'elysium'@'%';
   FLUSH PRIVILEGES;
   ```

3. **Connection string:**
   ```
   mysql://elysium:strong_password@host:3306/elysium_agent
   ```

### Running Migrations

1. **Generate migrations:**
   ```bash
   pnpm drizzle-kit generate
   ```

2. **Apply migrations:**
   ```bash
   webdev_execute_sql < drizzle/migrations/0001_*.sql
   ```

3. **Verify schema:**
   ```sql
   SHOW TABLES;
   DESCRIBE users;
   ```

---

## Building for Production

### Build Process

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Build frontend:**
   ```bash
   pnpm build
   ```

3. **Build backend:**
   ```bash
   esbuild server/_core/index.ts \
     --platform=node \
     --packages=external \
     --bundle \
     --format=esm \
     --outdir=dist
   ```

4. **Verify build:**
   ```bash
   ls -la dist/
   ```

### Build Output

- `dist/client/`: Compiled frontend assets
- `dist/index.js`: Compiled backend server
- `dist/`: All production-ready files

---

## Deployment Options

### Option 1: Manus Hosted (Recommended)

The simplest deployment option using Manus built-in hosting:

1. **Create checkpoint:**
   ```bash
   webdev_save_checkpoint
   ```

2. **Click Publish:**
   - Go to Management UI
   - Click "Publish" button
   - Select deployment region
   - Confirm deployment

3. **Configure domain:**
   - Management UI → Settings → Domains
   - Use auto-generated `xxx.manus.space` domain
   - Or bind custom domain

**Advantages:**
- Automatic scaling
- Built-in SSL/TLS
- No infrastructure management
- Automatic backups

### Option 2: Cloud Platforms

#### Google Cloud Run

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:22-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY dist/ ./dist/
   EXPOSE 3000
   CMD ["node", "dist/index.js"]
   ```

2. **Build and push:**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT/elysium-agent
   ```

3. **Deploy:**
   ```bash
   gcloud run deploy elysium-agent \
     --image gcr.io/PROJECT/elysium-agent \
     --platform managed \
     --region us-central1 \
     --set-env-vars DATABASE_URL=mysql://...
   ```

#### AWS Lambda + RDS

1. **Package for Lambda:**
   ```bash
   npm install aws-serverless-express
   ```

2. **Create handler:**
   ```javascript
   const awsServerlessExpress = require('aws-serverless-express');
   const app = require('./dist/index.js');
   const server = awsServerlessExpress.createServer(app);
   exports.handler = (event, context) => {
     awsServerlessExpress.proxy(server, event, context);
   };
   ```

3. **Deploy with SAM or Serverless Framework**

#### Heroku

1. **Create Procfile:**
   ```
   web: node dist/index.js
   ```

2. **Deploy:**
   ```bash
   git push heroku main
   ```

### Option 3: Self-Hosted (VPS/Dedicated Server)

1. **SSH into server:**
   ```bash
   ssh user@server.com
   ```

2. **Install dependencies:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo apt-get install -y mysql-server
   ```

3. **Clone repository:**
   ```bash
   git clone <repo> /opt/elysium-agent
   cd /opt/elysium-agent
   ```

4. **Install and build:**
   ```bash
   pnpm install
   pnpm build
   ```

5. **Set up systemd service:**
   ```ini
   [Unit]
   Description=Elysium Agent
   After=network.target
   
   [Service]
   Type=simple
   User=elysium
   WorkingDirectory=/opt/elysium-agent
   Environment="NODE_ENV=production"
   Environment="DATABASE_URL=mysql://..."
   ExecStart=/usr/bin/node dist/index.js
   Restart=always
   
   [Install]
   WantedBy=multi-user.target
   ```

6. **Start service:**
   ```bash
   sudo systemctl enable elysium-agent
   sudo systemctl start elysium-agent
   ```

---

## SSL/TLS Configuration

### Using Manus Hosting

SSL is automatically configured and renewed.

### Self-Hosted with Let's Encrypt

1. **Install Certbot:**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   ```

2. **Obtain certificate:**
   ```bash
   sudo certbot certonly --standalone -d yourdomain.com
   ```

3. **Configure Nginx:**
   ```nginx
   server {
     listen 443 ssl;
     server_name yourdomain.com;
     
     ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
     ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
     
     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

4. **Auto-renewal:**
   ```bash
   sudo systemctl enable certbot.timer
   ```

---

## Monitoring and Logging

### Application Monitoring

Set up monitoring for:

- **Uptime**: Ping monitoring service
- **Performance**: Response time tracking
- **Errors**: Error rate monitoring
- **Database**: Connection pool health

### Logging

1. **Application logs:**
   ```bash
   tail -f /var/log/elysium-agent/app.log
   ```

2. **Access logs:**
   ```bash
   tail -f /var/log/elysium-agent/access.log
   ```

3. **Error logs:**
   ```bash
   tail -f /var/log/elysium-agent/error.log
   ```

### Log Aggregation

For centralized logging:

- **ELK Stack**: Elasticsearch, Logstash, Kibana
- **Datadog**: Cloud-based monitoring
- **Splunk**: Enterprise logging
- **CloudWatch**: AWS logging service

---

## Backup and Recovery

### Automated Backups

**Database backups:**
```bash
# Daily backup
0 2 * * * mysqldump -u elysium -p elysium_agent > /backups/db_$(date +\%Y\%m\%d).sql
```

**Application backups:**
```bash
# Weekly backup
0 3 * * 0 tar -czf /backups/app_$(date +\%Y\%m\%d).tar.gz /opt/elysium-agent
```

### Backup Storage

- **Local**: `/backups/` directory
- **Cloud**: S3, Google Cloud Storage, or Azure Blob
- **Offsite**: Remote backup service

### Recovery Procedures

**Restore database:**
```bash
mysql -u elysium -p elysium_agent < /backups/db_20240101.sql
```

**Restore application:**
```bash
tar -xzf /backups/app_20240101.tar.gz -C /opt/
```

---

## Performance Optimization

### Database Optimization

```sql
-- Add indexes
CREATE INDEX idx_tasks_user ON tasks(userId);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_messages_conversation ON messages(conversationId);

-- Optimize tables
OPTIMIZE TABLE users, tasks, conversations, messages, documents;
```

### Caching Strategy

- **Session caching**: Redis (optional)
- **Query caching**: Database query cache
- **Static assets**: CDN caching

### Load Balancing

For high traffic:

```nginx
upstream backend {
  server app1:3000;
  server app2:3000;
  server app3:3000;
}

server {
  listen 80;
  server_name yourdomain.com;
  
  location / {
    proxy_pass http://backend;
    proxy_set_header Host $host;
  }
}
```

---

## Scaling Considerations

### Horizontal Scaling

- Deploy multiple instances
- Use load balancer
- Share database
- Use Redis for sessions

### Vertical Scaling

- Increase server resources
- Optimize queries
- Enable caching
- Archive old data

### Database Scaling

- Read replicas
- Sharding (if needed)
- Connection pooling
- Query optimization

---

## Troubleshooting Deployment

### Application won't start

1. Check environment variables
2. Verify database connection
3. Check port availability
4. Review application logs

### Database connection errors

1. Verify connection string
2. Check database is running
3. Verify credentials
4. Check firewall rules

### High memory usage

1. Check for memory leaks
2. Restart application
3. Optimize queries
4. Increase server resources

### Slow performance

1. Check database query performance
2. Enable caching
3. Optimize frontend assets
4. Review application logs

---

## Post-Deployment

### Verification

1. **Health check:**
   ```bash
   curl https://yourdomain.com/health
   ```

2. **Database connectivity:**
   ```bash
   curl https://yourdomain.com/api/trpc/auth.me
   ```

3. **OAuth flow:**
   - Test login
   - Verify session
   - Test logout

### Monitoring Setup

1. Set up uptime monitoring
2. Configure error alerts
3. Enable performance tracking
4. Set up log aggregation

### Documentation

- Record deployment details
- Document configuration
- Create runbooks
- Update disaster recovery plan

---

## Maintenance Schedule

| Task | Frequency |
|------|-----------|
| Database optimization | Weekly |
| Log rotation | Daily |
| Backup verification | Weekly |
| Security updates | As needed |
| Dependency updates | Monthly |
| Performance review | Monthly |
| Disaster recovery drill | Quarterly |

---

## Support and Resources

- **Manus Documentation**: https://docs.manus.im
- **Node.js Best Practices**: https://nodejs.org/en/docs/
- **Database Optimization**: MySQL documentation
- **DevOps Guide**: See `docs/ADMIN_GUIDE.md`

---

Thank you for deploying Elysium Agent!
