#!/usr/bin/env node

/**
 * Unified Visual Analysis Script
 * Combines screenshot generation and AI analysis in one workflow
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { callTransformersPipeline, testTransformersPipeline, preDownloadModels } = require('./transformers-inference');

// Load environment variables
require('dotenv').config();

// Configuration
const BASE_URL = 'http://localhost:8001';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const VIEWPORTS = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'large-desktop', width: 2560, height: 1440 }
];

// Pages to screenshot (ordered by priority)
const PAGES = [
    { name: 'home', url: '/' },
    { name: 'add-product-modal', url: '/', action: 'open-modal' }
];

// Transformers.js configuration
const TRANSFORMERS_MODEL = process.env.TRANSFORMERS_MODEL || 'Xenova/vit-gpt2-image-captioning';

// Rate limiting configuration (for delays between screenshots)
const API_DELAY_MS = parseInt(process.env.API_DELAY_MS) || 1000; // Reduced delay for local inference
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES) || 2; // Fewer retries needed for local inference

// Create screenshots directory
if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// ===== SCREENSHOT GENERATION =====

async function takeScreenshot(page, viewport, pageConfig) {
    const timestamp = Date.now();
    const filename = `${pageConfig.name}-${viewport.name}-${timestamp}.png`;
    const filepath = path.join(SCREENSHOTS_DIR, filename);
    
    await page.screenshot({
        path: filepath,
        fullPage: true,
        type: 'png'
    });
    
    // Validate screenshot was created and has reasonable size
    const stats = fs.statSync(filepath);
    if (stats.size < 1000) {
        throw new Error(`Screenshot too small: ${stats.size} bytes`);
    }
    
    return { 
        filename, 
        filepath, 
        viewport, 
        page: pageConfig.name,
        timestamp: new Date(timestamp).toISOString()
    };
}

async function openAddProductModal(page) {
    try {
        // Wait for the page to load and button to be available
        await page.waitForSelector('button[data-bs-target="#addProductModal"]', { 
            timeout: 5000,
            state: 'visible'
        });
        
        // Click the "Add New Product" button
        await page.click('button[data-bs-target="#addProductModal"]');
        
        // Wait for modal to appear and be visible
        await page.waitForSelector('#addProductModal.show, #addProductModal[style*="display: block"]', { 
            timeout: 3000 
        });
        
        // Wait a bit for modal animation
        await page.waitForTimeout(500);
        
        console.log('Add Product modal opened');
        return true;
    } catch (error) {
        console.warn(`Could not open modal: ${error.message}`);
        return false;
    }
}

async function capturePageScreenshots(browser, pageConfig) {
    const screenshots = [];
    let context = null;
    
    try {
        // Create one context for all viewports to improve performance
        context = await browser.newContext();
        
        for (const viewport of VIEWPORTS) {
            let page = null;
            
            try {
                page = await context.newPage();
                // Set viewport for this page
                await page.setViewportSize({ 
                    width: viewport.width, 
                    height: viewport.height 
                });
                
                // Navigate to page
                await page.goto(`${BASE_URL}${pageConfig.url}`, {
                    waitUntil: 'networkidle',
                    timeout: 10000
                });
                
                // Wait for content to load
                await page.waitForTimeout(2000);
                
                // Perform page-specific actions
                if (pageConfig.action === 'open-modal') {
                    const modalOpened = await openAddProductModal(page);
                    if (!modalOpened) {
                        console.warn(`Failed to open modal for ${pageConfig.name} at ${viewport.name}`);
                    }
                }
                
                // Take screenshot
                const screenshot = await takeScreenshot(page, viewport, pageConfig);
                screenshots.push(screenshot);
                console.log(`  Captured: ${screenshot.filename}`);
                
            } catch (error) {
                console.error(`Error capturing ${pageConfig.name} at ${viewport.name}:`, error.message);
                // Continue with next viewport instead of failing completely
                continue;
            } finally {
                if (page) {
                    await page.close();
                }
            }
        }
        
        if (screenshots.length === 0) {
            throw new Error(`No screenshots captured for ${pageConfig.name}`);
        }
        
    } finally {
        if (context) {
            await context.close();
        }
    }
    
    return screenshots;
}

// Server health check with retry logic
async function waitForServer(maxRetries = 5) {
    console.log('Checking server availability...');
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(BASE_URL, { timeout: 5000 });
            if (response.ok) {
                console.log('Server is ready');
                return true;
            }
        } catch (error) {
            console.log(`Server not ready, retrying in 2s... (${i + 1}/${maxRetries})`);
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
    
    throw new Error('Server not responding after multiple attempts. Please start the server first: npm run start');
}

async function generateScreenshots() {
    console.log('Generating fresh screenshots...\n');
    
    // Clean up old screenshots
    if (fs.existsSync(SCREENSHOTS_DIR)) {
        const oldScreenshots = fs.readdirSync(SCREENSHOTS_DIR)
            .filter(f => f.endsWith('.png'));
        
        if (oldScreenshots.length > 0) {
            console.log(`Cleaning up ${oldScreenshots.length} old screenshots...`);
            oldScreenshots.forEach(f => fs.unlinkSync(path.join(SCREENSHOTS_DIR, f)));
        }
    }
    
    // Wait for server to be ready
    await waitForServer();
    
    const browser = await chromium.launch({
        headless: true
    });
    
    const allScreenshots = [];
    
    try {
        for (const pageConfig of PAGES) {
            console.log(`\nCapturing screenshots for: ${pageConfig.name}`);
            const screenshots = await capturePageScreenshots(browser, pageConfig);
            allScreenshots.push(...screenshots);
            console.log(`  ${screenshots.length} screenshots captured`);
        }
        
        if (allScreenshots.length === 0) {
            throw new Error('No screenshots were captured');
        }
        
        // Save metadata with additional statistics
        const metadata = {
            generated: new Date().toISOString(),
            total: allScreenshots.length,
            expectedTotal: PAGES.length * VIEWPORTS.length,
            successRate: Math.round((allScreenshots.length / (PAGES.length * VIEWPORTS.length)) * 100),
            screenshots: allScreenshots.map(s => ({
                filename: s.filename,
                page: s.page,
                viewport: s.viewport,
                timestamp: s.timestamp,
                path: s.filepath
            }))
        };
        
        const metadataPath = path.join(SCREENSHOTS_DIR, 'metadata.json');
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        console.log(`\nScreenshot generation complete: ${allScreenshots.length} screenshots captured`);
        
    } finally {
        await browser.close();
    }
    
    return allScreenshots;
}

// ===== AI ANALYSIS =====

// Test transformers.js pipeline availability
async function testTransformersPipelineAvailability() {
    console.log('Testing transformers.js pipeline availability...');
    try {
        const result = await testTransformersPipeline();
        if (result.success) {
            console.log(`Transformers.js pipeline is available and ready`);
            return true;
                    } else {
            console.log(`Transformers.js pipeline issue: ${result.error}`);
            return false;
                    }
                } catch (error) {
        console.log(`Error testing transformers.js pipeline: ${error.message}`);
        return false;
    }
}

// Call transformers.js pipeline for image analysis
async function callTransformersPipelineForAnalysis(imagePath, modelName = TRANSFORMERS_MODEL) {
    try {
        const result = await callTransformersPipeline(imagePath, modelName);
        return result;
    } catch (error) {
        throw error;
    }
}

function analyzeScreenshot(imagePath, filename, modelName = TRANSFORMERS_MODEL) {
    return new Promise(async (resolve, reject) => {
        let retryCount = 0;
        
        const attemptAnalysis = async () => {
            try {
                console.log(`Analyzing: ${filename}${retryCount > 0 ? ` (attempt ${retryCount + 1})` : ''} using ${modelName}`);
                
                // Call transformers.js pipeline directly with image path
                const aiResult = await callTransformersPipelineForAnalysis(imagePath, modelName);
            
            // Process AI results - use the AI description directly
            const analysis = {
                filename,
                timestamp: new Date().toISOString(),
                aiGenerated: true,
                description: aiResult.caption || 'No description generated',
                confidence: aiResult.confidence || 0,
                issues: [],
                suggestions: ['Analysis provided by Transformers.js local AI pipeline.']
            };
            
            resolve(analysis);
            
            } catch (error) {
                // Handle pipeline initialization errors - no retry, skip immediately
                if (error.message.includes('TRANSFORMERS_INIT_ERROR')) {
                    console.log(`Transformers.js initialization error: ${error.message}`);
                    throw error; // Don't retry, skip this screenshot
                }
                
                // Handle image errors - no retry, skip immediately
                if (error.message.includes('TRANSFORMERS_IMAGE_ERROR')) {
                    console.log(`Transformers.js image error: ${error.message}`);
                    throw error; // Don't retry, skip this screenshot
                }
                
                // Handle inference errors with retry
                if (error.message.includes('TRANSFORMERS_INFERENCE_ERROR') && retryCount < MAX_RETRIES) {
                    retryCount++;
                    const delay = 2000; // 2 seconds for transformers.js inference issues
                    console.log(`Transformers.js inference error. Retrying in ${delay}ms... (attempt ${retryCount}/${MAX_RETRIES})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return attemptAnalysis();
                }
                
                // All other errors - no retry, skip analysis
                console.warn(`Transformers.js analysis failed for ${filename}: ${error.message}`);
                console.warn('Skipping analysis for this screenshot...');
                reject(error);
        }
        };
        
        await attemptAnalysis();
    });
}

function getScreenshotFiles() {
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
        return [];
    }
    
    const files = fs.readdirSync(SCREENSHOTS_DIR)
        .filter(file => file.endsWith('.png'))
        .map(file => path.join(SCREENSHOTS_DIR, file));
    
    return files;
}

function generateReport(analyses) {
    // Group analyses by viewport
    const analysesByViewport = {};
    analyses.forEach(analysis => {
        const filename = analysis.filename;
        const parts = filename.split('-');
        const viewport = parts[1]; // Extract viewport from filename
        
        if (!analysesByViewport[viewport]) {
            analysesByViewport[viewport] = [];
        }
        analysesByViewport[viewport].push(analysis);
    });
    
    const report = {
        generated: new Date().toISOString(),
        totalScreenshots: analyses.length,
        aiAnalyzed: analyses.filter(a => a.aiGenerated).length,
        totalIssues: analyses.reduce((sum, a) => sum + a.issues.length, 0),
        analyses: analyses,
        analysesByViewport: analysesByViewport,
        availableViewports: Object.keys(analysesByViewport)
    };
    
    // Group issues by type
    const issuesByType = {};
    analyses.forEach(analysis => {
        analysis.issues.forEach(issue => {
            if (!issuesByType[issue.type]) {
                issuesByType[issue.type] = [];
            }
            issuesByType[issue.type].push({
                filename: analysis.filename,
                message: issue.message,
                confidence: issue.confidence
            });
        });
    });
    
    report.issuesByType = issuesByType;
    
    return report;
}

// ===== HTML REPORT GENERATION =====

function generateHTMLReport(report) {
    return new Promise(async (resolve) => {
        try {
            const htmlPath = path.join(SCREENSHOTS_DIR, 'analysis-report.html');
            const templatePath = path.join(__dirname, 'template.html');
            
            // Read template file
            let html = fs.readFileSync(templatePath, 'utf8');
            
            // Replace template variables
            html = html.replace('{{GENERATED_DATE}}', new Date(report.generated).toLocaleString());
            html = html.replace('{{TOTAL_SCREENSHOTS}}', report.totalScreenshots);
            html = html.replace('{{AI_ANALYZED}}', report.aiAnalyzed);
            html = html.replace('{{TOTAL_ISSUES}}', report.totalIssues);
            html = html.replace('{{MODEL_USED}}', TRANSFORMERS_MODEL);
            
            // Generate viewport selector
            const viewportSelector = `
                <div class="viewport-selector" style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <label for="viewportSelect" style="font-weight: bold; margin-right: 10px;">Viewport:</label>
                    <select id="viewportSelect" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                        ${report.availableViewports.map(viewport => 
                            `<option value="${viewport}" ${viewport === 'desktop' ? 'selected' : ''}>${viewport.charAt(0).toUpperCase() + viewport.slice(1)}</option>`
                        ).join('')}
                    </select>
                    <span id="viewportInfo" style="margin-left: 15px; color: #666; font-size: 14px;"></span>
                </div>
            `;
            html = html.replace('{{VIEWPORT_SELECTOR}}', viewportSelector);
            
            // Generate issues section
            let issuesSection = '';
            if (report.totalIssues > 0) {
                issuesSection = `
            <div class="section">
                <h2>Issues Found</h2>
                <div class="issues">
                    ${Object.entries(report.issuesByType).map(([type, issues]) => `
                        <div class="issue-type">
                            <h3>${type.toUpperCase()} (${issues.length})</h3>
                            ${issues.map(issue => `
                                    <div class="issue-item ${issue.severity || 'medium'}">
                                        <div class="issue-title">
                                    <strong>${issue.filename}</strong>: ${issue.message} 
                                            <span class="severity-badge severity-${issue.severity || 'medium'}">${issue.severity || 'medium'}</span>
                                        </div>
                                        ${issue.explanation ? `<div class="issue-explanation">${issue.explanation}</div>` : ''}
                                        ${issue.recommendation ? `<div class="issue-recommendation"><strong>Recommendation:</strong> ${issue.recommendation}</div>` : ''}
                                        <div class="issue-meta">
                                            Confidence: ${issue.confidence} | File: ${issue.filename}
                                        </div>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
                </div>`;
            } else {
                issuesSection = `
            <div class="section">
                <h2>Issues Found</h2>
                <div class="no-issues">
                    No issues found! UI looks good.
                </div>
                </div>`;
            }
            html = html.replace('{{ISSUES_SECTION}}', issuesSection);
            
            // Generate screenshots section with viewport grouping
            const screenshotsSection = Object.entries(report.analysesByViewport).map(([viewport, analyses]) => {
                const viewportScreenshots = analyses.map(analysis => {
                        const filename = analysis.filename;
                        const parts = filename.split('-');
                        const page = parts[0];
                        const timestamp = parts[2]?.replace('.png', '');
                        
                        return `
                    <div class="screenshot-item" data-viewport="${viewport}">
                            <img src="${path.basename(analysis.filename)}" alt="${analysis.filename}">
                            <div class="screenshot-info">
                                <div class="screenshot-title">${page.charAt(0).toUpperCase() + page.slice(1)} - ${viewport.charAt(0).toUpperCase() + viewport.slice(1)}</div>
                                <div class="screenshot-meta">
                                    <strong>File:</strong> ${filename}<br>
                                    <strong>Analysis:</strong> ${analysis.aiGenerated ? 'AI Powered' : 'Fallback Analysis'}<br>
                                    <strong>Confidence:</strong> ${(analysis.confidence * 100).toFixed(1)}%
                                </div>
                                <div class="screenshot-description">
                                    ${analysis.description}
                                </div>
                            ${analysis.issues && analysis.issues.length > 0 ? `
                            <div class="screenshot-issues" style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px; font-size: 0.85em;">
                                <strong>Issues Found:</strong>
                                ${analysis.issues.map(issue => `
                                    <div style="margin: 5px 0; padding: 5px; background: white; border-radius: 3px; border-left: 3px solid ${issue.severity === 'critical' ? '#dc3545' : issue.severity === 'high' ? '#fd7e14' : issue.severity === 'medium' ? '#ffc107' : '#28a745'};">
                                        <strong>${issue.type}:</strong> ${issue.message}
                                        ${issue.explanation ? `<br><em>${issue.explanation}</em>` : ''}
                                        ${issue.recommendation ? `<br><small style="color: #6c757d;">Recommendation: ${issue.recommendation}</small>` : ''}
                            </div>
                                `).join('')}
                            </div>
                            ` : ''}
                        </div>
                    </div>`;
                }).join('');
                
                return viewportScreenshots;
            }).join('');
            html = html.replace('{{SCREENSHOTS_SECTION}}', screenshotsSection);
            
            // Add JavaScript for viewport switching
            const viewportScript = `
                <script>
                    document.addEventListener('DOMContentLoaded', function() {
                        const viewportSelect = document.getElementById('viewportSelect');
                        const viewportInfo = document.getElementById('viewportInfo');
                        const screenshotItems = document.querySelectorAll('.screenshot-item');
                        
                        function updateViewportDisplay() {
                            const selectedViewport = viewportSelect.value;
                            const visibleItems = document.querySelectorAll(\`[data-viewport="\${selectedViewport}"]\`);
                            const totalItems = screenshotItems.length;
                            const visibleCount = visibleItems.length;
                            
                            // Hide all screenshots
                            screenshotItems.forEach(item => {
                                item.style.display = 'none';
                            });
                            
                            // Show selected viewport screenshots
                            visibleItems.forEach(item => {
                                item.style.display = 'block';
                            });
                            
                            // Update info text
                            viewportInfo.textContent = \`Showing \${visibleCount} of \${totalItems} screenshots\`;
                        }
                        
                        // Initial display
                        updateViewportDisplay();
                        
                        // Handle viewport change
                        viewportSelect.addEventListener('change', updateViewportDisplay);
                    });
                </script>
            `;
            
            // Insert the script before the closing body tag
            html = html.replace('</body>', viewportScript + '</body>');
            
            // Write HTML file
            fs.writeFileSync(htmlPath, html);
            console.log(`HTML report generated: ${htmlPath}`);
            
            // Open in default browser
            const { exec } = require('child_process');
            const os = require('os');
            
            let command;
            if (os.platform() === 'win32') {
                command = `start "" "${htmlPath}"`;
            } else if (os.platform() === 'darwin') {
                command = `open "${htmlPath}"`;
            } else {
                command = `xdg-open "${htmlPath}"`;
            }
            
            exec(command, (error) => {
                if (error) {
                    console.warn(`Could not open browser: ${error.message}`);
                } else {
                    console.log('Report opened in default browser');
                }
                resolve();
            });
            
        } catch (error) {
            console.warn(`Could not generate HTML report: ${error.message}`);
            resolve();
        }
    });
}

// ===== MAIN WORKFLOW =====

async function runAnalysis() {
    console.log('Starting Visual Analysis...\n');
    
    // Step 1: Test and download transformers.js pipeline first
    console.log('Testing transformers.js pipeline availability...\n');
    
    const transformersAvailable = await testTransformersPipelineAvailability();
    if (!transformersAvailable) {
        console.error('Transformers.js pipeline not available!');
        console.error('Please check your internet connection and try again.');
        console.error('The pipeline will download models automatically on first use.');
        process.exit(1);
    }
    
    // Step 1.5: Pre-download models to avoid delays during analysis
    console.log('\nPre-downloading models to ensure smooth analysis...');
    try {
        await preDownloadModels();
        console.log('Models ready for analysis\n');
    } catch (error) {
        console.warn('Model pre-download failed, continuing anyway:', error.message);
        console.log('Models will be downloaded during analysis (may cause delays)\n');
    }
    
    console.log(`Transformers.js pipeline ready: ${TRANSFORMERS_MODEL}\n`);
    
    // Step 2: Generate fresh screenshots
    console.log('Generating fresh screenshots...\n');
        await generateScreenshots();
    const screenshotFiles = getScreenshotFiles();
        
        if (screenshotFiles.length === 0) {
            console.error('No screenshots generated. Please check your server is running.');
            process.exit(1);
        }
    
    // Step 3: Analyze screenshots by viewport (prioritize desktop first)
    console.log('Analyzing screenshots with AI by viewport...\n');
    
    const analyses = [];
    
    // Helper function to extract viewport from filename
    function extractViewportFromFilename(filename) {
        // Pattern: pageName-viewportName-timestamp.png
        const match = filename.match(/-([a-z-]+)-\d+\.png$/);
        return match ? match[1] : 'unknown';
    }
    
    // Group screenshots by viewport with improved parsing
    const screenshotsByViewport = {};
    screenshotFiles.forEach(imagePath => {
        const filename = path.basename(imagePath);
        const viewport = extractViewportFromFilename(filename);
        
        if (!screenshotsByViewport[viewport]) {
            screenshotsByViewport[viewport] = [];
        }
        screenshotsByViewport[viewport].push(imagePath);
    });
    
    // Analyze viewports in order of priority: desktop, tablet, mobile, large-desktop
    const viewportOrder = ['desktop', 'tablet', 'mobile', 'large-desktop'];
    const orderedViewports = viewportOrder.filter(v => screenshotsByViewport[v]);
    
    for (const viewport of orderedViewports) {
        const viewportScreenshots = screenshotsByViewport[viewport];
        console.log(`\n=== Analyzing ${viewport.toUpperCase()} viewport (${viewportScreenshots.length} screenshots) ===`);
        
        for (const imagePath of viewportScreenshots) {
        const filename = path.basename(imagePath);
            console.log(`\nAnalyzing: ${filename}`);
            try {
            const analysis = await analyzeScreenshot(imagePath, filename, TRANSFORMERS_MODEL);
        analyses.push(analysis);
                console.log(`  Result: ${analysis.aiGenerated ? 'AI Success' : 'AI Failed'} - ${analysis.description.substring(0, 100)}...`);
                
                // Add delay between API calls to avoid rate limiting
                if (viewportScreenshots.indexOf(imagePath) < viewportScreenshots.length - 1) {
                    console.log(`  Waiting ${API_DELAY_MS}ms before next analysis...`);
                    await new Promise(resolve => setTimeout(resolve, API_DELAY_MS));
                }
            } catch (error) {
                console.error(`Failed to analyze ${filename}: ${error.message}`);
                console.warn('Continuing with next screenshot...');
                // Skip this screenshot and continue with the next one
            }
        }
        
        // Add extra delay between viewports to reduce API load
        if (viewport !== orderedViewports[orderedViewports.length - 1]) {
            console.log(`\nCompleted ${viewport} viewport. Waiting ${API_DELAY_MS * 2}ms before next viewport...`);
            await new Promise(resolve => setTimeout(resolve, API_DELAY_MS * 2));
        }
    }
    
    console.log('\n');
    
    // Step 5: Generate comprehensive report
    const report = generateReport(analyses);
    
    // Display results
    console.log('Analysis Complete!\n');
    console.log(`Screenshots analyzed: ${report.totalScreenshots}`);
    console.log(`AI analyzed: ${report.aiAnalyzed}`);
    console.log(`Total issues found: ${report.totalIssues}\n`);
    
    if (report.totalIssues > 0) {
        console.log('Issues Found:\n');
        
        Object.entries(report.issuesByType).forEach(([type, issues]) => {
            console.log(`${type.toUpperCase()} (${issues.length}):`);
            issues.forEach(issue => {
                console.log(`  • ${issue.filename}: ${issue.message} (${issue.confidence})`);
            });
            console.log('');
        });
    } else {
        console.log('No issues found! UI looks good.');
    }
    
    // Save comprehensive report
    const reportPath = path.join(SCREENSHOTS_DIR, 'analysis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Report saved: ${reportPath}`);
    
    // Summary
    console.log('\nAnalysis Summary:');
    console.log(`  Generated/Found ${report.totalScreenshots} screenshots`);
    console.log(`  AI analyzed ${report.aiAnalyzed} screenshots using Transformers.js`);
    console.log(`  Viewports analyzed: ${report.availableViewports.join(', ')}`);
    console.log(`  Model used: ${TRANSFORMERS_MODEL}`);
    console.log(`  API: Transformers.js (Local Inference)`);
    console.log(`  Screenshots directory: ${SCREENSHOTS_DIR}`);
    console.log(`  Report includes viewport selection for focused analysis\n`);
    
    // Generate and open HTML report
    await generateHTMLReport(report);
    
    return report;
}

// Run if called directly
if (require.main === module) {
    runAnalysis()
        .then(() => {
            console.log('Analysis completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Analysis failed:', error);
            process.exit(1);
        });
}

module.exports = { runAnalysis, generateScreenshots, analyzeScreenshot };
