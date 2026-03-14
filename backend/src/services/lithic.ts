import Lithic from 'lithic';
import { lockFunds, settleFunds } from "./vault";
import { supabase } from "../index.js";
import { keccak256, stringToBytes } from 'viem';

let _lithic: Lithic | null = null;

function getLithic(): Lithic {
  if (!_lithic) {
    _lithic = new Lithic({
      apiKey: process.env.LITHIC_API_KEY,
      environment: 'sandbox',
    });
  }
  return _lithic;
}

// Create card → returns only what we need to store + temporary full details for initial display if desired
export async function createCardWithLithic(walletAddress: string, name: string) {
  try {
    const card = await getLithic().cards.create({
      type: 'VIRTUAL',
      memo: `PolkaPay Card for ${name}`,
      spend_limit: 100000, // $1000 in cents
      spend_limit_duration: 'MONTHLY',
      state: 'OPEN',
      // If you get 422 missing program_token → add: card_program_token: "your_program_token_from_dashboard"
    });

    return {
      token: card.token,
      last_four: card.last_four,
      cardholder_name: name,
      // Return full sensitive data ONLY for the create response (frontend can show once)
      // Do NOT store these
      pan: card.pan,
      cvv: card.cvv,
      exp_month: card.exp_month,
      exp_year: card.exp_year,
      status: card.state,
      memo: card.memo,
    };
  } catch (error) {
    console.error('Lithic card creation error:', error);
    throw error;
  }
}

// NEW: Retrieve full card details on demand (for reveal)
export async function getCardDetails(cardToken: string) {
  try {
    const card = await getLithic().cards.retrieve(cardToken);

    return {
      pan: card.pan,
      cvv: card.cvv,
      exp_month: card.exp_month,
      exp_year: card.exp_year,
      last_four: card.last_four,
      status: card.state,
      // add others if needed: memo, etc.
    };
  } catch (error) {
    console.error('Lithic get card error:', error);
    throw error;
  }
}



const lithicHeaders = () => ({
  Authorization: process.env.LITHIC_API_KEY!,
  "Content-Type": "application/json",
});
export async function simulateFullTransaction(cardToken: string, amount: number, merchant: string) {
  const amountCents = Math.round(amount * 100);
  const cardDetails = await getCardDetails(cardToken);

  const authRes = await fetch("https://sandbox.lithic.com/v1/simulate/authorize", {
    method: "POST",
    headers: lithicHeaders(),
    body: JSON.stringify({ amount: amountCents, descriptor: merchant, pan: cardDetails.pan }),
  });

  if (!authRes.ok) throw new Error("Authorization failed: " + await authRes.text());
  return await authRes.json(); // just return the pending tx, clearing happens after lockFunds
}

async function simulateClearing(txToken: string, amountCents: number) {
  const clearRes = await fetch("https://sandbox.lithic.com/v1/simulate/clearing", {
    method: "POST",
    headers: lithicHeaders(),
    body: JSON.stringify({ token: txToken, amount: amountCents }),
  });

  if (!clearRes.ok) throw new Error("Clearing failed: " + await clearRes.text());
  return await clearRes.json();
}



// Webhook handler
export async function handleLithicWebhook(event: any) {
  console.log("Lithic webhook received →", JSON.stringify(event, null, 2).slice(0, 600));

  const tx = event.data || event;
  const cardToken = tx.card_token;

  const { data: user } = await supabase
    .from("users")
    .select("wallet_address")
    .eq("lithic_card_token", cardToken)
    .single();

  if (!user) {
    console.log("No user found for card_token:", cardToken);
    return;
  }

  const wallet = user.wallet_address as `0x${string}`;
  const authId = keccak256(stringToBytes(tx.token)) as `0x${string}`;
  const amount = BigInt(tx.amount)  * 10000n;

  const lastEvent = tx.events?.[tx.events.length - 1] || { type: tx.status || "" };

  // AUTHORIZATION → lock funds
  if (lastEvent.type === "AUTHORIZATION" && (lastEvent.result === "APPROVED" || tx.status === "AUTHORIZED")) {
    console.log(`Locking ${amount} for wallet ${wallet}`);
    await lockFunds(wallet, authId, amount);
    await simulateClearing(tx.token, tx.amount);
  }

  // CLEARING → settle to treasury
  if (lastEvent.type === "CLEARING" || tx.status === "SETTLED") {
    console.log(`Settling to treasury`);
    await settleFunds(authId, process.env.TREASURY_ADDRESS as `0x${string}`);
  }
}