#!/bin/bash

echo "📦 Preparing standalone build..."

# Check if standalone directory exists
if [ ! -d ".next/standalone" ]; then
  echo "❌ Error: .next/standalone directory not found"
  exit 1
fi

# Copy public folder to standalone
if [ -d "public" ]; then
  echo "📂 Copying public folder..."
  cp -r public .next/standalone/
fi

# Copy static files to standalone
if [ -d ".next/static" ]; then
  echo "📂 Copying static files..."
  mkdir -p .next/standalone/.next
  cp -r .next/static .next/standalone/.next/
fi

echo "✅ Standalone build prepared successfully!"
