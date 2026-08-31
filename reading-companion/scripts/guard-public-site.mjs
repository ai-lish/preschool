#!/usr/bin/env node

/* Fail closed if the public child projection contains private source material. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "publish.allowlist.json"), "utf8"));
const publicRoot = path.resolve(root, manifest.publicDirectory || "site");

function listFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

function relative(file) { return path.relative(publicRoot, file).split(path.sep).join("/"); }
function fail(message) { throw new Error(`Public site guard: ${message}`); }

if (!fs.existsSync(publicRoot)) fail("site directory does not exist; run the public build first");
const expected = new Set([".nojekyll"]);
for (const entry of manifest.entries || []) {
  const sourcePath = path.resolve(root, entry.source);
  const destinationPath = path.resolve(publicRoot, entry.destination);
  if (entry.kind === "directory") {
    for (const file of listFiles(sourcePath)) expected.add(path.posix.join(entry.destination, path.relative(sourcePath, file).split(path.sep).join("/")));
  } else expected.add(relative(destinationPath));
}
const actualFiles = listFiles(publicRoot).map(relative).sort();
const expectedFiles = Array.from(expected).sort();
if (actualFiles.length !== expectedFiles.length || actualFiles.some((file, index) => file !== expectedFiles[index])) {
  fail(`public file set differs from allowlist\nexpected: ${expectedFiles.join(", ")}\nactual: ${actualFiles.join(", ")}`);
}

const forbiddenNames = /(^|\/)(?:\.env|.*\.map|.*(?:secret|token|credential|api[-_]?key|quota|usage|log).*)$/i;
const forbiddenContent = /drive\.google\.com|docs\.google\.com|fileId|fileUrl|previewUrl|minimax-pages\.json|preschool\.html|MINIMAX_API_KEY|BEGIN (?:RSA|OPENSSH|EC) PRIVATE KEY|sk-[A-Za-z0-9_-]{20,}/i;
for (const file of listFiles(publicRoot)) {
  const name = relative(file);
  if (forbiddenNames.test(name)) fail(`forbidden filename: ${name}`);
  if (path.extname(file).toLowerCase() === ".map") fail(`source map is not allowed: ${name}`);
  const data = fs.readFileSync(file);
  if (forbiddenContent.test(data.toString("utf8"))) fail(`private source marker found in: ${name}`);
  if (name.startsWith("assets/minimax/") && !/\.(?:mp3|jpe?g|webp)$/i.test(name)) fail(`unexpected child asset type: ${name}`);
}

const index = fs.readFileSync(path.join(publicRoot, "index.html"), "utf8");
if (!index.includes('src="minimax-child-reader.js"')) fail("child runtime script is missing from index.html");
console.log(`Public site guard passed: ${actualFiles.length} files`);
