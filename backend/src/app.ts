import express from 'express';
import cors from 'cors';
import resumeRoutes from './routes/resume';
import reportsRoutes from './routes/reports';
import healthRoutes from './routes/health';
import { config } from './config';

const app = express();

// CORS configuration
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [
      'https://ikigai-career.vercel.app',  // Production frontend
      'http://localhost:8081',             // Development frontend
      'http://localhost:3000'              // Alternative development port
    ];

console.log('Configured CORS Origins:', corsOrigins);
console.log('Raw CORS_ORIGIN env var:', process.env.CORS_ORIGIN);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    console.log('Incoming request origin:', origin);
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked request from origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'Accept'],
  credentials: true,
  maxAge: 86400 // Cache preflight requests for 24 hours
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.use('/api/health', healthRoutes);

// API routes
app.use('/api/resume', resumeRoutes);
app.use('/api/reports', reportsRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`CORS Origin: ${corsOptions.origin}`);
});

export default app; 