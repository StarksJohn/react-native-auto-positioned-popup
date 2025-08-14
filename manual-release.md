# Manual Release Steps

## 当前状态
- ✅ 本地版本已更新到 1.0.1
- ✅ Git commit 已创建："chore: bump version to 1.0.1"  
- ✅ Git tag v1.0.1 已创建
- ❌ 需要手动推送到 GitHub
- ❌ 需要手动发布到 NPM

## 方法一：使用 Git Bash 手动推送

```bash
# 1. 推送提交到远程仓库
git push origin main

# 2. 推送标签到远程仓库
git push origin v1.0.1

# 3. 发布到 NPM
npm publish
```

## 方法二：如果网络问题持续，使用代理

```bash
# 设置 Git 代理（根据你的代理配置调整）
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# 推送
git push origin main
git push origin v1.0.1

# 清除代理配置（推送成功后）
git config --global --unset http.proxy
git config --global --unset https.proxy
```

## 方法三：使用 SSH 代替 HTTPS

```bash
# 1. 更改远程仓库 URL 为 SSH
git remote set-url origin git@github.com:StarksJohn/react-native-auto-positioned-popup.git

# 2. 推送
git push origin main
git push origin v1.0.1

# 3. 发布到 NPM
npm publish
```

## 方法四：使用个人访问令牌（PAT）

```bash
# 1. 在 GitHub 创建个人访问令牌
# Settings -> Developer settings -> Personal access tokens -> Generate new token

# 2. 使用令牌推送
git push https://YOUR_GITHUB_TOKEN@github.com/StarksJohn/react-native-auto-positioned-popup.git main
git push https://YOUR_GITHUB_TOKEN@github.com/StarksJohn/react-native-auto-positioned-popup.git v1.0.1
```

## 验证发布

```bash
# 检查 NPM 发布状态
npm view react-native-auto-positioned-popup@1.0.1

# 检查 GitHub 仓库
git log origin/main --oneline -1
```

## 如果需要回滚

```bash
# 删除本地标签
git tag -d v1.0.1

# 重置到上一个提交
git reset --hard HEAD~1

# 恢复版本号到 1.0.0
# 编辑 package.json 将版本改回 1.0.0
```

## 注意事项
- 确保你已经登录 NPM：`npm whoami`
- 如果未登录，使用：`npm login`
- 确保有 GitHub 仓库的推送权限
- 建议先在测试分支上验证流程