/* Native-only helpers. The source diary HTML remains unchanged. */
(function () {
  const cap = window.Capacitor;
  if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) return;

  const plugins = cap.Plugins || {};
  const app = plugins.App;
  const statusBar = plugins.StatusBar;
  const splash = plugins.SplashScreen;

  if (statusBar) {
    statusBar.setBackgroundColor({ color: "#0e2a2f" }).catch(() => {});
    statusBar.setStyle({ style: "LIGHT" }).catch(() => {});
  }
  if (splash) splash.hide({ fadeOutDuration: 300 }).catch(() => {});

  if (app) {
    app.addListener("backButton", ({ canGoBack }) => {
      const stats = document.getElementById("statsView");
      const details = document.getElementById("personDetails");
      const diaryTab = document.getElementById("diaryTab");
      if (stats && !stats.hidden && details && !details.hidden) {
        const personFilter = document.getElementById("personFilter");
        if (personFilter) {
          personFilter.value = "";
          personFilter.dispatchEvent(new Event("change", { bubbles: true }));
        }
        return;
      }
      if (stats && !stats.hidden && diaryTab) {
        diaryTab.click();
        return;
      }
      if (canGoBack) window.history.back();
      else app.exitApp();
    });
  }

  // Use native file sharing on Android, where WebView download links for a
  // generated canvas image are not consistently handled by DownloadManager.
  const makeImageButton = document.getElementById("mk");
  const fileSystem = plugins.Filesystem;
  const share = plugins.Share;
  if (makeImageButton && fileSystem && share) {
    makeImageButton.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      try {
        if (typeof window.check === "function" && !window.check()) return;
        const canvas = await window.draw();
        canvas.toBlob(async (blob) => {
          if (!blob) {
            if (window.msg) window.msg("تصویر تیار نہیں ہو سکی۔");
            return;
          }
          try {
            const bytes = new Uint8Array(await blob.arrayBuffer());
            let binary = "";
            for (let i = 0; i < bytes.length; i += 0x8000) {
              binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
            }
            const day = document.getElementById("day")?.value || "diary";
            const saved = await fileSystem.writeFile({
              path: `diary-day-${day}.png`,
              data: btoa(binary),
              directory: "CACHE",
              recursive: true
            });
            await share.share({
              title: `Daily Diary - ${day}`,
              text: "Daily Diary app download: https://dailydairyapp.netlify.app/daily-diary.apk",
              files: [saved.uri],
              dialogTitle: "Share diary image"
            });
          } catch (error) {
            if (window.msg) window.msg("تصویر شیئر نہیں ہو سکی۔ دوبارہ کوشش کریں۔");
          }
        }, "image/png");
      } catch (error) {
        if (window.msg) window.msg("تصویر تیار نہیں ہو سکی۔ دوبارہ کوشش کریں۔");
      }
    }, true);
  }
})();
