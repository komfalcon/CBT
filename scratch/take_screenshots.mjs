import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('scratch/screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();

  const configs = [
    { url: 'http://localhost:5173/', name: 'landing', width: 1440, height: 900, isMobile: false },
    { url: 'http://localhost:5173/', name: 'landing', width: 390, height: 844, isMobile: true },
    { url: 'http://localhost:5173/register', name: 'register', width: 1440, height: 900, isMobile: false },
    { url: 'http://localhost:5173/register', name: 'register', width: 390, height: 844, isMobile: true },
  ];

  for (const cfg of configs) {
    for (const theme of ['light', 'dark']) {
      await page.setViewport({
        width: cfg.width,
        height: cfg.height,
        isMobile: cfg.isMobile,
        deviceScaleFactor: 2,
      });

      // Emulate media feature
      await page.emulateMediaFeatures([
        { name: 'prefers-color-scheme', value: theme }
      ]);

      await page.goto(cfg.url, { waitUntil: 'networkidle0' });

      // Apply theme via localStorage and classList directly on page
      await page.evaluate((th) => {
        localStorage.setItem('aurikrex-ui-theme', th);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(th);
        document.documentElement.setAttribute('data-theme', th);
      }, theme);

      // Wait a tick for any transitions
      await new Promise((r) => setTimeout(r, 400));

      const filename = `${cfg.name}_${cfg.width}px_${theme}.png`;
      const fullPath = path.join(outDir, filename);

      await page.screenshot({
        path: fullPath,
        fullPage: true,
      });

      console.log(`Saved screenshot: ${filename}`);
    }
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
