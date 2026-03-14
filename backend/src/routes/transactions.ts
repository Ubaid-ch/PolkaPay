import express from "express";
import { supabase } from "../index.js";
import { simulateFullTransaction } from "../services/lithic.js";

const router = express.Router();
// simulate transaction
router.post("/simulate", async (req, res) => {
  try {
    const { walletAddress, amount, merchant } = req.body;

    if (!walletAddress || !amount || !merchant) {
      return res.status(400).json({ error: "Missing walletAddress, amount, or merchant" });
    }

    // Get user and card token
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("lithic_card_token")
      .eq("wallet_address", walletAddress)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: "User not found or no Lithic card associated" });
    }

    const cardToken = user.lithic_card_token;

    if (!cardToken) {
      return res.status(400).json({ error: "User has no Lithic card token" });
    }

    // ✅ Simulate full transaction
    const tx = await simulateFullTransaction(cardToken, parseFloat(amount), merchant.trim());

    res.json({ transaction: tx });
  } catch (err: any) {
    console.error("Simulation failed:", err);
    res.status(500).json({ error: err.message || "Simulation failed" });
  }
});
// Fetch all transactions for a wallet
router.get("/:walletAddress", async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const { data: user } = await supabase
      .from("users")
      .select("lithic_card_token")
      .eq("wallet_address", walletAddress)
      .single();

    if (!user || !user.lithic_card_token) {
      return res.status(404).json({ error: "User not found or card not assigned" });
    }

    const response = await fetch(
      `https://sandbox.lithic.com/v1/transactions?card_token=${user.lithic_card_token}`,
      {
        headers: { Authorization: process.env.LITHIC_API_KEY! },
      }
    );

    const data = await response.json();
    res.json({ transactions: data.data || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

export default router;