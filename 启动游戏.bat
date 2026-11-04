@echo off
chcp 936 >nul
setlocal enabledelayedexpansion
title 豌豆镇大冒险 - 启动器
cd /d "%~dp0"

echo ============================================
echo   豌豆镇大冒险 - 本地服务器
echo ============================================
echo.
echo   目录: %CD%
echo.

rem ============ 自动寻找可用的启动方式 ============
set "RUNNER="
set "PORT="

rem ---- A. 优先 Python（启动快、无需联网） ----
for %%C in (python py python3) do (
    if not defined RUNNER (
        where %%C >nul 2>nul && set "RUNNER=%%C"
    )
)

rem ---- B. 其次 Node.js（需要本地已有 http-server，否则首次会联网下载） ----
if not defined RUNNER (
    where node >nul 2>nul
    if not errorlevel 1 (
        node -e "process.exit(0)" >nul 2>nul
        if not errorlevel 1 (
            where http-server >nul 2>nul
            if not errorlevel 1 set "RUNNER=node-local"
        )
    )
)

if not defined RUNNER goto :norunner

echo [1/3] 使用: !RUNNER!
if "!RUNNER!"=="node-local" (node --version) else (!RUNNER! --version)
echo.

rem ---- 选端口 ----
for %%P in (8080 8081 8082 8090 3000) do (
    if not defined PORT (
        netstat -ano ^| findstr ":%%P " ^| findstr "LISTENING" >nul 2>nul
        if errorlevel 1 set "PORT=%%P"
    )
)
if not defined PORT goto :noport
echo [2/3] 端口: !PORT!
echo.

start "" /b cmd /c "timeout /t 2 /nobreak >nul ^& start "" http://127.0.0.1:!PORT!/index.html"

echo [3/3] 服务器启动中...
echo.
echo    游戏地址: http://127.0.0.1:!PORT!/index.html
echo    关闭本窗口 = 停止服务器
echo.
echo ----------------------------------------------
echo   浏览器若没自动打开，手动复制上面的地址
echo ----------------------------------------------
echo.

if "!RUNNER!"=="node-local" (
    http-server . -p !PORT! -c-1
) else (
    !RUNNER! -m http.server !PORT!
)
set "RC=!errorlevel!"

echo.
if not "!RC!"=="0" (
    echo [错误] 服务器异常退出，返回码 !RC!。
    echo.
    echo 如果是 Node 方式失败，可能需要联网下载 http-server。
    echo 建议改用 Python 方式：安装 https://www.python.org/downloads/
    echo 安装时勾选 "Add python.exe to PATH"。
    echo.
) else (
    echo 服务器已停止。
)
pause
exit /b 0

:norunner
echo [错误] 没有找到 Node.js 或 Python，无法启动本地服务器。
echo.
echo 说明：本游戏是纯静态网页，必须通过 http 服务器访问，
echo       否则 assets/ 里的替换贴图全部不生效。
echo.
echo 请任选一种安装（装完重启本文件）：
echo.
echo   方案 1 - Python（推荐，体积小）
echo     https://www.python.org/downloads/
echo     安装第一屏勾选 "Add python.exe to PATH"
echo.
echo   方案 2 - Node.js
echo     https://nodejs.org/  (选 LTS 版本，一路下一步)
echo.
echo 如果你只是想先玩玩、不替换美术：
echo     直接双击 index.html 也能玩（贴图是占位图）。
echo.
pause
exit /b 1

:noport
echo [错误] 8080/8081/8082/8090/3000 端口都被占用。
echo 请关闭多余命令行窗口，或在任务管理器结束 python.exe / node.exe 后重试。
echo.
pause
exit /b 1
