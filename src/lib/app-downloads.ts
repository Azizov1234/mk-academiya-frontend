const GITHUB_REPOSITORY =
  process.env.NEXT_PUBLIC_GITHUB_REPOSITORY || 'Moxirbek236/mk-academy-dev';
const MOBILE_RELEASE_TAG =
  process.env.NEXT_PUBLIC_MOBILE_RELEASE_TAG || 'frontend-mobile-latest';

function releaseAssetUrl(assetName: string) {
  return `https://github.com/${GITHUB_REPOSITORY}/releases/download/${MOBILE_RELEASE_TAG}/${assetName}`;
}

function iosInstallUrl(manifestUrl: string) {
  return `itms-services://?action=download-manifest&url=${encodeURIComponent(manifestUrl)}`;
}

const iosManifestUrl = releaseAssetUrl('MK_Academy_iOS.plist');

export const APP_DOWNLOADS = {
  releaseUrl: `https://github.com/${GITHUB_REPOSITORY}/releases/tag/${MOBILE_RELEASE_TAG}`,
  android: {
    fileName: 'MK_Academy_Android.apk',
    url: releaseAssetUrl('MK_Academy_Android.apk'),
  },
  ios: {
    fileName: 'MK_Academy_iOS.ipa',
    manifestFileName: 'MK_Academy_iOS.plist',
    url: iosInstallUrl(iosManifestUrl),
    directUrl: releaseAssetUrl('MK_Academy_iOS.ipa'),
    manifestUrl: iosManifestUrl,
  },
};
