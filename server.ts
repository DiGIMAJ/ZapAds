import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "ZapAds API is running" });
});

// Paystack Verification Endpoint
app.post("/api/paystack/verify", async (req, res) => {
  const { reference } = req.body;
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    console.error("PAYSTACK_SECRET_KEY is missing in environment variables");
    return res.status(500).json({ error: "Paystack secret key not configured" });
  }

  try {
    console.log(`Verifying Paystack payment: ${reference}`);
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });
    const data = await response.json();
    console.log("Paystack verification response:", data.status ? "Success" : "Failed");
    res.json(data);
  } catch (error) {
    console.error("Paystack verification error:", error);
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

// Paystack Payout (Transfer) Endpoint
app.post("/api/paystack/withdraw", async (req, res) => {
  const { amount, bankCode, accountNumber, userId } = req.body;
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    return res.status(500).json({ error: "Paystack secret key not configured" });
  }

  try {
    // 1. Create Transfer Recipient
    const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "nuban",
        name: `User ${userId}`,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: "NGN",
      }),
    });
    const recipientData = await recipientRes.json();

    if (!recipientData.status) {
      return res.status(400).json(recipientData);
    }

    // 2. Initiate Transfer
    const transferRes = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "balance",
        amount: amount * 100, // kobo
        recipient: recipientData.data.recipient_code,
        reason: "ZapAds Withdrawal",
      }),
    });
    const transferData = await transferRes.json();
    res.json(transferData);
  } catch (error) {
    console.error("Paystack payout error:", error);
    res.status(500).json({ error: "Failed to process withdrawal" });
  }
});

// Vite middleware for development
async function setupVite() {
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production on Vercel, we don't serve static files from Express
    // Vercel handles static files via the "dist" directory and vercel.json routes
    app.get("/api/test", (req, res) => res.json({ message: "API is working" }));
  }
}

// Start server if not on Vercel
if (!process.env.VERCEL) {
  setupVite().then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  });
} else {
  // On Vercel, we still need to serve static files if it's not an API route
  // But Vercel's routing usually handles this.
  // We'll just ensure the app is ready.
  setupVite();
}

export default app;
