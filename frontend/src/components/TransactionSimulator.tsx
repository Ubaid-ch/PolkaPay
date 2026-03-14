import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAccount } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, ShoppingCart } from 'lucide-react';

export default function TransactionSimulator() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [simulating, setSimulating] = useState(false);
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');

  const simulateTransaction = async () => {
    if (!address || !amount || !merchant) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setSimulating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/transactions/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          amount: parseFloat(amount),
          merchant: merchant.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Transaction Simulated",
          description: `$${amount} at ${merchant} - ${data.transaction.status}`,
        });
        setAmount('');
        setMerchant('');
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to simulate transaction",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Transaction simulation error:', error);
      toast({
        title: "Error",
        description: "Failed to simulate transaction",
        variant: "destructive",
      });
    } finally {
      setSimulating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Transaction Simulator
        </CardTitle>
        <CardDescription>
          Test card transactions with Lithic sandbox
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount ($)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="25.99"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="merchant">Merchant</Label>
          <Input
            id="merchant"
            placeholder="Starbucks"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
          />
        </div>
        <Button
          onClick={simulateTransaction}
          disabled={simulating || !address}
          className="w-full gap-2"
        >
          {simulating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Simulating...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              Simulate Transaction
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}