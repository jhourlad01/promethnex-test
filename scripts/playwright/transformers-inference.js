#!/usr/bin/env node

/**
 * Transformers.js implementation for image captioning
 * 
 * LICENSE INFORMATION:
 * - blip-image-captioning-base: BSD-3-Clause (free, open source)
 * - Xenova models: License not specified in API (use at your own risk)
 * - All models downloaded from Hugging Face Model Hub
 * - No API keys or authentication required
 * - Models are downloaded once and cached locally
 * 
 * NOTE: Please verify license terms on Hugging Face before commercial use
 */

const { pipeline, env } = require('@xenova/transformers');

// Configure for local models (if available)
// env.localModelPath = './models/';  // Uncomment if you have local models
// env.allowRemoteModels = false;     // Uncomment to disable downloads
// env.allowLocalModels = true;       // Uncomment to use local models only

// Global pipeline instance for reuse
let imageCaptioner = null;

/**
 * Initialize the image captioning pipeline with fallback models
 */
async function initializePipeline(modelName = 'Xenova/vit-gpt2-image-captioning') {
    if (!imageCaptioner) {
        console.log(`Loading image captioning pipeline: ${modelName}...`);
        
        // Model configurations with working fallbacks
        const modelConfigs = [
            {
                name: 'Xenova/vit-gpt2-image-captioning',
                config: { quantized: true, progress_callback: createProgressCallback }
            },
            {
                name: 'Xenova/blip-image-captioning-base',
                config: { quantized: true, progress_callback: createProgressCallback }
            },
            {
                name: 'nlpconnect/vit-gpt2-image-captioning',
                config: { quantized: true, progress_callback: createProgressCallback }
            },
            {
                name: 'Salesforce/blip-image-captioning-base',
                config: { quantized: true, progress_callback: createProgressCallback }
            }
        ];
        
        // Find the requested model or start with the first one
        let selectedModel = modelConfigs.find(m => m.name === modelName) || modelConfigs[0];
        
        for (const modelConfig of modelConfigs) {
            try {
                console.log(`Attempting to load: ${modelConfig.name}`);
                console.log('This may take a while on first run as models are downloaded...');
                
                const startTime = Date.now();
                imageCaptioner = await pipeline('image-to-text', modelConfig.name, modelConfig.config);
                const loadTime = Math.round((Date.now() - startTime) / 1000);
                
                console.log(`Pipeline loaded successfully: ${modelConfig.name} (${loadTime}s)`);
                return imageCaptioner;
                
            } catch (error) {
                console.warn(`Failed to load ${modelConfig.name}: ${error.message}`);
                if (modelConfig === modelConfigs[modelConfigs.length - 1]) {
                    throw new Error(`TRANSFORMERS_INIT_ERROR: All model attempts failed. Last error: ${error.message}`);
                }
                console.log('Trying fallback model...');
            }
        }
    }
    return imageCaptioner;
}

/**
 * Create a detailed progress callback for model downloads
 */
function createProgressCallback(progress) {
    if (progress.status === 'downloading') {
        const file = progress.file || 'model files';
        const progressPercent = Math.round(progress.progress || 0);
        const loaded = progress.loaded ? `${(progress.loaded / 1024 / 1024).toFixed(1)}MB` : '';
        const total = progress.total ? `${(progress.total / 1024 / 1024).toFixed(1)}MB` : '';
        const sizeInfo = loaded && total ? ` (${loaded}/${total})` : '';
        
        console.log(`Downloading ${file}: ${progressPercent}%${sizeInfo}`);
    } else if (progress.status === 'loading') {
        console.log(`Loading model: ${progress.status}`);
    } else if (progress.status === 'ready') {
        console.log(`Model ready: ${progress.status}`);
    }
}

/**
 * Call transformers.js pipeline for image captioning
 */
