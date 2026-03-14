// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuardTransient} from "@openzeppelin/contracts/utils/ReentrancyGuardTransient.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Vault
/// @author Ubaid
/// @notice Vault that manages balances for crypto-funded debit cards
/// @dev Used with card processors like Lithic where card authorization locks funds


contract CardVault is AccessControl, Ownable, ReentrancyGuardTransient {

    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                            STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct Account {
        uint256 balance;
        uint256 locked;
    }

    struct Authorization {
        address user;
        uint256 amount;
        bool settled;
    }

    /*//////////////////////////////////////////////////////////////
                            STORAGE
    //////////////////////////////////////////////////////////////*/

    IERC20 public immutable TOKEN;

    mapping(address => Account) public accounts;

    mapping(bytes32 => Authorization) public authorizations;

    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");


    /*//////////////////////////////////////////////////////////////
                            EVENTS
    //////////////////////////////////////////////////////////////*/

    event Deposited(address indexed sender, address indexed user, uint256 amount);

    event Withdrawn(address indexed user, uint256 amount);

    event TransferInternal(address indexed from, address indexed to, uint256 amount);

    event FundsLocked(address indexed user, bytes32 authId, uint256 amount);

    event LockReleased(address indexed user, bytes32 authId);

    event Settled(address indexed user, bytes32 authId, uint256 amount);



    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address _token, address _manager) Ownable(msg.sender) {
        require(_token != address(0), "Invalid token");
        require(_manager != address(0), "Invalid manager");
        TOKEN = IERC20(_token);
        _grantRole(MANAGER_ROLE, _manager);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /*//////////////////////////////////////////////////////////////
                        USER DEPOSIT FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Deposit TOKENs into vault
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Invalid amount");

        TOKEN.safeTransferFrom(msg.sender, address(this), amount);

        accounts[msg.sender].balance += amount;

        emit Deposited(msg.sender, msg.sender, amount);
    }

    /// @notice Deposit for another user
    function depositFor(address user, uint256 amount) external nonReentrant {
        require(amount > 0, "Invalid amount");

        TOKEN.safeTransferFrom(msg.sender, address(this), amount);

        accounts[user].balance += amount;

        emit Deposited(msg.sender, user, amount);
    }

    /*//////////////////////////////////////////////////////////////
                        USER WITHDRAWAL
    //////////////////////////////////////////////////////////////*/

    function withdraw(uint256 amount) external nonReentrant {

        Account storage user = accounts[msg.sender];

        require(user.balance >= amount, "Insufficient available");

        user.balance -= amount;

        TOKEN.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL TRANSFERS
    //////////////////////////////////////////////////////////////*/

    function transferInternal(address to, uint256 amount) external {

        Account storage sender = accounts[msg.sender];

        require(sender.balance >= amount, "Insufficient balance");

        sender.balance -= amount;

        accounts[to].balance += amount;

        emit TransferInternal(msg.sender, to, amount);
    }

    /*//////////////////////////////////////////////////////////////
                    CARD AUTHORIZATION (LOCK)
    //////////////////////////////////////////////////////////////*/

    /// @notice Lock funds during card authorization
    function lockFunds(
        address user,
        bytes32 authId,
        uint256 amount
    ) external onlyRole(MANAGER_ROLE) {

        Account storage account = accounts[user];

        require(account.balance >= amount, "Insufficient funds");

        require(authorizations[authId].amount == 0, "Auth exists");

        account.locked += amount;
        account.balance -= amount;

        authorizations[authId] = Authorization({
            user: user,
            amount: amount,
            settled: false
        });

        emit FundsLocked(user, authId, amount);
    }

    /*//////////////////////////////////////////////////////////////
                    VOID / RELEASE LOCK
    //////////////////////////////////////////////////////////////*/

    function releaseLock(bytes32 authId) external onlyRole(MANAGER_ROLE) {

        Authorization storage auth = authorizations[authId];

        require(!auth.settled, "Already settled");

        Account storage account = accounts[auth.user];

        account.locked -= auth.amount;

        account.balance += auth.amount;

        delete authorizations[authId];

        emit LockReleased(auth.user, authId);
    }

    /*//////////////////////////////////////////////////////////////
                        CLEARING / SETTLEMENT
    //////////////////////////////////////////////////////////////*/

    function settle(bytes32 authId, address treasury) external onlyRole(MANAGER_ROLE) nonReentrant {

        Authorization storage auth = authorizations[authId];

        require(!auth.settled, "Already settled");

        Account storage account = accounts[auth.user];

        account.locked -= auth.amount;

        auth.settled = true;

        TOKEN.safeTransfer(treasury, auth.amount);

        emit Settled(auth.user, authId, auth.amount);
    }

    /*//////////////////////////////////////////////////////////////
                        Manager FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function addManager(address newManager) external onlyOwner {
        require(newManager != address(0), "Invalid address");
        grantRole(MANAGER_ROLE, newManager);
    }

    /// @notice Remove manager
    function removeManager(address manager) external onlyOwner {
        revokeRole(MANAGER_ROLE, manager);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function availableBalance(address user) external view returns (uint256) {

        Account memory acc = accounts[user];

        return acc.balance;
    }

    function vaultBalance() external view returns (uint256) {

        return TOKEN.balanceOf(address(this));
    }
}