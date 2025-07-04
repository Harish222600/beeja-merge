const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Image processing configuration
const IMAGE_CONFIG = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
    format: 'jpeg',
    // Maximum file size in bytes (5MB)
    maxFileSize: 5 * 1024 * 1024
};

// Function to resize and optimize image
const processImage = async (fileBuffer, options = {}) => {
    try {
        const {
            maxWidth = IMAGE_CONFIG.maxWidth,
            maxHeight = IMAGE_CONFIG.maxHeight,
            quality = IMAGE_CONFIG.quality,
            format = IMAGE_CONFIG.format
        } = options;

        console.log('🖼️ Processing image with Sharp...');
        
        // Configure Sharp with increased limits for large images
        const sharpInstance = sharp(fileBuffer, {
            limitInputPixels: false, // Remove pixel limit
            sequentialRead: true,    // Better for large images
            density: 72             // Set reasonable DPI
        });
        
        // Get image metadata
        const metadata = await sharpInstance.metadata();
        console.log('Original image metadata:', {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            size: fileBuffer.length
        });

        // Check if resizing is needed
        const needsResize = metadata.width > maxWidth || metadata.height > maxHeight;
        
        let processedBuffer;
        
        if (needsResize) {
            console.log(`Resizing image from ${metadata.width}x${metadata.height} to fit within ${maxWidth}x${maxHeight}`);
            
            processedBuffer = await sharpInstance
                .resize(maxWidth, maxHeight, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ 
                    quality,
                    progressive: true,
                    mozjpeg: true
                })
                .toBuffer();
        } else {
            // Just optimize without resizing
            console.log('Optimizing image without resizing');
            processedBuffer = await sharpInstance
                .jpeg({ 
                    quality,
                    progressive: true,
                    mozjpeg: true
                })
                .toBuffer();
        }

        console.log('✅ Image processed successfully:', {
            originalSize: fileBuffer.length,
            processedSize: processedBuffer.length,
            compressionRatio: ((fileBuffer.length - processedBuffer.length) / fileBuffer.length * 100).toFixed(2) + '%'
        });

        return processedBuffer;
    } catch (error) {
        console.error('Error processing image:', error);
        throw new Error(`Image processing failed: ${error.message}`);
    }
};

const uploadWithRetry = async (file, options, retryCount = 0) => {
    try {
        return await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    ...options,
                    // Enhanced upload options for better performance
                    use_filename: true, // Use original filename
                    unique_filename: true, // Ensure unique names
                    overwrite: false, // Don't overwrite existing files
                    invalidate: true, // Invalidate CDN cache if overwriting
                    async: true, // Use async upload for better performance
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            // Add progress monitoring
            if (options.resource_type === 'video') {
                uploadStream.on('progress', (progress) => {
                    console.log(`Upload progress: ${progress.percent}%`);
                });
            }

            // Handle file upload based on format
            if (file.buffer) {
                uploadStream.end(file.buffer);
            } else if (file.path) {
                const fs = require('fs');
                fs.createReadStream(file.path)
                    .pipe(uploadStream)
                    .on('error', (error) => reject(error));
            } else {
                reject(new Error('Invalid file format'));
            }
        });
    } catch (error) {
        console.error(`Upload attempt ${retryCount + 1} failed:`, error.message);
        
        if (retryCount < MAX_RETRIES) {
            console.log(`Retrying upload in ${RETRY_DELAY/1000} seconds...`);
            await wait(RETRY_DELAY);
            return uploadWithRetry(file, options, retryCount + 1);
        }
        throw error;
    }
};

