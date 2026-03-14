import express from "express";
import { handleLithicWebhook } from "../services/lithic.js";

const router = express.Router();

router.post("/lithic", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const event = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString()) : req.body;
    await handleLithicWebhook(event);
    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;