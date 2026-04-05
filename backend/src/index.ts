import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/cumulus',
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Test database connection
pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL'))
  .catch(err => console.error('❌ Database connection error:', err.message));

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Property Endpoints
app.get('/api/properties', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM properties ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

app.get('/api/properties/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM properties WHERE id = $1 OR property_id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching property:', error);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

// User Endpoints
app.get('/api/users/:address/kyc-status', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const result = await pool.query(
      'SELECT wallet_address, kyc_verified, nationality, kyc_verified_at FROM users WHERE wallet_address = $1',
      [address]
    );
    
    if (result.rows.length === 0) {
      return res.json({ kyc_verified: false, message: 'No KYC data found' });
    }
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching KYC status:', error);
    res.status(500).json({ error: 'Failed to fetch KYC status' });
  }
});

app.get('/api/users/:address/portfolio', async (req: Request, res: Response) => {
  try {
    // In production, would query blockchain events + database
    res.json({
      tokens: [],
      total_value: 0,
      maintenance_status: 'current',
    });
  } catch (error: any) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

// Marketplace Endpoints
app.get('/api/listings', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT l.*, p.name as property_name FROM listings l JOIN properties p ON l.property_id = p.id WHERE l.active = true ORDER BY l.listed_at DESC'
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

app.get('/api/listings/property/:propertyId', async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const result = await pool.query(
      'SELECT * FROM listings WHERE property_id = $1 AND active = true ORDER BY listed_at DESC',
      [propertyId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching property listings:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// Maintenance Endpoints
app.get('/api/maintenance/:tokenId', async (req: Request, res: Response) => {
  try {
    const { tokenId } = req.params;
    const result = await pool.query(
      'SELECT * FROM maintenance_payments WHERE token_id = $1 ORDER BY paid_at DESC',
      [tokenId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching maintenance history:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance history' });
  }
});

// Governance Endpoints
app.get('/api/proposals', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT pr.*, p.name as property_name FROM proposals pr JOIN properties p ON pr.property_id = p.id ORDER BY pr.created_at DESC'
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
});

app.get('/api/proposals/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM proposals WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching proposal:', error);
    res.status(500).json({ error: 'Failed to fetch proposal' });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
