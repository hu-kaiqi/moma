// 墨码 v0.2 渲染进程 — 经典编辑器的工具栏/标签栏/状态栏行为
// 文件操作全部走 preload 暴露的 window.npp（Electron IPC），原生菜单动作经 onAction 分发。

import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter,
         drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightSpecialChars,
         gutter, GutterMarker } from "@codemirror/view";
import { EditorState, EditorSelection, Compartment, StateField, StateEffect } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab, undo, redo } from "@codemirror/commands";
import { indentOnInput, indentUnit, bracketMatching, foldGutter, foldKeymap,
         syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap, autocompletion } from "@codemirror/autocomplete";
import { search, setSearchQuery, SearchQuery, findNext, findPrevious, replaceNext, replaceAll,
         highlightSelectionMatches } from "@codemirror/search";
import { tags as t } from "@lezer/highlight";

import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { xml } from "@codemirror/lang-xml";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { sql } from "@codemirror/lang-sql";

// ---------- 语言（与主进程菜单 LANG_ITEMS 对应） ----------
const LANG_FACTORY = {
  cpp: () => cpp(), cppx: () => cpp(), csharp: () => cpp(), java: () => java(),
  javascript: () => javascript(), json: () => json(), html: () => html(), css: () => css(),
  xml: () => xml(), python: () => python(), markdown: () => markdown(), sql: () => sql(),
  text: () => null,
};
const EXT_LANG = {
  c: "cpp", h: "cpp", cpp: "cppx", cc: "cppx", hpp: "cppx",
  cs: "csharp", java: "java", js: "javascript", mjs: "javascript", cjs: "javascript",
  jsx: "javascript", ts: "javascript", tsx: "javascript",
  json: "json", html: "html", htm: "html", css: "css", xml: "xml", svg: "xml",
  py: "python", md: "markdown", markdown: "markdown", sql: "sql",
};
const LANG_TYPE_LABEL = {
  text: "normal text file", cpp: "C file", cppx: "C++ file", csharp: "C# file",
  java: "Java file", javascript: "JavaScript file", json: "JSON file", html: "HTML file",
  css: "CSS file", xml: "XML file", python: "Python file", markdown: "Markdown file", sql: "SQL file",
};
const langIdOf = (tab) => tab.langOverride || (tab.path ? (EXT_LANG[tab.path.split(".").pop().toLowerCase()] || "text") : "text");

// ---------- 经典语法配色 ----------
const nppHighlight = HighlightStyle.define([
  { tag: t.keyword, color: "#0000FF" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "#008000" },
  { tag: [t.string, t.special(t.string)], color: "#808000" },
  { tag: t.number, color: "#FF8000" },
  { tag: [t.tagName], color: "#0000FF" },
  { tag: [t.attributeName], color: "#800080" },
  { tag: t.heading, color: "#0000FF", fontWeight: "bold" },
  { tag: t.link, color: "#0000FF", textDecoration: "underline" },
]);

