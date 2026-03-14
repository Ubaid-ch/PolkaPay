# PolkaPay Backend

Backend service for PolkaPay with Supabase and Lithic integration.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Fill in your environment variables:
- **Supabase**: Create a project at [supabase.com](https://supabase.com) and get your URL and anon key
- **Lithic**: Get sandbox API key from [lithic.com](https://lithic.com)

4. Set up Supabase tables:

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  lithic_card_token VARCHAR(255) UNIQUE,
  card_last_four VARCHAR(4),
  card_pan VARCHAR(32),
  card_cvv VARCHAR(4),
  card_exp_month VARCHAR(2),
  card_exp_year VARCHAR(4),
  cardholder_name VARCHAR(255),
  card_status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  lithic_card_token VARCHAR(255) NOT NULL,
  amount DECIMAL(18,6) NOT NULL,
  merchant VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  lithic_transaction_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Running

Development:
```bash
npm run dev
```

Production:
```bash
npm run build
npm start
```

## API Endpoints

### Cards
- `POST /api/cards/create` - Create a new card
- `GET /api/cards/:walletAddress` - Get user's card info

### Users
- `GET /api/users/:walletAddress/balance` - Get user's vault balance

### Transactions
- `POST /api/transactions/simulate` - Simulate a transaction
- `GET /api/transactions/:walletAddress` - Get user's transactions

### Webhooks
- `POST /webhooks/lithic` - Lithic webhook handler

## Smart Contract Integration

The backend integrates with the Vault smart contract for:
- Depositing USDC tokens
- Checking balances
- Handling transaction authorizations

Make sure to deploy the Vault contract and update the contract addresses in `.env`.