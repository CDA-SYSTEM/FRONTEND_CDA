import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cda.putumayo.frontend',
  appName: 'Frontend CDA Putumayo',
  webDir: 'dist',
  server: {
    // Usar http en Android para backend via Tailscale
    androidScheme: 'http',
    // Permitir contenido mixto HTTP/HTTPS en el WebView
    allowNavigation: ['100.94.204.56', 'api-cda.ilesandres.online'],
  },
  android: {
    allowMixedContent: true,
  },
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

