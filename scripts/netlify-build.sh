#!/bin/bash

# Netlify build script
echo "🚀 Starting Netlify build process..."

# Check Node.js version
echo "🔍 Node version: $(node --version)"
echo "🔍 NPM version: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --prefer-offline --no-audit --no-fund

# Check if all required environment variables are set
echo "🔑 Checking environment variables..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "❌ NEXT_PUBLIC_SUPABASE_URL is not set"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ SUPABASE_SERVICE_ROLE_KEY is not set"
  exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
  echo "❌ NEXTAUTH_SECRET is not set"
  exit 1
fi

if [ -z "$NEXTAUTH_URL" ]; then
  echo "❌ NEXTAUTH_URL is not set"
  exit 1
fi

echo "✅ All required environment variables are set"

# Run the build
echo "🏗️ Building Next.js application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
  echo "✅ Build completed successfully!"
  exit 0
else
  echo "❌ Build failed!"
  exit 1
fi