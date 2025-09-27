#!/usr/bin/env node

/**
 * Test script to verify model download and initialization
 * 
 * NOTE: Please verify license terms on Hugging Face before commercial use
 * - blip-image-captioning-base: BSD-3-Clause (verified free)
 * - Xenova models: License not specified in API (verify before commercial use)
 * 
 * Run this separately to test models before running the full analysis
 */

const { testTransformersPipeline, preDownloadModels } = require('./transformers-inference');

async function testModelDownload() {
    console.log('Testing Model Download and Initialization\n');
    
    try {
        // Test 1: Basic pipeline test
        console.log('=== Test 1: Pipeline Availability ===');
        const testResult = await testTransformersPipeline();
        
        if (testResult.success) {
            console.log('Pipeline test passed:', testResult.message);
        } else {
            console.error('Pipeline test failed:', testResult.error);
            if (testResult.troubleshooting) {
                console.log('\nTroubleshooting info:');
                console.log('- Node version:', testResult.troubleshooting.nodeVersion);
                console.log('- Platform:', testResult.troubleshooting.platform);
                console.log('- Fetch available:', testResult.troubleshooting.fetchAvailable);
                console.log('- Suggestion:', testResult.troubleshooting.suggestion);
            }
            process.exit(1);
        }
        
        console.log('\n=== Test 2: Model Pre-download ===');
        await preDownloadModels();
        
        console.log('\nAll tests passed! Models are ready for analysis.');
        console.log('\nYou can now run: npm run analyze');
        
    } catch (error) {
        console.error('Test failed:', error.message);
        console.log('\nCommon solutions:');
        console.log('1. Ensure you have Node.js 18+ installed');
        console.log('2. Check your internet connection');
        console.log('3. Try running: npm install @xenova/transformers');
        console.log('4. Clear npm cache: npm cache clean --force');
        process.exit(1);
    }
}

if (require.main === module) {
    testModelDownload();
}

module.exports = { testModelDownload };
