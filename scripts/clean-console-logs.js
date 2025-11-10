#!/usr/bin/env node

/**
 * 🧹 Clean Console Logs for Production
 * 
 * This script comments out unnecessary console.log statements
 * while keeping console.error and console.warn for debugging.
 * 
 * Usage:
 *   node scripts/clean-console-logs.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const DRY_RUN = process.argv.includes('--dry-run');

// Files/folders to skip
const SKIP_PATTERNS = [
  'node_modules/**',
  '.next/**',
  'dist/**',
  'build/**',
  'scripts/**',
  'tests/**',
  'backtest/**',
];

// Patterns to replace
const PATTERNS = [
  {
    regex: /(\s+)console\.log\((.*?)\);/g,
    replacement: '$1// console.log($2); // Disabled for production',
    description: 'console.log',
  },
  {
    regex: /(\s+)console\.info\((.*?)\);/g,
    replacement: '$1// console.info($2); // Disabled for production',
    description: 'console.info',
  },
  {
    regex: /(\s+)console\.debug\((.*?)\);/g,
    replacement: '$1// console.debug($2); // Disabled for production',
    description: 'console.debug',
  },
];

// Keep these for production debugging
const KEEP_PATTERNS = [
  'console.error',
  'console.warn',
];

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let changes = 0;

  PATTERNS.forEach(({ regex, replacement, description }) => {
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, replacement);
      changes += matches.length;
      modified = true;
    }
  });

  if (modified) {
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
    console.log(`✅ ${filePath}: ${changes} log(s) disabled`);
    return changes;
  }

  return 0;
}

function main() {
  console.log('🧹 Cleaning console logs for production...\n');
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No files will be modified\n');
  }

  const patterns = [
    'src/**/*.{ts,tsx,js,jsx}',
  ];

  let totalChanges = 0;
  let filesModified = 0;

  patterns.forEach(pattern => {
    const files = glob.sync(pattern, {
      ignore: SKIP_PATTERNS,
    });

    console.log(`📁 Processing ${files.length} files matching: ${pattern}\n`);

    files.forEach(file => {
      const changes = cleanFile(file);
      if (changes > 0) {
        totalChanges += changes;
        filesModified++;
      }
    });
  });

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Summary:`);
  console.log(`   Files modified: ${filesModified}`);
  console.log(`   Total logs disabled: ${totalChanges}`);
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'APPLIED'}`);
  console.log('='.repeat(50));

  console.log('\n✅ Keeping for production:');
  KEEP_PATTERNS.forEach(p => console.log(`   ✓ ${p}`));

  if (DRY_RUN) {
    console.log('\n💡 Run without --dry-run to apply changes');
  }
}

main();
