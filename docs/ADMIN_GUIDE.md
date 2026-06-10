# Elysium Agent Admin Guide

## Overview

This guide covers administrative tasks, system management, and platform configuration for Elysium Agent administrators.

---

## Admin Dashboard

### Accessing the Admin Panel

1. Log in with an admin account
2. Click **"Admin"** in the sidebar
3. You'll see the admin dashboard with system overview

### Dashboard Components

| Component | Purpose |
|-----------|---------|
| **User Statistics** | Total users, active users, new registrations |
| **Task Statistics** | Completed tasks, failed tasks, average duration |
| **System Health** | Server status, database health, error rates |
| **Recent Activity** | Latest user actions and system events |

---

## User Management

### Viewing All Users

1. Go to **Admin** → **Users**
2. View complete user list with:
   - User ID and name
   - Email address
   - Account role
   - Registration date
   - Last login date

### User Roles

| Role | Permissions |
|------|-------------|
| **User** | Create and manage own tasks, view own documents |
| **Admin** | Manage users, view system stats, access admin panel |

### Promoting Users to Admin

1. Find the user in the user list
2. Click the **role dropdown** next to their name
3. Select **"Admin"**
4. Confirm the change
5. User gains admin access immediately

### Demoting Admin Users

1. Find the admin user in the list
2. Click the **role dropdown**
3. Select **"User"**
4. Confirm the change
5. Admin access is revoked immediately

### User Activity Monitoring

1. Click on a user to view their profile
2. See their activity including:
   - Tasks created and completed
   - Documents uploaded and generated
   - Last login time
   - Account creation date

---

## System Configuration

### Environment Variables

Critical environment variables for system operation:

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | Database connection | `mysql://user:pass@host/db` |
| `JWT_SECRET` | Session signing key | Auto-generated |
| `VITE_APP_ID` | OAuth application ID | Auto-provided |
| `OWNER_OPEN_ID` | Platform owner ID | Auto-set |
| `OWNER_NAME` | Platform owner name | Auto-set |

### Configuring Notifications

Owner notifications are sent via the Heartbeat system. To set up scheduled notifications:

1. **Task Completion Notifications**
   ```bash
   manus-heartbeat create \
     --name task-completion-notify \
     --cron "0 */6 * * * *" \
     --path /api/scheduled/task-completion \
     --description "Notify owner of completed tasks every 6 hours"
   ```

2. **New User Notifications**
   ```bash
   manus-heartbeat create \
     --name new-user-notify \
     --cron "0 0 * * * *" \
     --path /api/scheduled/new-users \
     --description "Daily new user registration summary"
   ```

3. **Task Failure Alerts**
   ```bash
   manus-heartbeat create \
     --name task-failure-alert \
     --cron "0 */2 * * * *" \
     --path /api/scheduled/task-failures \
     --description "Alert on failed tasks every 2 hours"
   ```

### Viewing Scheduled Tasks

```bash
manus-heartbeat list
```

### Managing Scheduled Tasks

**Update a schedule:**
```bash
manus-heartbeat update \
  --task-uid <task_uid> \
  --cron "0 0 * * * *" \
  --enable=true
```

**Delete a schedule:**
```bash
manus-heartbeat delete --task-uid <task_uid>
```

**View execution logs:**
```bash
manus-heartbeat logs --task-uid <task_uid> --with-body
```

---

## Database Management

### Database Connection

The platform uses MySQL/TiDB for data storage. Connection details are in `DATABASE_URL`.

### Database Backup

Regular backups are recommended:

1. **Automated Backups**: Set up via your database provider
2. **Manual Backups**: Use `mysqldump` or database provider tools

### Database Maintenance

**Optimize tables:**
```sql
OPTIMIZE TABLE users, tasks, conversations, messages, documents;
```

**Check table integrity:**
```sql
CHECK TABLE users, tasks, conversations, messages, documents;
```

### Viewing Database Logs

Access database logs through:

1. Management UI → Database panel
2. View connection info and SSL settings
3. Monitor query performance

---

## Monitoring and Health Checks

### System Health Indicators

Monitor these key metrics:

| Metric | Healthy Range | Action |
|--------|---------------|--------|
| **API Response Time** | < 500ms | Investigate if > 2s |
| **Error Rate** | < 1% | Review logs if > 5% |
| **Database Connections** | < 80% | Scale if approaching limit |
| **Disk Usage** | < 80% | Clean up if approaching limit |
| **Memory Usage** | < 70% | Restart if > 90% |

### Viewing Logs

Access logs through the Management UI or via the sandbox:

```bash
# View dev server logs
tail -f .manus-logs/devserver.log

# View browser console logs
tail -f .manus-logs/browserConsole.log

# View network requests
tail -f .manus-logs/networkRequests.log
```

### Error Investigation

1. Check `.manus-logs/devserver.log` for server errors
2. Review `.manus-logs/browserConsole.log` for client errors
3. Check database logs for query errors
4. Review scheduled task logs: `manus-heartbeat logs --task-uid <uid>`

