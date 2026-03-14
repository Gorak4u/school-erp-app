#!/bin/bash

echo "🔍 Pre-deployment checks..."

# Check if Prisma schema and client are in sync
echo "📦 Checking Prisma client generation..."
npx prisma generate

# Verify database connection
echo "🗄️  Testing database connection..."
npx prisma db pull --force >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    exit 1
fi

# Check for TypeScript errors
echo "🔎 Checking TypeScript compilation..."
npx tsc --noEmit
if [ $? -eq 0 ]; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ TypeScript compilation failed"
    exit 1
fi

echo "✅ All pre-deployment checks passed!"
echo "🚀 Ready for deployment"
