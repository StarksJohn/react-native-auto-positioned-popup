# NPM Publishing Guide for react-native-auto-positioned-popup

This comprehensive guide provides both manual and automated approaches for publishing this React Native component to npm, including an advanced automated release system for streamlined publishing workflows.

## Table of Contents

- [Prerequisites](#prerequisites)
- [🚀 Automated Release System (Recommended)](#-automated-release-system-recommended)
- [Manual Publishing Steps](#manual-publishing-steps)
- [Version Management](#version-management)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)
- [Security Considerations](#security-considerations)
- [Maintenance](#maintenance)

## Prerequisites

1. **Node.js and npm**: Make sure you have Node.js installed (version 14 or higher)
2. **npm account**: Create an account at [npmjs.com](https://npmjs.com)
3. **Git**: For version control and repository management
4. **Git remote repository**: Properly configured with push permissions

---

## 🚀 Automated Release System (Recommended)

This project includes a comprehensive automated release script that handles version management, building, testing, Git operations, and NPM publishing with advanced error handling and rollback capabilities.

### ✨ Features

- 🚀 **Interactive version selection** - Choose between patch, minor, or major releases
- ✅ **Comprehensive pre-flight checks** - Git status, NPM auth, dependencies, network connectivity
- 🔨 **Automated building and testing** - Clean, compile, lint, type-check, and test
- 📦 **Package verification** - Ensures package integrity before publishing
- 🔄 **Git operations** - Automatic commits, tagging, and pushing
- 📤 **NPM publishing** - Publishes to registry with verification
- 🎯 **Error handling** - Rollback capabilities on failure
- 📝 **Detailed logging** - Complete audit trail of release process
- 🧪 **Dry run mode** - Test the process without making changes

### Quick Start

#### Interactive Release (Recommended)
use Private VPN
```bash
npm run release
```

This will:
1. Run all pre-flight checks
2. Build and test the project
3. Prompt you to select version type (patch/minor/major)
4. Show you the version change and ask for confirmation
5. Handle all Git operations
6. Publish to NPM
7. Verify the publication

#### Automated Release Commands

```bash
# Dry run mode (no actual changes)
npm run release:dry

# Direct version releases
npm run release:patch-auto    # Patch version (1.0.0 → 1.0.1)
npm run release:minor-auto    # Minor version (1.0.0 → 1.1.0)
npm run release:major-auto    # Major version (1.0.0 → 2.0.0)
```

#### Advanced Options

```bash
# Direct script execution with options
node scripts/release.js [options]

Options:
  --dry-run, -d     Run in dry mode (no actual changes)
  --version, -v     Specify version type (patch|minor|major)
  --skip-tests, -s  Skip test execution
  --help, -h        Show help information
```

#### Examples

```bash
# Interactive release with dry run
node scripts/release.js --dry-run

# Automated patch release
node scripts/release.js --version patch

# Skip tests and do minor release
node scripts/release.js --version minor --skip-tests

# Dry run with major version and skip tests
node scripts/release.js -d -v major -s
```

### Process Overview

#### 1. Pre-flight Checks
- ✅ Git working tree status (warns about uncommitted changes)
- ✅ Current Git branch validation (recommends main/master)
- ✅ NPM authentication status
- ✅ Dependencies installation and health
- ✅ Network connectivity to NPM registry

#### 2. Build and Test
- 🧹 Clean previous build artifacts
- 🔍 TypeScript type checking
- 📋 ESLint code quality (with auto-fix attempt)
- 🔨 Project compilation
- 🧪 Test execution (if not skipped)
- 📦 Package integrity verification

#### 3. Version Management
- 📊 Display current version
- 🎯 Interactive or automated version type selection
- 📈 Calculate and preview new version
- ✅ User confirmation for version update
- 📝 Update package.json

#### 4. Git Operations
- 💾 Commit version changes
- 🏷️ Create version tag (v1.0.0 format)
- ⬆️ Push commits and tags to remote

#### 5. NPM Publishing
- 📤 Publish package to NPM registry
- ⏳ Wait for registry propagation
- ✅ Verify successful publication

### Error Handling and Rollback

The automated script includes comprehensive error handling:

- **Automatic rollback** on failure (when possible)
- **Version rollback** - Reverts package.json changes
- **Git rollback** - Removes commits and tags
- **Detailed error logging** - Full audit trail in `release.log`
- **Graceful failure** - Clean exit with helpful error messages

### Logging

All release operations are logged to `release.log` with:
- Timestamps for all operations
- Step-by-step execution details
- Error messages and stack traces
- Release duration and summary

### Migration from Legacy Scripts

The legacy release scripts are still available:
```bash
npm run release:patch    # Old: npm version patch && npm publish
npm run release:minor    # Old: npm version minor && npm publish  
npm run release:major    # Old: npm version major && npm publish
```

However, the new automated script (`npm run release`) is recommended as it includes comprehensive checks and better error handling.

---

## Manual Publishing Steps

For those who prefer manual control or need to understand the underlying process, here's the step-by-step manual approach.

### Pre-Publishing Checklist

#### 1. Verify Package Configuration

Check your `package.json` file:

```json
{
  "name": "react-native-auto-positioned-popup",
  "version": "1.0.0",
  "main": "lib/index.js",
  "types": "lib/index.d.ts",
  "files": [
    "lib/",
    "src/",
    "README.md",
    "README_zh.md",
    "LICENSE"
  ]
}
```

#### 2. Build and Test the Package

```bash
# Navigate to project directory
cd D:\work\RN\react-native-auto-positioned-popup

# Install dependencies
npm install

# Build the TypeScript files
npm run build

# Verify build output
ls lib/
```

#### 3. Test Package Locally

Test the package locally before publishing:

```bash
# Create a tarball
npm pack

# This creates a .tgz file you can install in test projects
# npm install ./react-native-auto-positioned-popup-1.0.0.tgz
```

### Publishing Steps

#### Step 1: Login to npm

```bash
npm login
```

Enter your npm credentials:
- Username
- Password
- Email
- One-time password (if 2FA is enabled)

#### Step 2: Verify Login Status

```bash
npm whoami
```

This should return your npm username.

#### Step 3: Final Pre-Publish Checks

```bash
# Check what files will be published
npm pack --dry-run

# Lint the code (optional)
npm run lint

# Run tests (if available)
npm test
```

#### Step 4: Publish to npm

For first time publishing:

```bash
npm publish
```

For updates (remember to update version number first):

```bash
# Update version automatically
npm version patch  # for bug fixes
npm version minor  # for new features
npm version major  # for breaking changes

# Then publish
npm publish
```

#### Step 5: Verify Publication

1. Check on [npmjs.com](https://npmjs.com):
   - Visit https://npmjs.com/package/react-native-auto-positioned-popup
   - Verify package information, README, and files

2. Test installation:
   ```bash
   # In a separate project
   npm install react-native-auto-positioned-popup
   ```

### Post-Publishing Tasks

#### 1. Update GitHub Repository

If you have a GitHub repository:

```bash
git add .
git commit -m "v1.0.0: Initial npm publication"
git tag v1.0.0
git push origin main --tags
```

#### 2. Update Package Links

Update `package.json` with correct repository URLs:

```json
{
  "homepage": "https://github.com/your-username/react-native-auto-positioned-popup#readme",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/your-username/react-native-auto-positioned-popup.git"
  },
  "bugs": {
    "url": "https://github.com/your-username/react-native-auto-positioned-popup/issues"
  }
}
```

#### 3. Create GitHub Release

On GitHub:
1. Go to your repository
2. Click "Releases" → "Create a new release"
3. Tag: `v1.0.0`
4. Title: `v1.0.0 - Initial Release`
5. Description: Copy from CHANGELOG or README

---

## Version Management

### Semantic Versioning (SemVer)

Follow semantic versioning:
- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Patch** (1.0.0 → 1.0.1): Bug fixes, backward compatible

### Available Scripts

Current package.json scripts for version management:

```json
{
  "scripts": {
    "release": "node scripts/release.js",
    "release:dry": "node scripts/release.js --dry-run",
    "release:patch-auto": "node scripts/release.js --version patch",
    "release:minor-auto": "node scripts/release.js --version minor",
    "release:major-auto": "node scripts/release.js --version major",
    "release:patch": "npm version patch && npm publish",
    "release:minor": "npm version minor && npm publish",
    "release:major": "npm version major && npm publish"
  }
}
```

---

## Troubleshooting

### Common Issues and Solutions

#### NPM Authentication Issues
```bash
# Issue: Authentication failed
npm login
npm whoami  # Verify login
```

#### Git Working Tree Issues
```bash
# Issue: Working tree has uncommitted changes
git status
git add . && git commit -m "commit changes before release"
# Or use --dry-run to test first
npm run release:dry
```

#### Build Issues
```bash
# Check TypeScript errors
npm run type-check

# Check ESLint issues
npm run lint

# Verify all dependencies
npm install
```

#### Network Issues
```bash
# Check NPM registry connectivity
npm ping

# Verify internet connection
```

#### Package Name Issues
```
Error: Package name already exists
```
Solution: Choose a unique package name or add scope (@yourname/package-name)

#### Version Already Published
```
Error: Version 1.0.0 already published
```
Solution: Update version number with `npm version patch`

#### Build Files Missing
```
Error: Cannot find main entry point
```
Solution: Run `npm run build` before publishing

### Manual Push and Publish Methods

When automated release encounters network issues or Git push failures, use these manual methods:

#### Method 1: Manual Push with Git Bash

```bash
# 1. Push commits to remote repository
git push origin main

# 2. Push tags to remote repository
git push origin v1.0.1

# 3. Publish to NPM
npm publish
```

#### Method 2: Using Proxy for Network Issues

```bash
# Set Git proxy (adjust to your proxy configuration)
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# Push changes
git push origin main
git push origin v1.0.1

# Clear proxy configuration (after successful push)
git config --global --unset http.proxy
git config --global --unset https.proxy
```

#### Method 3: Using SSH Instead of HTTPS

```bash
# 1. Change remote URL to SSH
git remote set-url origin git@github.com:StarksJohn/react-native-auto-positioned-popup.git

# 2. Push changes
git push origin main
git push origin v1.0.1

# 3. Publish to NPM
npm publish
```

#### Method 4: Using Personal Access Token (PAT)

```bash
# 1. Create personal access token on GitHub
# Settings -> Developer settings -> Personal access tokens -> Generate new token

# 2. Push using token
git push https://YOUR_GITHUB_TOKEN@github.com/StarksJohn/react-native-auto-positioned-popup.git main
git push https://YOUR_GITHUB_TOKEN@github.com/StarksJohn/react-native-auto-positioned-popup.git v1.0.1
```

#### Manual Release Recovery

If you need to rollback a failed release:

```bash
# Delete local tag
git tag -d v1.0.1

# Reset to previous commit
git reset --hard HEAD~1

# Restore version number in package.json
# Edit package.json to revert version number
```

#### Manual Release Verification

```bash
# Check NPM publication status
npm view react-native-auto-positioned-popup@1.0.1

# Check GitHub repository
git log origin/main --oneline -1
```

#### Important Notes for Manual Release

- Ensure you're logged into NPM: `npm whoami`
- If not logged in, use: `npm login`
- Verify GitHub repository push permissions
- Consider testing on a feature branch first
- Always verify the release succeeded before closing terminal

### Getting Help

For automated release script:
```bash
node scripts/release.js --help
```

Check detailed logs:
```bash
cat release.log
```

---

## Best Practices

### Development Workflow
1. **Always test first** - Use `npm run release:dry` to verify the process
2. **Clean working tree** - Commit changes before releasing  
3. **Review changes** - Check what will be published with `npm run pack-test`
4. **Monitor publication** - Verify package appears on npmjs.com
5. **Keep logs** - Review `release.log` for any warnings or issues

### Version Management
6. **Use semantic versioning** - Follow semver guidelines for version selection
7. **Tag releases** - Use Git tags for version management
8. **Update documentation** - Keep README and CHANGELOG current

### Testing and Quality
9. **Always test before publishing** - Use `npm pack` and test locally
10. **Keep .npmignore updated** - Don't publish unnecessary files
11. **Write good commit messages** - For version tracking
12. **Monitor downloads** - Check npm stats regularly

### Automation
13. **Prefer automated releases** - Use `npm run release` for consistency
14. **Use dry-run mode** - Test releases before executing
15. **Review automation logs** - Check `release.log` for issues

---

## Security Considerations

### Account Security
1. **Enable 2FA** - Protect your npm account with two-factor authentication
2. **Use automation tokens** - For CI/CD pipelines instead of passwords
3. **Scope packages** - Consider using scoped packages (@yourname/package)

### Code Security  
4. **Review dependencies** - Regularly audit dependencies for vulnerabilities
5. **Never expose credentials** - Script never exposes NPM credentials
6. **Use dry-run for validation** - All operations can be reviewed in dry-run mode

### Release Security
7. **Rollback capabilities** - Minimize risk of partial releases
8. **Comprehensive logging** - Provides audit trail for all operations
9. **Repository permissions** - Git operations require proper permissions

---

## Maintenance

### Regular Tasks

1. **Update dependencies** - Keep dependencies current
2. **Monitor issues** - Respond to GitHub issues and npm feedback
3. **Security updates** - Address security vulnerabilities promptly
4. **Documentation** - Keep documentation updated with new features
5. **Review automation** - Periodically check release script performance

### Deprecation Process

If you need to deprecate a version:

```bash
# Deprecate a specific version
npm deprecate react-native-auto-positioned-popup@1.0.0 "This version has a security vulnerability"

# Deprecate all versions
npm deprecate react-native-auto-positioned-popup "Package no longer maintained"
```

### Configuration Management

The automated script uses the following default behavior:
- Builds to `lib/` directory
- Runs TypeScript compilation
- Executes ESLint with auto-fix
- Creates conventional commit messages
- Uses semantic versioning (semver)

---

## Success Checklist

- [ ] Package builds successfully (`npm run build`)
- [ ] All files included in build (`npm run pack-test`)
- [ ] README is comprehensive
- [ ] Version number is correct
- [ ] Git repository is clean and tagged
- [ ] npm login successful (`npm whoami`)
- [ ] Package published successfully
- [ ] Installation test passed (`npm install package-name`)
- [ ] Documentation links work
- [ ] GitHub release created (if applicable)
- [ ] Automation script tested (`npm run release:dry`)

---

## Resources

- [npm documentation](https://docs.npmjs.com/)
- [Semantic Versioning](https://semver.org/)
- [npm best practices](https://docs.npmjs.com/misc/developers)
- [TypeScript declaration files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)
- [Node.js Package Management](https://nodejs.org/en/knowledge/getting-started/npm/what-is-npm/)

---

## Quick Reference

### Most Common Commands

```bash
# Automated release (recommended)
npm run release

# Test release process
npm run release:dry

# Quick patch release
npm run release:patch-auto

# Manual release
npm version patch
npm publish

# Get help
node scripts/release.js --help
```

---

**Good luck with your package publication!** 🚀

*For questions or issues with the automated release system, check the `release.log` file or run with `--dry-run` to troubleshoot.*
