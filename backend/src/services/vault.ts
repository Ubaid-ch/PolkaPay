import { createPublicClient, http, createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";

/* ------------------------------------------------ */
/*  Polkadot Asset Hub Testnet Chain Config         */
/* ------------------------------------------------ */

export const assetHub = {
  id: 420420417,
  name: "polkadot-hub-testnet",
  network: "polkadot-hub-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "PAS",
    symbol: "PAS",
  },
  rpcUrls: {
    default: {
      http: ["https://services.polkadothub-rpc.com/testnet"],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://blockscout-testnet.polkadot.io/",
    },
  },
} as const;

/* ------------------------------------------------ */
/*  Vault Contract                                  */
/* ------------------------------------------------ */

const VAULT_ADDRESS =
  "0x09B072AD3e7a842dcA0Bd410Ed0B2af867F2d66B" as `0x${string}`;

const VAULT_ABI = [
  {
    name: "availableBalance",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "lockFunds",
    type: "function",
    inputs: [
      { name: "user", type: "address" },
      { name: "authId", type: "bytes32" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "releaseLock",
    type: "function",
    inputs: [{ name: "authId", type: "bytes32" }],
    outputs: [],
  },
  {
    name: "settle",
    type: "function",
    inputs: [
      { name: "authId", type: "bytes32" },
      { name: "treasury", type: "address" },
    ],
    outputs: [],
  },
] as const;

/* ------------------------------------------------ */
/*  Clients                                         */
/* ------------------------------------------------ */

export const publicClient = createPublicClient({
  chain: assetHub,
  transport: http(process.env.RPC_URL),
});

let _account: ReturnType<typeof privateKeyToAccount> | null = null;
let _walletClient: ReturnType<typeof createWalletClient> | null = null;

function getAccount() {
  if (!_account) {
    const pk = process.env.MANAGER_PRIVATE_KEY;
    if (!pk) throw new Error("MANAGER_PRIVATE_KEY is not set in environment");
    _account = privateKeyToAccount(pk as `0x${string}`);
  }
  return _account;
}

function getWalletClient() {
  if (!_walletClient) {
    _walletClient = createWalletClient({
      account: getAccount(),
      chain: assetHub,
      transport: http(process.env.RPC_URL),
    });
  }
  return _walletClient;
}

/* ------------------------------------------------ */
/*  Vault Functions                                 */
/* ------------------------------------------------ */

export async function getVaultBalance(wallet: `0x${string}`) {
  return publicClient.readContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "availableBalance",
    args: [wallet],
  });
}

export async function lockFunds(
  user: `0x${string}`,
  authId: `0x${string}`,
  amount: bigint
) {
  return getWalletClient().writeContract({
    account: getAccount(),
    chain: assetHub,          // ✅ required by viem when client has a chain
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "lockFunds",
    args: [user, authId, amount],
  });
}

export async function releaseLock(authId: `0x${string}`) {
  return getWalletClient().writeContract({
    account: getAccount(),
    chain: assetHub,          // ✅
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "releaseLock",
    args: [authId],
  });
}

export async function settleFunds(
  authId: `0x${string}`,
  treasury: `0x${string}`
) {
  return getWalletClient().writeContract({
    account: getAccount(),
    chain: assetHub,          
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "settle",
    args: [authId, treasury],
  });
}