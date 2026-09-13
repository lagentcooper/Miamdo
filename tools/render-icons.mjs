// Rend les icônes PNG de l'app à partir du SVG source (Chromium via Playwright).
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';

const svg = readFileSync(new URL('./icon.svg', import.meta.url), 'utf8');
const browser = await chromium.launch();

async function shot(markup, size, out) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(
    `<body style="margin:0;width:${size}px;height:${size}px;overflow:hidden">${markup}</body>`
  );
  const buf = await page.locator('svg').screenshot({ omitBackground: true });
  writeFileSync(out, buf);
  await page.close();
  console.log('→', out, size + 'px');
}

const sized = (s, size) => s.replace('width="512" height="512"', `width="${size}" height="${size}"`);

// icône standard (coins arrondis)
for (const size of [192, 512]) {
  await shot(sized(svg, size), size, new URL(`../assets/icons/icon-${size}.png`, import.meta.url).pathname);
}
// apple-touch-icon : fond plein, coins gérés par iOS
const apple = sized(svg.replace('rx="114"', 'rx="0"'), 180);
await shot(apple, 180, new URL('../assets/icons/apple-touch-icon.png', import.meta.url).pathname);

// maskable : contenu réduit à 72 % dans la zone de sécurité
const maskable = sized(
  svg.replace('rx="114"', 'rx="0"')
     .replace('<g fill="none"', '<g transform="translate(256 256) scale(0.72) translate(-256 -256)" fill="none"')
     .replace('<g fill="#fff">', '<g transform="translate(256 256) scale(0.72) translate(-256 -256)" fill="#fff">'),
  512
);
await shot(maskable, 512, new URL('../assets/icons/icon-maskable-512.png', import.meta.url).pathname);

await browser.close();
