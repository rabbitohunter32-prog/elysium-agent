# Elysium Agent Setup Guide

## Quick Start

### Prerequisites

- **Node.js**: 22.x or later
- **pnpm**: 10.x or later
- **MySQL**: 8.0+ or TiDB
- **Git**: For version control

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url> elysium-agent
   cd elysium-agent
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env.local`
   - Update with your configuration values
   - See "Environment Configuration" section below

4. **Set up database:**
   ```bash
   # Generate migrations
   pnpm drizzle-kit generate
   
   # Apply migrations
   pnpm db:push
   ```

5. **Start development server:**
   ```bash
   pnpm dev
   ```

6. **Open in browser:**
   - Navigate to `http://localhost:3000`
   - Sign in with Manus OAuth

---

## Environment Configuration

### Required Variables

| Variable | Description | How to Obtain |
|----------|-------------|---------------|
| `DATABASE_URL` | MySQL connection string | Set up MySQL database |
| `VITE_APP_ID` | OAuth application ID | Provided by Manus |
| `OAUTH_SERVER_URL` | OAuth server URL | `https://api.manus.im` |
| `OWNER_OPEN_ID` | Your Manus user ID | From Manus account |
| `OWNER_NAME` | Your display name | Choose your name |
| `JWT_SECRET` | Session signing key | Auto-generated |
| `BUILT_IN_FORGE_API_KEY` | LLM API key | Provided by Manus |
| `BUILT_IN_FORGE_API_URL` | LLM API URL | Provided by Manus |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_TITLE` | Application title | Elysium Agent |
| `VITE_APP_LOGO` | Logo URL | Auto-generated |
| `NODE_ENV` | Environment mode | development |
| `PORT` | Server port | 3000 |

---

## Database Setup

### MySQL Setup

1. **Install MySQL:**
   ```bash
   # macOS
   brew install mysql
   
   # Ubuntu/Debian
   sudo apt-get install mysql-server
   
   # Windows
   # Download from https://dev.mysql.com/downloads/mysql/
   ```

2. **Start MySQL:**
   ```bash
   # macOS
   brew services start mysql
   
   # Ubuntu/Debian
   sudo systemctl start mysql
   ```

3. **Create database and user:**
   ```bash
   mysql -u root -p
   ```
   
   ```sql
   CREATE DATABASE elysium_agent CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'elysium'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON elysium_agent.* TO 'elysium'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

4. **Update DATABASE_URL:**
   ```
   mysql://elysium:your_password@localhost:3306/elysium_agent
   ```

### Docker Setup

For easier setup using Docker:

1. **Start MySQL container:**
   ```bash
   docker run --name elysium-db \
     -e MYSQL_ROOT_PASSWORD=root \
     -e MYSQL_DATABASE=elysium_agent \
     -e MYSQL_USER=elysium \
     -e MYSQL_PASSWORD=elysium_password \
     -p 3306:3306 \
     -d mysql:8.0-alpine
   ```

2. **Update DATABASE_URL:**
   ```
   mysql://elysium:elysium_password@localhost:3306/elysium_agent
   ```

---

## OAuth Configuration

### Manus OAuth Setup

1. **Create OAuth application:**
   - Go to Manus dashboard
   - Create new OAuth application
   - Set redirect URI: `http://localhost:3000/api/oauth/callback`

2. **Get credentials:**
   - Copy Application ID → `VITE_APP_ID`
   - OAuth server URL → `OAUTH_SERVER_URL`

3. **Update .env.local:**
   ```
   VITE_APP_ID=your-app-id
   OAUTH_SERVER_URL=https://api.manus.im
   ```

---

## Development Workflow

### Running the Application

**Development mode:**
```bash
pnpm dev
```

**Production build:**
```bash
pnpm build
npm start
```

### Code Quality

**Type checking:**
```bash
pnpm check
```

**Formatting:**
```bash
pnpm format
```

**Testing:**
```bash
pnpm test
```

### Database Migrations

**Generate migration:**
```bash
pnpm drizzle-kit generate
```

**View generated SQL:**
```bash
cat drizzle/migrations/0001_*.sql
```

**Apply migration:**
```bash
pnpm db:push
```

---

## Project Structure

```
elysium-agent/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── lib/           # Utilities and helpers
│   │   └── App.tsx        # Main app component
│   └── index.html         # HTML entry point
├── server/                # Backend Node.js application
│   ├── _core/            # Core framework code
│   ├── routers.ts        # tRPC route definitions
│   ├── db.ts             # Database helpers
│   └── agentTools.ts     # Agent tool implementations
├── drizzle/              # Database schema and migrations
│   ├── schema.ts         # Table definitions
│   └── migrations/       # Generated SQL migrations
├── docs/                 # Documentation
│   ├── API.md           # API reference
│   ├── USER_GUIDE.md    # User documentation
│   ├── ADMIN_GUIDE.md   # Admin documentation
│   └── DEPLOYMENT.md    # Deployment guide
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript configuration
├── Dockerfile            # Production Docker image
└── docker-compose.yml    # Local development setup
```

---

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 pnpm dev
```

### Database Connection Failed

1. **Verify MySQL is running:**
   ```bash
   mysql -u root -p -e "SELECT 1;"
   ```

2. **Check DATABASE_URL format:**
   ```
   mysql://user:password@host:port/database
   ```

3. **Verify credentials:**
   ```bash
   mysql -u elysium -p -h localhost
   ```

### OAuth Login Not Working

1. **Verify VITE_APP_ID is correct**
2. **Check redirect URI matches configuration**
3. **Verify OAUTH_SERVER_URL is accessible**
4. **Check browser console for errors**

### TypeScript Errors

```bash
# Clear cache and rebuild
rm -rf dist node_modules
pnpm install
pnpm check
```

### Database Migration Issues

```bash
# View migration status
pnpm drizzle-kit migrate

# Rollback (if supported)
# Manual rollback required for MySQL
```

---

## Development Tips

### Hot Reload

The dev server automatically reloads on file changes:

- **Frontend**: Vite hot module replacement
- **Backend**: tsx watch mode

### Debugging

**Browser DevTools:**
- Open DevTools (F12)
- Check Console for errors
- Use Network tab to inspect API calls

**Server Logs:**
```bash
# View dev server output
tail -f .manus-logs/devserver.log
```

### Testing Changes

1. **Test locally first**
2. **Run type checking**: `pnpm check`
3. **Run tests**: `pnpm test`
4. **Test in browser**: Manual testing

---

## Next Steps

1. **Read the User Guide**: `docs/USER_GUIDE.md`
2. **Explore the API**: `docs/API.md`
3. **Admin Setup**: `docs/ADMIN_GUIDE.md`
4. **Deploy**: `docs/DEPLOYMENT.md`

---

## Getting Help

- **Documentation**: See `docs/` directory
- **Issues**: Check GitHub issues
- **Support**: Contact the development team

---

## Production Deployment

For production deployment, see `docs/DEPLOYMENT.md` for:

- Docker deployment
- Cloud platform setup
- Database configuration
- SSL/TLS setup
- Monitoring and logging

---

Happy coding! 🚀
