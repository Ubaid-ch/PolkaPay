import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Wallet, Shield, Zap, Globe, ArrowRight, CreditCard } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAccount } from 'wagmi';
import { useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import heroCard from "@/assets/hero-card.png";

const Landing = () => {
  const navigate = useNavigate();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected) {
      navigate('/dashboard');
    }
  }, [isConnected, navigate]);

  const features = [
    { icon: Shield, title: "Non-Custodial", desc: "Your keys, your funds. Always." },
    { icon: Zap, title: "Instant Issue", desc: "Virtual cards in seconds." },
    { icon: Globe, title: "Spend Anywhere", desc: "Accepted at 70M+ merchants." },
    { icon: CreditCard, title: "Stablecoin Funded", desc: "USDC/USDT on Polkadot EVM." },
  ];

  return (
    <div className="min-h-screen bg-background gradient-mesh overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="container flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/polkapay-logo-dark.png"
              alt="PolkaPay"
              className="h-14 w-auto"
            />

          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
                Home
              </Button>
            </Link>
            <a href="https://docs.polkapay.app" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
                Docs
              </Button>
            </a>
            <Link to="/faucet">
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
                Faucet 
              </Button>
            </Link>
          </div>

          <ConnectButton />
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="container max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
                <span className="text-sm text-muted-foreground">Live on Polkadot EVM</span>
              </div>

              <h1 className="font-display font-bold text-5xl lg:text-6xl leading-tight mb-6">
                Fund with{" "}
                <span className="text-gradient">stablecoin</span>
                <br />
                Spend{" "}
                <span className="text-gradient">anywhere</span>
              </h1>

              <p className="text-muted-foreground text-lg mb-8 max-w-md leading-relaxed">
                Convert your stablecoins to virtual cards instantly. Non-custodial, private, and accepted worldwide.
              </p>

              <div className="flex flex-wrap gap-4">
                <ConnectButton />
                <Button variant="glass" size="lg" className="gap-2">
                  Learn More
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40, rotateY: -10 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative flex justify-center"
            >
              <div className="relative animate-float">
                <img src={heroCard} alt="PolkaPay virtual debit card" className="w-full max-w-md rounded-2xl" />
                <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-full -z-10" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display font-bold text-3xl mb-4">
              Built for the <span className="text-gradient">future</span> of payments
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Seamless bridge between your on-chain assets and everyday spending.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-xl p-6 hover:border-primary/30 transition-colors group"
              >
                <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4 group-hover:glow-primary transition-shadow">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6 border-t border-border/50">
        <div className="container max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { val: "$12M+", label: "Volume Processed" },
              { val: "5,200+", label: "Cards Issued" },
              { val: "99.9%", label: "Uptime" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <p className="font-display font-bold text-3xl text-gradient mb-1">{s.val}</p>
                <p className="text-muted-foreground text-sm">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/50">
        <div className="container max-w-6xl mx-auto flex justify-between items-center">
          <span className="text-muted-foreground text-sm">© 2026 PolkaPay. All rights reserved.</span>
          <div className="flex gap-4 text-muted-foreground text-sm">
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
