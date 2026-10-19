#!/usr/bin/env node

import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'book', 'audio', 'minimax');
const manifestPath = path.join(outputDir, 'manifest.json');
const model = 'speech-2.8-hd';
const voices = {
  yue: { id: 'Cantonese_CuteGirl', languageBoost: 'Chinese,Yue' },
  cmn: { id: 'Chinese (Mandarin)_Warm_Girl', languageBoost: 'Chinese' },
  en: { id: 'English_PlayfulGirl', languageBoost: 'English' },
};

function getApiKey() {
  if (process.env.MINIMAX_API_KEY) return process.env.MINIMAX_API_KEY;
  const secretPath = path.join(homedir(), '.openclaw', 'secrets.json');
  try {
    const secrets = JSON.parse(readFileSync(secretPath, 'utf8'));
    return secrets['minimax-api-key'];
  } catch (error) {
    return null;
  }
}

function getPages(artworkSource) {
  const sandbox = { window: {} };
  vm.runInNewContext(artworkSource, sandbox, { timeout: 1000 });
  return sandbox.window.K2_BOOK_PAGES;
}

async function synthesize(text, voice) {
  const response = await fetch('https://api.minimax.io/v1/t2a_v2', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      text,
      stream: false,
      language_boost: voice.languageBoost,
      output_format: 'hex',
      emotion: 'happy',
      voice_setting: { voice_id: voice.id, speed: 0.94, vol: 1, pitch: 1 },
      audio_setting: { sample_rate: 32000, bitrate: 64000, format: 'mp3', channel: 1 },
    }),
  });
  if (!response.ok) throw new Error(`MiniMax returned HTTP ${response.status}`);
  const result = await response.json();
  if (result.base_resp?.status_code !== 0 || !result.data?.audio) {
    throw new Error(`MiniMax synthesis failed: ${result.base_resp?.status_msg || 'no audio returned'}`);
  }
  return Buffer.from(result.data.audio, 'hex');
}

const apiKey = getApiKey();
if (!apiKey) {
  console.error('Set MINIMAX_API_KEY or configure ~/.openclaw/secrets.json before generating audio.');
  process.exitCode = 1;
} else {
  await mkdir(outputDir, { recursive: true });
  const artwork = await readFile(path.join(root, 'book', 'artwork.js'), 'utf8');
  const pages = getPages(artwork);
  const files = {};

  for (const page of pages) {
    for (const [language, voice] of Object.entries(voices)) {
      for (const part of ['word', 'sentence']) {
        const key = `${page.id}.${language}.${part}`;
        const filename = `${page.id}-${language}-${part}.mp3`;
        const audio = await synthesize(page.sentences[language][part], voice);
        await writeFile(path.join(outputDir, filename), audio);
        files[key] = filename;
        console.log(`Generated ${filename} (${audio.length} bytes)`);
      }
    }
  }

  await writeFile(manifestPath, `${JSON.stringify({
    provider: 'MiniMax', model, emotion: 'happy', voices: Object.fromEntries(
      Object.entries(voices).map(([language, voice]) => [language, voice.id]),
    ), generatedAt: new Date().toISOString(), files,
  }, null, 2)}\n`);
  console.log(`Wrote ${Object.keys(files).length} audio files to ${path.relative(root, outputDir)}`);
}
