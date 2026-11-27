const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const webSource = path.join(root, "www");
const apkSource = path.join(root, "downloads", "daily-diary.apk");
const output = path.join(root, "dist");

if (!fs.existsSync(apkSource)) {
  throw new Error("Missing downloads/daily-diary.apk; publish a signed APK before deploying.");
}

fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(webSource, output, { recursive: true });
fs.copyFileSync(apkSource, path.join(output, "daily-diary.apk"));
