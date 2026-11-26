# Daily Diary Android app

This Capacitor wrapper packages the existing `daily-diary-urdu.html` without changing the original source file. Its Android WebView entry point is `www/index.html`. Chart.js is bundled at `www/assets/chart.umd.js`; the Google Sheets Apps Script URL and the app's existing POST plus GET/JSONP logic are retained in the copied page. Google Sheets features still need an internet connection.

## Requirements

- Node.js 22 or newer and npm
- Android Studio with Android SDK Platform 36 and Build Tools 36.1.0
- JDK 21 or 23 (JDK 23 is installed on the current workstation)
- An Android phone with USB debugging enabled, or an Android Studio emulator

## Open and run

From PowerShell in this project folder:

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-23'
npm install
npm run android:sync
npm run android:open
```

In Android Studio, wait for Gradle sync, then choose a phone/emulator and press **Run**. Or with a connected device/emulator:

```powershell
npm run android:run
```

## Build and install a debug APK

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-23'
npm run android:build:debug
& "$env:ANDROID_HOME\platform-tools\adb.exe" install -r .\android\app\build\outputs\apk\debug\app-debug.apk
```

The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.

### If the Gradle download times out

The Wrapper must reach Gradle's distribution host once. If that host is blocked on your network, download `gradle-8.14.3-bin.zip` in a browser from the official [Gradle distribution host](https://downloads.gradle.org/distributions/gradle-8.14.3-bin.zip), then verify it before extracting:

```powershell
$zip = "$env:USERPROFILE\Downloads\gradle-8.14.3-bin.zip"
Get-FileHash $zip -Algorithm SHA256
# Expected: bd71102213493060956ec229d946beee57158dbd89d0e62b91bca0fa2c5f3531
Expand-Archive $zip -DestinationPath 'D:\Gradle' -Force
& 'D:\Gradle\gradle-8.14.3\bin\gradle.bat' -p .\android assembleDebug
```

This invokes the verified local Gradle distribution directly, bypassing only the Wrapper's blocked download. Gradle still needs access to Google's and Maven Central's Android build dependencies. If the browser download is also blocked, allow the official Gradle distribution host through your firewall/proxy or ask your network administrator for an approved Gradle mirror.

## Build a signed release APK

Create and securely back up a signing key once. Keep the keystore and passwords private; the repository ignores `.jks` and `.keystore` files.

```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-23'
& "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -v -keystore .\daily-diary-release.jks -alias daily-diary -keyalg RSA -keysize 2048 -validity 10000
```

For each signed release build, set the following variables in the same PowerShell session, then build:

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:DAILY_DIARY_KEYSTORE = (Resolve-Path .\daily-diary-release.jks).Path
$env:DAILY_DIARY_STORE_PASSWORD = Read-Host 'Keystore password'
$env:DAILY_DIARY_KEY_ALIAS = 'daily-diary'
$env:DAILY_DIARY_KEY_PASSWORD = Read-Host 'Key password'
npm run android:build:release
```

The signed APK is written to `android/app/build/outputs/apk/release/app-release.apk`. If signing variables are not set, Gradle can produce only an unsigned release APK; it will reject a partially configured signing environment.

## Updating the web app

The original HTML stays at the project root. After intentionally updating it, copy it to `www/index.html`, reapply the two packaging-only changes if needed (the local Chart.js script and `native-bridge.js` include), and run:

```powershell
npm run android:sync
```

The native bridge handles Android back navigation, status bar styling and sharing generated diary images. Launcher art and splash resources can be regenerated with `assets/generate-android-art.ps1`.
