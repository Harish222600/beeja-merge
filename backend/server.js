require('dotenv').config(); 
const express = require('express')
const app = express();
const http = require('http');
const socketIo = require('socket.io');

// Create HTTP server
const server = http.createServer(app);

// packages
// const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// connection to DB and cloudinary
const { connectDB } = require('./config/database');
const { cloudinaryConnect } = require('./config/cloudinary');

// routes
const userRoutes = require('./routes/user');
const profileRoutes = require('./routes/profile');
const paymentRoutes = require('./routes/payments');
const courseRoutes = require('./routes/course');
const adminRoutes = require('./routes/admin');
const studentProgressRoutes = require('./routes/admin/studentProgress');
const courseAccessRoutes = require('./routes/courseAccess');
const quizRoutes = require('./routes/quiz');
const certificateRoutes = require('./routes/certificate');
const notificationRoutes = require('./routes/notification');
const contactMessageRoutes = require('./routes/contactMessage');
const featuredCoursesRoutes = require('./routes/featuredCourses');
const faqRoutes = require('./routes/faq.js');
const userAnalyticsRoutes = require('./routes/userAnalytics');
const chatRoutes = require('./routes/chat');
const jobRoutes = require('./routes/jobs');
const jobApplicationRoutes = require('./routes/jobApplications');

// middleware 
app.use(cookieParser());

// CORS configuration
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'], // Frontend URLs
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Socket.io configuration
const io = socketIo(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Socket.io connection handling
const jwt = require('jsonwebtoken');
const Chat = require('./models/chat');
const Message = require('./models/message');

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Authenticate socket connection
    socket.on('authenticate', async (token) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.userRole = decoded.accountType;
            
            // Join user-specific room for notifications
            socket.join(decoded.id);
            
            console.log(`User ${decoded.id} authenticated with role ${decoded.accountType} and joined personal room`);
            socket.emit('authenticated', { success: true });
        } catch (error) {
            console.error('Socket authentication failed:', error);
            socket.emit('authentication_error', { message: 'Invalid token' });
        }
    });

    // Join chat room
    socket.on('join_chat', async (chatId) => {
        try {
            if (!socket.userId) {
                socket.emit('error', { message: 'Not authenticated' });
                return;
            }

            // Verify user has access to this chat
            const chat = await Chat.findById(chatId);
            if (!chat) {
                socket.emit('error', { message: 'Chat not found' });
                return;
            }

            const hasAccess = chat.student.toString() === socket.userId || 
                            chat.instructor.toString() === socket.userId || 
                            socket.userRole === 'Admin';

            if (!hasAccess) {
                socket.emit('error', { message: 'Access denied' });
                return;
            }

            socket.join(chatId);
            console.log(`User ${socket.userId} joined chat ${chatId}`);
            socket.emit('joined_chat', { chatId });

        } catch (error) {
            console.error('Error joining chat:', error);
            socket.emit('error', { message: 'Error joining chat' });
        }
    });

    // Leave chat room
    socket.on('leave_chat', (chatId) => {
        socket.leave(chatId);
        console.log(`User ${socket.userId} left chat ${chatId}`);
    });

    // Handle new message
    socket.on('send_message', async (data) => {
        try {
            const { chatId, content, messageType = 'text' } = data;

            if (!socket.userId) {
                socket.emit('error', { message: 'Not authenticated' });
                return;
            }

            // Verify chat access
            const chat = await Chat.findById(chatId);
            if (!chat) {
                socket.emit('error', { message: 'Chat not found' });
                return;
            }

            const hasAccess = chat.student.toString() === socket.userId || 
                            chat.instructor.toString() === socket.userId || 
                            socket.userRole === 'Admin';

            if (!hasAccess) {
                socket.emit('error', { message: 'Access denied' });
                return;
            }

            // Create and save message
            const message = new Message({
                chat: chatId,
                sender: socket.userId,
                messageType,
                content
            });

            await message.save();

            // Update chat's last message
            await Chat.findByIdAndUpdate(chatId, {
                lastMessage: message._id,
                lastMessageTime: new Date()
            });

            // Populate message for broadcasting
            const populatedMessage = await Message.findById(message._id)
                .populate('sender', 'firstName lastName image');

            // Broadcast to all users in the chat room
            io.to(chatId).emit('new_message', populatedMessage);

            console.log(`Message sent in chat ${chatId} by user ${socket.userId}`);

        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', { message: 'Error sending message' });
        }
    });

    // Handle typing indicators
    socket.on('typing_start', (chatId) => {
        socket.to(chatId).emit('user_typing', { userId: socket.userId, typing: true });
    });

    socket.on('typing_stop', (chatId) => {
        socket.to(chatId).emit('user_typing', { userId: socket.userId, typing: false });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Make io available to routes
app.set('io', io);

// Body parser middleware with increased limits
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Increase timeout for large uploads
app.use((req, res, next) => {
    res.setTimeout(300000); // 5 minutes timeout
    next();
});

// Log all incoming requests (after body parsing)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request Body:', req.body);
    }
    next();
});

// mount routes
app.use('/api/v1/auth', userRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/course', courseRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/admin', studentProgressRoutes);
app.use('/api/v1/course-access', courseAccessRoutes);
app.use('/api/v1/quiz', quizRoutes);
app.use('/api/v1/certificate', certificateRoutes);
app.use('/api/v1/notification', notificationRoutes);
app.use('/api/v1/contact', contactMessageRoutes);
app.use('/api/v1/featured-courses', featuredCoursesRoutes);
// FAQ Routes
app.use('/api/v1/faqs', faqRoutes);
// User Analytics Routes
app.use('/api/v1/user', userAnalyticsRoutes);
// Chat Routes
app.use('/api/v1/chat', chatRoutes);
// Job Routes
app.use('/api/v1/jobs', jobRoutes);
// Job Application Routes
app.use('/api/v1/job-applications', jobApplicationRoutes);

// Default Route
app.get('/', (req, res) => {
    res.send(`<div>
        This is Default Route  
        <p>Everything is OK</p>
    </div>`);
});

// Error handling middleware for Multer errors and others
app.use((err, req, res, next) => {
    console.error('Global error handler caught:', err);
    
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size is too large. Maximum limit is 500MB.' });
        }
        return res.status(400).json({ error: err.message });
    }
    
    // Only handle errors that haven't been handled by route controllers
    if (!res.headersSent) {
        console.error('Unhandled error:', err);
        res.status(500).json({ 
            error: 'An internal server error occurred.',
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// connections
connectDB();
cloudinaryConnect();

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Server Started on PORT ${PORT}`);
    console.log(`Socket.IO server is running on http://localhost:${PORT}`);
});
