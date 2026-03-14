// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Vault.sol";

contract DeployVault is Script {

    function run() external {

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        address token = 0xeEe940Dea709D1261f5A0A0A91FBC8CD3F0144Ff;
        address manager = 0x43925640F3D44F35F90219ac160e1a8e7FfA3ea9;

        vm.startBroadcast(deployerPrivateKey);

        CardVault vault = new CardVault(token, manager);

        vm.stopBroadcast();

        console.log("CardVault deployed at:", address(vault));
    }
}