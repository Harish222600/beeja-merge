const cloudinary = require('cloudinary').v2;

/**
 * Generate a signed URL for a raw resource (e.g., PDF, DOC) in Cloudinary
 * @param {string} publicId - The public ID of the resource in Cloudinary
 * @param {number} expiresIn - Expiration time in seconds (default 3600 seconds = 1 hour)
 * @returns {string} - Signed URL with expiration
 */
function generateSignedUrl(publicId, expiresIn = 3600) {
  try {
    // For raw resources, use the url method with sign_url option
    const signedUrl = cloudinary.url(publicId, {
      resource_type: 'raw',
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      secure: true
    });
    
    console.log('Generated signed URL for:', publicId, '-> URL:', signedUrl);
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    // Return null if signing fails, so frontend can fall back to regular URL
    return null;
  }
}

module.exports = {
  generateSignedUrl,
};
