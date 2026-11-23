// npj CDP 自测：截图 + 执行表达式
// 用法：CDP_HOST=IP CDP_PORT=9222 node scripts/cdp.js out.png "expr1" "expr2"
const fs = require('fs');
const PORT = Number(process.env.CDP_PORT || 9222);
const HOST = process.env.CDP_HOST || '127.0.0.1';
const OUT = process.argv[2] || 'shot.png';
const EXPRS = process.argv.slice(3);

async function main() {
  let targets;
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(`http://${HOST}:${PORT}/json/list`);
      targets = await r.json();
      if (targets.length) break;
    } catch {}
    await new Promise((res) => setTimeout(res, 500));
  }
  if (!targets) { console.error('CDP not reachable'); process.exit(1); }
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl.replace(/127\.0\.0\.1:\d+/, `${HOST}:${PORT}`));
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let seq = 0; const pending = new Map();
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const send = (method, params = {}) => new Promise((res) => { const id = ++seq; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
  for (const expr of EXPRS) {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    if (r.result && r.result.exceptionDetails) {
      const ex = r.result.exceptionDetails;
      console.log('EXPR>', expr.slice(0,60), '=> THREW:', (ex.exception && (ex.exception.description || ex.exception.value)) || ex.text);
    } else {
      console.log('EXPR>', expr.slice(0,80), '=>', JSON.stringify(r.result && r.result.result && r.result.result.value));
    }
  }
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(OUT, Buffer.from(shot.result.data, 'base64'));
  console.log('SHOT saved:', OUT);
  ws.close(); process.exit(0);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
