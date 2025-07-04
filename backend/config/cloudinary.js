const cloudinary = require("cloudinary").v2;

exports.cloudinaryConnect = () => {
	try {
		cloudinary.config({
			cloud_name: process.env.CLOUD_NAME,
			api_key: process.env.API_KEY,
			api_secret: process.env.API_SECRET,
			// Add timeout and upload configurations
			timeout: 600000, // 10 minutes timeout
			upload_timeout: 600000, // 10 minutes upload timeout
			chunk_size: 6000000, // 6MB chunks for large files
		});
		console.log('Cloudinary connected successfully with extended timeout configuration')
	} catch (error) {
		console.log(error);
	}
};


