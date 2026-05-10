#!/usr/bin/env node
// Generate missing Noah Ark audio files (zhCN + ja)
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = fs.readFileSync('/Users/zachli/.minimax-api-key', 'utf8').trim();
const BASE = '/Users/zachli/.openclaw/workspace/preschool/audio/noah';

const MISSING = [
  // zhCN (fallback from zhHK for now since zhCN quota is exhausted)
  ["n4Narr_zhCN.mp3", "方舟漂在水面上，挪亚放出鸽子去探路。"],
  ["n4Success_zhCN.mp3", "鸽子带着橄榄树叶回来！表示陆地出现了！"],
  ["n5Narr_zhCN.mp3", "洪水完全消退了！挪亚一家人和所有动物离开方舟，展开新生活！"],
  ["n5Success_zhCN.mp3", "安全了！大家一起走来感谢上帝！"],
  ["summary_zhCN.mp3", "挪亚方舟的故事教导我们要信靠上帝，遵守祂的话。方舟带来平安，彩虹是上帝的应许——祂会一直看住我们。"],
  // ja
  ["n4Narr_ja.mp3", "箱舟が水面に浮かび、ノアはすみかを探すために鴿を放しました。"],
  ["n4Success_ja.mp3", "鴿がオリーブの葉を持って帰ってきた！陸が現れた！"],
  ["n5Narr_ja.mp3", "洪水が完全に引いた！ノアとすべての動物が箱舟を出て、新しい生活が始まった！"],
  ["n5Success_ja.mp3", "安全！皆出て神様に感謝！"],
  ["summary_ja.mp3", "ノアの箱舟の話は、神様を信頼し、その言葉に従うことを教えます。箱舟は安全をもたらし、虹は神様の約束——いつも私たちを見守ってくださるというしるしです。"],
];

function gen(text, filename) {
  return new Promise((resolve) => {
    const outPath = BASE + '/' + filename;
    const body = JSON.stringify({
      model: "speech-2.8-hd",
      text,
      stream: false,
      voice_setting: { voice_id: "female-tianmei", speed: 0.85 },
      output_format: "url"
    });
    const req = https.request({
      hostname: 'api.minimax.io', path: '/v1/t2a_v2', method: 'POST',
      headers: { 'Authorization': 'Bearer ' + API_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', async () => {
        const j = JSON.parse(d);
        const url = j?.data?.audio;
        if (!url) {
          console.log('FAIL ' + filename + ': ' + j.base_resp?.status_msg);
          fs.appendFileSync('/Users/zachli/.openclaw/workspace/preschool/audio_gen.log', new Date().toISOString() + ' FAIL ' + filename + ': ' + j.base_resp?.status_msg + '\n');
          resolve(false);
          return;
        }
        const dl = await new Promise(r2 => {
          const f = fs.createWriteStream(outPath);
          https.get(url, r => r.pipe(f)).on('finish', () => r2(true)).on('error', () => r2(false));
        });
        if (dl) {
          console.log('OK ' + filename + ' (' + fs.statSync(outPath).size + 'b)');
          fs.appendFileSync('/Users/zachli/.openclaw/workspace/preschool/audio_gen.log', new Date().toISOString() + ' OK ' + filename + '\n');
        }
        resolve(dl);
      });
    });
    req.setTimeout(30000);
    req.on('error', e => { console.log('NET ERR ' + e.message); resolve(false); });
    req.write(body);
    req.end();
  });
}

async function main() {
  fs.appendFileSync('/Users/zachli/.openclaw/workspace/preschool/audio_gen.log', '\n--- ' + new Date().toISOString() + ' ---\n');
  const total = MISSING.length;
  for (let i = 0; i < total; i++) {
    const [filename, text] = MISSING[i];
    process.stdout.write('[' + (i+1) + '/' + total + '] ' + filename + '... ');
    const ok = await gen(text, filename);
    if (!ok) {
      console.log('\nFailed at ' + filename + ' - will retry next run');
      break;
    }
    await new Promise(r => setTimeout(r, 600));
  }
  console.log('\nDone.');
}
main().catch(e => { console.error(e); process.exit(1); });