@echo off
echo ====================================
echo Manual Git Push and NPM Publish
echo ====================================
echo.

echo Current Status:
echo - Local version: 1.0.1
echo - Commit: "chore: bump version to 1.0.1"
echo - Tag: v1.0.1
echo.

echo Step 1: Attempting to push to GitHub...
echo.

REM Try to push main branch
echo Pushing main branch...
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to push main branch
    echo Please check your network connection or try using a VPN/proxy
    echo.
    echo You can also try:
    echo 1. Using a different network
    echo 2. Setting up Git proxy: git config --global http.proxy http://your-proxy:port
    echo 3. Using SSH instead of HTTPS
    pause
    exit /b 1
)

echo.
echo Step 2: Pushing tag v1.0.1...
git push origin v1.0.1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to push tag
    pause
    exit /b 1
)

echo.
echo Step 3: Publishing to NPM...
echo.

REM Check if logged in to NPM
npm whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo You are not logged in to NPM
    echo Please run: npm login
    pause
    exit /b 1
)

echo Publishing package to NPM...
npm publish
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to publish to NPM
    pause
    exit /b 1
)

echo.
echo ====================================
echo SUCCESS! Package v1.0.1 published!
echo ====================================
echo.
echo Check your package at: https://npmjs.com/package/react-native-auto-positioned-popup
echo.
pause