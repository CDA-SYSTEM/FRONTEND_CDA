import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cda.putumayo.frontend',
  appName: 'Frontend CDA Putumayo',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#155DFC',
      showSpinner: false,
    },
  },
};

export default config;
