import type { CapacitorConfig } from '@capacitor/cli';

const role = process.env.NEXT_PUBLIC_APP_ROLE || 'student';
const roleName = role.charAt(0).toUpperCase() + role.slice(1);

const config: CapacitorConfig = {
  appId: `com.mk.academy.${role}`,
  appName: `MK Academy ${roleName}`,
  webDir: 'out',
  android: {
    allowMixedContent: true,
  },
  server: {
    androidScheme: 'https',
    cleartext: true,
  }
};

export default config;