async function callTransformersPipeline(imagePath, modelName = 'Xenova/vit-gpt2-image-captioning') {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(`Running transformers.js inference with ${modelName}...`);
            
            // Initialize pipeline with the specified model
            const captioner = await initializePipeline(modelName);
            
            // Validate image file exists
            const fs = require('fs');
            if (!fs.existsSync(imagePath)) {
                throw new Error(`Image file not found: ${imagePath}`);
            }
            
            console.log(`Processing image: ${require('path').basename(imagePath)}`);
            const startTime = Date.now();
            
            // Run inference
            const result = await captioner(imagePath);
            const inferenceTime = Math.round(Date.now() - startTime);
            
            // Extract caption from result
            const caption = result[0]?.generated_text || 'No caption generated';
            
            console.log(`Inference completed in ${inferenceTime}ms`);
            
            resolve({
                success: true,
                caption: caption,
                model: modelName,
                method: 'TRANSFORMERS_JS',
                confidence: result[0]?.score || 0,
                inferenceTime: inferenceTime
            });
            
        } catch (error) {
            if (error.message.includes('TRANSFORMERS_INIT_ERROR')) {
                reject(new Error('TRANSFORMERS_INIT_ERROR: ' + error.message));
            } else if (error.message.includes('ENOENT') || error.message.includes('no such file')) {
                reject(new Error('TRANSFORMERS_IMAGE_ERROR: Image file not found: ' + imagePath));
            } else if (error.message.includes('Invalid image')) {
                reject(new Error('TRANSFORMERS_IMAGE_ERROR: Invalid image format'));
            } else {
                reject(new Error('TRANSFORMERS_INFERENCE_ERROR: ' + error.message));
            }
        }
    });
}

/**
 * Test transformers.js pipeline availability
 */
async function testTransformersPipeline() {
    return new Promise(async (resolve) => {
        try {
            console.log('Testing transformers.js pipeline...');
            console.log('Node.js version:', process.version);
            console.log('Platform:', process.platform);
            
            // Check if fetch is available
            if (typeof fetch === 'undefined') {
                console.warn('fetch() not available - this may cause issues');
            } else {
                console.log('fetch() is available');
            }
            
            // Test network connectivity to Hugging Face
            try {
                const testUrl = 'https://huggingface.co/api/models';
                console.log('Testing network connectivity to Hugging Face...');
                const response = await fetch(testUrl, { method: 'HEAD', timeout: 5000 });
                if (response.ok) {
                    console.log('Network connectivity OK');
                } else {
                    console.warn(`Network test returned status: ${response.status}`);
                }
            } catch (networkError) {
                console.warn('Network connectivity test failed:', networkError.message);
            }
            
            // Try to initialize the pipeline with a working model first
            console.log('Attempting to initialize pipeline with Xenova/vit-gpt2-image-captioning...');
            const startTime = Date.now();
            const captioner = await initializePipeline('Xenova/vit-gpt2-image-captioning');
            const initTime = Math.round((Date.now() - startTime) / 1000);
            
            resolve({
                success: true,
                error: null,
                statusCode: 200,
                message: `Transformers.js pipeline ready (initialized in ${initTime}s)`,
                initializationTime: initTime
            });
            
        } catch (error) {
            console.error('Pipeline test failed:', error.message);
            resolve({
                success: false,
                error: error.message,
                statusCode: 'PIPELINE_ERROR',
                message: 'Failed to initialize pipeline',
                troubleshooting: {
                    nodeVersion: process.version,
                    platform: process.platform,
                    fetchAvailable: typeof fetch !== 'undefined',
                    suggestion: 'Try running with a stable internet connection and Node.js 18+'
                }
            });
        }
    });
}

/**
 * Convert image to base64 (keeping compatibility with existing code)
 */
function imageToBase64(imagePath) {
    const fs = require('fs');
    try {
        const imageBuffer = fs.readFileSync(imagePath);
        const base64 = imageBuffer.toString('base64');
        return `data:image/png;base64,${base64}`;
    } catch (error) {
        throw new Error(`Failed to convert image to base64: ${error.message}`);
    }
}

/**
 * Pre-download models to avoid delays during analysis
 */
async function preDownloadModels() {
    console.log('Pre-downloading models to avoid delays during analysis...');
    console.log('Note: Please verify license terms on Hugging Face before commercial use');
    
    const models = [
        'Xenova/vit-gpt2-image-captioning',             // Working model
        'Xenova/blip-image-captioning-base',            // Working model
        'nlpconnect/vit-gpt2-image-captioning',         // Alternative
        'Salesforce/blip-image-captioning-base'         // Backup
    ];
    
    for (const modelName of models) {
        try {
            console.log(`\nPre-downloading: ${modelName}`);
            const startTime = Date.now();
            
            // This will download the model files without keeping them in memory
            const testPipeline = await pipeline('image-to-text', modelName, {
                quantized: true,
                progress_callback: createProgressCallback
            });
            
            const downloadTime = Math.round((Date.now() - startTime) / 1000);
            console.log(`${modelName} downloaded and cached (${downloadTime}s)`);
            
            // Clean up the test pipeline to free memory
            testPipeline = null;
            
        } catch (error) {
            console.warn(`Failed to pre-download ${modelName}: ${error.message}`);
        }
    }
    
    console.log('\nModel pre-download complete!');
}

module.exports = {
    callTransformersPipeline,
    testTransformersPipeline,
    imageToBase64,
    preDownloadModels,
    initializePipeline
};
