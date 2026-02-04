/**
 * Smart Swap Icon Generator
 * Generates all required app icons and splash screen assets
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../assets/images');

// Brand colors
const COLORS = {
  purple: '#9945FF',
  green: '#14F195',
  dark: '#0D0D0D',
  darkCard: '#1A1A1A',
};

// Create SVG for the main icon (lightning bolt in circle)
function createIconSvg(size, options = {}) {
  const { background = true, foregroundOnly = false, monochrome = false } = options;

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.4;

  // Lightning bolt path (scaled to size)
  const scale = size / 1024;
  const boltPath = `
    M ${512 * scale} ${180 * scale}
    L ${380 * scale} ${480 * scale}
    L ${480 * scale} ${480 * scale}
    L ${400 * scale} ${844 * scale}
    L ${644 * scale} ${450 * scale}
    L ${544 * scale} ${450 * scale}
    L ${624 * scale} ${180 * scale}
    Z
  `.trim();

  if (monochrome) {
    return `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="transparent"/>
        <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="white"/>
        <path d="${boltPath}" fill="black"/>
      </svg>
    `;
  }

  if (foregroundOnly) {
    // For adaptive icon foreground - just the bolt with padding
    return `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="boltGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${COLORS.purple};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${COLORS.green};stop-opacity:1" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="${4 * scale}" stdDeviation="${8 * scale}" flood-color="black" flood-opacity="0.3"/>
          </filter>
        </defs>
        <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="url(#boltGradient)" filter="url(#shadow)"/>
        <path d="${boltPath}" fill="white"/>
      </svg>
    `;
  }

  // Full icon with background
  const bgGradient = background ? `
    <defs>
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#1A1A1A;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#0D0D0D;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="boltGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${COLORS.purple};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${COLORS.green};stop-opacity:1" />
      </linearGradient>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="${20 * scale}" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#bgGradient)"/>
  ` : '';

  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      ${bgGradient}
      ${!background ? `
        <defs>
          <linearGradient id="boltGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${COLORS.purple};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${COLORS.green};stop-opacity:1" />
          </linearGradient>
        </defs>
      ` : ''}
      <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="url(#boltGradient)" ${background ? 'filter="url(#glow)"' : ''}/>
      <path d="${boltPath}" fill="white"/>
    </svg>
  `;
}

// Create splash screen SVG
function createSplashSvg(width, height) {
  const iconSize = Math.min(width, height) * 0.3;
  const centerX = width / 2;
  const centerY = height / 2;
  const scale = iconSize / 1024;

  const boltPath = `
    M ${centerX} ${centerY - iconSize * 0.32}
    L ${centerX - iconSize * 0.13} ${centerY - iconSize * 0.02}
    L ${centerX - iconSize * 0.03} ${centerY - iconSize * 0.02}
    L ${centerX - iconSize * 0.11} ${centerY + iconSize * 0.33}
    L ${centerX + iconSize * 0.13} ${centerY - iconSize * 0.07}
    L ${centerX + iconSize * 0.03} ${centerY - iconSize * 0.07}
    L ${centerX + iconSize * 0.11} ${centerY - iconSize * 0.32}
    Z
  `.trim();

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0D0D0D;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#1A1A1A;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0D0D0D;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${COLORS.purple};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${COLORS.green};stop-opacity:1" />
        </linearGradient>
        <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="30" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <radialGradient id="orbPurple" cx="20%" cy="20%" r="50%">
          <stop offset="0%" style="stop-color:${COLORS.purple};stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:${COLORS.purple};stop-opacity:0" />
        </radialGradient>
        <radialGradient id="orbGreen" cx="80%" cy="80%" r="50%">
          <stop offset="0%" style="stop-color:${COLORS.green};stop-opacity:0.2" />
          <stop offset="100%" style="stop-color:${COLORS.green};stop-opacity:0" />
        </radialGradient>
      </defs>

      <!-- Background -->
      <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>

      <!-- Decorative orbs -->
      <ellipse cx="${width * 0.2}" cy="${height * 0.3}" rx="${width * 0.5}" ry="${height * 0.4}" fill="url(#orbPurple)"/>
      <ellipse cx="${width * 0.8}" cy="${height * 0.7}" rx="${width * 0.5}" ry="${height * 0.4}" fill="url(#orbGreen)"/>

      <!-- Icon circle -->
      <circle cx="${centerX}" cy="${centerY}" r="${iconSize * 0.4}" fill="url(#iconGradient)" filter="url(#glow)"/>

      <!-- Lightning bolt -->
      <path d="${boltPath}" fill="white"/>

      <!-- App name -->
      <text x="${centerX}" y="${centerY + iconSize * 0.6}"
            font-family="system-ui, -apple-system, sans-serif"
            font-size="${iconSize * 0.15}"
            font-weight="bold"
            fill="white"
            text-anchor="middle">
        Smart Swap
      </text>
      <text x="${centerX}" y="${centerY + iconSize * 0.75}"
            font-family="system-ui, -apple-system, sans-serif"
            font-size="${iconSize * 0.08}"
            fill="#888888"
            text-anchor="middle">
        Powered by Jupiter
      </text>
    </svg>
  `;
}

// Create adaptive icon background (solid gradient)
function createAdaptiveBackgroundSvg(size) {
  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1A1A1A;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0D0D0D;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#bgGrad)"/>
    </svg>
  `;
}

async function generateIcon(svg, outputPath, width, height = width) {
  const buffer = Buffer.from(svg);
  await sharp(buffer)
    .resize(width, height)
    .png()
    .toFile(outputPath);
  console.log(`Generated: ${path.basename(outputPath)}`);
}

async function main() {
  console.log('Generating Smart Swap icons...\n');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 1. Main app icon (1024x1024)
  await generateIcon(
    createIconSvg(1024),
    path.join(OUTPUT_DIR, 'icon.png'),
    1024
  );

  // 2. Android adaptive icon foreground (1024x1024 with safe zone)
  await generateIcon(
    createIconSvg(1024, { foregroundOnly: true }),
    path.join(OUTPUT_DIR, 'android-icon-foreground.png'),
    1024
  );

  // 3. Android adaptive icon background
  await generateIcon(
    createAdaptiveBackgroundSvg(1024),
    path.join(OUTPUT_DIR, 'android-icon-background.png'),
    1024
  );

  // 4. Monochrome icon for Android 13+
  await generateIcon(
    createIconSvg(1024, { monochrome: true }),
    path.join(OUTPUT_DIR, 'android-icon-monochrome.png'),
    1024
  );

  // 5. Splash icon (centered, will be shown on splash background)
  await generateIcon(
    createIconSvg(512, { foregroundOnly: true }),
    path.join(OUTPUT_DIR, 'splash-icon.png'),
    512
  );

  // 6. Full splash screen (for reference/web)
  await generateIcon(
    createSplashSvg(1284, 2778),
    path.join(OUTPUT_DIR, 'splash-full.png'),
    1284,
    2778
  );

  // 7. Favicon for web
  await generateIcon(
    createIconSvg(64),
    path.join(OUTPUT_DIR, 'favicon.png'),
    64
  );

  console.log('\n✓ All icons generated successfully!');
  console.log(`\nOutput directory: ${OUTPUT_DIR}`);
}

main().catch(console.error);
