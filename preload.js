// 墨码预加载：把安全的 API 暴露给渲染进程
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('npp', {
  openDialog: () => ipcRenderer.invoke('dialog:open'),
  saveDialog: (defaultName) => ipcRenderer.invoke('dialog:saveAs', defaultName),
  readFile: (p) => ipcRenderer.invoke('file:read', p),
  writeFile: (p, content, encoding) => ipcRenderer.invoke('file:write', p, content, encoding),
  confirmUnsaved: (names) => ipcRenderer.invoke('app:confirmUnsaved', names),
  setTitle: (t) => ipcRenderer.invoke('app:setTitle', t),
  reportState: (s) => ipcRenderer.send('state:update', s),
  forceQuit: () => ipcRenderer.send('app:forceQuit'),
  platform: process.platform,
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (cfg) => ipcRenderer.invoke('config:set', cfg),
  termRun: (cmd, cwd) => ipcRenderer.invoke('term:run', { cmd, cwd }),
  onAction: (cb) => ipcRenderer.on('action', (e, a) => cb(a)),
  // 原生右键菜单
  showContextMenu: (items, x, y) => ipcRenderer.invoke('ctx:show', { items, x, y }),
  onCtxAction: (cb) => ipcRenderer.on('ctx-action', (e, id) => cb(id)),
});
