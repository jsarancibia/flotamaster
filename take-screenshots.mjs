import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, 'public', 'screenshots');

const BASE_URL = 'http://localhost:3000';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  // 1. Navigate to login
  console.log('Navigating to login page...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 2. Fill in credentials and log in
  console.log('Logging in...');
  await page.fill('#email', 'jose@br.com');
  await page.fill('#password', 'rosi2026');
  await page.click('button[type="submit"]');

  // Wait for navigation after login
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  await page.waitForTimeout(3000);

  // 3. Screenshot main dashboard
  console.log('Taking dashboard screenshot...');
  await page.screenshot({
    path: path.join(screenshotsDir, 'dashboard.png'),
    fullPage: true,
  });
  console.log('Saved: dashboard.png');

  // 4. Screenshot each sub-page
  const pages = [
    { url: '/dashboard/vehicles', name: 'vehicles.png' },
    { url: '/dashboard/drivers', name: 'drivers.png' },
    { url: '/dashboard/maintenances', name: 'maintenances.png' },
    { url: '/dashboard/finances', name: 'finances.png' },
  ];

  for (const p of pages) {
    console.log(`Navigating to ${p.url}...`);
    await page.goto(`${BASE_URL}${p.url}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: path.join(screenshotsDir, p.name),
      fullPage: true,
    });
    console.log(`Saved: ${p.name}`);
  }

  await browser.close();
  console.log('\nAll screenshots saved to:', screenshotsDir);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
