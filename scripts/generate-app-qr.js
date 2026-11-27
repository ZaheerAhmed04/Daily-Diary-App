const path = require("node:path");
const QRCode = require("qrcode");

const downloadUrl = "https://dailydairyapp.netlify.app/daily-diary.apk";
const outputPath = path.join(__dirname, "..", "www", "assets", "app-download-qr.png");

QRCode.toFile(outputPath, downloadUrl, {
  errorCorrectionLevel: "H",
  margin: 2,
  width: 360,
  color: {
    dark: "#0e2a2f",
    light: "#ffffff"
  }
}).catch((error) => {
  console.error("Could not generate the app download QR code:", error);
  process.exitCode = 1;
});
