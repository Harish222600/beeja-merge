const cloudinary = require('cloudinary').v2;

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const uploadWithRetry = async (file, options, retryCount = 0) => {
    try {
        return await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                options,
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
        console.log('🔧 Starting upload with enhanced options');
        const options = { 
            folder,
            // Add chunked upload for large files
            chunk_size: 6000000, // 6MB chunks
            // Add timeout settings
            timeout: 600000, // 10 minutes
        };

        if (height) options.height = height;
        if (quality) options.quality = quality;

        // Enhanced video upload configuration
        if (file.mimetype && file.mimetype.startsWith('video/')) {
            options.resource_type = 'video';
            console.log('🎥 Video upload detected - using enhanced video configuration');
            
            // Add video-specific optimizations
            options.eager = [
                { streaming_profile: "full_hd", format: "m3u8" } // HLS streaming
            ];
            options.eager_async = true;
            options.eager_notification_url = process.env.CLOUDINARY_NOTIFICATION_URL;
        } else {
            options.resource_type = 'auto';
        }
        
        console.log('📋 Enhanced upload options:', JSON.stringify(options, null, 2));
        
        // Use enhanced upload with retry mechanism
        return await uploadWithRetry(file, options);
    }
    catch (error) {
        console.log("Error while uploading file to Cloudinary");
        console.log(error);
        throw error;
    }
}

// Function to delete a resource by public ID
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

        const result = await cloudinary.uploader.destroy(publicId);
        console.log(`Deleted resource with public ID: ${publicId}`);
        return result;
    } catch (error) {
        console.error(`Error deleting resource with URL ${url}:`, error);
        // Don't throw error to prevent account deletion from failing
        console.log('Continuing with account deletion despite image deletion failure');
        return null;
    }
};
