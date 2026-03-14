import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ArrowDown, Check, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { useWriteContract, useAccount, useReadContract } from "wagmi";
import { parseUnits } from "viem";
import { erc20Abi } from "viem";


const VAULT_ADDRESS = "0x09B072AD3e7a842dcA0Bd410Ed0B2af867F2d66B" as `0x${string}`;

// You need to verify this is the correct USDC address on Polkadot testnet
const USDC_ADDRESS = "0xeEe940Dea709D1261f5A0A0A91FBC8CD3F0144Ff" as `0x${string}`;

const VAULT_ABI = [
  {
    name: "deposit",
    type: "function",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
] as const;

const assetHub = {
  id: 420420417,
  name: 'polkadot-hub-testnet',
  network: 'polkadot-hub-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'PAS',
    symbol: 'PAS',
  },
  rpcUrls: {
    default: {
      http: ['https://services.polkadothub-rpc.com/testnet'],
    },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://blockscout-testnet.polkadot.io/' },
  },
} as const;

const Fund = () => {
  const { writeContractAsync } = useWriteContract();
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"input" | "approving" | "depositing" | "done">("input");
  const [txHash, setTxHash] = useState("");
  const [needsApproval, setNeedsApproval] = useState(true);

  // Check current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, VAULT_ADDRESS] : undefined,
     chainId: assetHub.id,
  });

  // Update needsApproval when allowance or amount changes
  useEffect(() => {
    if (allowance && amount) {
      try {
        const amountUSDC = parseUnits(amount, 6);
        setNeedsApproval(allowance < amountUSDC);
      } catch (error) {
        // Invalid amount
        setNeedsApproval(true);
      }
    } else {
      setNeedsApproval(true);
    }
  }, [allowance, amount]);

  const presets = ["100", "250", "500", "1000"];

  const handleApprove = async () => {
  if (!amount || parseFloat(amount) <= 0) {
    toast.error("Please enter a valid amount");
    return;
  }

  const amountUSDC = parseUnits(amount, 6);
  setStep("approving");

  try {
    const approveTxHash = await writeContractAsync({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "approve",
      args: [VAULT_ADDRESS, amountUSDC],
      account: address,
      chain: assetHub,
    });

    toast.success("Approval submitted! Waiting for confirmation...");

    const { createPublicClient, http } = await import("viem");
    const publicClient = createPublicClient({
      chain: assetHub,
      transport: http("https://services.polkadothub-rpc.com/testnet"),
    });

    await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
    toast.success("Approval confirmed! Proceeding to deposit...");

    
    setStep("depositing");
    const hash = await writeContractAsync({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: "deposit",
      args: [amountUSDC],
      account: address,
      chain: assetHub,
    });

    setTxHash(hash);
    setStep("done");
    toast.success("Deposit successful!");

  } catch (error: any) {
    console.error("Approval/deposit error:", error);
    toast.error(error?.message || "Transaction failed");
    setStep("input");
  }
};
  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      setStep("input");
      return;
    }

    const amountUSDC = parseUnits(amount, 6);

    setStep("depositing");
    
    try {
      const hash = await writeContractAsync({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "deposit",
        args: [amountUSDC],
        account: address,
        chain: assetHub,
      });

      setTxHash(hash);
      setStep("done");
      toast.success("Deposit successful!");
      
    } catch (error: any) {
      console.error("Deposit error:", error);
      toast.error(error?.message || "Deposit failed");
      setStep("input");
    }
  };

  const handleSubmit = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (needsApproval) {
      await handleApprove();
    } else {
      await handleDeposit();
    }
  };

  const getButtonText = () => {
    if (!address) return "Connect Wallet";
    if (!amount || parseFloat(amount) <= 0) return "Enter Amount";
    if (step === "approving") return "Approving...";
    if (step === "depositing") return "Depositing...";
    return needsApproval ? "Approve USDC" : "Deposit USDC";
  };

  const isButtonDisabled = () => {
    return !address || !amount || parseFloat(amount) <= 0 || step === "approving" || step === "depositing";
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <Navbar />

      <main className="pt-24 pb-12 px-6">
        <div className="container max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 20 }}>
            <p className="text-muted-foreground text-sm">Deposit</p>
            <h1 className="font-display font-bold text-3xl text-foreground mb-8">Fund Your Account</h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 20 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-8"
          >
            {step === "input" && (
              <>
                <div className="text-center mb-8">
                  <p className="text-muted-foreground text-sm mb-2">From Wallet</p>
                  <div className="inline-flex items-center gap-2 bg-secondary rounded-full px-4 py-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span className="font-mono text-sm text-foreground">
                      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-muted-foreground text-sm block mb-2">Amount (USDC)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xl">$</span>
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

                <div className="flex gap-2 mb-8">
                  {presets.map((p) => (
                    <button
                      key={p}
                      onClick={() => setAmount(p)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        amount === p ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      ${p}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 bg-secondary/50 rounded-lg p-4 mb-6">
                  <ArrowDown className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">Deposit to PolkaPay Vault</p>
                    <p className="text-xs text-muted-foreground">
                      {needsApproval 
                        ? "Step 1: Approve USDC spending • Step 2: Deposit"
                        : "Gas fees estimated: ~$0.02"}
                    </p>
                  </div>
                </div>

                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full" 
                  onClick={handleSubmit}
                  disabled={isButtonDisabled()}
                >
                  {getButtonText()}
                </Button>
              </>
            )}

            {(step === "approving" || step === "depositing") && (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                <h3 className="font-display font-semibold text-foreground text-xl mb-2">
                  {step === "approving" ? "Approving USDC" : "Depositing Funds"}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {step === "approving" 
                    ? "Please confirm the approval in your wallet..." 
                    : "Waiting for on-chain confirmation..."}
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  {step === "approving" 
                    ? "This one-time approval allows the vault to spend your USDC"
                    : "Transaction submitted, waiting for confirmation"}
                </p>
              </div>
            )}

            {step === "done" && (
              <div className="text-center py-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4"
                >
                  <Check className="w-8 h-8 text-success" />
                </motion.div>
                <h3 className="font-display font-semibold text-foreground text-xl mb-2">Deposit Successful!</h3>
                <p className="text-muted-foreground text-sm mb-6">${Number(amount).toLocaleString()} USDC deposited</p>

                {txHash && (
                  <div className="bg-secondary rounded-lg p-4 mb-6 text-left">
                    <p className="text-muted-foreground text-xs mb-1">Transaction Hash</p>
                    <a 
                      href={`https://blockscout-testnet.polkadot.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      <p className="font-mono text-xs text-foreground truncate">{txHash}</p>
                      <ExternalLink className="w-3 h-3 text-primary flex-shrink-0" />
                    </a>
                  </div>
                )}

                <Button 
                  variant="hero" 
                  onClick={() => { 
                    setStep("input"); 
                    setAmount("");
                    refetchAllowance();
                  }}
                >
                  Make Another Deposit
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Fund;