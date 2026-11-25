// Gera poses.json: para cada espécie, as poses e quantos quadros ela tem (arquivos <id>-<pose>-<n>.png). Rode depois de acrescentar animações.
import fs from 'fs';
import path from 'path';
const aqui = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const P = {};
for (const f of fs.readdirSync(aqui)) {
  const m = /^([a-z0-9]+)-([a-z]+)-(\d+)\.png$/.exec(f); if (!m) continue;
  const [, id, pose, n] = m; P[id] = P[id] || {}; P[id][pose] = Math.max(P[id][pose] || 0, Number(n));
}
const ord = Object.fromEntries(Object.keys(P).sort().map((k) => [k, P[k]]));
fs.writeFileSync(path.join(aqui, 'poses.json'), JSON.stringify(ord));
console.log(Object.keys(ord).length + ' espécies com animação');
