// 墨码 语言加载器：主进程 require 直接用；渲染层从 renderer/src import。
// 两个语言包都打包进 bundle，运行时切换，不按语言分别构建。
'use strict';

const zhCN = require('./zh-CN.js');
const enUS = require('./en-US.js');

const PACKS = { 'zh-CN': zhCN, 'en-US': enUS };
const DEFAULT_LANG = 'zh-CN';
const SUPPORTED = ['zh-CN', 'en-US'];

let current = DEFAULT_LANG;

function normalize(lang) {
  if (!lang) return DEFAULT_LANG;
  const k = String(lang).toLowerCase();
  if (k === 'zh' || k.startsWith('zh-cn') || k.startsWith('zh-hans') || k.startsWith('zh_cn')) return 'zh-CN';
  if (k === 'en' || k.startsWith('en-us') || k.startsWith('en_us') || k.startsWith('en')) return 'en-US';
  return DEFAULT_LANG;
}

function setLang(lang) {
  current = normalize(lang);
  return current;
}

function getLang() {
  return current;
}

// t(key, vars)：缺失键回退到 zh-CN，再回退到键名本身（宁可显示键名也不留空）
function t(key, vars) {
  const pack = PACKS[current] || PACKS[DEFAULT_LANG];
  let s = pack[key];
  if (s === undefined) s = PACKS[DEFAULT_LANG][key];
  if (s === undefined) return key;
  if (vars) {
    s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : m));
  }
  return s;
}

module.exports = { t, setLang, getLang, normalize, SUPPORTED, DEFAULT_LANG };
