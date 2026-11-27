const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const androidRoot = path.join(root, "android");
const releaseApk = path.join(androidRoot, "app", "build", "outputs", "apk", "release", "app-release.apk");
const targetDirectory = path.join(root, "downloads");
const targetApk = path.join(targetDirectory, "daily-diary.apk");
const signingProperties = path.join(androidRoot, "keystore.properties");
const hasEnvironmentSigning = [
  process.env.DAILY_DIARY_KEYSTORE,
  process.env.DAILY_DIARY_STORE_PASSWORD,
  process.env.DAILY_DIARY_KEY_ALIAS,
  process.env.DAILY_DIARY_KEY_PASSWORD
].every((value) => value && value.trim());

if (!fs.existsSync(signingProperties) && !hasEnvironmentSigning) {
  throw new Error("A release signing key is required; configure android/keystore.properties before publishing.");
}
if (!fs.existsSync(releaseApk)) {
  throw new Error("Release APK was not created: " + releaseApk);
}

const sdkRoot = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
if (!sdkRoot) {
  throw new Error("ANDROID_HOME or ANDROID_SDK_ROOT must point to the Android SDK.");
}
const buildToolsRoot = path.join(sdkRoot, "build-tools");
const buildTools = fs.readdirSync(buildToolsRoot)
  .filter((name) => fs.statSync(path.join(buildToolsRoot, name)).isDirectory())
  .sort()
  .pop();
if (!buildTools) {
  throw new Error("Android SDK Build Tools are not installed.");
}
const apksignerJar = path.join(buildToolsRoot, buildTools, "lib", "apksigner.jar");
if (!fs.existsSync(apksignerJar)) {
  throw new Error("Android SDK APK signature verifier is missing: " + apksignerJar);
}
const java = process.env.JAVA_HOME
  ? path.join(process.env.JAVA_HOME, "bin", process.platform === "win32" ? "java.exe" : "java")
  : "java";
const verification = spawnSync(java, ["-jar", apksignerJar, "verify", releaseApk], {
  encoding: "utf8",
  stdio: "inherit"
});
if (verification.error) {
  throw verification.error;
}
if (verification.status !== 0) {
  throw new Error("Release APK signature verification failed; APK was not published.");
}

fs.mkdirSync(targetDirectory, { recursive: true });
fs.copyFileSync(releaseApk, targetApk);
console.log("Published signed APK to downloads/daily-diary.apk");
