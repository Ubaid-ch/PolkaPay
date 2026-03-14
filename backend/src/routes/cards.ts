import express from 'express';
import { supabase } from '../index.js';
import { createCardWithLithic, getCardDetails } from '../services/lithic.js';

const router = express.Router();

// Create a new card for user
router.post('/create', async (req, res) => {
  try {
    const { walletAddress, name } = req.body;

    if (!walletAddress || !name) {
      return res.status(400).json({ error: 'Wallet address and name are required' });
    }

    // Check if user already has a card
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User already has a card' });
    }

    const lithicCard = await createCardWithLithic(walletAddress, name);

    // Store ONLY safe fields
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        wallet_address: walletAddress,
        name,
        lithic_card_token: lithicCard.token,
        card_last_four: lithicCard.last_four,
        cardholder_name: lithicCard.cardholder_name,
        card_status: 'active',
        created_at: new Date().toISOString(),
        // Do NOT insert pan, cvv, exp_month, exp_year
      })
      .select()
      .single();

    if (userError) {
      console.error('Supabase error:', userError);
      return res.status(500).json({ error: 'Failed to create user record' });
    }

    // Return full details only in this initial response (frontend shows once)
    // Later reveals will use /:token/reveal
    res.json({
      success: true,
      user,
      card: {
        token: lithicCard.token,
        last_four: lithicCard.last_four,
        cardholder_name: lithicCard.cardholder_name,
        status: 'active',
        // sensitive — only sent once after create
        pan: lithicCard.pan,
        cvv: lithicCard.cvv,
        exp_month: lithicCard.exp_month,
        exp_year: lithicCard.exp_year,
      }
    });

  } catch (error) {
    console.error('Card creation error:', error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to create card: ${message}` });
  }
});

// NEW: Reveal endpoint (call when user clicks "Show card details")
router.get('/:walletAddress/reveal', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('lithic_card_token')
      .eq('wallet_address', walletAddress)
      .single();

    if (error || !user?.lithic_card_token) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const cardDetails = await getCardDetails(user.lithic_card_token);

    res.json({ card: cardDetails });
  } catch (error) {
    console.error('Reveal card error:', error);
    res.status(500).json({ error: 'Failed to retrieve card details' });
  }
});

// Get basic card info (already exists — now without sensitive fields)
router.get('/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('wallet_address, name, lithic_card_token, card_last_four, cardholder_name, card_status, created_at')
      .eq('wallet_address', walletAddress)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      card: {
        token: user.lithic_card_token,
        last_four: user.card_last_four,
        cardholder_name: user.cardholder_name,
        status: user.card_status,
      },
      user: {
        name: user.name,
        wallet_address: user.wallet_address,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Get card error:', error);
    res.status(500).json({ error: 'Failed to get card info' });
  }
});

export default router;