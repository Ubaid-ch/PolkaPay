import { motion } from "framer-motion";
import { Plus, Snowflake, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import VirtualCard from "@/components/VirtualCard";
import { toast } from "sonner";

interface CardData {
  id: string;
  number: string;
  expiry: string;
  name: string;
  balance: string;
  status: "active" | "frozen";
  limit: string;
}

const initialCards: CardData[] = [
  { id: "1", number: "4532 •••• •••• 7891", expiry: "12/27", name: "JOHN DOE", balance: "$2,450.00", status: "active", limit: "$5,000" },
  { id: "2", number: "4532 •••• •••• 3456", expiry: "06/28", name: "JOHN DOE", balance: "$800.00", status: "active", limit: "$2,000" },
  { id: "3", number: "4532 •••• •••• 9012", expiry: "03/27", name: "JOHN DOE", balance: "$0.00", status: "frozen", limit: "$1,000" },
];

const Cards = () => {
  const [cards, setCards] = useState(initialCards);
  const [showCreate, setShowCreate] = useState(false);
  const [newLimit, setNewLimit] = useState("1000");

  const toggleFreeze = (id: string) => {
    setCards(cards.map(c =>
      c.id === id ? { ...c, status: c.status === "active" ? "frozen" : "active" } : c
    ));
    toast.success("Card status updated");
  };

  const createCard = () => {
    const card: CardData = {
      id: Date.now().toString(),
      number: `4532 •••• •••• ${Math.floor(1000 + Math.random() * 9000)}`,
      expiry: "03/29",
      name: "JOHN DOE",
      balance: "$0.00",
      status: "active",
      limit: `$${Number(newLimit).toLocaleString()}`,
    };
    setCards([...cards, card]);
    setShowCreate(false);
    setNewLimit("1000");
    toast.success("New virtual card created!");
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <Navbar connected />

      <main className="pt-24 pb-12 px-6">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center mb-8"
          >
            <div>
              <p className="text-muted-foreground text-sm">Manage</p>
              <h1 className="font-display font-bold text-3xl text-foreground">My Cards</h1>
            </div>
            <Button variant="hero" onClick={() => setShowCreate(!showCreate)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Card
            </Button>
          </motion.div>

          {/* Create Card Form */}
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="glass rounded-xl p-6 mb-8"
            >
              <h3 className="font-display font-semibold text-foreground mb-4">Create New Virtual Card</h3>
              <div className="grid sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="text-muted-foreground text-sm block mb-2">Spending Limit (USD)</label>
                  <input
                    type="number"
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                    min="100"
                    max="50000"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground text-sm block mb-2">Card Type</label>
                  <div className="bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground text-sm">
                    Single-use Virtual Card
                  </div>
                </div>
                <Button variant="hero" onClick={createCard}>
                  Issue Card
                </Button>
              </div>
            </motion.div>
          )}

          {/* Card Grid */}
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {cards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-xl p-5"
              >
                <div className="flex justify-center mb-4">
                  <VirtualCard
                    compact
                    cardNumber={card.number}
                    expiry={card.expiry}
                    name={card.name}
                    balance={card.balance}
                    status={card.status}
                  />
                </div>
                <div className="flex justify-between items-center text-sm mb-3">
                  <span className="text-muted-foreground">Limit: {card.limit}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    card.status === "active" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                  }`}>
                    {card.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="glass" size="sm" className="flex-1 gap-1" onClick={() => toggleFreeze(card.id)}>
                    <Snowflake className="w-3 h-3" />
                    {card.status === "active" ? "Freeze" : "Unfreeze"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setCards(cards.filter(c => c.id !== card.id));
                      toast.success("Card deleted");
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Cards;
