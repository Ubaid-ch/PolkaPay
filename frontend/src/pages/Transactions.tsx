import { motion } from "framer-motion";
import { CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import TransactionItem from "@/components/TransactionItem";
import { useAccount } from "wagmi";

const Transactions = () => {
  const { address } = useAccount();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchTransactions = async () => {
    if (!address) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/transactions/${address}`
      );
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [address]);

  const simulate = async () => {
    setError("");
    setSuccess("");

    if (!address) {
      setError("Please connect your wallet first.");
      return;
    }

    if (!amount || !merchant.trim()) {
      setError("Please fill in both Amount and Merchant.");
      return;
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/transactions/simulate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: address,
            amount: parseFloat(amount),
            merchant: merchant.trim(),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Simulation failed. Check backend logs.");
        return;
      }

      setSuccess(`Transaction simulated: $${amount} at ${merchant}`);
      setAmount("");
      setMerchant("");
      setTimeout(fetchTransactions, 1000);
    } catch (err) {
      console.error("Simulate error:", err);
      setError("Request failed — is the backend running on " + import.meta.env.VITE_API_URL + "?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <Navbar />

      <main className="pt-24 pb-12 px-6">
        <div className="container max-w-4xl mx-auto">

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <h1 className="text-3xl font-bold">Transactions</h1>
            {!address && (
              <p className="text-sm text-destructive mt-1">⚠ Wallet not connected — connect to simulate transactions.</p>
            )}
          </motion.div>

          {/* Simulator */}
          <div className="glass rounded-xl p-4 mb-6 space-y-3">

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-green-400 bg-green-400/10 border border-green-400/30 rounded-lg px-3 py-2">
                ✓ {success}
              </div>
            )}

            <input
              type="number"
              placeholder="Amount (e.g. 25.99)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-input text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-ring"
            />

            <input
              type="text"
              placeholder="Merchant (e.g. Starbucks)"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-input text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-ring"
            />

            <Button
              onClick={simulate}
              disabled={loading || !address}
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Simulating...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Simulate Transaction
                </>
              )}
            </Button>
          </div>

          {/* Transaction List */}
          <div className="glass rounded-xl p-4 space-y-1">
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No transactions yet. Simulate one above.
              </p>
            ) : (
              transactions.map((tx, i) => (
                <TransactionItem
                  key={i}
                  merchant={tx.descriptor}
                  amount={`$${(tx.amount / 100).toFixed(2)}`}
                  date={new Date(tx.created).toLocaleString()}
                  status={tx.status.toLowerCase()}
                />
              ))
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default Transactions;