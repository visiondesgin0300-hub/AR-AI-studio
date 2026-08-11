import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Packages the built web application as a native Android application.
 *
 * The screens are bundled into the package and loaded from the device, so the
 * interface opens without a network round trip; the /api calls are sent to the
 * server named by VITE_API_BASE at build time (see src/lib/apiBase.ts).
 *
 * appId is the identifier the app is published under. Change it to a domain
 * the university controls before any release build.
 */
const config: CapacitorConfig = {
  appId: 'com.refeeq.arlibrary',
  appName: 'Refeeq',
  webDir: 'dist',
  android: {
    // The camera features need a secure context; https://localhost provides one.
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
