const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const createSVGIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" rx="${size * 0.1}" fill="url(#gradient)"/>
  <text x="50%" y="35%" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold" font-size="${size * 0.15}">M</text>
  <text x="50%" y="65%" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold" font-size="${size * 0.08}">Manga</text>
</svg>
`;

// Create PNG using Canvas (simplified - you'd normally use a proper image library)
const createSimpleIcon = (size) => {
  const svg = createSVGIcon(size);
  return svg;
};

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Generating PWA icons...');

iconSizes.forEach(size => {
  const svg = createSimpleIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`Created ${filename}`);
});

// Also create apple-touch-icon
const appleIcon = createSimpleIcon(180);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), appleIcon);

console.log('Icon generation complete!');
console.log('Note: For production, convert SVGs to PNG using an image processing tool.');