import { ArrowUpRight, ArrowDownLeft, ShoppingBag } from "lucide-react";

interface TransactionItemProps {
  merchant: string;
  amount: string;
  date: string;
  status: string;
}

const TransactionItem = ({ merchant, amount, date, status }: TransactionItemProps) => {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-secondary/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-muted-foreground"/>
        </div>
        <div>
          <p className="text-sm font-medium">{merchant}</p>
          <p className="text-xs text-muted-foreground">{date}</p>
        </div>
      </div>

      <div className="text-right">
        <p className="font-mono text-sm">-{amount}</p>
        <p className="text-xs capitalize">{status}</p>
      </div>
    </div>
  );
};

export default TransactionItem;