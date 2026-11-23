// 墨码 渲染层语言模块：bundle 内两个语言包 + t()/setLang()/getLang()（与主进程 locales/index.js 同构）。
// 放在 renderer/src 内，esbuild 打包时两个语言包一起进 bundle，运行时切换。
import zhCN from '../../locales/zh-CN.js';
import enUS from '../../locales/en-US.js';

const PACKS = { 'zh-CN': zhCN, 'en-US': enUS };
const DEFAULT_LANG = 'zh-CN';
export const SUPPORTED = ['zh-CN', 'en-US'];
export const DEFAULT = DEFAULT_LANG;

let current = DEFAULT_LANG;

export function normalize(lang) {
  if (!lang) return DEFAULT_LANG;
  const k = String(lang).toLowerCase();
  if (k === 'zh' || k.startsWith('zh-cn') || k.startsWith('zh-hans') || k.startsWith('zh_cn')) return 'zh-CN';
  if (k === 'en' || k.startsWith('en-us') || k.startsWith('en_us') || k.startsWith('en')) return 'en-US';
  return DEFAULT_LANG;
}

export function setLang(lang) {
  current = normalize(lang);
  return current;
}

export function getLang() {
  return current;
}

export function t(key, vars) {
  const pack = PACKS[current] || PACKS[DEFAULT_LANG];
  let s = pack[key];
  if (s === undefined) s = PACKS[DEFAULT_LANG][key];
  if (s === undefined) return key;
  if (vars) {
    s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : m));
  }
  return s;
}
