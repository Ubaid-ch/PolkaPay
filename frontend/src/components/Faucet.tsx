import { useState } from "react";
import { motion } from "framer-motion";
import { Droplets, ExternalLink, Check, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { useWriteContract, useAccount } from "wagmi";
import { parseUnits, isAddress } from "viem";

// ─── Chain config ─────────────────────────────────────────────────────────────
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

// ─── Mock USDT ────────────────────────────────────────────────────────────────
const TOKEN_ADDRESS =
  "0xeEe940Dea709D1261f5A0A0A91FBC8CD3F0144Ff" as `0x${string}`;

const TOKEN_ABI = [
  {
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

// ─── Presets ──────────────────────────────────────────────────────────────────
const PRESETS = ["100", "500", "1000", "5000"];

type Step = "input" | "minting" | "done";

// ─── Component ────────────────────────────────────────────────────────────────
const Faucet = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [amount, setAmount] = useState("1000");
  const [recipient, setRecipient] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [txHash, setTxHash] = useState("");

  // Use connected wallet if recipient is blank
  const resolvedRecipient = recipient.trim() || connectedAddress;

  const isRecipientValid =
    resolvedRecipient && isAddress(resolvedRecipient as string);

  const isDisabled =
    !isConnected ||
    !amount ||
    parseFloat(amount) <= 0 ||
    !isRecipientValid ||
    step === "minting";

  // ── Viem receipt poller ────────────────────────────────────────────────────
  const waitForReceipt = async (hash: `0x${string}`) => {
    const { createPublicClient, http } = await import("viem");
    const client = createPublicClient({
      chain: assetHub,
      transport: http("https://services.polkadothub-rpc.com/testnet"),
    });
    return client.waitForTransactionReceipt({ hash });
  };

  // ── Mint ───────────────────────────────────────────────────────────────────
  const handleMint = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!isRecipientValid) {
      toast.error("Enter a valid recipient address");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    // Mock USDT uses 6 decimals (same as real USDT)
    const parsedAmount = parseUnits(amount, 6);

    setStep("minting");
    try {
      const hash = await writeContractAsync({
        address: TOKEN_ADDRESS,
        abi: TOKEN_ABI,
        functionName: "mint",
        args: [resolvedRecipient as `0x${string}`, parsedAmount],
        account: connectedAddress,
        chain: assetHub,
      });

      setTxHash(hash);
      toast.success("Transaction submitted! Waiting for confirmation...");

      await waitForReceipt(hash);

      setStep("done");
      toast.success(`${Number(amount).toLocaleString()} mock USDT minted!`);
    } catch (err: any) {
      console.error("Mint error:", err);
      toast.error(err?.shortMessage || err?.message || "Transaction failed");
      setStep("input");
    }
  };

  const reset = () => {
    setStep("input");
    setTxHash("");
    setAmount("1000");
    setRecipient("");
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <Navbar />

      <main className="pt-24 pb-12 px-6">
        <div className="container max-w-lg mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <p className="text-muted-foreground text-sm">Testnet</p>
            <h1 className="font-display font-bold text-3xl text-foreground">
              Mock USDT Faucet
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Mint mock USDT tokens to any address for testing on Polkadot
              AssetHub testnet.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-8"
          >
            {/* ── Input step ── */}
            {step === "input" && (
              <>
                {/* Connected wallet badge */}
                <div className="text-center mb-8">
                  <p className="text-muted-foreground text-sm mb-2">
                    Connected Wallet
                  </p>
                  <div className="inline-flex items-center gap-2 bg-secondary rounded-full px-4 py-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isConnected ? "bg-success" : "bg-destructive"
                      }`}
                    />
                    <span className="font-mono text-sm text-foreground">
                      {isConnected && connectedAddress
                        ? `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`
                        : "Not connected"}
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="mb-4">
                  <label className="text-muted-foreground text-sm block mb-2">
                    Amount (mock USDT)
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
                      min="1"
                      step="1"
                      className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-4 text-foreground font-display text-3xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                {/* Presets */}
                <div className="flex gap-2 mb-6">
                  {PRESETS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setAmount(p)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        amount === p
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      ${p}
                    </button>
                  ))}
                </div>

                {/* Recipient */}
                <div className="mb-6">
                  <Label className="text-muted-foreground text-sm mb-2 block">
                    Recipient Address{" "}
                    <span className="text-muted-foreground/50">
                      (leave blank to use your wallet)
                    </span>
                  </Label>
                  <Input
                    placeholder={
                      connectedAddress
                        ? `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)} (your wallet)`
                        : "0x..."
                    }
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="font-mono text-sm"
                  />
                  {recipient && !isAddress(recipient) && (
                    <p className="text-xs text-destructive mt-1">
                      Invalid address format
                    </p>
                  )}
                </div>

                {/* Info banner */}
                <div className="flex items-center gap-3 bg-secondary/50 rounded-lg p-4 mb-6">
                  <Droplets className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      Minting on Polkadot AssetHub Testnet
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Token:{" "}
                      <span className="font-mono">
                        {TOKEN_ADDRESS.slice(0, 8)}...{TOKEN_ADDRESS.slice(-6)}
                      </span>{" "}
                      · 6 decimals
                    </p>
                  </div>
                </div>

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full gap-2"
                  onClick={handleMint}
                  disabled={isDisabled}
                >
                  <Droplets className="w-4 h-4" />
                  {!isConnected
                    ? "Connect Wallet First"
                    : `Mint ${amount ? `$${Number(amount).toLocaleString()}` : ""} mock USDT`}
                </Button>
              </>
            )}

            {/* ── Minting step ── */}
            {step === "minting" && (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                <h3 className="font-display font-semibold text-foreground text-xl mb-2">
                  Minting tokens...
                </h3>
                <p className="text-muted-foreground text-sm">
                  Waiting for on-chain confirmation on AssetHub testnet
                </p>
                {txHash && (
                  <p className="text-xs font-mono text-muted-foreground mt-4 truncate px-4">
                    {txHash.slice(0, 24)}...
                  </p>
                )}
              </div>
            )}

            {/* ── Done step ── */}
            {step === "done" && (
              <div className="text-center py-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4"
                >
                  <Check className="w-8 h-8 text-success" />
                </motion.div>
                <h3 className="font-display font-semibold text-foreground text-xl mb-2">
                  Tokens Minted!
                </h3>
                <p className="text-muted-foreground text-sm mb-1">
                  ${Number(amount).toLocaleString()} mock USDT sent to
                </p>
                <p className="font-mono text-xs text-foreground mb-6">
                  {(resolvedRecipient as string).slice(0, 10)}...
                  {(resolvedRecipient as string).slice(-8)}
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

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={reset}>
                    Mint More
                  </Button>
                  <Button variant="hero" className="flex-1" onClick={() => window.location.href = "/fund"}>
                    Deposit to Vault
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Faucet;