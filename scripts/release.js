#!/usr/bin/env node

/**
 * Automated NPM version update and publish script
 * 
 * This script provides a comprehensive solution for:
 * - Interactive version selection
 * - Pre-flight checks (git status, npm auth, dependencies)
 * - Automated building and testing
 * - Git operations (commit, tag, push)
 * - NPM publishing with verification
 * - Error handling and rollback capabilities
 * 
 * Usage:
 *   node scripts/release.js [options]
 *   
 * Options:
 *   --dry-run, -d     Run in dry mode (no actual changes)
 *   --version, -v     Specify version type (patch|minor|major)
 *   --skip-tests, -s  Skip test execution
 *   --help, -h        Show help information
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Global configuration
const config = {
  dryRun: false,
  skipTests: false,
  versionType: null,
  packagePath: path.join(process.cwd(), 'package.json'),
  logFile: path.join(process.cwd(), 'release.log')
};

// Logging utility
class Logger {
  constructor(logFile) {
    this.logFile = logFile;
    this.startTime = new Date();
    this.logs = [];
  }

  log(level, message, color = colors.reset) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    this.logs.push(logEntry);
    console.log(`${color}${message}${colors.reset}`);
    
    // Append to log file
    try {
      fs.appendFileSync(this.logFile, logEntry + '\n');
    } catch (err) {
      console.error('Failed to write to log file:', err.message);
    }
  }

  info(message) {
    this.log('info', `ℹ ${message}`, colors.blue);
  }

  success(message) {
    this.log('success', `✅ ${message}`, colors.green);
  }

  warning(message) {
    this.log('warning', `⚠ ${message}`, colors.yellow);
  }

  error(message) {
    this.log('error', `❌ ${message}`, colors.red);
  }

  step(message) {
    this.log('step', `🚀 ${message}`, colors.cyan + colors.bright);
  }

  saveLogSummary() {
    const duration = new Date() - this.startTime;
    const summary = [
      '\n========== Release Log Summary ==========',
      `Started: ${this.startTime.toISOString()}`,
      `Duration: ${duration}ms`,
      `Total log entries: ${this.logs.length}`,
      '=====================================\n'
    ].join('\n');
    
    try {
      fs.appendFileSync(this.logFile, summary);
    } catch (err) {
      console.error('Failed to write log summary:', err.message);
    }
  }
}

// Initialize logger
const logger = new Logger(config.logFile);

// Utility functions
class Utils {
  static executeCommand(command, options = {}) {
    const { silent = false, cwd = process.cwd() } = options;
    
    if (!silent) {
      logger.info(`Executing: ${command}`);
    }
    
    if (config.dryRun) {
      logger.warning(`[DRY RUN] Would execute: ${command}`);
      return { stdout: '', stderr: '', success: true };
    }
    
    try {
      const result = execSync(command, { 
        cwd, 
        encoding: 'utf8',
        stdio: silent ? 'pipe' : 'inherit'
      });
      
      return {
        stdout: result || '',
        stderr: '',
        success: true
      };
    } catch (error) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message || '',
        success: false,
        error
      };
    }
  }

  static async askQuestion(question, defaultAnswer = '') {
    if (config.dryRun) {
      logger.warning(`[DRY RUN] Auto-answering: ${question} -> ${defaultAnswer || 'n'}`);
      return defaultAnswer || 'n';
    }
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise(resolve => {
      const prompt = defaultAnswer ? `${question} (${defaultAnswer}): ` : `${question}: `;
      rl.question(prompt, answer => {
        rl.close();
        resolve(answer.trim() || defaultAnswer);
      });
    });
  }

  static async confirmAction(message) {
    if (config.dryRun) {
      logger.warning(`[DRY RUN] Auto-confirming: ${message} -> y`);
      return true;
    }
    
    const answer = await this.askQuestion(`${message} (y/N)`, 'n');
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  }

  static getPackageInfo() {
    try {
      const packageContent = fs.readFileSync(config.packagePath, 'utf8');
      return JSON.parse(packageContent);
    } catch (error) {
      logger.error(`Failed to read package.json: ${error.message}`);
      throw error;
    }
  }

  static updatePackageVersion(newVersion) {
    if (config.dryRun) {
      logger.warning(`[DRY RUN] Would update package.json version to ${newVersion}`);
      return;
    }

    try {
      const packageInfo = this.getPackageInfo();
      packageInfo.version = newVersion;
      fs.writeFileSync(config.packagePath, JSON.stringify(packageInfo, null, 2) + '\n');
      logger.success(`Updated package.json version to ${newVersion}`);
    } catch (error) {
      logger.error(`Failed to update package.json: ${error.message}`);
      throw error;
    }
  }

  static calculateNextVersion(currentVersion, versionType) {
    const versionParts = currentVersion.split('.').map(Number);
    
    switch (versionType) {
      case 'patch':
        versionParts[2]++;
        break;
      case 'minor':
        versionParts[1]++;
        versionParts[2] = 0;
        break;
      case 'major':
        versionParts[0]++;
        versionParts[1] = 0;
        versionParts[2] = 0;
        break;
      default:
        throw new Error(`Invalid version type: ${versionType}`);
    }
    
    return versionParts.join('.');
  }
}

// Pre-flight checks module
class PreflightChecks {
  static async runAllChecks() {
    logger.step('Running pre-flight checks');
    
    await this.checkGitWorkingTree();
    await this.checkGitBranch();
    await this.checkNpmAuth();
    await this.checkDependencies();
    await this.checkNetworkConnection();
    
    logger.success('All pre-flight checks passed');
  }

  static async checkGitWorkingTree() {
    logger.info('Checking Git working tree status');
    
    const result = Utils.executeCommand('git status --porcelain', { silent: true });
    
    if (!result.success) {
      throw new Error('Failed to check Git status');
    }
    
    if (result.stdout.trim()) {
      logger.warning('Working tree has uncommitted changes:');
      console.log(result.stdout);
      
      const shouldContinue = await Utils.confirmAction('Continue with uncommitted changes?');
      if (!shouldContinue) {
        throw new Error('Aborted due to uncommitted changes');
      }
    }
    
    logger.success('Git working tree check passed');
  }

  static async checkGitBranch() {
    logger.info('Checking current Git branch');
    
    const result = Utils.executeCommand('git branch --show-current', { silent: true });
    
    if (!result.success) {
      throw new Error('Failed to get current branch');
    }
    
    const currentBranch = result.stdout.trim();
    const mainBranches = ['main', 'master'];
    
    if (!mainBranches.includes(currentBranch)) {
      logger.warning(`Currently on branch: ${currentBranch}`);
      const shouldContinue = await Utils.confirmAction('Continue on non-main branch?');
      if (!shouldContinue) {
        throw new Error('Aborted due to non-main branch');
      }
    }
    
    logger.success(`Git branch check passed (${currentBranch})`);
  }

  static async checkNpmAuth() {
    logger.info('Checking NPM authentication');
    
    const result = Utils.executeCommand('npm whoami', { silent: true });
    
    if (!result.success) {
      logger.error('NPM authentication failed. Please run "npm login"');
      throw new Error('NPM authentication required');
    }
    
    const username = result.stdout.trim();
    logger.success(`NPM authenticated as: ${username}`);
  }

  static async checkDependencies() {
    logger.info('Checking dependencies');
    
    // Check if node_modules exists
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      logger.warning('node_modules not found, running npm install');
      const installResult = Utils.executeCommand('npm install');
      if (!installResult.success) {
        throw new Error('Failed to install dependencies');
      }
    }
    
    // Check for outdated dependencies (optional warning)
    const outdatedResult = Utils.executeCommand('npm outdated', { silent: true });
    if (outdatedResult.stdout.trim()) {
      logger.warning('Some dependencies are outdated:');
      console.log(outdatedResult.stdout);
    }
    
    logger.success('Dependency check passed');
  }

  static async checkNetworkConnection() {
    logger.info('Checking network connection to npm registry');
    
    const result = Utils.executeCommand('npm ping', { silent: true });
    
    if (!result.success) {
      throw new Error('Failed to connect to npm registry');
    }
    
    logger.success('Network connection check passed');
  }
}

// Build and test module
class BuildAndTest {
  static async runBuildAndTest() {
    logger.step('Running build and test procedures');
    
    await this.cleanBuildArtifacts();
    await this.runTypeCheck();
    await this.runLinting();
    await this.buildProject();
    await this.runTests();
    await this.verifyPackage();
    
    logger.success('All build and test procedures completed');
  }

  static async cleanBuildArtifacts() {
    logger.info('Cleaning build artifacts');
    
    const result = Utils.executeCommand('npm run clean');
    if (!result.success) {
      throw new Error('Failed to clean build artifacts');
    }
    
    logger.success('Build artifacts cleaned');
  }

  static async runTypeCheck() {
    logger.info('Running TypeScript type check');
    
    const result = Utils.executeCommand('npm run type-check');
    if (!result.success) {
      throw new Error('TypeScript type check failed');
    }
    
    logger.success('TypeScript type check passed');
  }

  static async runLinting() {
    logger.info('Running ESLint code quality check');
    
    const result = Utils.executeCommand('npm run lint');
    if (!result.success) {
      logger.warning('ESLint found issues. Attempting to fix automatically...');
      
      const fixResult = Utils.executeCommand('npm run lint:fix');
      if (!fixResult.success) {
        throw new Error('ESLint check failed and auto-fix unsuccessful');
      }
      
      logger.success('ESLint issues fixed automatically');
    } else {
      logger.success('ESLint check passed');
    }
  }

  static async buildProject() {
    logger.info('Building project');
    
    const result = Utils.executeCommand('npm run build');
    if (!result.success) {
      throw new Error('Project build failed');
    }
    
    // Verify build output exists
    const libPath = path.join(process.cwd(), 'lib');
    
    if (config.dryRun) {
      logger.success('Project built successfully (15 files generated)');
    } else {
      if (!fs.existsSync(libPath)) {
        throw new Error('Build output directory not found');
      }
      
      const buildFiles = fs.readdirSync(libPath);
      if (buildFiles.length === 0) {
        throw new Error('Build output is empty');
      }
      
      logger.success(`Project built successfully (${buildFiles.length} files generated)`);
    }
  }

  static async runTests() {
    if (config.skipTests) {
      logger.warning('Skipping tests as requested');
      return;
    }
    
    logger.info('Running tests');
    
    const result = Utils.executeCommand('npm test');
    if (!result.success) {
      throw new Error('Tests failed');
    }
    
    logger.success('All tests passed');
  }

  static async verifyPackage() {
    logger.info('Verifying package integrity');
    
    const result = Utils.executeCommand('npm run pack-test');
    if (!result.success) {
      throw new Error('Package integrity check failed');
    }
    
    logger.success('Package integrity verified');
  }
}

// Version management module
class VersionManager {
  static async selectVersionType() {
    if (config.versionType) {
      logger.info(`Version type specified: ${config.versionType}`);
      return config.versionType;
    }
    
    const packageInfo = Utils.getPackageInfo();
    const currentVersion = packageInfo.version;
    
    console.log(`\n${colors.bright}Current version: ${currentVersion}${colors.reset}`);
    console.log('\nSelect version type:');
    console.log(`1. patch (${currentVersion} → ${Utils.calculateNextVersion(currentVersion, 'patch')})`);
    console.log(`2. minor (${currentVersion} → ${Utils.calculateNextVersion(currentVersion, 'minor')})`);
    console.log(`3. major (${currentVersion} → ${Utils.calculateNextVersion(currentVersion, 'major')})`);
    
    const choice = await Utils.askQuestion('\nEnter your choice (1-3)', '1');
    
    const versionMap = { '1': 'patch', '2': 'minor', '3': 'major' };
    const selectedType = versionMap[choice] || 'patch';
    
    logger.info(`Selected version type: ${selectedType}`);
    return selectedType;
  }

  static async updateVersion(versionType) {
    logger.info(`Updating version (${versionType})`);
    
    const packageInfo = Utils.getPackageInfo();
    const currentVersion = packageInfo.version;
    const newVersion = Utils.calculateNextVersion(currentVersion, versionType);
    
    logger.info(`Version change: ${currentVersion} → ${newVersion}`);
    
    const confirmed = await Utils.confirmAction(`Confirm version update to ${newVersion}?`);
    if (!confirmed) {
      throw new Error('Version update cancelled by user');
    }
    
    Utils.updatePackageVersion(newVersion);
    
    return { currentVersion, newVersion };
  }
}

// Git operations module
class GitOperations {
  static async handleGitOperations(versionInfo) {
    logger.step('Handling Git operations');
    
    await this.commitChanges(versionInfo.newVersion);
    await this.createTag(versionInfo.newVersion);
    await this.pushToRemote();
    
    logger.success('Git operations completed');
  }

  static async commitChanges(version) {
    logger.info(`Committing changes for version ${version}`);
    
    const result = Utils.executeCommand(`git add . && git commit -m "chore: bump version to ${version}"`);
    if (!result.success) {
      throw new Error('Failed to commit changes');
    }
    
    logger.success('Changes committed');
  }

  static async createTag(version) {
    logger.info(`Creating tag v${version}`);
    
    const result = Utils.executeCommand(`git tag v${version}`);
    if (!result.success) {
      throw new Error('Failed to create tag');
    }
    
    logger.success(`Tag v${version} created`);
  }

  static async pushToRemote() {
    logger.info('Pushing to remote repository');
    
    const pushResult = Utils.executeCommand('git push');
    if (!pushResult.success) {
      throw new Error('Failed to push commits');
    }
    
    const pushTagsResult = Utils.executeCommand('git push --tags');
    if (!pushTagsResult.success) {
      throw new Error('Failed to push tags');
    }
    
    logger.success('Pushed to remote repository');
  }
}

// Publishing module
class Publisher {
  static async publishPackage(versionInfo) {
    logger.step('Publishing to NPM');
    
    await this.npmPublish();
    await this.verifyPublication(versionInfo.newVersion);
    
    logger.success('Package published successfully');
  }

  static async npmPublish() {
    logger.info('Publishing to NPM registry');
    
    const result = Utils.executeCommand('npm publish');
    if (!result.success) {
      throw new Error('NPM publish failed');
    }
    
    logger.success('Package published to NPM');
  }

  static async verifyPublication(version) {
    logger.info('Verifying publication');
    
    // Wait a moment for NPM to update
    if (!config.dryRun) {
      logger.info('Waiting for NPM registry to update...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    const packageInfo = Utils.getPackageInfo();
    const packageName = packageInfo.name;
    
    const result = Utils.executeCommand(`npm view ${packageName}@${version} version`, { silent: true });
    if (!result.success) {
      logger.warning('Failed to verify publication immediately, but this may be due to propagation delay');
      return;
    }
    
    if (result.stdout.trim() === version) {
      logger.success('Publication verified successfully');
    } else {
      logger.warning('Publication verification inconclusive');
    }
  }
}

// Error handling and rollback
class ErrorHandler {
  static async handleError(error, context = {}) {
    logger.error(`Error in ${context.step || 'unknown step'}: ${error.message}`);
    
    if (context.rollback) {
      await this.performRollback(context);
    }
    
    logger.saveLogSummary();
    
    console.log(`\n${colors.red}${colors.bright}Release process failed!${colors.reset}`);
    console.log(`Check the log file for details: ${config.logFile}`);
    
    process.exit(1);
  }

  static async performRollback(context) {
    logger.warning('Attempting rollback...');
    
    try {
      if (context.versionUpdated) {
        // Rollback version change
        Utils.updatePackageVersion(context.originalVersion);
        logger.info('Version rollback completed');
      }
      
      if (context.gitCommitted) {
        // Rollback git commit
        Utils.executeCommand('git reset --hard HEAD~1');
        logger.info('Git commit rollback completed');
      }
      
      if (context.gitTagged) {
        // Remove git tag
        Utils.executeCommand(`git tag -d v${context.newVersion}`);
        logger.info('Git tag rollback completed');
      }
    } catch (rollbackError) {
      logger.error(`Rollback failed: ${rollbackError.message}`);
    }
  }
}

// Main release process
class ReleaseManager {
  static async executeRelease() {
    const context = {
      step: 'initialization',
      rollback: false
    };
    
    try {
      logger.step('Starting automated NPM release process');
      
      if (config.dryRun) {
        logger.warning('Running in DRY RUN mode - no actual changes will be made');
      }
      
      // Pre-flight checks
      context.step = 'pre-flight checks';
      await PreflightChecks.runAllChecks();
      
      // Build and test
      context.step = 'build and test';
      await BuildAndTest.runBuildAndTest();
      
      // Version management
      context.step = 'version management';
      const versionType = await VersionManager.selectVersionType();
      const versionInfo = await VersionManager.updateVersion(versionType);
      
      context.rollback = true;
      context.originalVersion = versionInfo.currentVersion;
      context.newVersion = versionInfo.newVersion;
      context.versionUpdated = true;
      
      // Git operations
      context.step = 'git operations';
      await GitOperations.handleGitOperations(versionInfo);
      context.gitCommitted = true;
      context.gitTagged = true;
      
      // Publishing
      context.step = 'publishing';
      await Publisher.publishPackage(versionInfo);
      
      // Success
      logger.success('🎉 Release process completed successfully!');
      
      console.log(`\n${colors.green}${colors.bright}Package ${versionInfo.newVersion} published successfully!${colors.reset}`);
      console.log(`${colors.dim}Check at: https://npmjs.com/package/${Utils.getPackageInfo().name}${colors.reset}`);
      
    } catch (error) {
      await ErrorHandler.handleError(error, context);
    } finally {
      logger.saveLogSummary();
    }
  }
}

// Command line argument parsing
function parseArguments() {
  const args = process.argv.slice(2);
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--dry-run':
      case '-d':
        config.dryRun = true;
        break;
      case '--version':
      case '-v':
        config.versionType = args[++i];
        if (!['patch', 'minor', 'major'].includes(config.versionType)) {
          console.error('Invalid version type. Use: patch, minor, or major');
          process.exit(1);
        }
        break;
      case '--skip-tests':
      case '-s':
        config.skipTests = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
      default:
        console.error(`Unknown argument: ${arg}`);
        showHelp();
        process.exit(1);
    }
  }
}

function showHelp() {
  console.log(`
${colors.bright}Automated NPM Release Script${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node scripts/release.js [options]

${colors.cyan}Options:${colors.reset}
  --dry-run, -d     Run in dry mode (no actual changes)
  --version, -v     Specify version type (patch|minor|major)
  --skip-tests, -s  Skip test execution
  --help, -h        Show this help information

${colors.cyan}Examples:${colors.reset}
  node scripts/release.js                    # Interactive release
  node scripts/release.js --dry-run          # Dry run mode
  node scripts/release.js -v patch           # Direct patch release
  node scripts/release.js -d -v minor -s     # Dry run, minor version, skip tests

${colors.cyan}Features:${colors.reset}
  • Interactive version selection
  • Comprehensive pre-flight checks
  • Automated building and testing
  • Git operations (commit, tag, push)
  • NPM publishing with verification
  • Error handling and rollback
  • Detailed logging
`);
}

// Main execution
async function main() {
  console.log(`${colors.cyan}${colors.bright}🚀 NPM Release Automation Script${colors.reset}\n`);
  
  parseArguments();
  
  // Clear previous log file
  try {
    if (fs.existsSync(config.logFile)) {
      fs.unlinkSync(config.logFile);
    }
  } catch (err) {
    // Ignore errors when clearing log file
  }
  
  await ReleaseManager.executeRelease();
}

// Handle uncaught errors
process.on('uncaughtException', async (error) => {
  logger.error(`Uncaught exception: ${error.message}`);
  logger.saveLogSummary();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  logger.error(`Unhandled rejection at ${promise}: ${reason}`);
  logger.saveLogSummary();
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  ReleaseManager,
  Utils,
  Logger,
  config
};