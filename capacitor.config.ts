import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ph.ireside.mobile',
  appName: 'iReside',
  webDir: 'mobile/www',
  server: {
    url: 'https://i-reside-capstone.vercel.app/mobile',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
