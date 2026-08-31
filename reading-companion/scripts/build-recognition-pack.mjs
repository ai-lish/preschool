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

function fingerprint(file, crop = "") {
  const filter = crop
    ? `crop=iw*${crop.width}:ih*${crop.height}:iw*${crop.x}:ih*${crop.y},scale=32:24:flags=lanczos,format=gray`
    : "scale=32:24:flags=lanczos,format=gray";
  const raw = execFileSync(option("--ffmpeg", "/opt/homebrew/bin/ffmpeg"), [
    "-hide_banner", "-loglevel", "error", "-i", file,
    "-vf", filter,
    "-frames:v", "1", "-f", "rawvideo", "-"
  ], { maxBuffer: 1024 * 1024 });
  const values = Array.from(raw, Number);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const deviation = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length) || 1;
  return { values: values.map((value) => Math.round(((value - mean) / deviation) * 100) / 100) };
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
  const books = {
    goldilocks: buildBook("goldilocks", option("--gold-dir"), 12),
    pigs: buildBook("pigs", option("--pigs-dir"), 10)
  };
  const payload = { version: 2, books };
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `/* Generated from private PDF scans. Do not edit by hand. */\nwindow.MINIMAX_RECOGNITION = ${JSON.stringify(payload)};\n`);
  console.log(`Recognition pack written: ${output} (${Object.values(books).reduce((sum, book) => sum + book.pageCount, 0)} pages)`);
} catch (error) {
  fail(error.message || String(error));
}
