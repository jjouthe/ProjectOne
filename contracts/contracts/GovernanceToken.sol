// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title GovernanceToken
 * @dev ERC20 token with governance capabilities for the SilentIntellect ecosystem
 * @notice This token represents voting power in our decentralized organization
 */
contract GovernanceToken is 
    ERC20, 
    ERC20Burnable, 
    ERC20Snapshot, 
    Ownable, 
    ERC20Permit, 
    ERC20Votes,
    ReentrancyGuard
{
    // Token distribution constants
    uint256 public constant TOTAL_SUPPLY = 1_000_000 * 10**18; // 1 million tokens
    uint256 public constant COMMUNITY_ALLOCATION = 400_000 * 10**18; // 40%
    uint256 public constant DEVELOPMENT_ALLOCATION = 300_000 * 10**18; // 30%
    uint256 public constant EARLY_ADOPTER_ALLOCATION = 200_000 * 10**18; // 20%
    uint256 public constant TEAM_ALLOCATION = 100_000 * 10**18; // 10%

    // Vesting and distribution
    mapping(address => uint256) public vestedTokens;
    mapping(address => uint256) public claimedTokens;
    mapping(address => uint256) public vestingStart;
    mapping(address => uint256) public vestingDuration;
    
    // Staking for enhanced governance
    mapping(address => uint256) public stakedTokens;
    mapping(address => uint256) public stakingRewards;
    mapping(address => uint256) public lastStakeTime;
    
    uint256 public totalStaked;
    uint256 public rewardRate = 100; // 1% annual reward rate (100 basis points)
    
    // Fee reduction for token holders
    mapping(address => uint256) public feeDiscountTier;
    
    // Events
    event TokensVested(address indexed beneficiary, uint256 amount, uint256 duration);
    event TokensClaimed(address indexed beneficiary, uint256 amount);
    event TokensStaked(address indexed staker, uint256 amount);
    event TokensUnstaked(address indexed staker, uint256 amount);
    event RewardsDistributed(address indexed recipient, uint256 amount);
    event SnapshotCreated(uint256 indexed snapshotId);

    constructor() 
        ERC20("SilentIntellect Governance", "SIGD") 
        ERC20Permit("SilentIntellect Governance") 
    {
        // Mint initial supply to contract for controlled distribution
        _mint(address(this), TOTAL_SUPPLY);
        
        // Transfer team allocation to owner for immediate use
        _transfer(address(this), owner(), TEAM_ALLOCATION);
    }

    /**
     * @dev Create a snapshot of token balances
     * @return Snapshot ID
     */
    function snapshot() public onlyOwner returns (uint256) {
        uint256 snapshotId = _snapshot();
        emit SnapshotCreated(snapshotId);
        return snapshotId;
    }

    /**
     * @dev Vest tokens for a beneficiary with linear vesting
     * @param beneficiary Address to receive vested tokens
     * @param amount Amount of tokens to vest
     * @param duration Vesting duration in seconds
     */
    function vestTokens(address beneficiary, uint256 amount, uint256 duration) 
        external 
        onlyOwner 
        nonReentrant 
    {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(amount > 0, "Amount must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        require(balanceOf(address(this)) >= amount, "Insufficient contract balance");

        vestedTokens[beneficiary] += amount;
        vestingStart[beneficiary] = block.timestamp;
        vestingDuration[beneficiary] = duration;

        emit TokensVested(beneficiary, amount, duration);
    }

    /**
     * @dev Claim vested tokens
     */
    function claimVestedTokens() external nonReentrant {
        uint256 claimable = getClaimableTokens(msg.sender);
        require(claimable > 0, "No tokens to claim");

        claimedTokens[msg.sender] += claimable;
        _transfer(address(this), msg.sender, claimable);

        emit TokensClaimed(msg.sender, claimable);
    }

    /**
     * @dev Get claimable vested tokens for an address
     * @param beneficiary Address to check
     * @return Amount of claimable tokens
     */
    function getClaimableTokens(address beneficiary) public view returns (uint256) {
        if (vestedTokens[beneficiary] == 0) return 0;
        
        uint256 elapsed = block.timestamp - vestingStart[beneficiary];
        uint256 duration = vestingDuration[beneficiary];
        
        if (elapsed >= duration) {
            return vestedTokens[beneficiary] - claimedTokens[beneficiary];
        }
        
        uint256 vested = (vestedTokens[beneficiary] * elapsed) / duration;
        return vested - claimedTokens[beneficiary];
    }

    /**
     * @dev Stake tokens for enhanced governance power
     * @param amount Amount of tokens to stake
     */
    function stakeTokens(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        // Calculate and distribute pending rewards
        _distributeStakingRewards(msg.sender);

        // Transfer tokens to contract and update staking records
        _transfer(msg.sender, address(this), amount);
        stakedTokens[msg.sender] += amount;
        totalStaked += amount;
        lastStakeTime[msg.sender] = block.timestamp;

        emit TokensStaked(msg.sender, amount);
    }

    /**
     * @dev Unstake tokens
     * @param amount Amount of tokens to unstake
     */
    function unstakeTokens(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(stakedTokens[msg.sender] >= amount, "Insufficient staked balance");

        // Calculate and distribute pending rewards
        _distributeStakingRewards(msg.sender);

        // Update staking records and transfer tokens back
        stakedTokens[msg.sender] -= amount;
        totalStaked -= amount;
        _transfer(address(this), msg.sender, amount);

        emit TokensUnstaked(msg.sender, amount);
    }

    /**
     * @dev Claim staking rewards
     */
    function claimStakingRewards() external nonReentrant {
        _distributeStakingRewards(msg.sender);
        
        uint256 rewards = stakingRewards[msg.sender];
        require(rewards > 0, "No rewards to claim");
        
        stakingRewards[msg.sender] = 0;
        _mint(msg.sender, rewards);
        
        emit RewardsDistributed(msg.sender, rewards);
    }

    /**
     * @dev Calculate pending staking rewards
     * @param staker Address of the staker
     * @return Amount of pending rewards
     */
    function getPendingRewards(address staker) public view returns (uint256) {
        if (stakedTokens[staker] == 0) return 0;
        
        uint256 timeStaked = block.timestamp - lastStakeTime[staker];
        uint256 annualReward = (stakedTokens[staker] * rewardRate) / 10000;
        uint256 reward = (annualReward * timeStaked) / 365 days;
        
        return stakingRewards[staker] + reward;
    }

    /**
     * @dev Get enhanced voting power (includes staked tokens)
     * @param account Address to check
     * @return Enhanced voting power
     */
    function getVotingPower(address account) public view returns (uint256) {
        return balanceOf(account) + (stakedTokens[account] * 150) / 100; // 1.5x multiplier for staked tokens
    }

    /**
     * @dev Set fee discount tier based on token holdings
     * @param account Address to update
     */
    function updateFeeDiscountTier(address account) external {
        uint256 balance = balanceOf(account) + stakedTokens[account];
        
        if (balance >= 10000 * 10**18) {
            feeDiscountTier[account] = 3; // 30% discount
        } else if (balance >= 5000 * 10**18) {
            feeDiscountTier[account] = 2; // 20% discount
        } else if (balance >= 1000 * 10**18) {
            feeDiscountTier[account] = 1; // 10% discount
        } else {
            feeDiscountTier[account] = 0; // No discount
        }
    }

    /**
     * @dev Distribute community tokens (only owner)
     * @param recipients Array of recipient addresses
     * @param amounts Array of token amounts
     */
    function distributeCommunityTokens(address[] calldata recipients, uint256[] calldata amounts) 
        external 
        onlyOwner 
        nonReentrant 
    {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(balanceOf(address(this)) >= totalAmount, "Insufficient contract balance");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _transfer(address(this), recipients[i], amounts[i]);
        }
    }

    /**
     * @dev Internal function to distribute staking rewards
     * @param staker Address of the staker
     */
    function _distributeStakingRewards(address staker) internal {
        if (stakedTokens[staker] > 0) {
            uint256 pendingRewards = getPendingRewards(staker);
            stakingRewards[staker] = pendingRewards;
            lastStakeTime[staker] = block.timestamp;
        }
    }

    /**
     * @dev Update reward rate (only owner)
     * @param newRate New reward rate in basis points
     */
    function updateRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= 1000, "Reward rate too high"); // Max 10%
        rewardRate = newRate;
    }

    // Override required functions
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Snapshot)
    {
        super._beforeTokenTransfer(from, to, amount);
    }

    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }
}

