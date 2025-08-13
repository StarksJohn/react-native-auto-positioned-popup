# NPM Publishing Guide for react-native-auto-positioned-popup

This guide provides step-by-step instructions for publishing this React Native component to npm.

## Prerequisites

1. **Node.js and npm**: Make sure you have Node.js installed (version 14 or higher)
2. **npm account**: Create an account at [npmjs.com](https://npmjs.com)
3. **Git**: For version control and repository management

## Pre-Publishing Checklist

### 1. Verify Package Configuration

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

### 2. Build and Test the Package

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

### 3. Test Package Locally

Test the package locally before publishing:

```bash
# Create a tarball
npm pack

# This creates a .tgz file you can install in test projects
# npm install ./react-native-auto-positioned-popup-1.0.0.tgz
```

## Publishing Steps

### Step 1: Login to npm

```bash
npm login
```

Enter your npm credentials:
- Username
- Password
- Email
- One-time password (if 2FA is enabled)

### Step 2: Verify Login Status

```bash
npm whoami
```

This should return your npm username.

### Step 3: Final Pre-Publish Checks

```bash
# Check what files will be published
npm pack --dry-run

# Lint the code (optional)
npm run lint

# Run tests (if available)
npm test
```

### Step 4: Publish to npm

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

### Step 5: Verify Publication

1. Check on [npmjs.com](https://npmjs.com):
   - Visit https://npmjs.com/package/react-native-auto-positioned-popup
   - Verify package information, README, and files

2. Test installation:
   ```bash
   # In a separate project
   npm install react-native-auto-positioned-popup
   ```

## Post-Publishing Tasks

### 1. Update GitHub Repository

If you have a GitHub repository:

```bash
git add .
git commit -m "v1.0.0: Initial npm publication"
git tag v1.0.0
git push origin main --tags
```

### 2. Update Package Links

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

### 3. Create GitHub Release

On GitHub:
1. Go to your repository
2. Click "Releases" → "Create a new release"
3. Tag: `v1.0.0`
4. Title: `v1.0.0 - Initial Release`
5. Description: Copy from CHANGELOG or README

## Version Management

### Semantic Versioning (SemVer)

Follow semantic versioning:
- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Patch** (1.0.0 → 1.0.1): Bug fixes, backward compatible

### Version Update Commands

```bash
# Patch version (1.0.0 → 1.0.1)
npm version patch
npm publish

# Minor version (1.0.0 → 1.1.0)
npm version minor
npm publish

# Major version (1.0.0 → 2.0.0)
npm version major
npm publish
```

## Automation Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "prepublishOnly": "npm run build && npm run lint",
    "postpublish": "git push && git push --tags",
    "release:patch": "npm version patch && npm publish",
    "release:minor": "npm version minor && npm publish",
    "release:major": "npm version major && npm publish"
  }
}
```

## Troubleshooting

### Common Issues and Solutions

1. **Package name already exists**
   ```
   Error: Package name already exists
   ```
   Solution: Choose a unique package name or add scope (@yourname/package-name)

2. **Authentication failed**
   ```
   Error: Authentication failed
   ```
   Solution: Run `npm login` again or check 2FA settings

3. **Version already published**
   ```
   Error: Version 1.0.0 already published
   ```
   Solution: Update version number with `npm version patch`

4. **Build files missing**
   ```
   Error: Cannot find main entry point
   ```
   Solution: Run `npm run build` before publishing

### Best Practices

1. **Always test before publishing**: Use `npm pack` and test locally
2. **Keep .npmignore updated**: Don't publish unnecessary files
3. **Write good commit messages**: For version tracking
4. **Tag releases**: Use Git tags for version management
5. **Update documentation**: Keep README and CHANGELOG current
6. **Monitor downloads**: Check npm stats regularly

## Security Considerations

1. **Enable 2FA**: Protect your npm account with two-factor authentication
2. **Review dependencies**: Regularly audit dependencies for vulnerabilities
3. **Scope packages**: Consider using scoped packages (@yourname/package)
4. **Access tokens**: Use automation tokens for CI/CD

## Maintenance

### Regular Tasks

1. **Update dependencies**: Keep dependencies current
2. **Monitor issues**: Respond to GitHub issues and npm feedback
3. **Security updates**: Address security vulnerabilities promptly
4. **Documentation**: Keep documentation updated with new features

### Deprecation Process

If you need to deprecate a version:

```bash
# Deprecate a specific version
npm deprecate react-native-auto-positioned-popup@1.0.0 "This version has a security vulnerability"

# Deprecate all versions
npm deprecate react-native-auto-positioned-popup "Package no longer maintained"
```

## Success Checklist

- [ ] Package builds successfully
- [ ] All files included in build
- [ ] README is comprehensive
- [ ] Version number is correct
- [ ] Git repository is clean and tagged
- [ ] npm login successful
- [ ] Package published successfully
- [ ] Installation test passed
- [ ] Documentation links work
- [ ] GitHub release created

## Resources

- [npm documentation](https://docs.npmjs.com/)
- [Semantic Versioning](https://semver.org/)
- [npm best practices](https://docs.npmjs.com/misc/developers)
- [TypeScript declaration files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)

---

Good luck with your package publication! 🚀