// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./IdentityRegistry.sol";
import "./CredentialManager.sol";

/**
 * @title LendingPool
 * @dev Decentralized lending and borrowing protocol with identity-based credit scoring
 * @notice Enables users to lend and borrow assets without traditional intermediaries
 */
contract LendingPool is 
    Initializable, 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable, 
    PausableUpgradeable, 
    UUPSUpgradeable 
{
    using SafeERC20 for IERC20;

    struct Pool {
        address asset;
        uint256 totalSupply;
        uint256 totalBorrowed;
        uint256 baseInterestRate; // Annual rate in basis points
        uint256 utilizationRate; // Current utilization percentage
        uint256 lastUpdateTimestamp;
        bool isActive;
    }

    struct UserPosition {
        uint256 supplied;
        uint256 borrowed;
        uint256 lastInterestIndex;
        uint256 collateralValue;
    }

    struct LoanRequest {
        address borrower;
        address asset;
        uint256 amount;
        uint256 collateralAmount;
        address collateralAsset;
        uint256 requestedRate;
        uint256 duration;
        bool approved;
        bool active;
        uint256 createdAt;
    }

    // State variables
    IdentityRegistry public identityRegistry;
    CredentialManager public credentialManager;
    
    // Mappings
    mapping(address => Pool) public pools;
    mapping(address => mapping(address => UserPosition)) public userPositions; // user => asset => position
    mapping(address => uint256) public creditScores;
    mapping(address => bool) public supportedAssets;
    mapping(bytes32 => LoanRequest) public loanRequests;
    mapping(address => bytes32[]) public userLoanRequests;
    
    // Constants
    uint256 public constant MAX_UTILIZATION_RATE = 9000; // 90%
    uint256 public constant LIQUIDATION_THRESHOLD = 8000; // 80%
    uint256 public constant LIQUIDATION_BONUS = 500; // 5%
    uint256 public constant BASE_RATE = 200; // 2% base rate
    uint256 public constant RATE_SLOPE1 = 400; // 4% slope before optimal utilization
    uint256 public constant RATE_SLOPE2 = 6000; // 60% slope after optimal utilization
    uint256 public constant OPTIMAL_UTILIZATION = 8000; // 80%

    // Events
    event AssetSupplied(address indexed user, address indexed asset, uint256 amount);
    event AssetWithdrawn(address indexed user, address indexed asset, uint256 amount);
    event AssetBorrowed(address indexed user, address indexed asset, uint256 amount);
    event LoanRepaid(address indexed user, address indexed asset, uint256 amount);
    event LiquidationExecuted(address indexed liquidator, address indexed borrower, address indexed asset, uint256 amount);
    event CreditScoreUpdated(address indexed user, uint256 newScore);
    event LoanRequestCreated(bytes32 indexed requestId, address indexed borrower, address asset, uint256 amount);
    event LoanRequestApproved(bytes32 indexed requestId);

    // Modifiers
    modifier onlyActivePool(address asset) {
        require(pools[asset].isActive, "Pool not active");
        _;
    }

    modifier onlyVerifiedUser() {
        require(identityRegistry.isUserVerified(msg.sender), "User not verified");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _identityRegistry,
        address _credentialManager
    ) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        
        identityRegistry = IdentityRegistry(_identityRegistry);
        credentialManager = CredentialManager(_credentialManager);
    }

    /**
     * @dev Add a new asset pool
     * @param asset Address of the ERC20 token
     * @param baseRate Base interest rate for the asset
     */
    function addAssetPool(address asset, uint256 baseRate) 
        external 
        onlyOwner 
    {
        require(asset != address(0), "Invalid asset address");
        require(!pools[asset].isActive, "Pool already exists");

        pools[asset] = Pool({
            asset: asset,
            totalSupply: 0,
            totalBorrowed: 0,
            baseInterestRate: baseRate,
            utilizationRate: 0,
            lastUpdateTimestamp: block.timestamp,
            isActive: true
        });

        supportedAssets[asset] = true;
    }

    /**
     * @dev Supply assets to the lending pool
     * @param asset Address of the asset to supply
     * @param amount Amount to supply
     */
    function supply(address asset, uint256 amount) 
        external 
        whenNotPaused 
        nonReentrant 
        onlyActivePool(asset)
        onlyVerifiedUser
    {
        require(amount > 0, "Amount must be greater than 0");
        
        _updateInterestRates(asset);
        
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        
        pools[asset].totalSupply += amount;
        userPositions[msg.sender][asset].supplied += amount;
        
        _updateCreditScore(msg.sender);
        
        emit AssetSupplied(msg.sender, asset, amount);
    }

    /**
     * @dev Withdraw supplied assets from the pool
     * @param asset Address of the asset to withdraw
     * @param amount Amount to withdraw
     */
    function withdraw(address asset, uint256 amount) 
        external 
        whenNotPaused 
        nonReentrant 
        onlyActivePool(asset)
    {
        require(amount > 0, "Amount must be greater than 0");
        require(userPositions[msg.sender][asset].supplied >= amount, "Insufficient supplied balance");
        
        _updateInterestRates(asset);
        
        // Check if withdrawal would exceed available liquidity
        uint256 availableLiquidity = pools[asset].totalSupply - pools[asset].totalBorrowed;
        require(amount <= availableLiquidity, "Insufficient liquidity");
        
        pools[asset].totalSupply -= amount;
        userPositions[msg.sender][asset].supplied -= amount;
        
        IERC20(asset).safeTransfer(msg.sender, amount);
        
        emit AssetWithdrawn(msg.sender, asset, amount);
    }

    /**
     * @dev Borrow assets from the pool
     * @param asset Address of the asset to borrow
     * @param amount Amount to borrow
     * @param collateralAsset Address of collateral asset
     * @param collateralAmount Amount of collateral
     */
    function borrow(
        address asset, 
        uint256 amount, 
        address collateralAsset, 
        uint256 collateralAmount
    ) 
        external 
        whenNotPaused 
        nonReentrant 
        onlyActivePool(asset)
        onlyVerifiedUser
    {
        require(amount > 0, "Amount must be greater than 0");
        require(supportedAssets[collateralAsset], "Collateral asset not supported");
        
        _updateInterestRates(asset);
        
        // Check available liquidity
        uint256 availableLiquidity = pools[asset].totalSupply - pools[asset].totalBorrowed;
        require(amount <= availableLiquidity, "Insufficient liquidity");
        
        // Calculate required collateral based on credit score
        uint256 creditScore = calculateCreditScore(msg.sender);
        uint256 collateralRatio = _getCollateralRatio(creditScore);
        uint256 requiredCollateral = (amount * collateralRatio) / 10000;
        
        require(collateralAmount >= requiredCollateral, "Insufficient collateral");
        
        // Transfer collateral
        IERC20(collateralAsset).safeTransferFrom(msg.sender, address(this), collateralAmount);
        
        // Update pool and user state
        pools[asset].totalBorrowed += amount;
        userPositions[msg.sender][asset].borrowed += amount;
        userPositions[msg.sender][asset].collateralValue += collateralAmount;
        
        // Transfer borrowed asset
        IERC20(asset).safeTransfer(msg.sender, amount);
        
        _updateCreditScore(msg.sender);
        
        emit AssetBorrowed(msg.sender, asset, amount);
    }

    /**
     * @dev Repay borrowed assets
     * @param asset Address of the asset to repay
     * @param amount Amount to repay
     */
    function repay(address asset, uint256 amount) 
        external 
        whenNotPaused 
        nonReentrant 
        onlyActivePool(asset)
    {
        require(amount > 0, "Amount must be greater than 0");
        require(userPositions[msg.sender][asset].borrowed >= amount, "Repay amount exceeds debt");
        
        _updateInterestRates(asset);
        
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        
        pools[asset].totalBorrowed -= amount;
        userPositions[msg.sender][asset].borrowed -= amount;
        
        // Return proportional collateral
        uint256 collateralToReturn = (userPositions[msg.sender][asset].collateralValue * amount) / 
                                   (userPositions[msg.sender][asset].borrowed + amount);
        
        if (collateralToReturn > 0) {
            userPositions[msg.sender][asset].collateralValue -= collateralToReturn;
            // Note: In a full implementation, we'd need to track which collateral asset to return
        }
        
        _updateCreditScore(msg.sender);
        
        emit LoanRepaid(msg.sender, asset, amount);
    }

    /**
     * @dev Calculate credit score based on identity and credentials
     * @param user Address of the user
     * @return Credit score (0-1000)
     */
    function calculateCreditScore(address user) public view returns (uint256) {
        if (creditScores[user] > 0) {
            return creditScores[user];
        }
        
        uint256 score = 300; // Base score
        
        // Check if user is verified
        if (identityRegistry.isUserVerified(user)) {
            score += 200;
        }
        
        // Check for credentials (simplified)
        bytes32[] memory credentials = credentialManager.getHolderCredentials(user);
        score += credentials.length * 50; // 50 points per credential
        
        // Check lending history
        UserPosition memory position = userPositions[user][address(0)]; // Simplified
        if (position.supplied > 0) {
            score += 100; // Bonus for being a lender
        }
        
        // Cap at 1000
        return score > 1000 ? 1000 : score;
    }

    /**
     * @dev Get current interest rate for an asset
     * @param asset Address of the asset
     * @return Current interest rate in basis points
     */
    function getCurrentInterestRate(address asset) public view returns (uint256) {
        Pool memory pool = pools[asset];
        
        if (pool.totalSupply == 0) {
            return BASE_RATE;
        }
        
        uint256 utilizationRate = (pool.totalBorrowed * 10000) / pool.totalSupply;
        
        if (utilizationRate <= OPTIMAL_UTILIZATION) {
            return BASE_RATE + (utilizationRate * RATE_SLOPE1) / 10000;
        } else {
            uint256 excessUtilization = utilizationRate - OPTIMAL_UTILIZATION;
            return BASE_RATE + RATE_SLOPE1 + (excessUtilization * RATE_SLOPE2) / 10000;
        }
    }

    /**
     * @dev Internal function to update interest rates
     * @param asset Address of the asset
     */
    function _updateInterestRates(address asset) internal {
        Pool storage pool = pools[asset];
        
        if (pool.totalSupply > 0) {
            pool.utilizationRate = (pool.totalBorrowed * 10000) / pool.totalSupply;
        }
        
        pool.lastUpdateTimestamp = block.timestamp;
    }

    /**
     * @dev Internal function to get collateral ratio based on credit score
     * @param creditScore User's credit score
     * @return Collateral ratio in basis points
     */
    function _getCollateralRatio(uint256 creditScore) internal pure returns (uint256) {
        if (creditScore >= 800) {
            return 12000; // 120% for high credit score
        } else if (creditScore >= 600) {
            return 15000; // 150% for medium credit score
        } else {
            return 20000; // 200% for low credit score
        }
    }

    /**
     * @dev Internal function to update user's credit score
     * @param user Address of the user
     */
    function _updateCreditScore(address user) internal {
        uint256 newScore = calculateCreditScore(user);
        if (newScore != creditScores[user]) {
            creditScores[user] = newScore;
            emit CreditScoreUpdated(user, newScore);
        }
    }

    /**
     * @dev Get user's position in a pool
     * @param user Address of the user
     * @param asset Address of the asset
     * @return UserPosition struct
     */
    function getUserPosition(address user, address asset) 
        external 
        view 
        returns (UserPosition memory) 
    {
        return userPositions[user][asset];
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Authorize upgrade
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}

