@echo off
rem npj 一键构建（Windows）：前端 bundle + g++ 引导程序
rem g++ 用 Dev-C++ 5.11 自带的 TDM-GCC（如路径不同，设 DEVCPP_GXX 环境变量）
setlocal
cd /d "%~dp0"

if "%DEVCPP_GXX%"=="" set "DEVCPP_GXX=D:\Program Files (x86)\Dev-Cpp\MinGW64\bin\g++.exe"

call npm run build-renderer || goto :err
if not exist node_modules\electron\dist\electron.exe (
  echo [提示] Electron 二进制缺失，先跑: npm install
  goto :err
)
"%DEVCPP_GXX%" -std=c++14 -O2 -mwindows -o npj.exe launcher.cpp -lshell32 || goto :err

echo.
echo 构建完成。双击 npj.exe 启动。
exit /b 0
:err
echo 构建失败
exit /b 1