---

## Performance Optimization

### Database Query Optimization

1. **Add indexes** for frequently queried columns
2. **Monitor slow queries** using database tools
3. **Archive old data** to maintain performance
4. **Vacuum tables** regularly to reclaim space

### Caching Strategy

The platform uses in-memory caching for:

- User sessions
- Recent task data
- Conversation history

Cache is automatically invalidated when data changes.

### Load Balancing

For high-traffic deployments:

1. Deploy multiple instances behind a load balancer
2. Use sticky sessions for OAuth flow
3. Share database across instances
4. Monitor instance health

---

## Security Management

### Access Control

- **Role-Based Access Control (RBAC)**: Users and admins have different permissions
- **Session Management**: Sessions expire after 1 year
- **OAuth Integration**: All authentication via Manus OAuth

### Audit Logging

The `auditLogs` table tracks:

- User login/logout events
- Role changes
- Task creation and execution
- Document uploads and downloads
- Admin actions

**Query audit logs:**
```sql
SELECT * FROM auditLogs 
WHERE userId = ? 
ORDER BY createdAt DESC 
LIMIT 100;
```

### Security Best Practices

1. **Keep credentials secure**: Never commit `.env` files
2. **Use HTTPS**: Always use encrypted connections
3. **Regular backups**: Maintain secure backups
4. **Monitor access**: Review audit logs regularly
5. **Update dependencies**: Keep packages current

---

## Troubleshooting

### Common Issues

**Issue: Users can't log in**
- Check OAuth configuration
- Verify `VITE_APP_ID` is correct
- Check database connection

**Issue: Tasks failing frequently**
- Review agent tool logs
- Check LLM API availability
- Verify task objectives are clear

**Issue: Database connection errors**
- Check `DATABASE_URL` format
- Verify database is running
- Check network connectivity

**Issue: Scheduled tasks not running**
- Verify Heartbeat jobs are enabled
- Check `/api/scheduled/*` endpoints are accessible
- Review Heartbeat logs: `manus-heartbeat logs --task-uid <uid>`

### Restarting Services

```bash
# Restart dev server
pnpm dev

# Restart production server
npm start

# Check server status
ps aux | grep node
```

---

## Maintenance Tasks

### Daily Tasks

- Monitor error logs
- Check system health metrics
- Verify scheduled tasks completed

### Weekly Tasks

- Review user activity
- Check database performance
- Audit access logs
- Test backups

### Monthly Tasks

- Optimize database tables
- Review and update security policies
- Analyze performance trends
- Plan capacity upgrades

### Quarterly Tasks

- Security audit
- Performance review
- Dependency updates
- Disaster recovery testing

---

## Deployment and Updates

### Deploying Updates

1. **Save checkpoint**: `webdev_save_checkpoint`
2. **Review changes**: Check diff of modifications
3. **Test locally**: Verify all tests pass
4. **Deploy**: Click Publish in Management UI
5. **Monitor**: Watch logs for errors

### Rolling Back

If issues occur after deployment:

1. Go to Management UI → Version History
2. Select previous stable version
3. Click "Rollback"
4. Verify system is working

### Database Migrations

For schema changes:

1. Create migration SQL
2. Test in development
3. Back up production database
4. Apply migration: `webdev_execute_sql`
5. Verify data integrity

---

## Scaling and Performance

### Horizontal Scaling

For increased traffic:

1. Deploy multiple instances
2. Use load balancer (e.g., Nginx, HAProxy)
3. Share database across instances
4. Use Redis for session storage (optional)

### Vertical Scaling

For increased load per instance:

1. Increase server RAM
2. Upgrade CPU
3. Optimize database queries
4. Enable caching

### Monitoring at Scale

1. Set up centralized logging (ELK, Datadog)
2. Monitor all instances
3. Set up alerts for anomalies
4. Track performance trends

---

## Disaster Recovery

### Backup Strategy

- **Daily backups**: Automated via database provider
- **Weekly full backups**: Complete system snapshot
- **Monthly archives**: Long-term retention

### Recovery Procedures

**From database backup:**
1. Stop the application
2. Restore database from backup
3. Verify data integrity
4. Restart application

**From full system backup:**
1. Restore entire system
2. Verify all services
3. Run health checks
4. Notify users if needed

### Testing Recovery

- Monthly: Test backup restoration
- Quarterly: Full disaster recovery drill
- Document recovery time objective (RTO)
- Document recovery point objective (RPO)

---

## Support and Resources

- **API Documentation**: See `docs/API.md`
- **User Guide**: See `docs/USER_GUIDE.md`
- **Troubleshooting**: See `docs/TROUBLESHOOTING.md`
- **Database Schema**: See `drizzle/schema.ts`
- **Periodic Updates**: See `references/periodic-updates.md`

---

## Contact and Escalation

For critical issues:

1. Check logs and error messages
2. Review this guide's troubleshooting section
3. Contact the development team
4. Escalate to platform support if needed

---

Thank you for administering Elysium Agent!
