---
description: Safe database schema changes without data loss
---

# Safe Database Schema Changes Workflow

## ⚠️ CRITICAL WARNING
**NEVER use `--force-reset` in ANY environment!** This deletes ALL data in development AND production. Use only safe alternatives below.

## 🛡️ Safe Schema Change Process

### 1. Check Environment First
```bash
# Check if you're in production
if [ "$NODE_ENV" = "production" ]; then
  echo "❌ PRODUCTION DETECTED - Using safe schema changes"
  # Use safe methods below
else
  echo "✅ Development environment detected"
  # Still NEVER use --force-reset even in development
fi
```

### 2. For Adding New Fields (like autoRenew)
```bash
# ✅ SAFE: Create migration instead of reset
npx prisma migrate dev --name add-auto-renew-field

# ✅ SAFE: Apply schema changes without data loss
npx prisma db push --force  # NOT --force-reset
npx prisma generate

# ❌ NEVER: This deletes ALL data
# npx prisma db push --force-reset  # FORBIDDEN
```

### 3. For Complex Schema Changes
```bash
# Step 1: Create migration
npx prisma migrate dev --name descriptive-change-name

# Step 2: Apply to database
npx prisma migrate deploy

# Step 3: Generate client
npx prisma generate
```

### 4. Before Any Schema Change
```bash
# 1. Backup current data
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# 2. Test in development first
# 3. Review migration files before applying
# 4. Have rollback plan ready
```

## 🔄 Recovery Steps (if data was lost)

### 1. Restore from Backup (if available)
```bash
psql $DATABASE_URL < backup-20240315-193000.sql
```

### 2. Re-seed Essential Data
```bash
# Run existing seed script
npx tsx prisma/seed.ts
```

### 3. Manual Data Recovery
- Contact users to re-register if needed
- Import any exported data files
- Check for any automated backups

## 📋 Pre-Change Checklist
- [ ] Environment verified (dev/prod)
- [ ] Backup created
- [ ] Migration plan reviewed
- [ ] Rollback plan ready
- [ ] Test in development first
- [ ] User communication plan ready

## 🚨 Emergency Recovery Commands
```bash
# Stop any running services
pm2 stop all

# Restore from most recent backup
psql $DATABASE_URL < LATEST_BACKUP.sql

# Restart services
pm2 start all
```

## 💡 Best Practices
1. **Always backup** before schema changes
2. **Use migrations** instead of resets
3. **Test in development** first
4. **Never use --force-reset** in production
5. **Document all schema changes**
6. **Communicate with users** about maintenance
