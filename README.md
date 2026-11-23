# npj v0.4 — Notepad++ 复刻（Electron + g++ 引导程序）

> 复刻目标：Notepad++，UI 对齐其默认经典浅色界面（中文菜单）。
> 架构（用户定）：Electron；双击 g++ 编译的原生引导程序打开；除引导程序外全部跨平台。

## v0.4 变更（2026-11-18，第二批）

### 发布链路（混淆+加壳+安装包）

- **混淆**：`scripts/obfuscate.js`（javascript-obfuscator）——控制流扁平化 + RC4 字符串阵列（全量）+ 死代码注入 + 自我防御 + 十六进制标识符。产物只写 `dist-app/`，**源码原地不动，另有 backup/src-2026-11-18/ 全量备份**。
- **asar 仅 9 个文件**：dependencies 全部移到 devDependencies（renderer 已单文件 bundle，运行时零 node_modules）。
- **Win 安装包**：`release/npj-Setup-0.4.0.exe`（NSIS 向导式，可自选目录、桌面快捷方式）。构建：`ELECTRON_MIRROR/ELECTRON_BUILDER_BINARIES_MIRROR=npmmirror` + `npx electron-builder --win nsis`。
- **Linux 安装包**：`release/npj_0.4.0_amd64.deb`——**手工构造**（electron-builder 交叉打 deb 要 fpm/Ruby，弃），`scripts/build-deb.py`：ar(debian-binary+control+data.tar.xz) + 强制执行位（NTFS 丢权限的坑）+ .desktop 入口，装到 /opt/npj。依赖 fpm 的官方 deb target 做参考。安装：`sudo dpkg -i npj_0.4.0_amd64.deb`。
- **g++ 引导程序**：`-s`（strip 符号）+ **UPX 5.3.0 开源壳**（--best --lzma，541KB→139KB），反汇编只见解压桩。
- **未签名**：无代码签名证书，Windows SmartScreen 可能提示（预期）。

### 功能

1. **切标签不丢撤销历史**：每标签保存完整 EditorState（撤销/光标/选区/书签随标签走）。
2. **状态栏长度**：ANSI 文件按 GBK 字节计（ASCII 1 字节、中文 2 字节），不再按 UTF-8 估算。
3. **查找窗口**：N++ 式浮动对话框（可拖动），查找/替换两页、匹配大小写、全字匹配、查找上/下一个、替换/全部替换；Ctrl+F/H、F3/Shift+F3；查询高亮延续到编辑区；ESC 关闭。
4. **列选模式**：鼠标 Alt+拖动（矩形选区）+ 键盘 Alt+Shift+↑/↓（逐行加光标）。
5. **书签边栏**：点击行号右侧灰条切换书签（蓝圈标记），F2/Shift+F2 跳转（环绕），搜索菜单▸书签子菜单；书签随编辑自动映射行号、每标签独立。
6. **底部终端 dock**：状态栏"终端"按钮开关；不再弹外部窗口。逐条执行命令（Win=cmd / Linux=sh），GBK 输出自动解码，cd/clear 内置解析，↑/↓ 历史，ESC 关闭；工作目录默认当前文件目录。

## v0.3 变更（2026-11-18，用户需求批次）

1. **缩放持久化**：字号存 `userData/npj-config.json`，重启恢复上次缩放程度。
2. **边栏配色**：行号区背景改浅灰 #E8E8E8（书签条 #DBDBDB 更深一档）；行号字号缓涨（内容每 +1px 行号 +0.4px），列宽只跟位数，缩放不撑大。
3. **打开终端**：状态栏"打开终端"按钮，已保存文件可用（新文档置灰），Win 开 cmd /K cd、Linux 探测 gnome-terminal/konsole/x-terminal-emulator/xterm，定位文件所在目录。
4. **缩进规则**：Tab=4 空格（`indentUnit`，永不写制表符）；空行回车原样保留缩进不收缩；普通文本 `{ ( [ :` 行尾回车多缩一级；语言文件（js/py/java/c…）回车走 lezer 语法缩进（大括号/冒号自动缩进）。
5. **首选项**：设置▸首选项(P)... 对话框——自动补全开关、匹配来源（当前文件/所有已打开文件）、触发最少字符数；随配置文件持久化。
6. **双击文件打开**：引导程序转发命令行参数（Win `CommandLineToArgvW`+`-lshell32` / Linux `execv`）；主进程解析启动参数、单实例下第二实例参数转第一实例打开（还支持 macOS open-file）；渲染进程 `openPaths` 动作打开并顶掉空 new 文档。设为默认打开方式：右键文件→打开方式→选择 npj.exe→始终。

## v0.2.1 变更（2026-11-18，用户反馈修复）

