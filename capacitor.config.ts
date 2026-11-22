import type { CapacitorConfig } from '@capacitor/cli';

// The iPhone app opens the live web version of First Week, because snippets and
// scoring run on the server. Set FIRST_WEEK_WEB_URL to the deployed https link
// before `npx cap sync ios`. Without it, the app shows the offline page in native-shell/.
const webUrl = process.env.FIRST_WEEK_WEB_URL?.trim();
if (webUrl && !/^https:\/\/[^/\s]+\/?$/.test(webUrl)) {
  throw new Error('FIRST_WEEK_WEB_URL must be an https origin, for example https://first-week.example.workers.dev');
}

const config: CapacitorConfig = {
  appId: 'com.playfirstweek.app',
  appName: 'First Week',
  webDir: 'native-shell',
  ios: {
    contentInset: 'never',
    backgroundColor: '#0a0a0f',
  },
  ...(webUrl ? { server: { url: webUrl.replace(/\/$/, ''), cleartext: false } } : {}),
};

export default config;
