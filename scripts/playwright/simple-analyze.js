#!/usr/bin/env node

/**
 * Simple Visual Analysis Script (NO AI REQUIRED)
 * Just takes screenshots and generates basic reports
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:8001';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const VIEWPORTS = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'large-desktop', width: 2560, height: 1440 }
];

const PAGES = [
    { name: 'home', url: '/' },
    { name: 'add-product-modal', url: '/', action: 'open-modal' }
];

// Create screenshots directory
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function takeScreenshot(page, viewport, pageConfig) {
    const timestamp = Date.now();
    const filename = `${pageConfig.name}-${viewport.name}-${timestamp}.png`;
    const filepath = path.join(SCREENSHOTS_DIR, filename);

    await page.screenshot({ path: filepath, fullPage: true, type: 'png' });

    // Basic validation
    const stats = fs.statSync(filepath);
    if (stats.size < 1000) {
        throw new Error(`Screenshot too small: ${stats.size} bytes`);
    }

    return { 
        filename, 
        filepath, 
        viewport, 
        page: pageConfig.name,
        timestamp: new Date(timestamp).toISOString(),
        size: stats.size
    };
}

async function generateScreenshots() {
    console.log('Generating screenshots (NO AI analysis)...\n');

    // Clean up old screenshots
    if (fs.existsSync(SCREENSHOTS_DIR)) {
        const oldScreenshots = fs.readdirSync(SCREENSHOTS_DIR)
            .filter(f => f.endsWith('.png'));
        
        if (oldScreenshots.length > 0) {
            console.log(`Cleaning up ${oldScreenshots.length} old screenshots...`);
            oldScreenshots.forEach(f => fs.unlinkSync(path.join(SCREENSHOTS_DIR, f)));
        }
    }

    // Check server
    try {
        const response = await fetch(BASE_URL);
        if (!response.ok) throw new Error(`Server not responding: ${response.status}`);
        console.log('Server is ready');
    } catch (error) {
        console.error('Server not running! Please start the server first: npm run start');
        process.exit(1);
    }

    const browser = await chromium.launch({ headless: true });
    const allScreenshots = [];

    try {
        for (const pageConfig of PAGES) {
            console.log(`\nCapturing screenshots for: ${pageConfig.name}`);
            
            for (const viewport of VIEWPORTS) {
                let page = null;
                try {
                    page = await browser.newPage();
                    await page.setViewportSize({ width: viewport.width, height: viewport.height });
                    
                    await page.goto(`${BASE_URL}${pageConfig.url}`, {
                        waitUntil: 'networkidle',
                        timeout: 10000
                    });
                    
                    await page.waitForTimeout(2000);

                    if (pageConfig.action === 'open-modal') {
                        try {
                            await page.waitForSelector('button[data-bs-target="#addProductModal"]', { timeout: 5000 });
                            await page.click('button[data-bs-target="#addProductModal"]');
                            await page.waitForSelector('#addProductModal', { timeout: 3000 });
                            await page.waitForTimeout(500);
                            console.log(`  Modal opened for ${viewport.name}`);
                        } catch (error) {
                            console.warn(`  Could not open modal for ${viewport.name}`);
                        }
                    }

                    const screenshot = await takeScreenshot(page, viewport, pageConfig);
                    allScreenshots.push(screenshot);
                    console.log(`  Captured: ${screenshot.filename} (${(screenshot.size / 1024).toFixed(1)}KB)`);
                    
                } catch (error) {
                    console.error(`Error capturing ${pageConfig.name} at ${viewport.name}:`, error.message);
                } finally {
                    if (page) await page.close();
                }
            }
        }

        if (allScreenshots.length === 0) {
            throw new Error('No screenshots were captured');
        }

        // Generate basic report
        const report = {
            generated: new Date().toISOString(),
            total: allScreenshots.length,
            expectedTotal: PAGES.length * VIEWPORTS.length,
            successRate: Math.round((allScreenshots.length / (PAGES.length * VIEWPORTS.length)) * 100),
            screenshots: allScreenshots.map(s => ({
                filename: s.filename,
                page: s.page,
                viewport: s.viewport,
                timestamp: s.timestamp,
                size: s.size,
                sizeKB: Math.round(s.size / 1024)
            })),
            summary: {
                totalSizeKB: Math.round(allScreenshots.reduce((sum, s) => sum + s.size, 0) / 1024),
                averageSizeKB: Math.round(allScreenshots.reduce((sum, s) => sum + s.size, 0) / 1024 / allScreenshots.length),
                pagesCaptured: [...new Set(allScreenshots.map(s => s.page))],
                viewportsCaptured: [...new Set(allScreenshots.map(s => s.viewport))]
            }
        };

        fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'simple-report.json'), JSON.stringify(report, null, 2));
        console.log(`\nSimple analysis complete: ${allScreenshots.length} screenshots captured`);
        console.log(`Report saved: ${path.join(SCREENSHOTS_DIR, 'simple-report.json')}`);

    } finally {
        await browser.close();
    }

    return allScreenshots;
}

if (require.main === module) {
    generateScreenshots()
        .then(() => console.log('\nSimple analysis completed successfully!'))
        .catch(error => {
            console.error('Simple analysis failed:', error);
            process.exit(1);
        });
}

module.exports = { generateScreenshots };
