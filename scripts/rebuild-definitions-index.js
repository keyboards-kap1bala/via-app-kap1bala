/**
 * 重建 public/definitions 下的索引文件（Windows 兼容）。
 *
 * 背景：via-keyboards 的 build-all.ts 用 path.join() 拼 glob 模式，
 * 在 Windows 上会生成反斜杠路径，而 glob 把反斜杠当转义字符，
 * 导致匹配到 0 个定义 —— supported_kbs.json 的 vendorProductIds 变成空数组，
 * 应用因此永远停在「搜索设备…」（授权按钮依赖非空的 supportedIds）。
 *
 * 本脚本直接扫描已经生成好的 v2/v3 定义目录来重建索引，不依赖 glob。
 * 用法：node scripts/rebuild-definitions-index.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUT = path.resolve(process.argv[2] || 'public/definitions');

const readDefs = (version) => {
  const dir = path.join(OUT, version);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const json = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      return {file: f, id: json.vendorProductId, name: json.name};
    })
    .filter((d) => typeof d.id === 'number');
};

const getNames = (name) =>
  typeof name === 'string' ? [name] : name && name.options ? name.options : [];

function main() {
  const v2 = readDefs('v2');
  const v3 = readDefs('v3');
  const v2Ids = v2.map((d) => d.id);
  const v3Ids = v3.map((d) => d.id).filter((id) => !v2Ids.includes(id));

  // 保留原索引里的 version / theme，避免破坏既有字段
  const prevPath = path.join(OUT, 'supported_kbs.json');
  const prev = fs.existsSync(prevPath)
    ? JSON.parse(fs.readFileSync(prevPath, 'utf8'))
    : {};

  const index = {
    generatedAt: Date.now(),
    version: prev.version || '0.1.0',
    theme: prev.theme,
    vendorProductIds: {v2: v2Ids, v3: v3Ids},
  };

  fs.writeFileSync(prevPath, JSON.stringify(index, null, 2));
  console.log(`supported_kbs.json: v2=${v2Ids.length} v3=${v3Ids.length}`);

  const names = v3.flatMap((d) => getNames(d.name)).sort();
  fs.writeFileSync(
    path.join(OUT, 'keyboard_names.json'),
    JSON.stringify(names, null, 2),
  );
  console.log(`keyboard_names.json: ${names.length} 个名称`);

  // hash 只需在内容变化时变化，用于失效客户端缓存
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify({...index, generatedAt: undefined}))
    .digest('hex');
  fs.writeFileSync(path.join(OUT, 'hash.json'), JSON.stringify(hash));
  console.log(`hash.json: ${hash.slice(0, 12)}…`);
}

main();
