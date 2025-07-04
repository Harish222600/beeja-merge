const mongoose = require('mongoose');

// MongoDB Atlas connection - requires MONGODB_URL environment variable
const MONGO_URI = process.env.MONGODB_URL;

// MongoDB URI validation and normalization
const validateMongoURI = (uri) => {
    if (!uri) {
        throw new Error('MONGODB_URL environment variable is required');
    }

    try {
        // Basic cleanup
        uri = uri.trim();

        // Check if it's Atlas or local MongoDB
        const isAtlas = uri.includes('mongodb+srv');
        const isLocal = uri.includes('mongodb://');

        if (!isAtlas && !isLocal) {
            throw new Error('Invalid MongoDB URI format. Must start with mongodb:// or mongodb+srv://');
        }

        // Parse the URI to validate its structure
        const url = new URL(uri);
        
        // Ensure protocol is correct
        if (isAtlas && url.protocol !== 'mongodb+srv:') {
            url.protocol = 'mongodb+srv:';
        } else if (isLocal && url.protocol !== 'mongodb:') {
            url.protocol = 'mongodb:';
        }

        // Add database name if not present
        if (!url.pathname || url.pathname === '/') {
            url.pathname = '/learnhub';
        }

        // Return the normalized URI
        return url.toString();
    } catch (error) {
        if (error instanceof TypeError) {
            // URL parsing failed, try basic string manipulation
            let normalizedUri = uri;
            
            // Ensure proper protocol
            if (uri.includes('mongodb+srv')) {
                normalizedUri = normalizedUri.replace(/^mongodb\+srv:?\/?\/?\/?/, 'mongodb+srv://');
            } else {
                normalizedUri = normalizedUri.replace(/^mongodb:?\/?\/?\/?/, 'mongodb://');
            }
            
            // Add database name if missing
            if (!normalizedUri.includes('/learnhub')) {
                const queryIndex = normalizedUri.indexOf('?');
                if (queryIndex !== -1) {
                    normalizedUri = normalizedUri.slice(0, queryIndex) + '/learnhub' + normalizedUri.slice(queryIndex);
                } else {
                    normalizedUri += '/learnhub';
                }
            }
            
            return normalizedUri;
        }
        throw error;
    }
};

// Validate and normalize the MongoDB URI
const VALIDATED_MONGO_URI = validateMongoURI(MONGO_URI);

exports.connectDB = async () => {
  let retries = 5;
  
  const connectWithRetry = async () => {
    try {
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      };

      console.log('Attempting to connect to database...');
      console.log('MongoDB URI:', VALIDATED_MONGO_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
      
      await mongoose.connect(VALIDATED_MONGO_URI, options);
      console.log("Database connected successfully");

      // Create indexes for better performance
      try {
        await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
        await mongoose.connection.db.collection('users').createIndex({ accountType: 1 });
        console.log("Database indexes created successfully");
      } catch (indexError) {
        console.warn("Warning: Could not create indexes:", indexError.message);
      }
      
    } catch (error) {
      console.error("Error while connecting to Database:", {
        message: error.message,
        code: error.code,
        uri: VALIDATED_MONGO_URI.replace(/\/\/.*@/, '//***:***@') // Hide credentials in error logs
      });
      
      if (retries > 0) {
        retries--;
        console.log(`Retrying connection... (${retries} attempts remaining)`);
        // Wait for 5 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
        return connectWithRetry();
      } else {
        console.log("Max retries reached. Exiting...");
        process.exit(1);
      }
    }
  };

  await connectWithRetry();
};
