// 墨码 语言包 · 简体中文（默认）
// 文案 = 各界面原有中文串原样搬运，一字未改。
module.exports = {
  // 语言名（在语言下拉里用各自语言显示，不翻译）
  'lang.name': '中文（简体）',

  // 主进程 · 原生菜单（12 个菜单）
  'menu.file': '文件(F)',
  'menu.edit': '编辑(E)',
  'menu.search': '搜索(S)',
  'menu.view': '视图(V)',
  'menu.encoding': '编码(N)',
  'menu.language': '语言(L)',
  'menu.settings': '设置(T)',
  'menu.tools': '工具(T)',
  'menu.macro': '宏(M)',
  'menu.plugins': '插件(P)',
  'menu.window': '窗口(W)',
  'menu.help': '?(H)',

  'menu.file.new': '新建(N)',
  'menu.file.open': '打开(O)...',
  'menu.file.save': '保存(S)',
  'menu.file.saveAs': '另存为(A)...',
  'menu.file.saveAll': '保存全部',
  'menu.file.rename': '重命名(M)',
  'menu.file.close': '关闭(C)',
  'menu.file.closeAll': '关闭全部',
  'menu.file.exit': '退出(X)',

  'menu.edit.undo': '撤销(U)',
  'menu.edit.redo': '重做(R)',
  'menu.edit.cut': '剪切(T)',
  'menu.edit.copy': '复制(C)',
  'menu.edit.paste': '粘贴(P)',
  'menu.edit.delete': '删除(D)',
  'menu.edit.selectAll': '全选(A)',

  'menu.search.find': '查找(F)...',
  'menu.search.replace': '替换(P)...',
  'menu.search.findNext': '查找下一个',
  'menu.search.bookmark': '书签(B)',
  'menu.search.bmToggle': '切换书签',
  'menu.search.bmNext': '下一书签',
  'menu.search.bmPrev': '上一书签',
  'menu.search.bmClear': '清除全部书签',

  'menu.view.symbol': '显示符号',
  'menu.view.zoom': '缩放(Z)',
  'menu.view.zoomIn': '放大',
  'menu.view.zoomOut': '缩小',
  'menu.view.zoomReset': '还原默认缩放',
  'menu.view.wrap': '自动换行(W)',
  'menu.view.lineNumbers': '显示行号(L)',

  'menu.encoding.convertToUtf8': '转为 UTF-8',
  'menu.encoding.convertToAnsi': '转为 ANSI',

  'menu.settings.prefs': '首选项(P)...',
  'menu.tools.none': '（暂无工具）',
  'menu.macro.none': '（暂无宏）',
  'menu.plugins.manage': '插件管理...',
  'menu.window.arrange': '全部重排',
  'menu.help.about': '关于墨码(A)...',

  // 主进程 · 文件对话框
  'dialog.open.title': '打开',
  'dialog.open.allTypes': '所有类型',
  'dialog.saveAs.title': '另存为',
  'dialog.defaultName': '新建文档.txt',

  // 主进程 · 未保存确认
  'dialog.unsaved.title': '保存',
  'dialog.unsaved.message': '是否保存以下文件的修改？',
  'dialog.unsaved.save': '保存(S)',
  'dialog.unsaved.dontSave': '不保存(N)',
  'dialog.unsaved.cancel': '取消',

  // 主进程 · 关于框
  'dialog.about.title': '关于墨码',
  'dialog.about.product': '墨码',
  'dialog.about.desc': '墨码 代码编辑器（Electron + CodeMirror）',
  'dialog.about.ok': '确定',

  // 主进程 · 窗口标题 / 打开失败
  'title.appName': '墨码',
  'error.binaryFile': '二进制文件，暂不支持编辑',

  // 渲染层 · 工具栏 tooltip
  'toolbar.new': '新建',
  'toolbar.open': '打开',
  'toolbar.save': '保存',
  'toolbar.saveAll': '保存全部',
  'toolbar.close': '关闭',
  'toolbar.closeAll': '关闭全部',
  'toolbar.print': '打印（未实现）',
  'toolbar.cut': '剪切',
  'toolbar.copy': '复制',
  'toolbar.paste': '粘贴',
  'toolbar.undo': '撤销',
  'toolbar.redo': '重做',
  'toolbar.find': '查找',
  'toolbar.zoomIn': '放大',
  'toolbar.zoomOut': '缩小',
  'toolbar.wrap': '自动换行',

  // 渲染层 · 标签 / 窗口标题
  'tab.defaultName': 'new {n}',
  'title.suffix': '墨码',
  // 渲染层 · 状态栏
  'status.type': '文件类型 : {value}',
  'status.len': '长度 : {n}',
  'status.lines': '行数 : {n}',
  'status.pos': 'Ln : {line} Col : {col} Sel : {sel}',
  'status.eol.crlf': 'Windows (CR LF)',
  'status.eol.lf': 'Unix (LF)',
  'status.term': '终端',
  'status.term.title': '底部终端',

  // 渲染层 · 终端 dock
  'term.title': '终端',

  // 渲染层 · 查找 / 替换窗口
  'find.title': '查找',
  'find.tab.find': '查找',
  'find.tab.replace': '替换',
  'find.what': '查找内容:',
  'find.replaceWith': '替换为:',
  'find.options': '选项:',
  'find.case': '匹配大小写',
  'find.word': '全字匹配',
  'find.next': '查找下一个',
  'find.prev': '查找上一个',
  'find.replace': '替换',
  'find.replaceAll': '全部替换',
  'find.close': '关闭',
  'find.replaced': '已替换 {n} 处',

  // 渲染层 · 首选项
  'prefs.title': '首选项',
  'prefs.language': '语言',
  'prefs.language.zhCN': '中文（简体）',
  'prefs.language.enUS': 'English',
  'prefs.autocomplete': '自动补全',
  'prefs.ac.enable': '启用自动补全',
  'prefs.ac.alltabs': '匹配所有已打开文件的单词（默认仅当前文件）',
  'prefs.ac.minLen': '触发所需最少字符数',
  'prefs.cancel': '取消',
  'prefs.ok': '确定',

  // 渲染层 · 右键菜单（编辑区 / 标签栏两套）
  'ctx.edit.cut': '剪切(T)',
  'ctx.edit.copy': '复制(C)',
  'ctx.edit.paste': '粘贴(P)',
  'ctx.edit.delete': '删除(D)',
  'ctx.edit.selectAll': '全选(A)',
  'ctx.tab.save': '保存(S)',
  'ctx.tab.close': '关闭(C)',
  'ctx.tab.closeOthers': '关闭其他标签',

  // 渲染层 · 其它
  'alert.saveFailed': '保存失败：{err}',
};