exports.uploadImageToCloudinary = async (file, folder, height, quality) => {
    try {
        console.log('🔧 Starting file upload to Cloudinary');
        console.log('File details:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            folder: folder
        });

        // Check if file is an image and needs processing
        const isImage = file.mimetype && file.mimetype.startsWith('image/');
        let fileBuffer = file.buffer;

        if (isImage && file.size > IMAGE_CONFIG.maxFileSize) {
            console.log('⚠️ Large image detected, processing before upload...');
            
            // Process image with custom options if height is specified
            const processOptions = {};
            if (height) {
                processOptions.maxHeight = height;
                processOptions.maxWidth = height * 2; // Maintain aspect ratio
            }
            
            // Process the image to reduce size
            fileBuffer = await processImage(file.buffer, processOptions);
            
            console.log('📏 Image processed for upload:', {
                originalSize: file.size,
                processedSize: fileBuffer.length,
                reduction: ((file.size - fileBuffer.length) / file.size * 100).toFixed(2) + '%'
            });
        } else if (isImage && (file.size > 1024 * 1024)) { // Process images larger than 1MB
            console.log('🔄 Optimizing image before upload...');
            
            const processOptions = {};
            if (height) {
                processOptions.maxHeight = height;
                processOptions.maxWidth = height * 2;
            }
            
            fileBuffer = await processImage(file.buffer, processOptions);
        }
        
        // Base options for all uploads
        const options = { 
            folder,
            resource_type: 'auto',
            use_filename: true,
            unique_filename: true,
            overwrite: true, // Changed to true to ensure updates work
            secure: true,
            quality: quality || 'auto:good'
        };

        // Specific options based on folder/usage - removed height/crop since we pre-process
        if (folder === 'chat-images') {
            // Chat images need immediate processing
            options.async = false;
        } else if (folder.includes('course')) {
            // Course-related images get optimization
            options.eager = [
                { width: 1024, crop: "scale" }, // Desktop
                { width: 768, crop: "scale" },  // Tablet
                { width: 480, crop: "scale" }   // Mobile
            ];
            options.eager_async = true;
        }
        
        console.log('📋 Upload options:', JSON.stringify(options, null, 2));
        
        // Use upload with retry for important files (like course thumbnails)
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                options,
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        reject(error);
                    } else {
                        console.log('Cloudinary upload result:', {
                            secure_url: result.secure_url,
                            public_id: result.public_id,
                            format: result.format,
                            resource_type: result.resource_type,
                            status: result.status || 'completed'
                        });
                        resolve(result);
                    }
                }
            );

            if (fileBuffer) {
                uploadStream.end(fileBuffer);
            } else {
                reject(new Error('File buffer is required'));
            }
        });

        console.log('✅ Upload successful:', {
            secure_url: result.secure_url,
            public_id: result.public_id
        });

        return result;
    }
    catch (error) {
        console.error("Error while uploading file to Cloudinary:", error);
        throw new Error(`Failed to upload file: ${error.message}`);
    }
}

// Enhanced function to delete a resource by public ID with invalidation
exports.deleteResourceFromCloudinary = async (url) => {
    if (!url) return;

    try {
        // Extract public ID from Cloudinary URL
        let publicId = url;
        
        // If it's a full Cloudinary URL, extract the public ID
        if (url.includes('cloudinary.com')) {
            // Extract the public ID from the URL
            // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.extension
            const urlParts = url.split('/');
            const uploadIndex = urlParts.findIndex(part => part === 'upload');
            
            if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
                // Get everything after 'upload/v1234567890/' or 'upload/'
                const pathAfterUpload = urlParts.slice(uploadIndex + 1);
                
                // Remove version if present (starts with 'v' followed by numbers)
                if (pathAfterUpload[0] && pathAfterUpload[0].match(/^v\d+$/)) {
                    pathAfterUpload.shift();
                }
                
                // Join the remaining parts and remove file extension
                publicId = pathAfterUpload.join('/').replace(/\.[^/.]+$/, '');
            }
        }

        // Delete with enhanced options
        const result = await cloudinary.uploader.destroy(publicId, {
            invalidate: true, // Invalidate CDN cache
            resource_type: 'auto', // Auto-detect resource type
            type: 'upload', // Specify upload type
        });

        // Also delete any derived resources
        await cloudinary.api.delete_derived_resources(publicId);

        console.log(`Deleted resource with public ID: ${publicId}`);
        return result;
    } catch (error) {
        console.error(`Error deleting resource with URL ${url}:`, error);
        // Don't throw error to prevent account deletion from failing
        console.log('Continuing with account deletion despite image deletion failure');
        return null;
    }
};
