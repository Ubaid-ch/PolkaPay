import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  icon: LucideIcon;
  positive?: boolean;
}

const StatCard = ({ label, value, change, icon: Icon, positive = true }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass rounded-xl p-5 hover:border-primary/30 transition-colors"
  >
    <div className="flex items-start justify-between mb-3">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      {change && (
        <span className={`text-xs font-medium ${positive ? "text-success" : "text-destructive"}`}>
          {change}
        </span>
      )}
    </div>
    <p className="text-muted-foreground text-sm">{label}</p>
    <p className="text-foreground font-display font-bold text-2xl mt-1">{value}</p>
  </motion.div>
);

export default StatCard;
