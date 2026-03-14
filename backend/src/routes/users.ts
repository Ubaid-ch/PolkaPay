import express from 'express';
import { supabase } from '../index.js';
import { getVaultBalance } from "../services/vault.js";
const router = express.Router();



router.get('/:walletAddress/balance', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const balance = await getVaultBalance(walletAddress as `0x${string}`);

    res.json({
      balance: Number(balance) / 1e6
    });

  } catch (error) {
    res.status(500).json({ error: "Failed to fetch balance" });
  }
});

export default router;