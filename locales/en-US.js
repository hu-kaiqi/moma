// 墨码 语言包 · English (US)
// 文案 = Notepad++ 官方英文原文（installer/nativeLang/english.xml 与各对话框资源，逐条查证）。
module.exports = {
  // 语言名（在语言下拉里用各自语言显示，不翻译）
  'lang.name': 'English',

  // 主进程 · 原生菜单（12 个菜单）
  'menu.file': '&File',
  'menu.edit': '&Edit',
  'menu.search': '&Search',
  'menu.view': '&View',
  'menu.encoding': 'E&ncoding',
  'menu.language': '&Language',
  'menu.settings': 'Se&ttings',
  'menu.tools': 'T&ools',
  'menu.macro': '&Macro',
  'menu.plugins': '&Plugins',
  'menu.window': '&Window',
  'menu.help': '&?',

  'menu.file.new': '&New',
  'menu.file.open': '&Open...',
  'menu.file.save': '&Save',
  'menu.file.saveAs': 'Save &As...',
  'menu.file.saveAll': 'Sa&ve All',
  'menu.file.rename': '&Rename...',
  'menu.file.close': '&Close',
  'menu.file.closeAll': 'Clos&e All',
  'menu.file.exit': 'E&xit',

  'menu.edit.undo': '&Undo',
  'menu.edit.redo': '&Redo',
  'menu.edit.cut': 'Cu&t',
  'menu.edit.copy': '&Copy',
  'menu.edit.paste': '&Paste',
  'menu.edit.delete': '&Delete',
  'menu.edit.selectAll': '&Select All',

  'menu.search.find': '&Find...',
  'menu.search.replace': '&Replace...',
  'menu.search.findNext': 'Find &Next',
  'menu.search.bookmark': '&Bookmark',
  'menu.search.bmToggle': 'Toggle Bookmark',
  'menu.search.bmNext': 'Next Bookmark',
  'menu.search.bmPrev': 'Previous Bookmark',
  'menu.search.bmClear': 'Clear All Bookmarks',

  'menu.view.symbol': 'Show S&ymbol',
  'menu.view.zoom': '&Zoom',
  'menu.view.zoomIn': 'Zoom &In (Ctrl+Mouse Wheel Up)',
  'menu.view.zoomOut': 'Zoom &Out (Ctrl+Mouse Wheel Down)',
  'menu.view.zoomReset': '&Restore Default Zoom',
  'menu.view.wrap': '&Word wrap',
  'menu.view.lineNumbers': 'Line N&umbers',

  'menu.encoding.convertToUtf8': 'Convert to UTF-8',
  'menu.encoding.convertToAnsi': 'Convert to ANSI',

  'menu.settings.prefs': 'Preferences...',
  'menu.tools.none': '(no tools)',
  'menu.macro.none': '(no macros)',
  'menu.plugins.manage': 'Plugins Admin...',
  'menu.window.arrange': 'Arrange All',
  'menu.help.about': 'About Moma(A)...',

  // 主进程 · 文件对话框
  'dialog.open.title': 'Open',
  'dialog.open.allTypes': 'All types',
  'dialog.saveAs.title': 'Save As',
  'dialog.defaultName': 'Untitled.txt',

  // 主进程 · 未保存确认
  'dialog.unsaved.title': 'Save',
  'dialog.unsaved.message': 'Do you want to save the modifications of the following files?',
  'dialog.unsaved.save': '&Save',
  'dialog.unsaved.dontSave': "Don't Save(&N)",
  'dialog.unsaved.cancel': '&Cancel',

  // 主进程 · 关于框
  'dialog.about.title': 'About Moma',
  'dialog.about.product': 'Moma',
  'dialog.about.desc': 'Moma code editor (Electron + CodeMirror)',
  'dialog.about.ok': 'OK',

  // 主进程 · 窗口标题 / 打开失败
  'title.appName': 'Moma',
  'error.binaryFile': 'Binary file, editing is not supported',

  // 渲染层 · 工具栏 tooltip
  'toolbar.new': 'New',
  'toolbar.open': 'Open',
  'toolbar.save': 'Save',
  'toolbar.saveAll': 'Save All',
  'toolbar.close': 'Close',
  'toolbar.closeAll': 'Close All',
  'toolbar.print': 'Print (not implemented)',
  'toolbar.cut': 'Cut',
  'toolbar.copy': 'Copy',
  'toolbar.paste': 'Paste',
  'toolbar.undo': 'Undo',
  'toolbar.redo': 'Redo',
  'toolbar.find': 'Find',
  'toolbar.zoomIn': 'Zoom In',
  'toolbar.zoomOut': 'Zoom Out',
  'toolbar.wrap': 'Word wrap',

  // 渲染层 · 标签 / 窗口标题
  'tab.defaultName': 'Untitled.txt',
  'title.suffix': 'Moma',

  // 渲染层 · 状态栏
  'status.type': 'File type : {value}',
  'status.len': 'Length : {n}',
  'status.lines': 'Lines : {n}',
  'status.pos': 'Ln : {line} Col : {col} Sel : {sel}',
  'status.eol.crlf': 'Windows (CR LF)',
  'status.eol.lf': 'Unix (LF)',
  'status.term': 'Terminal',
  'status.term.title': 'Bottom terminal',

  // 渲染层 · 终端 dock
  'term.title': 'Terminal',

  // 渲染层 · 查找 / 替换窗口
  'find.title': 'Find',
  'find.tab.find': 'Find',
  'find.tab.replace': 'Replace',
  'find.what': '&Find what:',
  'find.replaceWith': 'Rep&lace with:',
  'find.options': 'Options:',
  'find.case': 'Match &case',
  'find.word': 'Match &whole word only',
  'find.next': 'Find Next',
  'find.prev': 'Find Previous',
  'find.replace': '&Replace',
  'find.replaceAll': 'Replace &All',
  'find.close': 'Close',
  'find.replaced': '{n} occurrences were replaced',

  // 渲染层 · 首选项
  'prefs.title': 'Preferences',
  'prefs.language': 'Language',
  'prefs.language.zhCN': '中文（简体）',
  'prefs.language.enUS': 'English',
  'prefs.autocomplete': 'Auto-Completion',
  'prefs.ac.enable': 'Enable auto-completion on each input',
  'prefs.ac.alltabs': 'Match words from all opened documents (default: current document only)',
  'prefs.ac.minLen': 'Minimum characters for trigger',
  'prefs.cancel': 'Cancel',
  'prefs.ok': 'OK',

  // 渲染层 · 右键菜单（编辑区 / 标签栏两套）
  'ctx.edit.cut': 'Cu&t',
  'ctx.edit.copy': '&Copy',
  'ctx.edit.paste': '&Paste',
  'ctx.edit.delete': '&Delete',
  'ctx.edit.selectAll': '&Select All',
  'ctx.tab.save': '&Save',
  'ctx.tab.close': '&Close',
  'ctx.tab.closeOthers': 'Close All BUT This',

  // 渲染层 · 其它
  'alert.saveFailed': 'Failed to save: {err}',
};
