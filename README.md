# PolkaPay - Virtual Cards Powered by Stablecoins

<p align="center">
<picture>
    <source media="(prefers-color-scheme: dark)" srcset="./frontend/public/polkapay-logo-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="./frontend/public/polkapay-logo.png">
    <img src="./frontend/public/polkapay-logo-dark.png" width="400">
  </picture>
</p>

A decentralized debit card platform built on Polkadot EVM, featuring smart contract vaults, Lithic card processing, and seamless crypto-to-fiat transactions.

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + RainbowKit + Wagmi
- **Backend**: Node.js + Express + TypeScript + Supabase + Lithic API
- **Smart Contracts**: Solidity + Foundry (Vault for token management)
- **Database**: Supabase (PostgreSQL)
- **Card Processing**: Lithic (sandbox for testing)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Foundry (for smart contracts)
- Supabase account
- Lithic sandbox account

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd polkapay
npm run install:all
```

2. **Set up Supabase:**
   - Create a new project at [supabase.com](https://supabase.com)
   - Get your project URL and anon key
   - Run the SQL setup in `backend/README.md`

3. **Set up Lithic:**
   - Create a sandbox account at [lithic.com](https://lithic.com)
   - Get your API key

4. **Configure environment variables:**
   - Copy `backend/.env.example` to `backend/.env`
   - Fill in your Supabase and Lithic credentials
   - The frontend `.env` is already configured

5. **Deploy smart contracts:**
```bash
cd contracts
forge install
forge build
# Deploy to testnet (update RPC in foundry.toml)
forge script script/DeployVault.s.sol --rpc-url <your-rpc> --broadcast
```

6. **Start development servers:**
```bash
# Option 1: Basic concurrent run (no auto-restart)
npm run dev

# Option 2: Auto-restart on file changes (recommended)
npm run dev:watch
```

The `dev:watch` command will automatically restart frontend/backend when you save files in either `frontend/src/` or `backend/src/`.

## 📁 Project Structure

```
polkapay/
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── pages/      # Route pages
│   │   └── hooks/      # Custom hooks
│   └── .env            # Frontend env vars
├── backend/            # Express backend
│   ├── src/
│   │   ├── routes/     # API routes
│   │   └── services/   # External integrations
│   └── .env            # Backend env vars
├── contracts/          # Foundry smart contracts
│   ├── src/            # Contract source
│   └── script/         # Deployment scripts
└── package.json        # Root scripts
```

## 🔄 User Flow

1. **Connect Wallet**: User connects their wallet via RainbowKit
2. **Create Card**: User provides name to create virtual debit card via Lithic
3. **Get Test Tokens**: User claims mock USDC from faucet
4. **Deposit to Vault**: Tokens are deposited into the smart contract vault
5. **Make Transactions**: Simulate card transactions via Lithic sandbox
6. **View Balance**: Real-time balance updates from vault contract
7. **Transfer**: Transfer stablecoins to other address in Vault contract
8. **Withdraw**: Withdraw stablecoins from Vault smart contract

## 🛠️ Development

### Frontend
```bash
cd frontend
npm run dev
```

### Backend
```bash
cd backend
npm run dev
```

### Smart Contracts
```bash
cd contracts
forge test
forge build
```

## 🔧 API Endpoints

### Cards
- `POST /api/cards/create` - Create new card
- `GET /api/cards/:walletAddress` - Get card info
- `GET /api/cards/:walletAddress/reveal` - Reveal Card Details

### Transactions
- `POST /api/transactions/simulate` - Simulate transaction
- `GET /api/transactions/:walletAddress` - Get transaction history

### Users
- `GET /api/users/:walletAddress/balance` - Get vault balance

## 📊 Database Schema

### Users Table
```sql
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
```



## 🔐 Environment Variables

### Backend (.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
LITHIC_API_KEY=your_lithic_key
VAULT_CONTRACT_ADDRESS=deployed_vault_address
USDC_CONTRACT_ADDRESS=usdc_address
RPC_URL=testnet_rpc_url
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
```

## 🚀 Deployment

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Deploy dist/ to your hosting service
```

### Smart Contracts
```bash
cd contracts
forge script script/DeployVault.s.sol --rpc-url <mainnet-rpc> --broadcast --verify
```

## 🧪 Testing

### Frontend
```bash
cd frontend
npm test
```

### Smart Contracts
```bash
cd contracts
forge test
```

## 📝 License

MIT License - see LICENSE file for details.


