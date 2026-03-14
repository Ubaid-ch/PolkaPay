import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wallet, LayoutDashboard, CreditCard, ArrowDownCircle, Activity } from "lucide-react";
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Navbar = () => {
  const location = useLocation();
  const { isConnected } = useAccount();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/cards", label: "Cards", icon: CreditCard },
    { path: "/fund", label: "Fund", icon: ArrowDownCircle },
    { path: "/transactions", label: "Activity", icon: Activity },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="container flex items-center justify-between h-16 px-6">
        <Link to="/" className="flex items-center gap-2">
           <img
              src="/polkapay-logo-dark.png"
              alt="PolkaPay"
              className="h-14 w-auto"
            />
        </Link>

        {isConnected && (
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-2 ${isActive ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-3">
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
