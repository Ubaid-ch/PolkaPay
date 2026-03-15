// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Vault.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor() ERC20("MockUSDC", "mUSDC") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract CardVaultTest is Test {

    CardVault vault;
    MockToken token;

    address owner = address(this);
    address manager = address(1);
    address user = address(2);
    address user2 = address(3);
    address treasury = address(4);

    bytes32 authId = keccak256("auth1");

    function setUp() public {

        token = new MockToken();

        vault = new CardVault(address(token), manager);

        token.mint(user, 1000 ether);
        token.mint(user2, 1000 ether);

        vm.startPrank(user);
        token.approve(address(vault), type(uint256).max);
        vm.stopPrank();

        vm.startPrank(user2);
        token.approve(address(vault), type(uint256).max);
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                            DEPOSIT TESTS
    //////////////////////////////////////////////////////////////*/

    function testDeposit() public {

        vm.prank(user);
        vault.deposit(100 ether);

        assertEq(vault.availableBalance(user), 100 ether);
        assertEq(token.balanceOf(address(vault)), 100 ether);
    }

    function testDepositForAnotherUser() public {

        vm.prank(user);
        vault.depositFor(user2, 200 ether);

        assertEq(vault.availableBalance(user2), 200 ether);
    }

    function testDepositRevertsIfZero() public {

        vm.prank(user);

        vm.expectRevert("Invalid amount");

        vault.deposit(0);
    }

    /*//////////////////////////////////////////////////////////////
                        WITHDRAW TESTS
    //////////////////////////////////////////////////////////////*/

    function testWithdraw() public {

        vm.startPrank(user);

        vault.deposit(200 ether);

        vault.withdraw(50 ether);

        vm.stopPrank();

        assertEq(vault.availableBalance(user), 150 ether);
        assertEq(token.balanceOf(user), 850 ether);
    }

    function testWithdrawRevertsIfInsufficient() public {

        vm.prank(user);

        vm.expectRevert("Insufficient available");

        vault.withdraw(1 ether);
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL TRANSFER
    //////////////////////////////////////////////////////////////*/

    function testInternalTransfer() public {

        vm.startPrank(user);

        vault.deposit(300 ether);

        vault.transferInternal(user2, 100 ether);

        vm.stopPrank();

        assertEq(vault.availableBalance(user), 200 ether);
        assertEq(vault.availableBalance(user2), 100 ether);
    }

    function testTransferRevertsIfInsufficient() public {

        vm.prank(user);

        vm.expectRevert("Insufficient balance");

        vault.transferInternal(user2, 1 ether);
    }

    /*//////////////////////////////////////////////////////////////
                        AUTHORIZATION LOCK
    //////////////////////////////////////////////////////////////*/

    function testLockFunds() public {

        vm.prank(user);
        vault.deposit(500 ether);

        vm.prank(manager);
        vault.lockFunds(user, authId, 200 ether);

        (uint256 balance, uint256 locked) = vault.accounts(user);

        assertEq(balance, 300 ether);
        assertEq(locked, 200 ether);
    }

    function testLockFundsOnlyManager() public {

        vm.prank(user);
        vault.deposit(200 ether);

        vm.prank(user);

        vm.expectRevert();

        vault.lockFunds(user, authId, 100 ether);
    }

    /*//////////////////////////////////////////////////////////////
                        RELEASE LOCK
    //////////////////////////////////////////////////////////////*/

    function testReleaseLock() public {

        vm.prank(user);
        vault.deposit(300 ether);

        vm.prank(manager);
        vault.lockFunds(user, authId, 100 ether);

        vm.prank(manager);
        vault.releaseLock(authId);

        (uint256 balance, uint256 locked) = vault.accounts(user);

        assertEq(balance, 300 ether);
        assertEq(locked, 0);
    }

    /*//////////////////////////////////////////////////////////////
                        SETTLEMENT
    //////////////////////////////////////////////////////////////*/

    function testSettle() public {

        vm.prank(user);
        vault.deposit(400 ether);

        vm.prank(manager);
        vault.lockFunds(user, authId, 200 ether);

        vm.prank(manager);
        vault.settle(authId, treasury);

        assertEq(token.balanceOf(treasury), 200 ether);

        (, uint256 locked) = vault.accounts(user);

        assertEq(locked, 0);
    }

    function testSettleRevertsIfAlreadySettled() public {

        vm.prank(user);
        vault.deposit(300 ether);

        vm.prank(manager);
        vault.lockFunds(user, authId, 100 ether);

        vm.prank(manager);
        vault.settle(authId, treasury);

        vm.prank(manager);

        vm.expectRevert("Already settled");

        vault.settle(authId, treasury);
    }

    /*//////////////////////////////////////////////////////////////
                        MANAGER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function testOwnerCanAddManager() public {

        address newManager = address(9);

        vault.addManager(newManager);

        assertTrue(vault.hasRole(vault.MANAGER_ROLE(), newManager));
    }

    function testOwnerCanRemoveManager() public {

        vault.removeManager(manager);

        assertFalse(vault.hasRole(vault.MANAGER_ROLE(), manager));
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function testVaultBalance() public {

        vm.prank(user);
        vault.deposit(123 ether);

        assertEq(vault.vaultBalance(), 123 ether);
    }
}