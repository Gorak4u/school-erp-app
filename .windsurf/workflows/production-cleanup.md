---
description: Production cleanup workflow for removing test artifacts and temporary code
---

# Production Cleanup Workflow

This workflow ensures production-grade code quality by automatically cleaning up test artifacts, temporary code, and mock data.

## When to Use

- **After testing**: When you've completed testing and need to clean up
- **Before deployment**: Before deploying to production
- **After development**: When switching from development to production mode
- **Code review**: Before submitting code for review

## Cleanup Steps

### 1. Remove Test Files and Scripts
```bash
# Remove all test files from project root
rm -f test-*.js test-*.ts test-*.html
rm -f *.test.js *.test.ts *.spec.js *.spec.ts

# Remove test directories
rm -rf test/ tests/ __tests__/

# Remove temporary API endpoints
find src/app/api -name "*test*" -type d -exec rm -rf {} +
find src/app/api -name "*debug*" -type d -exec rm -rf {} +
find src/app/api -name "*temp*" -type d -exec rm -rf {} +
```

### 2. Clean Up Temporary Code Changes
```bash
# Check for TODO comments that indicate temporary code
grep -r "TODO\|FIXME\|TEMP\|HACK" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"

# Remove console.log statements (except error logs)
find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "console.log" | while read file; do
  # Keep error logs, remove debug logs
  sed -i '' '/console\.log\(/d' "$file"
done

# Remove debugger statements
find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "debugger" | while read file; do
  sed -i '' '/debugger/d' "$file"
done
```

### 3. Remove Mock and Hard-coded Data
```bash
# Find mock data files
find src/ -name "*mock*" -o -name "*sample*" -o -name "*dummy*" | grep -v node_modules

# Check for hard-coded test data
grep -r "test.*data\|mock.*data\|sample.*data\|dummy.*data" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"

# Look for hard-coded email addresses, passwords, tokens
grep -r "test.*@\|example\.com\|dummy.*@\|sample.*@" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"

# Check for hard-coded IDs, tokens, or secrets
grep -r "test.*token\|dummy.*id\|sample.*key\|mock.*secret" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"
```

### 4. Validate Production Readiness
```bash
# Check for development-only code
grep -r "process\.env\.NODE_ENV.*development\|if.*development" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"

# Verify no test imports remain
grep -r "from.*test\|import.*test" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"

# Check for exposed API keys or secrets
grep -r "API_KEY\|SECRET\|PASSWORD\|TOKEN" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "process\.env"
```

### 5. Build and Test Production Build
```bash
# Clean build
rm -rf .next

# Production build
npm run build

# Check for build warnings or errors
npm run build 2>&1 | grep -i "warning\|error"

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

### 6. Final Verification
```bash
# Check file sizes are reasonable
du -sh .next/
du -sh src/

# Verify no test files remain
find . -name "*test*" -not -path "./node_modules/*" -not -path "./.next/*"

# Check for any remaining temporary code
grep -r "TEMP\|FIXME\|TODO.*remove\|HACK" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"
```

## Automation Script

Create an automated cleanup script:

```bash
#!/bin/bash
# production-cleanup.sh

echo "🧹 Starting Production Cleanup..."

# Step 1: Remove test files
echo "📁 Removing test files..."
rm -f test-*.js test-*.ts test-*.html
find src/app/api -name "*test*" -type d -exec rm -rf {} + 2>/dev/null || true

# Step 2: Clean console logs
echo "🧹 Cleaning debug logs..."
find src/ -name "*.ts" -o -name "*.tsx" | xargs sed -i '' '/console\.log\(/d'

# Step 3: Remove debugger statements
echo "🐛 Removing debugger statements..."
find src/ -name "*.ts" -o -name "*.tsx" | xargs sed -i '' '/debugger/d'

# Step 4: Build verification
echo "🏗️  Verifying production build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Production cleanup completed successfully!"
else
    echo "❌ Build failed - please fix issues before deployment"
    exit 1
fi
```

## Pre-deployment Checklist

- [ ] All test files removed
- [ ] No temporary code comments (TODO, FIXME, TEMP)
- [ ] No mock or sample data in production code
- [ ] No hard-coded credentials or test data
- [ ] Console logs removed (except error logs)
- [ ] Debugger statements removed
- [ ] Production build succeeds
- [ ] No TypeScript errors
- [ ] No linting warnings
- [ ] Environment variables properly configured

## Memory Guidelines

### What to Remember
- Test files should always be temporary
- Production code should be clean and professional
- Mock data should never be committed
- Hard-coded values should use environment variables
- Debug code should be removed before deployment

### What to Avoid
- Committing test scripts to version control
- Leaving TODO/FIXME comments in production
- Hard-coding test emails, passwords, or tokens
- Using mock data in production features
- Leaving console.log statements in production code

## Implementation Notes

- This workflow should be run before every deployment
- Consider adding it as a git pre-commit hook
- Use CI/CD pipeline to enforce these rules automatically
- Regular code reviews should check for these issues
