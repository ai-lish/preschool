#!/usr/bin/env node

/*
 * Build the device-independent recognition pack from private page scans.
 * The output contains only normalized visual fingerprints: never PDF URLs,
 * Drive IDs, page text, or source filenames.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);

function option(name, fallback = "") {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] || fallback : fallback;
}

function fail(message) {
  console.error(`Recognition pack: ${message}`);
  process.exitCode = 1;
}

function pageFiles(directory) {
  if (!directory || !fs.existsSync(directory)) throw new Error(`page directory not found: ${directory}`);
  return fs.readdirSync(directory)
    .filter((file) => /\.(png|jpe?g|webp)$/i.test(file))
    .sort((first, second) => first.localeCompare(second, undefined, { numeric: true }))
    .map((file) => path.join(directory, file));
}

function normalized(values, precision = 2) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const deviation = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length) || 1;
  const factor = 10 ** precision;
  return values.map((value) => Math.round(((value - mean) / deviation) * factor) / factor);
}

function ffmpegFrame(file, crop, size, format) {
  const filter = crop
    ? `crop=iw*${crop.width}:ih*${crop.height}:iw*${crop.x}:ih*${crop.y},scale=${size}:flags=lanczos,format=${format}`
    : `scale=${size}:flags=lanczos,format=${format}`;
  return execFileSync(option("--ffmpeg", "/opt/homebrew/bin/ffmpeg"), [
    "-hide_banner", "-loglevel", "error", "-i", file,
    "-vf", filter,
    "-frames:v", "1", "-f", "rawvideo", "-"
  ], { maxBuffer: 1024 * 1024 });
}

function colorValues(raw) {
  const values = [];
  for (let index = 0; index < raw.length; index += 3) {
    const red = raw[index];
    const green = raw[index + 1];
    const blue = raw[index + 2];
    const total = red + green + blue || 1;
    values.push(red / total, green / total, blue / total);
  }
  return values.map((value) => Math.round(value * 1000) / 1000);
}

function fingerprint(file, crop = "") {
  const gray = Array.from(ffmpegFrame(file, crop, "32:24", "gray"), Number);
  const color = colorValues(ffmpegFrame(file, crop, "16:12", "rgb24"));
  return { values: normalized(gray), color };
}

function buildBook(id, directory, expectedCount) {
  const files = pageFiles(directory);
  if (files.length !== expectedCount) throw new Error(`${id} expected ${expectedCount} pages, found ${files.length}`);
  const samples = {};
  const crops = [
    { x: "0.09", y: "0.05", width: "0.82", height: "0.90" },
    { x: "0.16", y: "0.125", width: "0.68", height: "0.75" }
  ];
  files.forEach((file, index) => {
    samples[String(index + 1)] = [fingerprint(file), ...crops.map((crop) => fingerprint(file, crop))];
  });
  return { pageCount: expectedCount, samples };
}

try {
  const output = option("--out", "assets/minimax-recognition.js");
  const books = {};
  const goldilocksDir = option("--gold-dir");
  const pigsDir = option("--pigs-dir");
  const bibleDir = option("--bible-dir");
  if (goldilocksDir) books.goldilocks = buildBook("goldilocks", goldilocksDir, 12);
  if (pigsDir) books.pigs = buildBook("pigs", pigsDir, 10);
  if (bibleDir) books.bible = buildBook("bible", bibleDir, 12);
  if (!Object.keys(books).length) throw new Error("provide at least one book page directory");
  const payload = { version: 2, books };
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `/* Generated from private PDF scans. Do not edit by hand. */\nwindow.MINIMAX_RECOGNITION = ${JSON.stringify(payload)};\n`);
  console.log(`Recognition pack written: ${output} (${Object.values(books).reduce((sum, book) => sum + book.pageCount, 0)} pages)`);
} catch (error) {
  fail(error.message || String(error));
}
