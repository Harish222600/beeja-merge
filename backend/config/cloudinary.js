const cloudinary = require("cloudinary").v2;

exports.cloudinaryConnect = () => {
	try {
		cloudinary.config({
			cloud_name: process.env.CLOUD_NAME,
			api_key: process.env.API_KEY,
			api_secret: process.env.API_SECRET,
			secure: true, // Use HTTPS for all URLs
		});
		console.log('Cloudinary connected successfully')
	} catch (error) {
		console.log(error);
	}
};

// Helper function to generate optimized image URLs
exports.getOptimizedImageUrl = (publicId, options = {}) => {
	const {
		width = 'auto',
		height = 'auto',
		quality = 'auto:best',
		format = 'auto',
		crop = 'limit',
		dpr = 'auto'
	} = options;

	return cloudinary.url(publicId, {
		width,
		height,
		quality,
		format,
		crop,
		dpr,
		secure: true,
		fetch_format: 'auto'
	});
};

// Helper function to generate responsive image URLs
exports.getResponsiveImageUrls = (publicId, sizes = [200, 400, 600, 800]) => {
	return sizes.map(size => ({
		url: cloudinary.url(publicId, {
			width: size,
			quality: 'auto:best',
			format: 'auto',
			crop: 'limit',
			secure: true,
			fetch_format: 'auto'
		}),
		width: size
	}));
};


