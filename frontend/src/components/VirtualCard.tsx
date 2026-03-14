import { motion } from "framer-motion";
import { Eye, EyeOff, Snowflake } from "lucide-react";

interface VirtualCardProps {
  cardNumber: string;
  expiry: string;
  cvv: string;
  name: string;
  balance?: string;
  status?: "active" | "frozen";
  compact?: boolean;
  // Reveal control — owned by parent
  isRevealed: boolean;
  isRevealing?: boolean;
  onRevealToggle: () => void;
}

const maskCardNumber = (pan: string) => {
  if (!pan || pan.length !== 16) return "•••• •••• •••• ••••";
  return pan.match(/.{1,4}/g)!.map((g, i) => (i < 3 ? "••••" : g)).join(" ");
};

const formatCardNumber = (pan: string) => {
  if (!pan || pan.length !== 16) return pan;
  return pan.match(/.{1,4}/g)!.join(" ");
};

const VirtualCard = ({
  cardNumber = "",
  expiry = "MM/YY",
  cvv = "•••",
  name = "CARDHOLDER",
  balance = "$0.00",
  status = "active",
  compact = false,
  isRevealed,
  isRevealing = false,
  onRevealToggle,
}: VirtualCardProps) => {
  const displayedNumber = isRevealed ? formatCardNumber(cardNumber) : maskCardNumber(cardNumber);
  const displayedCVV = isRevealed ? cvv : "•••";
  const displayedExpiry = isRevealed ? expiry : "••/••";

  return (
    <motion.div
      whileHover={{ scale: 1.02, rotateY: 2 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`relative rounded-2xl overflow-hidden gradient-primary p-6 card-shine shadow-xl ${
        compact ? "w-72 h-44" : "w-96 h-56"
      } ${status === "frozen" ? "opacity-70 grayscale-[30%]" : ""}`}
    >
      <div className="relative z-10 flex flex-col justify-between h-full text-white">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white/70 text-xs font-medium tracking-wider">POLKAPAY</p>
            <p className="text-white font-display font-bold text-xl mt-1">{balance}</p>
          </div>
          <div className="flex items-center gap-3">
            {status === "frozen" && <Snowflake className="w-6 h-6 text-white/80" />}
            <button
              onClick={onRevealToggle}
              disabled={isRevealing}
              className="text-white/70 hover:text-white transition-colors focus:outline-none disabled:opacity-50"
              aria-label={isRevealed ? "Hide card details" : "Show card details"}
            >
              {isRevealing ? (
                <div className="w-5 h-5 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
              ) : isRevealed ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div className="mt-auto">
          <p className="font-mono text-white tracking-[0.25em] text-lg md:text-xl mb-4 font-medium">
            {displayedNumber}
          </p>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-white/60 text-xs tracking-wider uppercase">Cardholder</p>
              <p className="text-white text-base font-medium">{name.toUpperCase()}</p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-white/60 text-xs tracking-wider uppercase">Expiry</p>
                <p className="text-white text-base font-mono">{displayedExpiry}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs tracking-wider uppercase">CVV</p>
                <p className="text-white text-base font-mono">{displayedCVV}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VirtualCard;