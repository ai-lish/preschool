#!/usr/bin/env node

/* Build the smallest online child projection from the private reading source. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const allowlistPath = path.join(root, "publish.allowlist.json");
const manifest = JSON.parse(fs.readFileSync(allowlistPath, "utf8"));
const publicRoot = path.resolve(root, manifest.publicDirectory || "site");

function resolveInsideRoot(relativePath) {
  const resolved = path.resolve(root, relativePath);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) throw new Error(`path escapes source root: ${relativePath}`);
  return resolved;
}

function sanitiseChildHtml(value) {
  let html = value;
  html = html.replace(/\s*<aside class="side">[\s\S]*?<\/aside>/, "");
  html = html.replace(/\s*<header class="top">[\s\S]*?<\/header>/, "");
  html = html.replace(/\s*<section class="hero"[\s\S]*?<\/section>/, "");
  html = html.replace(/\s*<section class="section" id="library">[\s\S]*?<\/section>/, "");
  html = html.replace(/\s*<section class="section" id="record">[\s\S]*?<\/section>/, "");
  html = html.replace(/\s*<p class="footer">[\s\S]*?<\/p>/, "");
  html = html.replace(/\s*<a class="child-adult"[\s\S]*?<\/a>/, "");
  html = html.replace(/\s*<section class="card pdf-card">[\s\S]*?<\/section>/, "");
  html = html.replace(/https:\/\/drive\.google\.com[^"'\s<]*/g, "#");
  html = html.replace(/<title>[^<]*<\/title>/, "<title>閱光｜小朋友閱讀</title>");
  html = html.replace(
    '<script src="minimax-reader.js"></script>',
    '<script src="minimax-child-reader.js?v=20260831-3"></script>'
  );
  return html;
}

function copyFile(source, destination, kind) {
  const sourcePath = resolveInsideRoot(source);
  const destinationPath = path.resolve(publicRoot, destination);
  if (destinationPath !== publicRoot && !destinationPath.startsWith(`${publicRoot}${path.sep}`)) throw new Error(`destination escapes public root: ${destination}`);
  if (!fs.existsSync(sourcePath)) throw new Error(`allowlisted source not found: ${source}`);
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  const contents = fs.readFileSync(sourcePath);
  fs.writeFileSync(destinationPath, kind === "child-html" ? sanitiseChildHtml(contents.toString("utf8")) : contents);
}

fs.rmSync(publicRoot, { recursive: true, force: true });
fs.mkdirSync(publicRoot, { recursive: true });
for (const entry of manifest.entries || []) {
  const sourcePath = resolveInsideRoot(entry.source);
  if (entry.kind === "directory") {
    if (!fs.statSync(sourcePath).isDirectory()) throw new Error(`allowlisted directory is not a directory: ${entry.source}`);
    fs.cpSync(sourcePath, path.resolve(publicRoot, entry.destination), { recursive: true });
  } else {
    copyFile(entry.source, entry.destination, entry.kind);
  }
}
fs.writeFileSync(path.join(publicRoot, ".nojekyll"), "");
console.log(`Public child site written: ${publicRoot}`);
