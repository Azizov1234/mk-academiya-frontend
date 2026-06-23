import {
  DEFAULT_CENTER_BRANDING,
  normalizeCenterBranding,
} from '@/lib/branding';

export async function getServerCenterBranding() {
  return normalizeCenterBranding(DEFAULT_CENTER_BRANDING);
}
