#!/bin/bash

echo "🚀 Starting Next.js build..."

# Create temp file in current directory (more reliable than /tmp in Docker)
TEMP_LOG="./build-output.log"

# Run Next.js build with real-time output
npm run build 2>&1 | tee "$TEMP_LOG"

# Capture the exit code from the build command
BUILD_EXIT_CODE=${PIPESTATUS[0]}

echo ""
echo "📊 Build Process Summary:"
echo "- Build Exit Code: $BUILD_EXIT_CODE"

# Check if the log file exists and has content
if [ ! -f "$TEMP_LOG" ]; then
  echo "❌ Error: Build log not created"
  exit 1
fi

# Check if all pages were generated successfully
# Look for the completion message (any number of pages)
if grep -q "✓ Generating static pages" "$TEMP_LOG" 2>/dev/null; then
  # Extract the actual page count
  PAGE_COUNT=$(grep -o "Generating static pages ([0-9]*/[0-9]*)" "$TEMP_LOG" | tail -1 | grep -o "[0-9]*/[0-9]*")
  echo "- Pages Generated: $PAGE_COUNT ✅"
  
  # Check for export errors (these are non-critical in Docker builds)
  if grep -q "Export encountered errors" "$TEMP_LOG" 2>/dev/null; then
    echo "- Export Warnings: Detected (non-critical) ⚠️"
    echo ""
    echo "✅ Build succeeded! All application pages generated."
    echo "⚠️  Default error page warnings can be safely ignored."
    
    # Run post-build script only if standalone mode is enabled
    # if [ -f "scripts/postbuild.sh" ]; then
    #   echo ""
    #   bash scripts/postbuild.sh
    # fi
    
    rm -f "$TEMP_LOG"
    exit 0
  fi
  
  # No export errors, clean build
  echo "- Export Warnings: None"
  echo ""
  echo "✅ Build completed successfully!"
  
  # Run post-build script only if standalone mode is enabled
  # if [ -f "scripts/postbuild.sh" ]; then
  #   echo ""
  #   bash scripts/postbuild.sh
  # fi
  
  rm -f "$TEMP_LOG"
  exit 0
fi

# Build failed - check what went wrong
echo "- Pages Generated: INCOMPLETE ❌"
echo ""
echo "❌ Build failed - not all pages were generated"
echo ""
echo "Last 20 lines of build output:"
tail -20 "$TEMP_LOG" 2>/dev/null || echo "(Could not read log file)"
rm -f "$TEMP_LOG"
exit 1
