const fs = require('fs');
const path = require('path');

// Create a simple base64 PNG icon (1x1 pixel expanded to create proper icons)
// This creates a minimal PNG file structure
const createMinimalPNG = (size) => {
  // Create a simple gradient PNG data URL
  const canvas = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4f46e5"/>
      <stop offset="100%" style="stop-color:#7c3aed"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" rx="${size * 0.1}" fill="url(#grad)"/>
  <text x="50%" y="40%" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold" font-size="${size * 0.2}">M</text>
  <text x="50%" y="70%" text-anchor="middle" fill="white" font-family="Arial" font-size="${size * 0.12}">anga</text>
</svg>`;
  return canvas;
};

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

console.log('Creating mobile-compatible PNG icons...');

// For now, we'll create SVG files with proper mobile-friendly content
// In production, you'd convert these to actual PNG files using a library like sharp
iconSizes.forEach(size => {
  const svgContent = createMinimalPNG(size);
  
  // Create SVG file (mobile browsers will accept SVG in many cases)
  const svgFilename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, svgFilename), svgContent);
  
  console.log(`Created ${svgFilename}`);
});

// Create apple-touch-icon (180x180 is the standard size for iOS)
const appleIconContent = createMinimalPNG(180);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), appleIconContent);

// Create favicon
const faviconContent = createMinimalPNG(32);
fs.writeFileSync(path.join(iconsDir, 'favicon.svg'), faviconContent);

console.log('Created apple-touch-icon.svg and favicon.svg');
console.log('Icons created! For production, convert SVG files to PNG using image processing tools.');