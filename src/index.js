const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Load env variables
dotenv.config();

// Connect to database
connectDB();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const app = express();
const http = require('http');
const { Server } = require('socket.io');

// Create HTTP server wrapping Express
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Make socket.io instance available globally in req context
app.set('socketio', io);

// Set security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Make req.query writable in Express 5 for express-mongo-sanitize compatibility
app.use((req, res, next) => {
  if (req.query) {
    Object.defineProperty(req, 'query', {
      value: { ...req.query },
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }
  next();
});

// Sanitize data against NoSQL query injection
app.use(mongoSanitize());

// Enable CORS
app.use(cors());

// Parse cookies (used for secure refresh tokens)
app.use(cookieParser());

// Serve static uploads
app.use('/uploads', express.static(uploadDir));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// Health check route
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Authentication API is running. Go to /api-docs for documentation.',
  });
});

// Swagger Documentation Configuration
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Authentication API Documentation',
      version: '1.0.0',
      description: 'MongoDB-backed Node.js Express User Authentication API (Register, Login, Forgot & Reset Password, Profile Management)',
      contact: {
        name: 'Developer Support',
      },
      servers: [
        {
          url: 'http://localhost:5000',
          description: 'Local Development Server',
        },
      ],
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token to access protected routes.',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Mount routers
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));
app.use('/api/images', require('./routes/imageRoutes'));

// Error handling middleware (fallback)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

// Listen on HTTP server containing Socket.io
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