// ---------- 工具栏图标（手绘 SVG） ----------
const S = (inner) => `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
const ICONS = {
  new: S(`<path d="M3 1h7l3 3v11H3z" fill="#fff" stroke="#8a8a8a"/><path d="M10 1v3h3" fill="#e8e8e8" stroke="#8a8a8a"/><circle cx="11.5" cy="11.5" r="4" fill="#f5a623"/><path d="M11.5 9.5v4M9.5 11.5h4" stroke="#fff" stroke-width="1.4"/>`),
  open: S(`<path d="M1 4h5l2 2h7v8H1z" fill="#ffca28" stroke="#b8860b"/><path d="M1 4V2h4l1 2z" fill="#ffd764" stroke="#b8860b"/>`),
  save: S(`<path d="M1 1h11l3 3v11H1z" fill="#366bca" stroke="#1f4a92"/><rect x="4" y="1" width="7" height="5" fill="#dfefff" stroke="#1f4a92"/><rect x="8" y="2" width="2" height="3" fill="#366bca"/><rect x="4" y="9" width="8" height="5" fill="#fff" stroke="#1f4a92"/>`),
  saveAll: S(`<path d="M1 3h9l2.5 2.5V13H1z" fill="#366bca" stroke="#1f4a92"/><rect x="3" y="9" width="6" height="4" fill="#fff" stroke="#1f4a92"/><circle cx="12" cy="4" r="4" fill="#2ea44f"/><path d="M12 2v4M10 4h4" stroke="#fff" stroke-width="1.4"/>`),
  close: S(`<path d="M3 1h7l3 3v11H3z" fill="#fff" stroke="#8a8a8a"/><path d="M10 1v3h3" fill="#e8e8e8" stroke="#8a8a8a"/><path d="M6 7l4 4M10 7l-4 4" stroke="#d32f2f" stroke-width="1.6"/>`),
  closeAll: S(`<path d="M2 2h7l2 2v9H2z" fill="#f2f2f2" stroke="#8a8a8a"/><path d="M6 4h7l2 2v9H6z" fill="#fff" stroke="#8a8a8a"/><path d="M9.5 7l3 3M12.5 7l-3 3" stroke="#d32f2f" stroke-width="1.5"/>`),
  cut: S(`<circle cx="4" cy="12" r="2.2" fill="none" stroke="#5a7ca6" stroke-width="1.5"/><circle cx="11" cy="12" r="2.2" fill="none" stroke="#5a7ca6" stroke-width="1.5"/><path d="M5.5 10.5L12 2M10.5 10.5L4 2" stroke="#8a9bb0" stroke-width="1.5"/>`),
  copy: S(`<rect x="5" y="1" width="8" height="10" fill="#fff" stroke="#8a8a8a"/><rect x="3" y="5" width="8" height="10" fill="#f4fbff" stroke="#366bca"/>`),
  paste: S(`<rect x="2" y="2" width="12" height="13" rx="1" fill="#c69a55" stroke="#8a6a2f"/><rect x="5" y="1" width="6" height="3" rx="1" fill="#d8d8d8" stroke="#888"/><rect x="4.5" y="6" width="7" height="8" fill="#fff" stroke="#aaa"/>`),
  undo: S(`<path d="M3 6h6a4 4 0 014 4v3" fill="none" stroke="#366bca" stroke-width="2"/><path d="M7 2L2.5 6L7 10z" fill="#366bca"/>`),
  redo: S(`<path d="M13 6H7a4 4 0 00-4 4v3" fill="none" stroke="#366bca" stroke-width="2"/><path d="M9 2l4.5 4L9 10z" fill="#366bca"/>`),
  find: S(`<circle cx="7" cy="7" r="4.5" fill="none" stroke="#5a7ca6" stroke-width="2"/><path d="M10.5 10.5L14.5 14.5" stroke="#8a9bb0" stroke-width="2.4"/>`),
  zoomIn: S(`<circle cx="7" cy="7" r="4.5" fill="none" stroke="#5a7ca6" stroke-width="2"/><path d="M10.5 10.5L14.5 14.5" stroke="#8a9bb0" stroke-width="2.4"/><path d="M7 4.5v5M4.5 7h5" stroke="#2ea44f" stroke-width="1.4"/>`),
  zoomOut: S(`<circle cx="7" cy="7" r="4.5" fill="none" stroke="#5a7ca6" stroke-width="2"/><path d="M10.5 10.5L14.5 14.5" stroke="#8a9bb0" stroke-width="2.4"/><path d="M4.5 7h5" stroke="#d32f2f" stroke-width="1.4"/>`),
  wrap: S(`<path d="M2 4h10a3 3 0 010 6H8" fill="none" stroke="#366bca" stroke-width="1.6"/><path d="M10 8l-3 2 3 2" fill="none" stroke="#366bca" stroke-width="1.6"/><path d="M2 12h4" stroke="#8a8a8a" stroke-width="1.6"/>`),
  print: S(`<rect x="4" y="1" width="8" height="4" fill="#fff" stroke="#8a8a8a"/><rect x="2" y="5" width="12" height="6" rx="1" fill="#c8c8c8" stroke="#888"/><rect x="4" y="9" width="8" height="5" fill="#fff" stroke="#8a8a8a"/>`),
};
const floppySVG = (color, dark) => S(
  `<path d="M1 1h11l3 3v11H1z" fill="${color}" stroke="${dark}"/>` +
  `<rect x="4" y="1" width="7" height="5" fill="#dfefff" stroke="${dark}"/>` +
  `<rect x="8" y="2" width="2" height="3" fill="${color}"/>` +
  `<rect x="4" y="9" width="8" height="5" fill="#fff" stroke="${dark}"/>`);

// ---------- 工具栏 ----------
const TOOLBAR = [
  { id: "new", tip: "新建", act: { type: "new" } },
  { id: "open", tip: "打开", act: { type: "open" } },
  { sep: true },
  { id: "save", tip: "保存", act: { type: "save" } },
  { id: "saveAll", tip: "保存全部", act: { type: "saveAll" } },
  { id: "close", tip: "关闭", act: { type: "close" } },
  { id: "closeAll", tip: "关闭全部", act: { type: "closeAll" } },
  { sep: true },
  { id: "print", tip: "打印（未实现）", disabled: true },
  { sep: true },
  { id: "cut", tip: "剪切", run: () => document.execCommand("cut") },
  { id: "copy", tip: "复制", run: () => document.execCommand("copy") },
  { id: "paste", tip: "粘贴", run: () => document.execCommand("paste") },
  { sep: true },
  { id: "undo", tip: "撤销", run: () => undo(view) },
  { id: "redo", tip: "重做", run: () => redo(view) },
  { sep: true },
  { id: "find", tip: "查找", run: () => showFindWin("find") },
  { sep: true },
  { id: "zoomIn", tip: "放大", run: () => zoomFont(1) },
  { id: "zoomOut", tip: "缩小", run: () => zoomFont(-1) },
  { sep: true },
  { id: "wrap", tip: "自动换行", run: () => toggleWrap() },
];

const toolbarEl = document.getElementById("toolbar");
function renderToolbar() {
  toolbarEl.innerHTML = "";
  for (const item of TOOLBAR) {
    if (item.sep) {
      const sep = document.createElement("div");
      sep.className = "tb-sep";
      toolbarEl.appendChild(sep);
      continue;
    }
    const btn = document.createElement("div");
    btn.className = "tb-btn" + (item.disabled ? " disabled" : "");
    btn.title = item.tip;
    btn.innerHTML = ICONS[item.id];
    btn.addEventListener("click", () => {
      if (item.act) handleAction(item.act);
      else if (item.run) item.run();
    });
    toolbarEl.appendChild(btn);
  }
}

// ---------- 列选（键盘）：Alt+Shift+↑/↓ 添加光标；鼠标 Alt+拖动为矩形选（CM 默认） ----------
function addCursorLine(v, dir) {
  const ranges = [...v.state.selection.ranges];
  const last = ranges[ranges.length - 1];
  const target = v.state.doc.lineAt(last.head).number + dir;
  if (target < 1 || target > v.state.doc.lines) return false;
  const tl = v.state.doc.line(target);
  ranges.push(EditorSelection.range(tl.from, tl.from));
  v.dispatch({ selection: EditorSelection.create(ranges, ranges.length - 1), scrollIntoView: true });
  return true;
}

// ---------- 回车缩进规则 ----------
// 空行（含纯空白行）：原样保留缩进，不做语法收缩
// 普通文本：行尾是 { ( [ : 时多缩进一级
// 语言文件：交给 lezer 语法缩进（大括号/冒号自动缩进由语言包负责）
function smartEnter(view) {
  const { state } = view;
  const range = state.selection.main;
  if (!range.empty) return false;
  const line = state.doc.lineAt(range.head);
  if (line.text.trim() === "") {
    view.dispatch(state.replaceSelection("\n" + line.text));
    return true;
  }
  const tab = tabs[activeIdx];
  const langId = tab ? langIdOf(tab) : "text";
  if (!LANG_FACTORY[langId]) {
    const before = line.text.slice(0, range.head - line.from);
    if (/[{([:]\s*$/.test(before)) {
      const indent = before.match(/^[ \t]*/)[0];
      view.dispatch(state.replaceSelection("\n" + indent + "    "));
      return true;
    }
  }
  return false; // 走默认：语法感知缩进
}

// ---------- 标签页 ----------
const tabs = [];           // {name, path, encoding, eol, isNew, langOverride, doc, savedContent, dirty}
let activeIdx = -1;
let newCounter = 0;

const langComp = new Compartment();
const wrapComp = new Compartment();
const lineNumComp = new Compartment();
const fontComp = new Compartment();
// 每标签重建扩展时读取这些全局值
let wrapOn = false; // Notepad++ 默认不自动换行
let lineNumsOn = true;
let fontSize = 13; // 缩放只改文字大小（全局生效，对齐 N++）

// 字号主题：内容跟缩放走；行号字号缓涨（0.4 倍），列宽跟位数，不随缩放膨胀
const fontTheme = (px) => EditorView.theme({
  ".cm-content": { fontSize: px + "px" },
  ".cm-gutters": { fontSize: Math.round(11 + Math.max(0, px - 13) * 0.4) + "px" },
});

// ---------- 书签（N++：点击边栏切换，蓝圈标记，F2 跳转，每标签独立） ----------
const setBookmarks = StateEffect.define();
const bookmarkField = StateField.define({
  create: () => [],
  update(value, tr) {
    let next = value;
    if (tr.docChanged) {
      next = value.map((ln) => {
        const pos = tr.changes.mapPos(tr.startState.doc.line(ln).from, -1);
        return tr.state.doc.lineAt(Math.max(0, pos)).number;
      });
      next = [...new Set(next)];
    }
    for (const e of tr.effects) if (e.is(setBookmarks)) next = e.value;
    return next;
  },
});
const bookmarkMarker = new (class extends GutterMarker {
  toDOM() { const d = document.createElement("div"); d.className = "bm-mark"; return d; }
})();
// Notepad++ 符号边栏（源码 _SC_MARGE_SYMBOL=1，行号右侧），点击行切换书签
const bookmarkGutter = gutter({
  class: "cm-bookmarkGutter",
  initialMargin: false,
  lineMarker: (view, line) =>
    view.state.field(bookmarkField).includes(view.state.doc.lineAt(line.from).number) ? bookmarkMarker : null,
  initialSpacer: () => bookmarkMarker,
  domEventHandlers: { mousedown: (view, line) => { toggleBookmarkAt(view, line.from); return true; } },
});
function toggleBookmarkAt(view, pos) {
  const ln = view.state.doc.lineAt(pos ?? view.state.selection.main.head).number;
  const cur = view.state.field(bookmarkField);
  const next = cur.includes(ln) ? cur.filter((x) => x !== ln) : [...cur, ln].sort((a, b) => a - b);
  view.dispatch({ effects: setBookmarks.of(next) });
}
function jumpBookmark(dir) {
  const cur = view.state.field(bookmarkField);
  if (!cur.length) return;
  const ln = view.state.doc.lineAt(view.state.selection.main.head).number;
  let target = dir > 0 ? cur.find((x) => x > ln) : [...cur].reverse().find((x) => x < ln);
  if (target === undefined) target = dir > 0 ? cur[0] : cur[cur.length - 1]; // 环绕
  const line = view.state.doc.line(target);
  view.dispatch({ selection: EditorSelection.cursor(line.from), scrollIntoView: true });
}

// ---------- 自动补全（首选项可配） ----------
const acComp = new Compartment();
let acCfg = { enabled: true, allTabs: false, minLen: 1 };

function wordSource(ctx) {
  const before = ctx.matchBefore(/[\w$]+/);
  if (!before) return null;
  if (before.from === before.to && !ctx.explicit) return null;
  if (before.text.length < acCfg.minLen) return null;
  const prefix = before.text.toLowerCase();
  const seen = new Set();
  const sources = acCfg.allTabs ? tabs.map((t) => t.doc).filter(Boolean) : [ctx.state.doc.toString()];
  for (const doc of sources) {
    const words = doc.match(/[\w$]{2,60}/g) || [];
    for (const w of words) {
      if (seen.size > 500) break;
      if (w.toLowerCase().startsWith(prefix)) seen.add(w);
    }
  }
  const options = [...seen].slice(0, 200).map((w) => ({ label: w, type: "text" }));
  return options.length ? { from: before.from, options, validFor: /^[\w$]*$/ } : null;
}
function acExtension() {
  return acCfg.enabled ? [autocompletion({ override: [wordSource], icons: false })] : [];
}

const editorHost = document.getElementById("editor-host");
const view = new EditorView({
  state: EditorState.create({ doc: "", extensions: baseExtensions(null) }),
  parent: editorHost,
  dispatch: (tr) => {
    view.update([tr]);
    // 每标签保存完整 EditorState：撤销历史/光标/书签随标签走，切标签不丢
    if (activeIdx >= 0 && tabs[activeIdx]) {
      tabs[activeIdx].state = view.state;
      if (tr.docChanged) {
        const tab = tabs[activeIdx];
        tab.doc = tr.state.doc.toString();
        tab.dirty = tab.doc !== tab.savedContent;
        renderTabs();
      }
    }
    updateStatus();
  },
});

function baseExtensions(lang) {
  return [
    lineNumComp.of(lineNumsOn ? lineNumbers() : []),
    bookmarkGutter,
    bookmarkField, // N++ margin 顺序（源码 _SC_MARGE_*）: 行号(0)最左 → 符号/书签(1) → 修改历史(2) → 折叠(3)
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    indentUnit.of("    "), // Tab/自动缩进 = 4 空格，绝不写入制表符
    syntaxHighlighting(nppHighlight),
    bracketMatching(),
    closeBrackets(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    search(), // 查找窗口设置的查询在编辑区高亮
    langComp.of(lang || []),
    acComp.of(acExtension()),
    wrapComp.of(wrapOn ? EditorView.lineWrapping : []),
    fontComp.of(fontTheme(fontSize)),
    EditorView.theme({
      "&": { backgroundColor: "#FFFFFF", color: "#000000", fontSize: "13px" },
      ".cm-content": { fontFamily: '"Courier New", monospace', caretColor: "#000" },
      ".cm-gutters": { backgroundColor: "#E8E8E8", color: "#707070", border: "none" },
      ".cm-bookmarkGutter": { width: "18px", backgroundColor: "#DBDBDB", borderRight: "1px solid #CFCFCF" },
      ".cm-lineNumbers .cm-gutterElement": { padding: "0 4px 0 3px" },
      ".cm-activeLine": { backgroundColor: "rgba(255,255,150,0.40)" },
      ".cm-activeLineGutter": { backgroundColor: "rgba(255,255,150,0.40)" },
      "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": { backgroundColor: "#C0E2F1" },
      ".cm-cursor": { borderLeftColor: "#000" },
      ".cm-searchMatch": { backgroundColor: "#FFFF00" },
      ".cm-searchMatch-selected": { backgroundColor: "#FF9900" },
      ".cm-panels": { backgroundColor: "#F0F0F0", color: "#000" },
    }),
    keymap.of([
      { key: "Enter", run: smartEnter },
      { key: "Mod-=", run: () => { zoomFont(1); return true; } },
      { key: "Mod--", run: () => { zoomFont(-1); return true; } },
      { key: "Mod-0", run: () => { setFont(13); return true; } },
      { key: "Mod-f", run: () => { showFindWin("find"); return true; } },
      { key: "Mod-h", run: () => { showFindWin("replace"); return true; } },
      { key: "F3", run: () => { applyQuery(); findNext(view); return true; } },
      { key: "Shift-F3", run: () => { applyQuery(); findPrevious(view); return true; } },
      { key: "F2", run: () => { jumpBookmark(1); return true; } },
      { key: "Shift-F2", run: () => { jumpBookmark(-1); return true; } },
      { key: "Alt-Shift-ArrowDown", run: (v) => addCursorLine(v, 1) },
      { key: "Alt-Shift-ArrowUp", run: (v) => addCursorLine(v, -1) },
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...historyKeymap,
      ...foldKeymap,
      indentWithTab,
    ]),
    EditorView.updateListener.of((u) => {
      if (u.selectionSet || u.docChanged) updateCursor(u.state);
    }),
  ];
}

// ---------- 标签栏 ----------
const tabbarEl = document.getElementById("tabbar");
tabbarEl.addEventListener("click", (e) => {
  const tabEl = e.target.closest(".tab");
  if (!tabEl) return;
  const idx = Number(tabEl.dataset.idx);
  if (e.target.closest(".close")) closeTab(idx);
  else activateTab(idx);
});

function renderTabs() {
  tabbarEl.innerHTML = "";
  tabs.forEach((tab, idx) => {
    const div = document.createElement("div");
    div.className = "tab" + (idx === activeIdx ? " active" : "");
    div.dataset.idx = idx;
    const iconColor = tab.dirty ? ["#c23b3b", "#8c1f1f"] : ["#366bca", "#1f4a92"];
    div.innerHTML = `<span class="doc-icon">${floppySVG(iconColor[0], iconColor[1])}</span>` +
      `<span class="name"></span><span class="close">×</span>`;
    div.querySelector(".name").textContent = tab.name;
    div.title = tab.path || tab.name;
    tabbarEl.appendChild(div);
  });
  syncToolbarState();
}

function activateTab(idx) {
  if (idx < 0 || idx >= tabs.length) return;
  activeIdx = idx;
  const tab = tabs[idx];
  view.setState(tab.state);
  // 全局项（字号/换行/行号/补全）可能在别的标签编辑期间变了，切入即统一；
  // 查找窗口开着时把查询也带到新标签（高亮延续）
  const effects = [
    fontComp.reconfigure(fontTheme(fontSize)),
    wrapComp.reconfigure(wrapOn ? EditorView.lineWrapping : []),
    lineNumComp.reconfigure(lineNumsOn ? lineNumbers() : []),
    acComp.reconfigure(acExtension()),
  ];
  if (!findWin.hidden) effects.push(setSearchQuery.of(makeQuery()));
  view.dispatch({ effects });
  window.npp.setTitle(`${tab.name} - 墨码`);
  reportMenuState();
  renderTabs();
  updateStatus();
  view.focus();
}

function closeTab(idx) {
  const tab = tabs[idx];
  if (!tab) return;
  if (tab.dirty) {
    window.npp.confirmUnsaved([tab.name]).then((resp) => {
      if (resp === 2) return;            // 取消
      if (resp === 0) { saveTab(tab).then((ok) => { if (ok) reallyClose(idx); }); return; }
      reallyClose(idx);                  // 不保存
    });
    return;
  }
  reallyClose(idx);
}

function reallyClose(idx) {
  tabs.splice(idx, 1);
  if (tabs.length === 0) { newTab(); return; }
  const next = Math.min(idx, tabs.length - 1);
  activateTab(next);
}

// ---------- 新建 / 打开 / 保存 ----------
function newTab() {
  newCounter += 1;
  const tab = {
    name: `new ${newCounter}`, path: null, encoding: "UTF-8",
    eol: window.npp.platform === "win32" ? "crlf" : "lf",
    isNew: true, langOverride: null, doc: "", savedContent: "", dirty: false,
  };
  tab.state = EditorState.create({ doc: "", extensions: baseExtensions(null) });
  tabs.push(tab);
  activateTab(tabs.length - 1);
}

async function openFiles() {
  const paths = await window.npp.openDialog();
  if (!paths.length) return;
  await openPathsDirect(paths);
}

// 双击文件/"打开方式"传入的路径：第一个顶掉未动过的空 new 文档（N++ 行为）
async function openPathsDirect(paths) {
  const emptyNew = tabs.findIndex((t) => t.isNew && !t.dirty && t.doc === "");
  for (let i = 0; i < paths.length; i++) {
    await openOne(paths[i], i === 0 ? emptyNew : null);
  }
}
async function openOne(p, replaceIdx) {
  const data = await window.npp.readFile(p);
  if (data.error) { alert(data.error); return; }
  const tab = {
    name: p.split("\\").pop().split("/").pop(), path: p, encoding: data.encoding,
    eol: /\r\n/.test(data.content) ? "crlf" : "lf",
    isNew: false, langOverride: null,
    doc: data.content, savedContent: data.content, dirty: false,
  };
  tab.state = EditorState.create({
    doc: data.content,
    extensions: baseExtensions(LANG_FACTORY[langIdOf(tab)] ? LANG_FACTORY[langIdOf(tab)]() : null),
  });
  if (replaceIdx !== null && replaceIdx >= 0 && replaceIdx < tabs.length && tabs[replaceIdx].isNew) {
    tabs[replaceIdx] = tab;
    activateTab(replaceIdx);
  } else {
    tabs.push(tab);
    activateTab(tabs.length - 1);
  }
}

function toEol(text, eol) { return eol === "crlf" ? text.replace(/\r?\n/g, "\r\n") : text.replace(/\r\n/g, "\n"); }

async function saveTab(tab) {
  let path = tab.path;
  if (!path) {
    path = await window.npp.saveDialog(tab.name);
    if (!path) return false;
    tab.path = path;
    tab.name = path.split("\\").pop().split("/").pop();
    tab.isNew = false;
  }
  const r = await window.npp.writeFile(path, toEol(tab.doc, tab.eol), tab.encoding);
  if (r.error) { alert("保存失败：" + r.error); return false; }
  tab.savedContent = tab.doc;
  tab.dirty = false;
  window.npp.setTitle(`${tab.name} - 墨码`);
  renderTabs();
  updateStatus();
  return true;
}

async function saveActive() { if (activeIdx >= 0) await saveTab(tabs[activeIdx]); }
async function saveAll() {
  for (const tab of tabs.slice()) {
    if (!tab.dirty) continue;
    const ok = await saveTab(tab);
    if (!ok) return;
  }
}
async function renameActive() {
  const tab = tabs[activeIdx];
  if (!tab) return;
  const p = await window.npp.saveDialog(tab.name);
  if (!p) return;
  tab.path = p; tab.name = p.split("\\").pop().split("/").pop(); tab.isNew = false;
  await saveTab(tab);
}

async function closeActive() { if (activeIdx >= 0) closeTab(activeIdx); }
async function closeAllTabs() {
  const dirty = tabs.filter((t) => t.dirty);
  if (dirty.length) {
    const resp = await window.npp.confirmUnsaved(dirty.map((t) => t.name));
    if (resp === 2) return;
    if (resp === 0) {
      for (const tab of dirty) { const ok = await saveTab(tab); if (!ok) return; }
    }
  }
  tabs.length = 0;
  newTab();
}

// ---------- 菜单动作 ----------
function handleAction(a) {
  switch (a.type) {
    case "new": newTab(); break;
    case "open": openFiles(); break;
    case "save": saveActive(); break;
    case "saveAs": { const tab = tabs[activeIdx]; if (tab) { const keep = tab.path; tab.path = null; saveTab(tab).then((ok) => { if (!ok && keep) { tab.path = keep; tab.name = keep.split("\\").pop(); } }); } break; }
    case "saveAll": saveAll(); break;
    case "rename": renameActive(); break;
    case "close": closeActive(); break;
    case "closeAll": closeAllTabs(); break;
    case "undo": undo(view); view.focus(); break;
    case "redo": redo(view); view.focus(); break;
    case "find": case "replace": showFindWin(a.type === "replace" ? "replace" : "find"); break;
    case "findNext": applyQuery(); findNext(view); view.focus(); break;
    case "bmToggle": toggleBookmarkAt(view); break;
    case "bmNext": jumpBookmark(1); break;
    case "bmPrev": jumpBookmark(-1); break;
    case "bmClear": view.dispatch({ effects: setBookmarks.of([]) }); break;
    case "wrap": toggleWrap(); break;
    case "lineNumbers": toggleLineNumbers(); break;
    case "encoding": {
      const tab = tabs[activeIdx];
      if (tab && tab.encoding !== a.value) { tab.encoding = a.value; tab.dirty = tab.doc !== tab.savedContent || true; renderTabs(); updateStatus(); reportMenuState(); }
      break;
    }
    case "lang": {
      const tab = tabs[activeIdx];
      if (tab) {
        tab.langOverride = a.value;
        view.dispatch({ effects: langComp.reconfigure(LANG_FACTORY[a.value] ? LANG_FACTORY[a.value]() : []) });
        updateStatus(); reportMenuState();
      }
      break;
    }
    case "zoom": a.value === "reset" ? setFont(13) : zoomFont(a.value); break;
    case "prefs": showPrefs(); break;
    case "openPaths": openPathsDirect(a.paths); break;
    case "beforeQuit": beforeQuit(); break;
  }
}

let quitting = false;
async function beforeQuit() {
  if (quitting) return;
  const dirty = tabs.filter((t) => t.dirty);
  if (!dirty.length) { quitting = true; window.npp.forceQuit(); return; }
  const resp = await window.npp.confirmUnsaved(dirty.map((t) => t.name));
  if (resp === 2) return;
  if (resp === 0) { for (const tab of dirty) { const ok = await saveTab(tab); if (!ok) return; } }
  quitting = true;
  window.npp.forceQuit();
}

function toggleWrap() {
  wrapOn = !wrapOn;
  view.dispatch({ effects: wrapComp.reconfigure(wrapOn ? EditorView.lineWrapping : []) });
  reportMenuState();
  saveConfig();
}
function toggleLineNumbers() {
  lineNumsOn = !lineNumsOn;
  view.dispatch({ effects: lineNumComp.reconfigure(lineNumsOn ? lineNumbers() : []) });
  reportMenuState();
  saveConfig();
}

// ---------- 缩放（只改文字大小，对齐 Notepad++：全局、工具栏/状态栏不动） ----------
function saveConfig() {
  window.npp.setConfig({ fontSize, wrap: wrapOn, lineNumbers: lineNumsOn, ac: acCfg });
}
function setFont(px) {
  fontSize = Math.max(6, Math.min(48, px));
  view.dispatch({ effects: fontComp.reconfigure(fontTheme(fontSize)) });
  saveConfig();
}
function zoomFont(delta) { setFont(fontSize + delta); }

// Ctrl+滚轮：上放大、下缩小（N++ 手感），同时拦下 Chromium 自带的整页缩放
editorHost.addEventListener("wheel", (e) => {
  if (!e.ctrlKey) return;
  e.preventDefault();
  zoomFont(e.deltaY < 0 ? 1 : -1);
}, { passive: false });

// 主键盘 Ctrl+= / Ctrl+- / Ctrl+0（菜单加速键只注册了小键盘 +）
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!findWin.hidden) { findWin.hidden = true; view.focus(); return; }
    if (!termDock.hidden && document.activeElement === termInput) { termDock.hidden = true; view.focus(); return; }
  }
  if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
  if (e.defaultPrevented) return;
  if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomFont(1); }
  else if (e.key === "-") { e.preventDefault(); zoomFont(-1); }
  else if (e.key === "0") { e.preventDefault(); setFont(13); }
});

function reportMenuState() {
  const tab = tabs[activeIdx];
  window.npp.reportState({
    encoding: tab ? tab.encoding : "UTF-8",
    langId: tab ? langIdOf(tab) : "text",
    wrap: wrapOn,
    lineNumbers: lineNumsOn,
  });
}

// ---------- 状态栏 ----------
const sb = {
  type: document.getElementById("sb-type"),
  len: document.getElementById("sb-len"),
  lines: document.getElementById("sb-lines"),
  pos: document.getElementById("sb-pos"),
  eol: document.getElementById("sb-eol"),
  enc: document.getElementById("sb-enc"),
};
const termBtn = document.getElementById("sb-term");

// ---------- 查找窗口（N++ 风格浮动窗口：查找/替换两页，可拖动） ----------
const findWin = document.getElementById("findwin");
const fwFind = document.getElementById("fw-find");
const fwReplace = document.getElementById("fw-replace");
const fwCase = document.getElementById("fw-case");
const fwWord = document.getElementById("fw-word");

function showFindWin(mode) {
  findWin.hidden = false;
  document.querySelectorAll(".fw-tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === mode));
  document.querySelectorAll(".fw-rep-row, .fw-rep").forEach((el) => {
    el.style.display = mode === "replace" ? "" : "none";
  });
  fwFind.focus();
  fwFind.select();
}
function makeQuery() {
  return new SearchQuery({
    search: fwFind.value,
    caseSensitive: fwCase.checked,
    wholeWord: fwWord.checked,
    replace: fwReplace.value,
  });
}
function applyQuery() { view.dispatch({ effects: setSearchQuery.of(makeQuery()) }); }

document.getElementById("fw-next").addEventListener("click", () => { applyQuery(); findNext(view); view.focus(); });
document.getElementById("fw-prev").addEventListener("click", () => { applyQuery(); findPrevious(view); view.focus(); });
document.getElementById("fw-replace-btn").addEventListener("click", () => { applyQuery(); replaceNext(view); view.focus(); });
document.getElementById("fw-replace-all").addEventListener("click", () => {
  applyQuery();
  const n = replaceAll(view);
  flashStatus(`已替换 ${n} 处`);
  view.focus();
});
for (const id of ["fw-close", "fw-close2"]) {
  document.getElementById(id).addEventListener("click", () => { findWin.hidden = true; view.focus(); });
}
document.querySelectorAll(".fw-tab").forEach((t) =>
  t.addEventListener("click", () => showFindWin(t.dataset.tab)));
fwFind.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    applyQuery();
    e.shiftKey ? findPrevious(view) : findNext(view);
  }
});
// 拖动查找窗口
(function enableFindDrag() {
  const bar = document.getElementById("findwin-title");
  bar.addEventListener("mousedown", (e) => {
    if (e.target.closest(".fw-close")) return;
    const rect = findWin.getBoundingClientRect();
    const ox = e.clientX - rect.left, oy = e.clientY - rect.top;
    const move = (ev) => {
      findWin.style.left = Math.max(0, ev.clientX - ox) + "px";
      findWin.style.top = Math.max(0, ev.clientY - oy) + "px";
    };
    const up = () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    e.preventDefault();
  });
})();

// ---------- 底部终端 dock（不弹外部窗口；逐条执行，GBK 解码，cd/历史/清屏） ----------
const isWin = window.npp.platform === "win32";
const termDock = document.getElementById("term-dock");
const termOut = document.getElementById("term-out");
const termInput = document.getElementById("term-input");
const termPrompt = document.getElementById("term-prompt");
const termTitle = document.getElementById("term-title-text");
let termCwd = null;
const termHistory = [];
let termHistIdx = 0;

function termSetCwd(cwd) {
  termCwd = cwd;
  termPrompt.textContent = cwd + (isWin ? ">" : " $");
  termTitle.textContent = cwd;
}
function termPrint(text) {
  termOut.textContent += text;
  termOut.parentNode.scrollTop = termOut.parentNode.scrollHeight;
}
function termToggle() {
  termDock.hidden = !termDock.hidden;
  if (!termDock.hidden) {
    if (!termCwd) {
      const tab = tabs[activeIdx];
      termSetCwd((tab && tab.path) ? tab.path.replace(/[\\/][^\\/]*$/, "") : (isWin ? "C:\\" : "/"));
    }
    termInput.focus();
  } else {
    view.focus();
  }
}
// cd 在 dock 内解析（保持工作目录），其余命令交主进程执行
function termResolveCd(arg) {
  const sep = isWin ? "\\" : "/";
  if (!arg || arg === "/" || arg === "\\") return isWin ? termCwd.slice(0, 3) : "/";
  let base;
  if (isWin && /^[a-zA-Z]:/.test(arg)) base = arg;
  else if (!isWin && arg.startsWith("/")) base = arg;
  else base = termCwd.replace(/[\\/]+$/, "") + sep + arg;
  const stack = [];
  for (const p of base.split(/[\\/]+/)) {
    if (!p || p === ".") continue;
    if (p === "..") stack.pop();
    else stack.push(p);
  }
  if (!stack.length) return "/";
  if (isWin && /^[a-zA-Z]:$/.test(stack[0])) return stack[0] + sep + stack.slice(1).join(sep);
  return isWin ? stack.join(sep) : sep + stack.join(sep);
}
async function termExec(cmdline) {
  termPrint(termPrompt.textContent + " " + cmdline + "\n");
  const trimmed = cmdline.trim();
  if (!trimmed) return;
  termHistory.push(cmdline);
  termHistIdx = termHistory.length;
  if (trimmed === "cls" || trimmed === "clear") { termOut.textContent = ""; return; }
  if (/^cd(\s|$)/i.test(trimmed)) {
    const arg = trimmed.replace(/^cd\s*/i, "").replace(/^"(.*)"$/, "$1");
    termSetCwd(termResolveCd(arg));
    return;
  }
  const r = await window.npp.termRun(trimmed, termCwd);
  let text = r.out || "";
  if (isWin) {
    // cmd 输出为 GBK 码页：latin1 保底字节 → GBK 解码
    const bytes = Uint8Array.from(text, (c) => c.charCodeAt(0) & 0xFF);
    try { text = new TextDecoder("gbk").decode(bytes); } catch { /* 保留原样 */ }
  }
  termPrint(text + (text && !text.endsWith("\n") ? "\n" : ""));
}
termBtn.addEventListener("click", termToggle);
document.getElementById("term-close").addEventListener("click", () => { termDock.hidden = true; view.focus(); });
termInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { termExec(termInput.value); termInput.value = ""; }
  else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (termHistIdx > 0) termInput.value = termHistory[--termHistIdx];
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    if (termHistIdx < termHistory.length - 1) termInput.value = termHistory[++termHistIdx];
    else { termHistIdx = termHistory.length; termInput.value = ""; }
  }
});

// 字节长度：ANSI(GBK) 按 GBK 编码计（ASCII 1 字节、中文 2 字节、€ 特判）
function byteLength(text, encoding) {
  if (encoding === "ANSI") {
    let n = 0;
    for (const ch of text) {
      const c = ch.codePointAt(0);
      n += c < 0x80 || c === 0x20AC ? 1 : 2;
    }
    return n;
  }
  let n = new TextEncoder().encode(text).length;
  if (encoding === "UTF-8-BOM") n += 3;
  return n;
}

function updateStatus() {
  const tab = tabs[activeIdx];
  if (!tab) return;
  sb.type.textContent = `文件类型 : ${LANG_TYPE_LABEL[langIdOf(tab)] || "normal text file"}`;
  sb.len.textContent = `长度 : ${byteLength(tab.doc, tab.encoding)}`;
  sb.lines.textContent = `行数 : ${view.state.doc.lines}`;
  const head = view.state.selection.main.head;
  const range = view.state.selection.main;
  const line = view.state.doc.lineAt(head);
  const sel = Math.abs(range.to - range.from);
  sb.pos.textContent = `Ln : ${line.number} Col : ${head - line.from + 1} Sel : ${sel}`;
  sb.eol.textContent = tab.eol === "crlf" ? "Windows (CR LF)" : "Unix (LF)";
  sb.enc.textContent = tab.encoding;
}

// ---------- 首选项 ----------
const prefsOverlay = document.getElementById("prefs-overlay");
function showPrefs() {
  document.getElementById("pref-ac-enable").checked = acCfg.enabled;
  document.getElementById("pref-ac-alltabs").checked = acCfg.allTabs;
  document.getElementById("pref-ac-minlen").value = acCfg.minLen;
  prefsOverlay.hidden = false;
}
document.getElementById("prefs-cancel").addEventListener("click", () => { prefsOverlay.hidden = true; });
document.getElementById("prefs-ok").addEventListener("click", () => {
  acCfg.enabled = document.getElementById("pref-ac-enable").checked;
  acCfg.allTabs = document.getElementById("pref-ac-alltabs").checked;
  acCfg.minLen = Math.max(1, Math.min(10, Number(document.getElementById("pref-ac-minlen").value) || 1));
  view.dispatch({ effects: acComp.reconfigure(acExtension()) });
  prefsOverlay.hidden = true;
  saveConfig();
});
function updateCursor(state) {
  const head = state.selection.main.head;
  const line = state.doc.lineAt(head);
  const sel = Math.abs(state.selection.main.to - state.selection.main.from);
  sb.pos.textContent = `Ln : ${line.number} Col : ${head - line.from + 1} Sel : ${sel}`;
}

// ---------- 工具栏状态同步 ----------
// v0.2：save/saveAll 常亮（Notepad++ 亦如此），无需禁用逻辑
function syncToolbarState() {}

// ---------- 全局 ----------
window.addEventListener("beforeunload", (e) => {
  if (tabs.some((t) => t.dirty) && !quitting) { e.preventDefault(); e.returnValue = ""; }
});
// ============ 右键菜单（原生） ============
window.npp.onAction(handleAction);
// 主进程 ctx-action → 渲染回调
window.npp.onCtxAction((id) => {
  const t = tabs[activeIdx];
  switch (id) {
    case "cut": document.execCommand("cut"); break;
    case "copy": document.execCommand("copy"); break;
    case "paste": document.execCommand("paste"); break;
    case "delete": {
      const v = view;
      const { from, to } = v.state.selection.main;
      if (from !== to) v.dispatch({ changes: { from, to, insert: "" } });
      break;
    }
    case "selectAll": view.dispatch({ selection: { anchor: 0, head: view.state.doc.length } }); break;
    case "saveTab": saveTab(t); break;
    case "closeTab": closeTab(activeIdx); break;
    case "closeOtherTabs": {
      const keep = tabs[activeIdx];
      tabs.length = 0; tabs.push(keep);
      activeIdx = 0;
      activateTab(0);
      break;
    }
  }
});
function showEditorMenu(e) {
  const v = view;
  const sel = v.state.selection.main;
  const hasSel = sel.from !== sel.to;
  window.npp.showContextMenu(e.clientX, e.clientY, [
    { id: "cut", label: "剪切(T)", enabled: hasSel },
    { id: "copy", label: "复制(C)", enabled: hasSel },
    { id: "paste", label: "粘贴(P)", enabled: true },
    { id: "delete", label: "删除(D)", enabled: hasSel },
    { type: "separator" },
    { id: "selectAll", label: "全选(A)" },
  ]);
}
function showTabMenu(e, idx) {
  e.preventDefault();
  const t = tabs[idx];
  window.npp.showContextMenu(e.clientX, e.clientY, [
    { id: "saveTab", label: "保存(S)", enabled: t && t.dirty },
    { id: "closeTab", label: "关闭(C)" },
    { id: "closeOtherTabs", label: "关闭其他标签", enabled: tabs.length > 1 },
  ]);
}
// 捕获阶段监听：CodeMirror 的 contenteditable 会吞掉冒泡阶段的事件（Linux 上尤其明显）
editorHost.addEventListener("contextmenu", (e) => { e.preventDefault(); e.stopPropagation(); showEditorMenu(e); }, true);
tabbarEl.addEventListener("contextmenu", (e) => {
  const tabEl = e.target.closest(".tab");
  if (tabEl) showTabMenu(e, Number(tabEl.dataset.idx));
});



renderToolbar();
// 启动时恢复上次的缩放/换行/行号/自动补全（存于 userData/moma-config.json）
(async function restoreConfig() {
  const cfg = await window.npp.getConfig().catch(() => ({}));
  if (cfg) {
    if (typeof cfg.fontSize === "number") fontSize = Math.max(6, Math.min(48, cfg.fontSize));
    if (typeof cfg.wrap === "boolean") wrapOn = cfg.wrap;
    if (typeof cfg.lineNumbers === "boolean") lineNumsOn = cfg.lineNumbers;
    if (cfg.ac) acCfg = Object.assign(acCfg, cfg.ac);
  }
  view.dispatch({ effects: [
    fontComp.reconfigure(fontTheme(fontSize)),
    wrapComp.reconfigure(wrapOn ? EditorView.lineWrapping : []),
    lineNumComp.reconfigure(lineNumsOn ? lineNumbers() : []),
    acComp.reconfigure(acExtension()),
  ]});
  reportMenuState();
  newTab();
})();
