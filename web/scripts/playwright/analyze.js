#!/usr/bin/env node

/**
 * Unified Visual Analysis Script
 * Combines screenshot generation and AI analysis in one workflow
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');

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

// Hugging Face API configuration
const HF_API_KEY = process.env.HF_API_KEY;
const HF_MODEL = process.env.HF_MODEL || 'nlpconnect/vit-gpt2-image-captioning';

// Fallback models to try if primary fails
const FALLBACK_MODELS = [
    'nlpconnect/vit-gpt2-image-captioning',
    'Salesforce/blip-image-captioning-base',
    'microsoft/git-base-coco'
];

// Rate limiting configuration
const API_DELAY_MS = parseInt(process.env.API_DELAY_MS) || 2000; // Default 2 seconds
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES) || 3; // Default 3 retries
const RATE_LIMIT_DELAY_MS = parseInt(process.env.RATE_LIMIT_DELAY_MS) || 5000; // Default 5 seconds

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
    
    console.log(`Screenshot saved: ${filename}`);
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
        // Wait for the page to load
        await page.waitForSelector('button[data-bs-target="#addProductModal"]', { timeout: 5000 });
        
        // Click the "Add New Product" button
        await page.click('button[data-bs-target="#addProductModal"]');
        
        // Wait for modal to appear
        await page.waitForSelector('#addProductModal', { timeout: 3000 });
        
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
    
    for (const viewport of VIEWPORTS) {
        let context = null;
        let page = null;
        
        try {
            context = await browser.newContext({
                viewport: {
                    width: viewport.width,
                    height: viewport.height
                }
            });
            page = await context.newPage();
            
            // Navigate to page
            console.log(`Navigating to ${BASE_URL}${pageConfig.url} (${viewport.name})`);
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
                    console.warn('Modal not opened, taking regular screenshot');
                }
            }
            
            // Take screenshot
            const screenshot = await takeScreenshot(page, viewport, pageConfig);
            screenshots.push(screenshot);
            
        } catch (error) {
            console.error(`Error capturing ${pageConfig.name} at ${viewport.name}:`, error.message);
            console.error('Full error:', error);
            throw error; // Stop execution on error
        } finally {
            if (page) {
                await page.close();
            }
            if (context) {
                await context.close();
            }
        }
    }
    
    return screenshots;
}

async function generateScreenshots() {
    console.log('Generating fresh screenshots...\n');
    
    // Clear existing screenshots
    if (fs.existsSync(SCREENSHOTS_DIR)) {
        const files = fs.readdirSync(SCREENSHOTS_DIR);
        files.forEach(file => {
            if (file.endsWith('.png')) {
                fs.unlinkSync(path.join(SCREENSHOTS_DIR, file));
            }
        });
    }
    
    // Check if server is running
    try {
        const response = await fetch(BASE_URL);
        if (!response.ok) {
            throw new Error(`Server not responding: ${response.status}`);
        }
    } catch (error) {
        console.error('Server not running! Please start the server first:');
        console.error('   npm run start');
        process.exit(1);
    }
    
    const browser = await chromium.launch({
        headless: true
    });
    
    const allScreenshots = [];
    
    try {
        for (const pageConfig of PAGES) {
            console.log(`\nCapturing screenshots for: ${pageConfig.name}`);
            const screenshots = await capturePageScreenshots(browser, pageConfig);
            allScreenshots.push(...screenshots);
        }
        
        // Save metadata
        const metadata = {
            generated: new Date().toISOString(),
            total: allScreenshots.length,
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
        console.log(`\nMetadata saved: ${metadataPath}`);
        
    } finally {
        await browser.close();
    }
    
    return allScreenshots;
}

// ===== AI ANALYSIS =====

function imageToBase64(imagePath) {
    const imageBuffer = fs.readFileSync(imagePath);
    return imageBuffer.toString('base64');
}

function callHuggingFaceVisionAPI(imageBase64, model = HF_MODEL) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            inputs: `data:image/png;base64,${imageBase64}`
        });

        const options = {
            hostname: 'api-inference.huggingface.co',
            port: 443,
            path: `/models/${model}`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_API_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        const result = JSON.parse(responseData);
                        resolve(result);
                    } else if (res.statusCode === 503) {
                        reject(new Error('Model is loading, please try again in a few seconds'));
                    } else if (res.statusCode === 429) {
                        reject(new Error('Rate limit exceeded, please wait before retrying'));
                    } else {
                        reject(new Error(`API error: ${res.statusCode} - ${responseData}`));
                    }
                } catch (error) {
                    reject(new Error(`Invalid JSON response: ${responseData.substring(0, 200)}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

function analyzeScreenshot(imagePath, filename) {
    return new Promise(async (resolve, reject) => {
        let retryCount = 0;
        let modelIndex = 0;
        
        const attemptAnalysis = async () => {
            try {
                const currentModel = FALLBACK_MODELS[modelIndex];
                console.log(`Analyzing: ${filename}${retryCount > 0 ? ` (attempt ${retryCount + 1})` : ''} using ${currentModel}`);
                
                // Convert image to base64
                const imageBase64 = imageToBase64(imagePath);
                
                // Call Hugging Face API
                const aiResult = await callHuggingFaceVisionAPI(imageBase64, currentModel);
                
                // Process AI results
                const analysis = {
                    filename,
                    timestamp: new Date().toISOString(),
                    aiGenerated: true,
                    description: aiResult[0]?.generated_text || 'No description generated',
                    confidence: aiResult[0]?.score || 0,
                    issues: [],
                    suggestions: []
                };
                
                // Parse Hugging Face description for issues
                const description = analysis.description.toLowerCase();
                
                // Look for visual issues in the AI description with detailed explanations
                if (description.includes('error') || description.includes('failed') || description.includes('broken')) {
                    analysis.issues.push({
                        type: 'error',
                        message: 'Error or broken elements detected in the interface',
                        explanation: 'The AI detected error messages, failed states, or broken UI elements. This could indicate JavaScript errors, API failures, or broken functionality that needs immediate attention.',
                        confidence: 'high',
                        severity: 'critical',
                        recommendation: 'Check browser console for JavaScript errors, verify API endpoints are working, and test all interactive elements.'
                    });
                }
                
                if (description.includes('small') || description.includes('tiny') || description.includes('unreadable') || description.includes('hard to read')) {
                    analysis.issues.push({
                        type: 'accessibility',
                        message: 'Text appears to be too small or unreadable',
                        explanation: 'The AI detected text that may be too small for comfortable reading, especially on mobile devices. This affects accessibility and user experience.',
                        confidence: 'high',
                        severity: 'high',
                        recommendation: 'Increase font sizes, especially for body text. Ensure minimum 16px font size for mobile devices and maintain good contrast ratios.'
                    });
                }
                
                if ((description.includes('color') && (description.includes('poor') || description.includes('bad') || description.includes('contrast'))) || 
                    description.includes('hard to see') || description.includes('blend')) {
                    analysis.issues.push({
                        type: 'design',
                        message: 'Poor color choices or contrast detected',
                        explanation: 'The AI identified color combinations that may have insufficient contrast or poor visual hierarchy. This affects readability and accessibility.',
                        confidence: 'high',
                        severity: 'medium',
                        recommendation: 'Use WebAIM contrast checker to ensure WCAG AA compliance. Increase contrast between text and background colors.'
                    });
                }
                
                if (description.includes('cluttered') || description.includes('crowded') || description.includes('messy') || description.includes('busy')) {
                    analysis.issues.push({
                        type: 'layout',
                        message: 'Layout appears cluttered or poorly organized',
                        explanation: 'The AI detected a layout that may be overwhelming or difficult to navigate. This can confuse users and reduce conversion rates.',
                        confidence: 'medium',
                        severity: 'medium',
                        recommendation: 'Apply white space principles, group related elements, and prioritize content hierarchy. Consider reducing visual noise.'
                    });
                }
                
                if (description.includes('button') && (description.includes('small') || description.includes('hard to click'))) {
                    analysis.issues.push({
                        type: 'usability',
                        message: 'Buttons may be too small or hard to interact with',
                        explanation: 'The AI detected buttons or interactive elements that may be difficult to tap or click, especially on touch devices.',
                        confidence: 'medium',
                        severity: 'high',
                        recommendation: 'Ensure buttons are at least 44px in height for mobile devices. Add adequate padding and spacing between interactive elements.'
                    });
                }
                
                if (description.includes('image') && (description.includes('broken') || description.includes('missing') || description.includes('not loading'))) {
                    analysis.issues.push({
                        type: 'content',
                        message: 'Images may be broken or not loading properly',
                        explanation: 'The AI detected issues with image loading or display. This affects the visual appeal and may indicate broken links or server issues.',
                        confidence: 'medium',
                        severity: 'medium',
                        recommendation: 'Check image file paths, verify images exist on server, and ensure proper alt text for accessibility.'
                    });
                }
                
                // If no specific issues found but description suggests problems
                if (analysis.issues.length === 0 && (description.includes('problem') || description.includes('issue') || description.includes('bad') || description.includes('confusing'))) {
                    analysis.issues.push({
                        type: 'general',
                        message: 'AI detected potential usability concerns',
                        explanation: 'The AI analysis suggests there may be usability issues that require manual review. The description indicates potential problems that need human evaluation.',
                        confidence: 'low',
                        severity: 'low',
                        recommendation: 'Conduct manual testing and user feedback sessions to identify specific usability issues.'
                    });
                }
                
                analysis.suggestions.push('Analysis provided by Hugging Face AI model.');
                
                resolve(analysis);
                
            } catch (error) {
                // Handle 404 - could be rate limiting or model unavailability
                if (error.message.includes('404') && retryCount < MAX_RETRIES) {
                    retryCount++;
                    const delay = RATE_LIMIT_DELAY_MS * retryCount; // Exponential backoff
                    console.log(`404 error (likely rate limiting). Retrying in ${delay}ms... (attempt ${retryCount}/${MAX_RETRIES})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return attemptAnalysis();
                }
                
                // Try next model only after retries exhausted
                if (error.message.includes('404') && modelIndex < FALLBACK_MODELS.length - 1) {
                    modelIndex++;
                    console.log(`All retries failed, trying next model: ${FALLBACK_MODELS[modelIndex]}`);
                    retryCount = 0; // Reset retry count for new model
                    return attemptAnalysis();
                }
                
                // Handle rate limiting with retry
                if (error.message.includes('Rate limit exceeded') && retryCount < MAX_RETRIES) {
                    retryCount++;
                    const delay = RATE_LIMIT_DELAY_MS * retryCount; // Exponential backoff
                    console.log(`Rate limited. Retrying in ${delay}ms... (attempt ${retryCount}/${MAX_RETRIES})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return attemptAnalysis();
                }
                
                // Handle model loading with retry
                if (error.message.includes('Model is loading') && retryCount < MAX_RETRIES) {
                    retryCount++;
                    const delay = 10000; // 10 seconds for model loading
                    console.log(`Model is loading. Retrying in ${delay}ms... (attempt ${retryCount}/${MAX_RETRIES})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return attemptAnalysis();
                }
                
                // Handle connectivity errors with retry
                if ((error.message.includes('ECONNRESET') || error.message.includes('ENOTFOUND') || 
                     error.message.includes('ETIMEDOUT') || error.message.includes('connect')) && retryCount < MAX_RETRIES) {
                    retryCount++;
                    const delay = 5000; // 5 seconds for connectivity issues
                    console.log(`Connectivity issue detected. Retrying in ${delay}ms... (attempt ${retryCount}/${MAX_RETRIES})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return attemptAnalysis();
                }
                
                // All models failed or connectivity issues persist - use fallback analysis
                console.warn(`AI analysis failed for ${filename}: ${error.message}`);
                console.warn('Falling back to static analysis...');
                
                const fallbackAnalysis = {
                    filename,
                    timestamp: new Date().toISOString(),
                    aiGenerated: false,
                    description: 'AI analysis unavailable - using fallback analysis',
                    confidence: 0,
                    issues: [],
                    suggestions: ['AI analysis failed due to connectivity or model availability issues']
                };
                
                // Basic static analysis based on filename
                if (filename.includes('mobile')) {
                    fallbackAnalysis.issues.push({
                        type: 'accessibility',
                        message: 'Mobile viewport detected - verify responsive design',
                        explanation: 'This screenshot was taken on a mobile viewport. Manual verification is needed to ensure the interface is properly responsive and usable on mobile devices.',
                        confidence: 'low',
                        severity: 'low',
                        recommendation: 'Test the interface on actual mobile devices and verify touch targets are appropriately sized (minimum 44px).'
                    });
                }
                
                if (filename.includes('modal')) {
                    fallbackAnalysis.issues.push({
                        type: 'functionality',
                        message: 'Modal interface detected - verify proper modal behavior',
                        explanation: 'This screenshot shows a modal dialog. Manual testing is required to ensure the modal opens, closes, and functions correctly across different devices.',
                        confidence: 'low',
                        severity: 'low',
                        recommendation: 'Test modal functionality including keyboard navigation (ESC to close), focus management, and proper backdrop behavior.'
                    });
                }
                
                resolve(fallbackAnalysis);
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
    const report = {
        generated: new Date().toISOString(),
        totalScreenshots: analyses.length,
        aiAnalyzed: analyses.filter(a => a.aiGenerated).length,
        totalIssues: analyses.reduce((sum, a) => sum + a.issues.length, 0),
        analyses: analyses
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
            html = html.replace('{{MODEL_USED}}', HF_MODEL);
            
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
            
            // Generate screenshots section
            const screenshotsSection = report.analyses.map(analysis => {
                const filename = analysis.filename;
                const parts = filename.split('-');
                const page = parts[0];
                const viewport = parts[1];
                const timestamp = parts[2]?.replace('.png', '');
                
                return `
                <div class="screenshot-item">
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
            html = html.replace('{{SCREENSHOTS_SECTION}}', screenshotsSection);
            
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
    console.log('Starting Unified Visual Analysis...\n');
    
    if (!HF_API_KEY) {
        console.log('No Hugging Face API key found. Set HF_API_KEY environment variable for AI analysis.');
        console.log('   AI analysis will fail without API key.\n');
    }
    
    // Step 1: Always generate fresh screenshots
    console.log('Generating fresh screenshots...\n');
    await generateScreenshots();
    const screenshotFiles = getScreenshotFiles();
    
    if (screenshotFiles.length === 0) {
        console.error('No screenshots generated. Please check your server is running.');
        process.exit(1);
    }
    
    // Step 2: Analyze all screenshots
    console.log('Analyzing screenshots with AI...\n');
    
    const analyses = [];
    
    for (const imagePath of screenshotFiles) {
        const filename = path.basename(imagePath);
        console.log(`\nAnalyzing: ${filename}`);
        try {
            const analysis = await analyzeScreenshot(imagePath, filename);
            analyses.push(analysis);
            console.log(`  Result: ${analysis.aiGenerated ? 'AI Success' : 'AI Failed'} - ${analysis.description.substring(0, 100)}...`);
            
            // Add delay between API calls to avoid rate limiting
            if (screenshotFiles.indexOf(imagePath) < screenshotFiles.length - 1) {
                console.log(`  Waiting ${API_DELAY_MS}ms before next analysis...`);
                await new Promise(resolve => setTimeout(resolve, API_DELAY_MS));
            }
        } catch (error) {
            console.error(`Failed to analyze ${filename}: ${error.message}`);
            console.warn('Continuing with next screenshot...');
            
            // Add a fallback analysis for failed screenshots
            const fallbackAnalysis = {
                filename,
                timestamp: new Date().toISOString(),
                aiGenerated: false,
                description: 'Analysis failed - screenshot captured but not analyzed',
                confidence: 0,
                issues: [{
                    type: 'analysis',
                    message: 'Screenshot analysis failed due to technical issues',
                    explanation: 'The AI analysis could not be completed for this screenshot due to technical issues such as API failures, connectivity problems, or model unavailability.',
                    confidence: 'low',
                    severity: 'low',
                    recommendation: 'Manual review of this screenshot is recommended to identify any potential UI issues that may have been missed.'
                }],
                suggestions: ['Manual review recommended for this screenshot']
            };
            
            analyses.push(fallbackAnalysis);
        }
    }
    
    console.log('\n');
    
    // Step 3: Generate comprehensive report
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
    console.log(`  AI analyzed ${report.aiAnalyzed} screenshots using Hugging Face Vision`);
    console.log(`  Model used: ${HF_MODEL}`);
    console.log(`  API: Hugging Face Transformers`);
    console.log(`  Screenshots directory: ${SCREENSHOTS_DIR}\n`);
    
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
