// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MockERC20.sol";

contract DeployMockERC20 is Script {

    function run() external {

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        MockERC20 token = new MockERC20(
            "Mock USDT",
            "mUSDT",
            1_000_000 * 10 ** 6
        );

        vm.stopBroadcast();
    }
}