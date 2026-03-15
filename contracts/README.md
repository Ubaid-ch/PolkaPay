# CardVault

A secure smart contract vault for **crypto-funded debit cards**, enabling stablecoin deposits, card authorization locking, and settlement flows similar to traditional payment processors.

This vault is designed to work with **card issuing platforms (e.g., Lithic)** where card transactions require **authorization → lock → settlement**.

The contract allows users to deposit stablecoins, and a trusted manager (card processor backend) temporarily locks funds during card authorization and settles them once the merchant clears the transaction.

---

# Overview

CardVault enables users to fund debit cards with stablecoins while maintaining full on-chain accounting of balances.

It supports:

* Stablecoin deposits
* Internal user transfers
* Authorization-based fund locking
* Settlement to treasury
* Role-based access control for card processors

Typical card flow:

1. User deposits stablecoins into the vault.
2. Card transaction occurs.
3. Card processor authorizes the transaction.
4. Funds are locked in the vault.
5. Merchant settles the transaction.
6. Locked funds are transferred to treasury.

This replicates the behavior of traditional card networks like Visa or Mastercard, but with **on-chain asset custody**.

---

# Deployed Contracts

## Mock Stablecoin (Test Token)

Address:

```
0xeEe940Dea709D1261f5A0A0A91FBC8CD3F0144Ff
```

Network:

Polkadot Hub Testnet

Explorer:

https://blockscout-testnet.polkadot.io/address/0xeEe940Dea709D1261f5A0A0A91FBC8CD3F0144Ff

---

## CardVault

Address:

```
0x09B072AD3e7a842dcA0Bd410Ed0B2af867F2d66B
```

Explorer:

https://blockscout-testnet.polkadot.io/address/0x09B072AD3e7a842dcA0Bd410Ed0B2af867F2d66B

---

# Architecture

## Account Structure

Each user has an internal vault account:

```
struct Account {
    uint256 balance;   // available balance
    uint256 locked;    // funds reserved for card authorizations
}
```

---

## Authorization Structure

Card authorizations are tracked using unique IDs.

```
struct Authorization {
    address user;
    uint256 amount;
    bool settled;
}
```

This allows safe handling of:

* card authorizations
* voided transactions
* settlements

---

# Core Functions

## Deposit

Users deposit stablecoins into the vault.

```
deposit(uint256 amount)
```

Flow:

User → Vault → Internal Balance

---

## Deposit For Another User

Allows funding another user.

```
depositFor(address user, uint256 amount)
```

Example:

Parent funding a child's debit card.

---

## Withdraw

Withdraw available funds.

```
withdraw(uint256 amount)
```

Restrictions:

* Only available balance can be withdrawn
* Locked funds cannot be withdrawn

---

## Internal Transfers

Transfer funds between vault accounts without moving tokens.

```
transferInternal(address to, uint256 amount)
```

Useful for:

* P2P payments
* internal wallet transfers

---

# Card Transaction Flow

## 1 Authorization (Lock Funds)

When a card transaction is authorized, funds are locked.

```
lockFunds(address user, bytes32 authId, uint256 amount)
```

Effects:

* Deducts balance
* Increases locked funds

Only callable by **MANAGER_ROLE**.

---

## 2 Void / Release Authorization

If the merchant cancels the transaction:

```
releaseLock(bytes32 authId)
```

Funds return to user's available balance.

---

## 3 Settlement

When merchant settlement occurs:

```
settle(bytes32 authId, address treasury)
```

Locked funds are transferred to the treasury.

---

# Roles

## Owner

Controls vault administration.

Permissions:

* Add managers
* Remove managers

---

## Manager

Represents backend card processor (e.g., Lithic service).

Permissions:

* Lock funds
* Release locks
* Settle transactions

Role identifier:

```
MANAGER_ROLE
```

---

# Security Features

The vault includes several protections.

### Access Control

Uses OpenZeppelin AccessControl.

Manager functions require:

```
onlyRole(MANAGER_ROLE)
```

---

### Reentrancy Protection

Uses:

```
ReentrancyGuardTransient
```

Protects:

* deposits
* withdrawals
* settlements

---

### Safe ERC20 Transfers

Uses:

```
SafeERC20
```

Prevents unsafe token transfers.

---

# Deployment

Contracts were deployed using **Foundry scripts**.

## Deploy Mock Token

```
forge script script/DeployMockERC20.s.sol \
--chain polkadot-testnet \
--rpc-url https://services.polkadothub-rpc.com/testnet \
--private-key $PRIVATE_KEY \
--broadcast \
--verify \
--verifier blockscout \
--verifier-url https://blockscout-testnet.polkadot.io/api
```

---

## Deploy Vault

```
forge script script/DeployVault.s.sol \
--chain polkadot-testnet \
--rpc-url https://services.polkadothub-rpc.com/testnet \
--private-key $PRIVATE_KEY \
--broadcast \
--verify \
--verifier blockscout \
--verifier-url https://blockscout-testnet.polkadot.io/api
```

---

# Local Development

Clone the repository:

```
git clone <repo>
cd project
```

Install dependencies:

```
forge install
```

Compile contracts:

```
forge build
```

Run tests:

```
forge test
```

---

# Example Flow

Example card transaction lifecycle:

1. User deposits 500 USDC.

```
deposit(500)
```

2. Card authorization for $100.

```
lockFunds(user, authId, 100)
```

3. Merchant settles.

```
settle(authId, treasury)
```

Result:

* User balance reduced
* Treasury receives funds

---

# Future Improvements

Possible upgrades:

* Multi-token support
* Expiring authorizations
* Merchant whitelisting
* Spending limits
* Card fraud monitoring
* On-chain card transaction history

---

# License

MIT
