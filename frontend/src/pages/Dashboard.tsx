import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  CreditCard,
  Plus,
  ArrowRightLeft,
  ArrowDownToLine,
  X,
  Loader2,
  ExternalLink,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAccount, useWriteContract } from "wagmi";
import { parseUnits, isAddress } from "viem";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import VirtualCard from "@/components/VirtualCard";
import StatCard from "@/components/StatCard";
import TransactionItem from "@/components/TransactionItem";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// ─── Chain config (mirrors Fund.tsx exactly) ──────────────────────────────────
const assetHub = {
  id: 420420417,
  name: "polkadot-hub-testnet",
  network: "polkadot-hub-testnet",
  nativeCurrency: { decimals: 18, name: "PAS", symbol: "PAS" },
  rpcUrls: {
    default: { http: ["https://services.polkadothub-rpc.com/testnet"] },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://blockscout-testnet.polkadot.io/",
    },
  },
} as const;

// ─── Addresses ────────────────────────────────────────────────────────────────
const VAULT_ADDRESS =
  "0x09B072AD3e7a842dcA0Bd410Ed0B2af867F2d66B" as `0x${string}`;

// ─── Vault ABI (only what we need) ───────────────────────────────────────────
const VAULT_ABI = [
  {
    name: "transferInternal",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "withdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────
type ModalType = "transfer" | "withdraw" | null;
type TxStep = "input" | "sending" | "done";

// ─── Viem public client (same helper pattern as Fund.tsx) ─────────────────────
const waitForReceipt = async (hash: `0x${string}`) => {
  const { createPublicClient, http } = await import("viem");
  const publicClient = createPublicClient({
    chain: assetHub,
    transport: http("https://services.polkadothub-rpc.com/testnet"),
  });
  return publicClient.waitForTransactionReceipt({ hash });
};

// ─── Component ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const { writeContractAsync } = useWriteContract();

  // -- Data state --
  const [vaultBalance, setVaultBalance] = useState<number | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [revealedCard, setRevealedCard] = useState<any>(null);
  const [revealing, setRevealing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creatingCard, setCreatingCard] = useState(false);
  const [cardName, setCardName] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);

  // -- Modal state --
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [txStep, setTxStep] = useState<TxStep>("input");
  const [txHash, setTxHash] = useState("");

  // ── Guards ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isConnected) navigate("/");
  }, [isConnected, navigate]);

  useEffect(() => {
    if (address) {
      fetchUserData();
      fetchVaultBalance();
      fetchTransactions();
    }
  }, [address]);

  // ── API helpers ───────────────────────────────────────────────────────────────
  const fetchUserData = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/cards/${address}`
      );
      if (res.ok) {
        setUserData(await res.json());
        setRevealedCard(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchVaultBalance = async () => {
    if (!address) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/${address}/balance`
      );
      if (res.ok) {
        const data = await res.json();
        setVaultBalance(data.balance);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTransactions = async () => {
    if (!address) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/transactions/${address}`
      );
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (e) {
      console.error(e);
    }
  };

  const createCard = async () => {
    if (!cardName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }
    setCreatingCard(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/cards/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: address,
            name: cardName.trim(),
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setUserData(data);
        setRevealedCard(data.card);
        toast({ title: "Success", description: "Card created successfully!" });
      } else {
        const txt = await res.text();
        let msg = "Failed to create card";
        try {
          msg = JSON.parse(txt).error || msg;
        } catch {}
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to create card",
        variant: "destructive",
      });
    } finally {
      setCreatingCard(false);
    }
  };

  const handleReveal = async () => {
    if (revealedCard) {
      setRevealedCard(null);
      return;
    }
    if (!address) return;
    setRevealing(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/cards/${address}/reveal`
      );
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setRevealedCard(json.card);
      setTimeout(() => setRevealedCard(null), 45000);
      toast({
        title: "Card Revealed",
        description: "Details auto-hide in 45s.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Could not reveal card",
        variant: "destructive",
      });
    } finally {
      setRevealing(false);
    }
  };

  // ── Modal helpers ─────────────────────────────────────────────────────────────
  const openModal = (type: ModalType) => {
    setAmount("");
    setRecipient("");
    setTxStep("input");
    setTxHash("");
    setActiveModal(type);
  };

  const closeModal = () => {
    if (txStep === "sending") return; // block accidental close mid-tx
    setActiveModal(null);
    setAmount("");
    setRecipient("");
    setTxStep("input");
    setTxHash("");
  };

  // ── Transfer ─────────────────────────────────────────────────────────────────
  // transferInternal is a pure vault-balance move — no token approval needed.
  const handleTransfer = async () => {
    if (!address) return;
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    if (!isAddress(recipient)) {
      toast({ title: "Invalid recipient address", variant: "destructive" });
      return;
    }

    setTxStep("sending");
    try {
      const hash = await writeContractAsync({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "transferInternal",
        args: [recipient as `0x${string}`, parseUnits(amount, 6)],
        account: address,
        chain: assetHub,
      });

      setTxHash(hash);
      await waitForReceipt(hash);
      setTxStep("done");
      fetchVaultBalance();
    } catch (err: any) {
      console.error("Transfer error:", err);
      toast({
        title: "Transfer failed",
        description: err?.message || "Transaction rejected",
        variant: "destructive",
      });
      setTxStep("input");
    }
  };

  // ── Withdraw ─────────────────────────────────────────────────────────────────
  // Vault sends tokens back to msg.sender — no approval needed.
  const handleWithdraw = async () => {
    if (!address) return;
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    setTxStep("sending");
    try {
      const hash = await writeContractAsync({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "withdraw",
        args: [parseUnits(amount, 6)],
        account: address,
        chain: assetHub,
      });

      setTxHash(hash);
      await waitForReceipt(hash);
      setTxStep("done");
      fetchVaultBalance();
    } catch (err: any) {
      console.error("Withdraw error:", err);
      toast({
        title: "Withdrawal failed",
        description: err?.message || "Transaction rejected",
        variant: "destructive",
      });
      setTxStep("input");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background gradient-mesh flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const hasCard = !!userData;

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <Navbar />

      <main className="pt-24 pb-12 px-6">
        <div className="container max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <p className="text-muted-foreground text-sm">Welcome back</p>
            <h1 className="font-display font-bold text-3xl text-foreground">
              Dashboard
            </h1>
          </motion.div>

          {!hasCard ? (
            /* ── Card creation ── */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Create Your Card
                  </CardTitle>
                  <CardDescription>
                    Get started by creating your first virtual debit card
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={createCard}
                    disabled={creatingCard}
                    className="w-full gap-2"
                  >
                    {creatingCard ? (
                      <>
                        <Loader2 className="animate-spin w-4 h-4" /> Creating
                        Card...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" /> Create Card
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <>
              {/* ── Stat + Action cards ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  label="Available Balance"
                  value={
                    vaultBalance !== null
                      ? `$${vaultBalance.toFixed(2)}`
                      : "Loading..."
                  }
                  icon={DollarSign}
                />
                <StatCard label="Active Cards" value="1" icon={CreditCard} />

                {/* Transfer card */}
                <motion.div
                  whileHover={{ y: -2 }}
                  onClick={() => openModal("transfer")}
                  className="cursor-pointer rounded-xl border border-border bg-card p-5 flex flex-col gap-3 hover:border-blue-500/40 hover:bg-blue-950/20 transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <ArrowRightLeft className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      Transfer
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Send to any address
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground/50 mt-auto">
                    Tap to send →
                  </p>
                </motion.div>

                {/* Withdraw card */}
                <motion.div
                  whileHover={{ y: -2 }}
                  onClick={() => openModal("withdraw")}
                  className="cursor-pointer rounded-xl border border-border bg-card p-5 flex flex-col gap-3 hover:border-fuchsia-500/40 hover:bg-fuchsia-950/20 transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-fuchsia-500/10 flex items-center justify-center">
                    <ArrowDownToLine className="w-4 h-4 text-fuchsia-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      Withdraw
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Cash out stablecoins
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground/50 mt-auto">
                    Tap to withdraw →
                  </p>
                </motion.div>
              </div>

              {/* ── Virtual card + Transactions ── */}
              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <VirtualCard
                    cardNumber={
                      revealedCard?.pan ||
                      (userData?.card?.last_four
                        ? `************${userData.card.last_four}`
                        : "")
                    }
                    name={
                      userData?.card?.cardholder_name ??
                      userData?.user?.name ??
                      "CARDHOLDER"
                    }
                    expiry={
                      revealedCard
                        ? `${revealedCard.exp_month}/${revealedCard.exp_year
                            .toString()
                            .slice(-2)}`
                        : "MM/YY"
                    }
                    cvv={revealedCard?.cvv ?? "•••"}
                    balance="$1,000.00"
                    isRevealed={!!revealedCard}
                    isRevealing={revealing}
                    onRevealToggle={handleReveal}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Transactions</CardTitle>
                      <CardDescription>
                        Your latest card activity
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="glass rounded-xl p-4 space-y-1">
                        {transactions.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-6">
                            No transactions yet.
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
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ────────────────── Transfer / Withdraw Modal ────────────────── */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-full max-w-md glass rounded-2xl p-6 shadow-2xl"
            >

              {/* ── Input step ── */}
              {txStep === "input" && (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          activeModal === "transfer"
                            ? "bg-blue-500/10"
                            : "bg-fuchsia-500/10"
                        }`}
                      >
                        {activeModal === "transfer" ? (
                          <ArrowRightLeft className="w-4 h-4 text-blue-400" />
                        ) : (
                          <ArrowDownToLine className="w-4 h-4 text-fuchsia-400" />
                        )}
                      </div>
                      <div>
                        <h2 className="font-semibold text-foreground">
                          {activeModal === "transfer"
                            ? "Transfer Funds"
                            : "Withdraw Funds"}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {activeModal === "transfer"
                            ? "Move vault balance to another address"
                            : "Withdraw USDT to your connected wallet"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={closeModal}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Recipient — transfer only */}
                  {activeModal === "transfer" && (
                    <div className="mb-4">
                      <label className="text-muted-foreground text-sm block mb-2">
                        Recipient Address
                      </label>
                      <Input
                        placeholder="0x..."
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                  )}

                  {/* Amount — same input style as Fund.tsx */}
                  <div className="mb-2">
                    <label className="text-muted-foreground text-sm block mb-2">
                      Amount (USDT)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xl">
                        $
                      </span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-4 text-foreground font-display text-3xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>

                  {/* Balance hint + max */}
                  {vaultBalance !== null && (
                    <p className="text-xs text-muted-foreground mb-5">
                      Vault balance: ${vaultBalance.toFixed(2)}{" "}
                      <button
                        className="text-primary underline ml-1"
                        onClick={() => setAmount(vaultBalance.toString())}
                      >
                        Max
                      </button>
                    </p>
                  )}

                  <div className="flex gap-3 mt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={closeModal}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="hero"
                      className="flex-1"
                      disabled={
                        !amount ||
                        parseFloat(amount) <= 0 ||
                        (activeModal === "transfer" && !isAddress(recipient))
                      }
                      onClick={
                        activeModal === "transfer"
                          ? handleTransfer
                          : handleWithdraw
                      }
                    >
                      {activeModal === "transfer" ? "Send Now" : "Withdraw"}
                    </Button>
                  </div>
                </>
              )}

              {/* ── Sending / confirming step — mirrors Fund.tsx loading UI ── */}
              {txStep === "sending" && (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                  <h3 className="font-display font-semibold text-foreground text-xl mb-2">
                    {activeModal === "transfer"
                      ? "Sending Transfer"
                      : "Processing Withdrawal"}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Waiting for on-chain confirmation...
                  </p>
                  {txHash && (
                    <p className="text-xs font-mono text-muted-foreground mt-4 truncate px-4">
                      {txHash.slice(0, 22)}...
                    </p>
                  )}
                </div>
              )}

              {/* ── Done step — mirrors Fund.tsx success UI ── */}
              {txStep === "done" && (
                <div className="text-center py-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4"
                  >
                    <Check className="w-8 h-8 text-success" />
                  </motion.div>
                  <h3 className="font-display font-semibold text-foreground text-xl mb-2">
                    {activeModal === "transfer"
                      ? "Transfer Successful!"
                      : "Withdrawal Successful!"}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    ${Number(amount).toLocaleString()} USDT{" "}
                    {activeModal === "transfer"
                      ? `sent to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`
                      : "withdrawn to your wallet"}
                  </p>

                  {txHash && (
                    <div className="bg-secondary rounded-lg p-4 mb-6 text-left">
                      <p className="text-muted-foreground text-xs mb-1">
                        Transaction Hash
                      </p>
                      <a
                        href={`https://blockscout-testnet.polkadot.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                      >
                        <p className="font-mono text-xs text-foreground truncate">
                          {txHash}
                        </p>
                        <ExternalLink className="w-3 h-3 text-primary flex-shrink-0" />
                      </a>
                    </div>
                  )}

                  <Button variant="hero" onClick={closeModal}>
                    Done
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;