1. **缩放重做**：废弃 Chromium 整页 zoomLevel（之前会把工具栏/状态栏一起放大）。现在只改编辑器文字大小，全局生效，菜单/工具栏不动。范围 6–48px，默认 13px。
2. **缩放入口补齐**：Ctrl+滚轮（上放大/下缩小，拦掉了 Chromium 默认整页缩放）、主键盘 Ctrl+= / Ctrl+- / Ctrl+0、菜单"视图▸缩放▸放大/缩小/还原默认缩放"（小键盘 Ctrl+小键盘+/-/0）、工具栏放大镜按钮。
3. **行号边栏**：行号左侧新增 18px 书签边栏（N++ 同款，浅灰底 #EBEBEB + 分隔线）；行号列右对齐、宽度只跟位数走，缩放时字号同步变大但不膨胀数字区。
4. **自动换行对齐 N++**：默认改为**关闭**（N++ 默认即关），视图菜单可勾选切换，全局生效，切标签保持。

## 架构

```
npj.exe（g++ 引导，唯一平台相关）
  └─ electron.exe .  （主进程 main.js：原生中文菜单、文件对话框、UTF-8/ANSI 编码探测、读写文件）
       └─ 渲染进程（CodeMirror 6，复刻 N++ 工具栏/标签栏/状态栏；preload.js 暴露安全 IPC API）
```

- **引导程序**：`launcher.cpp`（Win32，`-std=c++14`，Dev-C++ 5.11 自带 TDM-GCC 4.9.2 编译）；Linux 对称版 `launcher-linux.cpp`（POSIX exec）
- **跨平台**：Electron 应用本体平台无关；新文档默认 EOL 按平台（Win=CR LF，Linux=LF）；文件名处理兼容两种分隔符
- **编码**：ANSI(=GBK)/UTF-8/UTF-8-BOM 三态，对齐 Notepad++ 的编码语义，按原编码保存
- **单实例**：与 N++ 默认行为一致

## 构建与运行

```bash
# Windows：build.cmd   （npm 构建 renderer + Dev-C++ g++ 编译 npj.exe）
# Ubuntu： ./build.sh  （npm 构建 renderer + 系统 g++ 编译 npj）
# 之后双击 npj.exe / ./npj
```

## 复刻对齐清单（v0.2）

| Notepad++ 元素 | npj v0.2 状态 |
|---|---|
| 中文原生菜单（文件/编辑/搜索/视图/编码/语言/工具/宏/插件/窗口/?） | ✅ 全部存在，快捷键一致（Ctrl+N/O/S/W/H/F、Ctrl+Alt+S、Ctrl+Shift+S） |
| 工具栏（新建/打开/保存/保存全部/关闭/关闭全部/打印/剪切/复制/粘贴/撤销/重做/查找/缩放/换行） | ✅ 手绘 SVG 仿其语义配色；打印置灰（未实现） |
| 标签页：蓝/红软盘图标（保存/未保存）、激活白底、× 关闭 | ✅ |
| 状态栏：文件类型/长度/行数/Ln Col Sel/EOL/编码/INS 八段式 | ✅ 文案格式对齐 |
| 编辑器：白底黑字 Courier New、行号灰、当前行淡黄、选中浅蓝 | ✅ 近似复刻 |
| 语法配色（关键字蓝 #0000FF/注释绿 #008000/字符串橄榄 #808000/数字橙 #FF8000） | ✅ 近似 N++ 默认主题 |
| 编码菜单（ANSI/UTF-8/UTF-8-BOM 单选 + 转为） | ✅ 转编码即标脏（对齐 N++ 语义） |
| 语言菜单（普通文本/C/C++/Java/C#/JavaScript/JSON/HTML/CSS/XML/Python/Markdown/SQL） | ✅ 单选高亮 |
| 未保存关闭三选（保存/不保存/取消），原生对话框 | ✅ |
| 空文档 "new 1" 起步、打开文件顶掉未动过的空文档 | ✅ |
| 查找/替换面板 | ⚠️ CodeMirror 自带面板（英文 UI，后续汉化） |

## 已知差距（v0.3 待办）

1. 切标签丢撤销历史（需按标签保存 HistoryState）
2. 打印、宏/插件/工具/窗口菜单为占位（置灰），对齐"存在感"但无功能
3. 编码菜单缺"使用 XX 重新载入"（reload-as）
4. 状态栏"长度"对 ANSI 文件按 UTF-8 字节估算（需 GBK 字节计数）
5. 应用图标（.ico/备用图标）未做，发布需加图标 + jpackage/electron-builder 安装包
6. 查找面板汉化、列选模式（N++ Alt+列选）、书签边栏

## 文件结构

```
npj/
├── launcher.cpp        ← Win 引导（Dev-C++ g++ -std=c++14）
├── launcher-linux.cpp  ← Linux 引导
├── npj.exe             ← 编译产物，双击启动
├── main.js             ← Electron 主进程（菜单/对话框/文件IO/编码）
├── preload.js          ← 安全 API 桥
├── renderer/
│   ├── index.html / style.css / bundle.js
│   └── src/renderer.js ← N++ 工具栏/标签/状态栏 + CodeMirror
├── build.cmd / build.sh
└── package.json
```
