import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Cards from "./pages/Cards";
import Fund from "./pages/Fund";
import Transactions from "./pages/Transactions";
import NotFound from "./pages/NotFound";
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';

import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import Faucet from "./components/Faucet";

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

const config = getDefaultConfig({
  appName: 'PolkaPay',
  projectId: '50a43f47ed0c80de470c526672772f3b',
  chains: [assetHub],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();

const App = () => (
   <WagmiProvider config={config}>  
  <QueryClientProvider client={queryClient}>
    <RainbowKitProvider
      theme={darkTheme({
        accentColor: '#ff2b7a',
        accentColorForeground: '#ffffff',
        borderRadius: 'medium',
        overlayBlur: 'small',
      })}
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cards" element={<Cards />} />
            <Route path="/fund" element={<Fund />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/faucet" element={<Faucet />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </RainbowKitProvider>
  </QueryClientProvider>
  </WagmiProvider>
);

export default App;
