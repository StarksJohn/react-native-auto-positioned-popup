#!/usr/bin/env node

/**
 * Post-build script to strip console.log statements from compiled lib files
 *
 * This script:
 * 1. Adds DEBUG_LOG flag and debugLog wrapper function to constants.js
 * 2. Replaces all console.log calls with debugLog in lib/*.js files
 * 3. Ensures production builds have minimal console output for performance
 *
 * Usage:
 *   node scripts/strip-console-logs.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const LIB_DIR = path.join(process.cwd(), 'lib');
const CONSTANTS_FILE = path.join(LIB_DIR, 'constants.js');

/**
 * Debug logging code to inject into constants.js
 */
const DEBUG_LOG_CODE = `
/**
 * Debug logging control flag - set to false to disable all console.log for performance
 * In React Native debug mode, excessive console.log causes severe performance degradation
 * due to JS Bridge serialization overhead
 */
export const DEBUG_LOG = false;
export const debugLog = (...args) => {
    if (DEBUG_LOG) {
        console.log(...args);
    }
};
`;

/**
 * Process constants.js to add DEBUG_LOG and debugLog
 */
function processConstantsFile() {
  if (!fs.existsSync(CONSTANTS_FILE)) {
    console.log(`${colors.yellow}Warning: constants.js not found, creating it${colors.reset}`);
    fs.writeFileSync(CONSTANTS_FILE, DEBUG_LOG_CODE.trim() + '\n');
    return;
  }

  let content = fs.readFileSync(CONSTANTS_FILE, 'utf8');

  // Check if DEBUG_LOG already exists
  if (content.includes('export const DEBUG_LOG')) {
    console.log(`${colors.blue}constants.js already has DEBUG_LOG, skipping${colors.reset}`);
    return;
  }

  // Add DEBUG_LOG code at the beginning of the file (after any initial comments)
  const lines = content.split('\n');
  let insertIndex = 0;

  // Skip any initial comments or empty lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*') || line === '') {
      insertIndex = i + 1;
    } else {
      break;
    }
  }

  // Insert DEBUG_LOG code
  lines.splice(insertIndex, 0, DEBUG_LOG_CODE);
  content = lines.join('\n');

  fs.writeFileSync(CONSTANTS_FILE, content);
  console.log(`${colors.green}Added DEBUG_LOG to constants.js${colors.reset}`);
}

/**
 * Replace console.log with debugLog in a file
 * @param {string} filePath - Path to the file
 * @returns {number} - Number of replacements made
 */
function replaceConsoleLogInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);

  // Skip constants.js as it defines debugLog
  if (fileName === 'constants.js') {
    return 0;
  }

  // Count occurrences before replacement
  const matches = content.match(/console\.log\s*\(/g);
  const count = matches ? matches.length : 0;

  if (count === 0) {
    return 0;
  }

  // Check if file has a LOCAL debugLog definition (not imported)
  // This handles files that define their own debugLog function for custom debug control
  const hasLocalDebugLog = /(?:const|let|var|function)\s+debugLog\s*[=(]/.test(content);

  if (hasLocalDebugLog) {
    // File has its own debugLog implementation, skip processing to avoid duplicate declaration
    console.log(`${colors.yellow}  Skipping ${fileName}: has local debugLog definition${colors.reset}`);
    return 0;
  }

  // Check if debugLog import already exists
  const hasDebugLogImport = content.includes("import { debugLog") ||
                            content.includes("import {debugLog") ||
                            content.includes("from './constants'") && content.includes("debugLog");

  // Add import for debugLog if not present
  if (!hasDebugLogImport) {
    // Find existing imports from constants
    const constantsImportRegex = /import\s*\{([^}]*)\}\s*from\s*['"]\.\/constants['"]/;
    const match = content.match(constantsImportRegex);

    if (match) {
      // Add debugLog to existing import
      const existingImports = match[1];
      if (!existingImports.includes('debugLog')) {
        const newImports = existingImports.trim() + ', debugLog';
        content = content.replace(constantsImportRegex, `import { ${newImports} } from './constants'`);
      }
    } else {
      // Add new import statement at the beginning (after any "use strict" or initial comments)
      const importStatement = "import { debugLog } from './constants';\n";

      // Find the best position to insert import
      if (content.startsWith('"use strict"') || content.startsWith("'use strict'")) {
        const endOfStrict = content.indexOf(';') + 1;
        content = content.slice(0, endOfStrict) + '\n' + importStatement + content.slice(endOfStrict);
      } else {
        // Insert at the beginning
        content = importStatement + content;
      }
    }
  }

  // Replace console.log with debugLog
  content = content.replace(/console\.log\s*\(/g, 'debugLog(');

  fs.writeFileSync(filePath, content);
  return count;
}

/**
 * Process all JavaScript files in the lib directory
 */
function processLibDirectory() {
  if (!fs.existsSync(LIB_DIR)) {
    console.log(`${colors.yellow}Warning: lib directory not found${colors.reset}`);
    return;
  }

  const files = fs.readdirSync(LIB_DIR);
  const jsFiles = files.filter(f => f.endsWith('.js') && !f.endsWith('.map.js'));

  let totalReplacements = 0;
  const processedFiles = [];

  for (const file of jsFiles) {
    const filePath = path.join(LIB_DIR, file);
    const count = replaceConsoleLogInFile(filePath);

    if (count > 0) {
      processedFiles.push({ file, count });
      totalReplacements += count;
    }
  }

  return { totalReplacements, processedFiles };
}

/**
 * Main execution
 */
function main() {
  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}  Strip Console.log Post-build Script${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);

  try {
    // Step 1: Process constants.js
    console.log(`${colors.blue}Step 1: Processing constants.js...${colors.reset}`);
    processConstantsFile();

    // Step 2: Process all lib files
    console.log(`\n${colors.blue}Step 2: Processing lib/*.js files...${colors.reset}`);
    const result = processLibDirectory();

    if (result) {
      console.log(`\n${colors.green}Summary:${colors.reset}`);
      console.log(`  Total files processed: ${result.processedFiles.length}`);
      console.log(`  Total console.log replaced: ${result.totalReplacements}`);

      if (result.processedFiles.length > 0) {
        console.log(`\n  Files modified:`);
        for (const { file, count } of result.processedFiles) {
          console.log(`    - ${file}: ${count} replacements`);
        }
      }
    }

    console.log(`\n${colors.green}Console.log stripping completed successfully!${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.yellow}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { main, processConstantsFile, replaceConsoleLogInFile };
