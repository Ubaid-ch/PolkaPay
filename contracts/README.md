forge script script/DeployMockERC20.s.sol \
--chain polkadot-testnet \
--rpc-url https://services.polkadothub-rpc.com/testnet \
--private-key $PRIVATE_KEY \
--broadcast \
--verify \
--verifier blockscout \
--verifier-url https://blockscout-testnet.polkadot.io/api

- 0xeEe940Dea709D1261f5A0A0A91FBC8CD3F0144Ff


forge script script/DeployVault.s.sol \
--chain polkadot-testnet \
--rpc-url https://services.polkadothub-rpc.com/testnet \
--private-key $PRIVATE_KEY \
--broadcast \
--verify \
--verifier blockscout \
--verifier-url https://blockscout-testnet.polkadot.io/api

- 0x09B072AD3e7a842dcA0Bd410Ed0B2af867F2d66B