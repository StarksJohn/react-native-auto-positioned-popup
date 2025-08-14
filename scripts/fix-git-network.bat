@echo off
echo ====================================
echo Git Network Configuration Helper
echo ====================================
echo.

echo Select an option:
echo 1. Test GitHub connection
echo 2. Set HTTP proxy (for corporate networks)
echo 3. Use Git protocol instead of HTTPS
echo 4. Use SSH instead of HTTPS
echo 5. Reset all Git network settings
echo 6. Show current Git config
echo.

set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" (
    echo.
    echo Testing GitHub connection...
    curl -I https://github.com
    echo.
    echo Testing Git fetch...
    git ls-remote https://github.com/StarksJohn/react-native-auto-positioned-popup.git HEAD
    if %errorlevel% equ 0 (
        echo.
        echo Connection successful!
    ) else (
        echo.
        echo Connection failed. Try options 2-4 to fix.
    )
)

if "%choice%"=="2" (
    echo.
    set /p proxy="Enter proxy URL (e.g., http://127.0.0.1:7890): "
    git config --global http.proxy %proxy%
    git config --global https.proxy %proxy%
    echo Proxy configured: %proxy%
    echo.
    echo To remove proxy later, run option 5
)

if "%choice%"=="3" (
    echo.
    echo Changing remote URL to use git:// protocol...
    git remote set-url origin git://github.com/StarksJohn/react-native-auto-positioned-popup.git
    echo Done! Remote URL changed to git:// protocol
)

if "%choice%"=="4" (
    echo.
    echo Changing remote URL to use SSH...
    git remote set-url origin git@github.com:StarksJohn/react-native-auto-positioned-popup.git
    echo Done! Remote URL changed to SSH
    echo.
    echo NOTE: Make sure you have SSH keys configured with GitHub
    echo To generate SSH keys: ssh-keygen -t ed25519 -C "your_email@example.com"
)

if "%choice%"=="5" (
    echo.
    echo Resetting Git network configuration...
    git config --global --unset http.proxy
    git config --global --unset https.proxy
    git config --global --unset core.gitproxy
    git remote set-url origin https://github.com/StarksJohn/react-native-auto-positioned-popup.git
    echo All network settings reset to default
)

if "%choice%"=="6" (
    echo.
    echo Current Git configuration:
    echo.
    echo Remote URLs:
    git remote -v
    echo.
    echo Proxy settings:
    git config --global --get http.proxy
    git config --global --get https.proxy
    echo.
    echo All global settings:
    git config --global --list
)

echo.
pause