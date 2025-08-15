import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.fgh.eptsclinicalsummary',
  appName: 'SESP Clinical Summary',
  webDir: 'src-capacitor/www',
  server: {
    androidScheme: 'http',
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
  
};

export default config;
