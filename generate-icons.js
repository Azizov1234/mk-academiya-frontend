const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, 'public');

// SVG source - MK Academy icon
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="80" fill="#3D855A"/>
  <text x="256" y="310" font-family="Arial, sans-serif" font-size="220" font-weight="bold" fill="white" text-anchor="middle">MK</text>
</svg>
`;

// Maskable SVG - subject is within the safe zone (center 80%)
const svgMaskable = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#3D855A"/>
  <text x="256" y="310" font-family="Arial, sans-serif" font-size="200" font-weight="bold" fill="white" text-anchor="middle">MK</text>
</svg>
`;

async function generateIcons() {
  const svgBuffer = Buffer.from(svg);
  const maskableBuffer = Buffer.from(svgMaskable);

  // any icons
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✓ icon-192.png');

  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✓ icon-512.png');

  // maskable icons
  await sharp(maskableBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192-maskable.png'));
  console.log('✓ icon-192-maskable.png');

  await sharp(maskableBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512-maskable.png'));
  console.log('✓ icon-512-maskable.png');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
