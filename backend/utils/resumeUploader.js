const cloudinary = require('cloudinary').v2;
const path = require('path');

exports.uploadResumeToCloudinary = async (file, folder, height, quality) => {
  // Get file extension from original filename
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const fileName = path.basename(file.originalname, fileExtension);
  
  const options = { 
    folder,
    resource_type: "raw", // Important for PDF and document files
    use_filename: true,
    unique_filename: false, // Keep original filename structure
    public_id: `${fileName}_${Date.now()}${fileExtension}`, // Preserve extension
    type: "upload", // Ensure it's an upload type
    access_mode: "public" // Keep as public for now to avoid auth issues
  };
  
  if (height) {
    options.height = height;
    options.crop = "scale";
  }
  if (quality) {
    options.quality = quality;
  }

  console.log('Uploading resume with options:', {
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    extension: fileExtension,
    publicId: options.public_id
  });

  // For multer memory storage, we need to upload from buffer
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('Cloudinary upload success:', {
            public_id: result.public_id,
            secure_url: result.secure_url,
            format: result.format,
            resource_type: result.resource_type
          });
          resolve(result);
        }
      }
    ).end(file.buffer);
  });
};
