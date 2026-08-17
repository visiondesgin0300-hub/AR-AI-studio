# Building Refeeq as an Android application

Refeeq is written as a web application, and this directory turns that same
codebase into a real Android application: an `android/` Gradle project that the
**Android SDK** compiles into an installable `.apk` (or an `.aab` for the Play
Store). Nothing is rewritten — the screens, the AR views and the camera
features are the ones in `src/`, packaged into the application and loaded from
the device.

## What the Android SDK is used for

| Step | Tool | Output |
| --- | --- | --- |
| Bundle the interface | Vite | `dist/` |
| Copy it into the native project | Capacitor | `android/app/src/main/assets/public` |
| Compile the application | Android SDK build-tools + Gradle | `app-debug.apk` |
| Install and test on a device | Android SDK platform-tools (`adb`) | the app running on the phone |

## One-time setup

1. Install a JDK (17 or newer) and Android Studio, which brings the Android SDK
   with it. Alternatively install the command-line tools and then the platform
   and build-tools packages with `sdkmanager`.
2. Point the build at the SDK, either by setting `ANDROID_HOME` or by writing
   `android/local.properties`:

   ```properties
   sdk.dir=/path/to/Android/sdk
   ```

   That file is deliberately not committed: it names a path on one machine.

## Where /api goes

On the web, the screens and the `/api` endpoints are served by the same Express
process, so a relative path resolves on its own. In the Android package the
screens are loaded from the device, so `/api` has to be told where the server
is. Set it at build time:

```bash
VITE_API_BASE=https://refeeq.example.edu npm run android:sync
```

`src/lib/apiBase.ts` rewrites every relative `/api/...` request to that origin
once, at start-up, so no screen needs to know how the app was packaged. Leave
the variable unset for the ordinary web build.

## Build

```bash
# bundle the web app and copy it into the native project
VITE_API_BASE=https://refeeq.example.edu npm run android:sync

# open the project in Android Studio and press Run
npm run android:open

# or build the debug package from the command line
npm run android:apk
# → android/app/build/outputs/apk/debug/app-debug.apk
```

Install it on a connected phone with `adb install -r app-debug.apk`.

## Camera permission

`AndroidManifest.xml` declares `android.permission.CAMERA` and requires a
camera device. The runtime prompt is raised by Capacitor's WebView bridge the
first time a screen calls `getUserMedia`, so the cover-scanning and AR views
ask for the camera at the moment they are opened rather than at install.

## Two things to know before choosing this route

**The WebView is not Chrome.** Everything the prototype does with the camera
through `getUserMedia` — cover recognition, the marker views, the AR floor view
— works inside the Android WebView. The `immersive-ar` WebXR session does not:
WebXR AR is a Chrome feature backed by ARCore and is not available to a WebView.
If a full WebXR session is required, package the app as a **Trusted Web
Activity** instead: Bubblewrap generates an Android project (also built with
the Android SDK) that opens the site in Chrome itself, keeping WebXR and ARCore.
That route needs a public HTTPS domain and a Digital Asset Links file, which is
why Capacitor is the default here.

**Change `appId` before release.** `capacitor.config.ts` currently declares
`com.refeeq.arlibrary`. An application published under an identifier the
institution does not own cannot later be moved to one it does.
