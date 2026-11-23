#!/usr/bin/env bash
# npj 一键构建（Linux/Ubuntu）：前端 bundle + g++ 引导程序
set -e
cd "$(dirname "$0")"

npm install
npm run build-renderer
g++ -std=c++14 -O2 -o npj launcher-linux.cpp

echo
echo "构建完成。运行 ./npj 启动。"
