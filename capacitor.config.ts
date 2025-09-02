import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.myapp',
  appName: 'MyNextMobileApp',
  webDir: 'out', // can be empty if you’re using hosted server
  server: {
    url: 'https:///bubble-migration-feasibility-web.vercel.app',
    cleartext: true,
  },
};

export default config;
