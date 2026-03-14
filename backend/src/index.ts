import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import { createClient } from '@supabase/supabase-js';
import cardRoutes from './routes/cards.js';
import userRoutes from './routes/users.js';
import transactionRoutes from './routes/transactions.js';
import webhookRoutes from './routes/webhooks.js';

console.log('Starting PolkaPay backend server...');




// console.log('Key loaded:', process.env.LITHIC_API_KEY)
console.log('Environment loaded');

const app = express();
const port = process.env.PORT || 3001;

console.log(`Port: ${port}`);

// Middleware
app.use(cors());
app.use('/webhooks', webhookRoutes);
app.use(express.json());

console.log('Middleware configured');

// Supabase client
console.log('Creating Supabase client...');
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
console.log('Supabase client created');

// Routes
try {
  console.log('Mounting routes...');
  app.use('/api/cards', cardRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/transactions', transactionRoutes);
  
  console.log('Routes mounted successfully');
} catch (error) {
  console.error('Error mounting routes:', error);
  process.exit(1);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

console.log('Starting server...');
app.listen(port, () => {
  console.log(`🚀 Backend server running on port ${port}`);
}).on('error', (error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});