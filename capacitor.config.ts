import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.85c3a3f9d0894fa5816957a08377fee8',
  appName: 'Automated Pillbox',
  webDir: 'dist',
  server: {
    // Remove URL for production - app will use local files for better performance
    // url: 'https://85c3a3f9-d089-4fa5-8169-57a08377fee8.lovableproject.com?forceHideBadge=true',
    cleartext: true,
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true // Allow HTTP requests to ESP32 on local network
  }
};

export default config;
