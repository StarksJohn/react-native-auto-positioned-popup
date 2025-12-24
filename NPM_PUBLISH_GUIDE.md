# react-native-auto-positioned-popup NPM 发布指南

本指南提供了手动和自动化两种方法来发布这个 React Native 组件到 npm，包括用于简化发布工作流程的高级自动化发布系统。

## 目录

- [前置要求](#前置要求)
- [🚀 自动化发布系统（推荐）](#-自动化发布系统推荐)
- [手动发布步骤](#手动发布步骤)
- [版本管理](#版本管理)
- [故障排除](#故障排除)
- [最佳实践](#最佳实践)
- [安全注意事项](#安全注意事项)
- [维护](#维护)

## 前置要求

1. **Node.js 和 npm**: 确保已安装 Node.js（版本 14 或更高）
2. **npm 账户**: 在 [npmjs.com](https://npmjs.com) 创建账户
3. **Git**: 用于版本控制和仓库管理
4. **Git 远程仓库**: 正确配置并具有推送权限

---

## 🚀 自动化发布系统（推荐）

本项目包含一个完整的自动化发布脚本，可处理版本管理、构建、测试、Git 操作和 NPM 发布，具有高级错误处理和回滚功能。

### ✨ 功能特性

- 🚀 **交互式版本选择** - 在 patch、minor 或 major 发布之间选择
- ✅ **全面的预检查** - Git 状态、NPM 认证、依赖项、网络连接
- 🔨 **自动构建和测试** - 清理、编译、代码检查、类型检查和测试
- 📦 **包验证** - 发布前确保包的完整性
- 🔄 **Git 操作** - 自动提交、打标签和推送
- 📤 **NPM 发布** - 发布到 registry 并验证
- 🎯 **错误处理** - 失败时的回滚功能
- 📝 **详细日志** - 完整的发布过程审计记录
- 🧪 **试运行模式** - 在不进行实际更改的情况下测试流程

### 快速开始

#### 交互式发布（推荐）

使用私有 VPN
```bash
npm run release
```

这将：
1. 运行所有预检查
2. 构建和测试项目
3. 提示您选择版本类型（patch/minor/major）
4. 显示版本变更并询问确认
5. 处理所有 Git 操作
6. 发布到 NPM
7. 验证发布成功

#### 自动化发布命令

```bash
# 试运行模式（无实际更改）
npm run release:dry

# 直接版本发布
npm run release:patch-auto    # Patch 版本 (1.0.0 → 1.0.1)
npm run release:minor-auto    # Minor 版本 (1.0.0 → 1.1.0)
npm run release:major-auto    # Major 版本 (1.0.0 → 2.0.0)
```

#### 高级选项

```bash
# 带选项的直接脚本执行
node scripts/release.js [选项]

选项:
  --dry-run, -d     试运行模式（无实际更改）
  --version, -v     指定版本类型 (patch|minor|major)
  --skip-tests, -s  跳过测试执行
  --help, -h        显示帮助信息
```

#### 示例

```bash
# 试运行的交互式发布
node scripts/release.js --dry-run

# 自动化 patch 发布
node scripts/release.js --version patch

# 跳过测试的 minor 发布
node scripts/release.js --version minor --skip-tests

# 跳过测试的 major 版本试运行
node scripts/release.js -d -v major -s
```

### 流程概览

#### 1. 预检查
- ✅ Git 工作树状态（警告未提交的更改）
- ✅ 当前 Git 分支验证（推荐 main/master）
- ✅ NPM 认证状态
- ✅ 依赖项安装和健康检查
- ✅ 到 NPM registry 的网络连接

#### 2. 构建和测试
- 🧹 清理之前的构建产物
- 🔍 TypeScript 类型检查
- 📋 ESLint 代码质量检查（尝试自动修复）
- 🔨 项目编译
- 🧪 测试执行（如果未跳过）
- 📦 包完整性验证

#### 3. 版本管理
- 📊 显示当前版本
- 🎯 交互式或自动化版本类型选择
- 📈 计算并预览新版本
- ✅ 用户确认版本更新
- 📝 更新 package.json

#### 4. Git 操作
- 💾 提交版本更改
- 🏷️ 创建版本标签（v1.0.0 格式）
- ⬆️ 推送提交和标签到远程

#### 5. NPM 发布
- 📤 发布包到 NPM registry
- ⏳ 等待 registry 传播
- ✅ 验证发布成功

### 错误处理和回滚

自动化脚本包含全面的错误处理：

- **失败时自动回滚**（尽可能）
- **版本回滚** - 恢复 package.json 更改
- **Git 回滚** - 删除提交和标签
- **详细错误日志** - `release.log` 中的完整审计记录
- **优雅失败** - 带有有用错误信息的干净退出

### 日志记录

所有发布操作都记录到 `release.log`，包含：
- 所有操作的时间戳
- 逐步执行详情
- 错误信息和堆栈跟踪
- 发布持续时间和摘要

### 从旧脚本迁移

旧版发布脚本仍然可用：
```bash
npm run release:patch    # 旧版: npm version patch && npm publish
npm run release:minor    # 旧版: npm version minor && npm publish
npm run release:major    # 旧版: npm version major && npm publish
```

但是，推荐使用新的自动化脚本（`npm run release`），因为它包含全面的检查和更好的错误处理。

---

## 手动发布步骤

对于那些喜欢手动控制或需要了解底层流程的人，这里是逐步的手动方法。

### 发布前检查清单

#### 1. 验证包配置

检查你的 `package.json` 文件：

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

#### 2. 构建和测试包

```bash
# 导航到项目目录
cd D:\work\RN\react-native-auto-positioned-popup

# 安装依赖
npm install

# 构建 TypeScript 文件
npm run build

# 验证构建输出
ls lib/
```

#### 3. 本地测试包

发布前本地测试包：

```bash
# 创建 tarball
npm pack

# 这会创建一个 .tgz 文件，你可以在测试项目中安装
# npm install ./react-native-auto-positioned-popup-1.0.0.tgz
```

### 发布步骤

#### 步骤 1: 登录 npm

```bash
npm login
```

输入你的 npm 凭据：
- 用户名
- 密码
- 邮箱
- 一次性密码（如果启用了 2FA）

#### 步骤 2: 验证登录状态

```bash
npm whoami
```

这应该返回你的 npm 用户名。

#### 步骤 3: 最终发布前检查

```bash
# 检查哪些文件将被发布
npm pack --dry-run

# 代码检查（可选）
npm run lint

# 运行测试（如果可用）
npm test
```

#### 步骤 4: 发布到 npm

首次发布：

```bash
npm publish
```

更新时（记得先更新版本号）：

```bash
# 自动更新版本
npm version patch  # 用于 bug 修复
npm version minor  # 用于新功能
npm version major  # 用于破坏性变更

# 然后发布
npm publish
```

#### 步骤 5: 验证发布

1. 在 [npmjs.com](https://npmjs.com) 上检查：
   - 访问 https://npmjs.com/package/react-native-auto-positioned-popup
   - 验证包信息、README 和文件

2. 测试安装：
   ```bash
   # 在另一个项目中
   npm install react-native-auto-positioned-popup
   ```

### 发布后任务

#### 1. 更新 GitHub 仓库

如果你有 GitHub 仓库：

```bash
git add .
git commit -m "v1.0.0: 首次 npm 发布"
git tag v1.0.0
git push origin main --tags
```

#### 2. 更新包链接

用正确的仓库 URL 更新 `package.json`：

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

#### 3. 创建 GitHub Release

在 GitHub 上：
1. 进入你的仓库
2. 点击 "Releases" → "Create a new release"
3. 标签：`v1.0.0`
4. 标题：`v1.0.0 - 首次发布`
5. 描述：从 CHANGELOG 或 README 复制

---

## 版本管理

### 语义化版本（SemVer）

遵循语义化版本：
- **Major** (1.0.0 → 2.0.0): 破坏性变更
- **Minor** (1.0.0 → 1.1.0): 新功能，向后兼容
- **Patch** (1.0.0 → 1.0.1): Bug 修复，向后兼容

### 可用脚本

当前用于版本管理的 package.json 脚本：

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

## 故障排除

### 常见问题和解决方案

#### NPM 认证问题
```bash
# 问题：认证失败
npm login
npm whoami  # 验证登录
```

#### Git 工作树问题
```bash
# 问题：工作树有未提交的更改
git status
git add . && git commit -m "发布前提交更改"
# 或使用 --dry-run 先测试
npm run release:dry
```

#### 构建问题
```bash
# 检查 TypeScript 错误
npm run type-check

# 检查 ESLint 问题
npm run lint

# 验证所有依赖
npm install
```

#### 网络问题
```bash
# 检查 NPM registry 连接
npm ping

# 验证网络连接
```

#### 包名问题
```
错误：包名已存在
```
解决方案：选择唯一的包名或添加作用域（@yourname/package-name）

#### 版本已发布
```
错误：版本 1.0.0 已发布
```
解决方案：使用 `npm version patch` 更新版本号

#### 构建文件缺失
```
错误：找不到主入口点
```
解决方案：发布前运行 `npm run build`

### 手动推送和发布方法

当自动化发布遇到网络问题或 Git 推送失败时，使用这些手动方法：

#### 方法 1：使用 Git Bash 手动推送

```bash
# 1. 推送提交到远程仓库
git push origin main

# 2. 推送标签到远程仓库
git push origin v1.0.1

# 3. 发布到 NPM
npm publish
```

#### 方法 2：使用代理解决网络问题

```bash
# 设置 Git 代理（根据你的代理配置调整）
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# 推送更改
git push origin main
git push origin v1.0.1

# 成功推送后清除代理配置
git config --global --unset http.proxy
git config --global --unset https.proxy
```

#### 方法 3：使用 SSH 代替 HTTPS

```bash
# 1. 将远程 URL 更改为 SSH
git remote set-url origin git@github.com:StarksJohn/react-native-auto-positioned-popup.git

# 2. 推送更改
git push origin main
git push origin v1.0.1

# 3. 发布到 NPM
npm publish
```

#### 方法 4：使用个人访问令牌（PAT）

```bash
# 1. 在 GitHub 上创建个人访问令牌
# 设置 -> 开发者设置 -> 个人访问令牌 -> 生成新令牌

# 2. 使用令牌推送
git push https://YOUR_GITHUB_TOKEN@github.com/StarksJohn/react-native-auto-positioned-popup.git main
git push https://YOUR_GITHUB_TOKEN@github.com/StarksJohn/react-native-auto-positioned-popup.git v1.0.1
```

#### 手动发布恢复

如果需要回滚失败的发布：

```bash
# 删除本地标签
git tag -d v1.0.1

# 重置到上一个提交
git reset --hard HEAD~1

# 恢复 package.json 中的版本号
# 编辑 package.json 恢复版本号
```

#### 手动发布验证

```bash
# 检查 NPM 发布状态
npm view react-native-auto-positioned-popup@1.0.1

# 检查 GitHub 仓库
git log origin/main --oneline -1
```

#### 手动发布重要说明

- 确保已登录 NPM：`npm whoami`
- 如果未登录，使用：`npm login`
- 验证 GitHub 仓库推送权限
- 考虑先在功能分支上测试
- 关闭终端前始终验证发布成功

### 获取帮助

对于自动化发布脚本：
```bash
node scripts/release.js --help
```

检查详细日志：
```bash
cat release.log
```

---

## 最佳实践

### 开发工作流程
1. **始终先测试** - 使用 `npm run release:dry` 验证流程
2. **干净的工作树** - 发布前提交更改
3. **审查更改** - 使用 `npm run pack-test` 检查将发布的内容
4. **监控发布** - 验证包出现在 npmjs.com 上
5. **保留日志** - 查看 `release.log` 中的任何警告或问题

### 版本管理
6. **使用语义化版本** - 遵循 semver 版本选择指南
7. **标记发布** - 使用 Git 标签进行版本管理
8. **更新文档** - 保持 README 和 CHANGELOG 最新

### 测试和质量
9. **发布前始终测试** - 使用 `npm pack` 并本地测试
10. **保持 .npmignore 更新** - 不要发布不必要的文件
11. **写好提交信息** - 用于版本跟踪
12. **监控下载量** - 定期检查 npm 统计

### 自动化
13. **首选自动化发布** - 使用 `npm run release` 保持一致性
14. **使用试运行模式** - 执行前测试发布
15. **审查自动化日志** - 检查 `release.log` 中的问题

---

## 安全注意事项

### 账户安全
1. **启用 2FA** - 使用双因素认证保护你的 npm 账户
2. **使用自动化令牌** - 在 CI/CD 管道中使用令牌而非密码
3. **作用域包** - 考虑使用作用域包（@yourname/package）

---

## 🔑 NPM 自动化令牌配置（绕过 2FA）

要启用完全自动化的发布而无需每次进行 2FA 验证，你必须配置一个启用了"绕过 2FA"选项的 NPM 自动化令牌。

### 步骤 1：创建细粒度访问令牌

1. 访问 https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. 点击 **"Generate New Token"** → **"Granular Access Token"**

### 步骤 2：配置令牌设置

| 设置 | 推荐值 |
|------|--------|
| **Token name（令牌名称）** | `auto-publish` |
| **Description（描述）** | 用于自动化发布 |
| **⚠️ Bypass two-factor authentication (2FA)（绕过双因素认证）** | ✅ **必须勾选此项** |
| **Allowed IP ranges（允许的 IP 范围）** | （可选）留空表示任何 IP |
| **Permissions（权限）** | `Read and write` |
| **Select packages（选择包）** | `All packages` 或特定包 |
| **Expiration Date（过期日期）** | 设置合理的过期时间（如 1 年） |

### 步骤 3：生成并保存令牌

1. 点击 **"Generate token"**
2. **重要**：立即复制令牌 - 它只会显示一次！
3. 令牌格式：`npm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 步骤 4：在系统中配置令牌

#### 选项 A：全局配置（推荐）

```bash
# 为你的用户全局设置令牌
npm config set //registry.npmjs.org/:_authToken=npm_YOUR_TOKEN_HERE
```

这会将令牌保存到 `~/.npmrc`（Windows 上是 `C:\Users\USERNAME\.npmrc`）。

#### 选项 B：项目级配置

在项目根目录创建 `.npmrc` 文件：

```
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

然后设置环境变量：

```bash
# Windows PowerShell
$env:NPM_TOKEN="npm_YOUR_TOKEN_HERE"

# Windows CMD
set NPM_TOKEN=npm_YOUR_TOKEN_HERE

# Linux/Mac
export NPM_TOKEN=npm_YOUR_TOKEN_HERE
```

#### 选项 C：CI/CD 环境

对于 GitHub Actions，将令牌添加为仓库密钥：

```yaml
# .github/workflows/publish.yml
- name: Publish to npm
  run: npm publish
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 步骤 5：验证令牌配置

```bash
# 验证认证
npm whoami

# 应该输出你的 npm 用户名
```

### 令牌问题故障排除

#### 错误："401 Unauthorized"

**原因**：令牌无效、已过期或未勾选"绕过 2FA"。

**解决方案**：
1. 在 npmjs.com 上删除旧令牌
2. 创建新令牌并勾选 ✅ "Bypass two-factor authentication (2FA)"
3. 重新配置新令牌

#### 错误："403 Forbidden - Two-factor authentication required"

**原因**：创建令牌时未勾选"绕过 2FA"选项。

**解决方案**：
1. 访问 https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. 删除有问题的令牌
3. 创建新的细粒度访问令牌
4. **重要**：勾选 ✅ "Bypass two-factor authentication (2FA)"
5. 重新配置新令牌

#### 错误："Access token expired or revoked"

**原因**：令牌已过期或被手动撤销。

**解决方案**：
1. 在 npmjs.com 上生成新令牌
2. 更新 `.npmrc` 文件中的令牌

### 自动化令牌安全最佳实践

1. **设置过期日期** - 不要使用永不过期的令牌
2. **限制包作用域** - 如果可能，将令牌限制为特定包
3. **使用 IP 限制** - 如果部署 IP 是静态的，添加允许的 IP 范围
4. **定期轮换令牌** - 定期更换令牌
5. **永不提交令牌** - 如果 `.npmrc` 包含令牌，将其添加到 `.gitignore`
6. **使用环境变量** - 首选 `${NPM_TOKEN}` 模式而非硬编码令牌

### 当前令牌状态

在此检查你的令牌状态：https://www.npmjs.com/settings/stark2018/tokens

| 令牌名称 | 创建时间 | 过期时间 | 绕过 2FA |
|----------|----------|----------|----------|
| auto-publish | 2025年12月24日 | 2026年3月24日 | ✅ 已启用 |

### 代码安全
4. **审查依赖** - 定期审计依赖项的漏洞
5. **永不暴露凭据** - 脚本永不暴露 NPM 凭据
6. **使用试运行验证** - 所有操作都可以在试运行模式下审查

### 发布安全
7. **回滚功能** - 最小化部分发布的风险
8. **全面日志** - 为所有操作提供审计记录
9. **仓库权限** - Git 操作需要适当的权限

---

## 维护

### 定期任务

1. **更新依赖** - 保持依赖项最新
2. **监控问题** - 回应 GitHub issues 和 npm 反馈
3. **安全更新** - 及时处理安全漏洞
4. **文档** - 随新功能更新文档
5. **审查自动化** - 定期检查发布脚本性能

### 废弃流程

如果需要废弃一个版本：

```bash
# 废弃特定版本
npm deprecate react-native-auto-positioned-popup@1.0.0 "此版本存在安全漏洞"

# 废弃所有版本
npm deprecate react-native-auto-positioned-popup "包不再维护"
```

### 配置管理

自动化脚本使用以下默认行为：
- 构建到 `lib/` 目录
- 运行 TypeScript 编译
- 执行带自动修复的 ESLint
- 创建规范的提交信息
- 使用语义化版本（semver）

---

## 成功检查清单

- [ ] 包构建成功（`npm run build`）
- [ ] 所有文件包含在构建中（`npm run pack-test`）
- [ ] README 内容完整
- [ ] 版本号正确
- [ ] Git 仓库干净并已打标签
- [ ] npm 登录成功（`npm whoami`）
- [ ] 包发布成功
- [ ] 安装测试通过（`npm install package-name`）
- [ ] 文档链接有效
- [ ] GitHub release 已创建（如适用）
- [ ] 自动化脚本已测试（`npm run release:dry`）

---

## 资源

- [npm 文档](https://docs.npmjs.com/)
- [语义化版本](https://semver.org/)
- [npm 最佳实践](https://docs.npmjs.com/misc/developers)
- [TypeScript 声明文件](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)
- [Node.js 包管理](https://nodejs.org/en/knowledge/getting-started/npm/what-is-npm/)

---

## 快速参考

### 最常用命令

```bash
# 自动化发布（推荐）
npm run release

# 测试发布流程
npm run release:dry

# 快速 patch 发布
npm run release:patch-auto

# 手动发布
npm version patch
npm publish

# 获取帮助
node scripts/release.js --help
```

---

**祝你包发布顺利！** 🚀

*如有自动化发布系统的问题，请检查 `release.log` 文件或使用 `--dry-run` 进行故障排除。*
