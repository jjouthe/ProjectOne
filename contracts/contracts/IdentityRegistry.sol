// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title IdentityRegistry
 * @dev Decentralized identity registry for managing user identities and attributes
 * @notice This contract serves as the foundation of our identity system
 */
contract IdentityRegistry is 
    Initializable, 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable, 
    PausableUpgradeable, 
    UUPSUpgradeable 
{
    struct Identity {
        address owner;
        bytes32 identityHash;
        uint256 createdAt;
        uint256 lastUpdated;
        bool isActive;
    }

    // Mappings
    mapping(address => Identity) public identities;
    mapping(bytes32 => address) public hashToAddress;
    mapping(address => mapping(bytes32 => bytes32)) public userAttributes;
    mapping(address => mapping(address => bool)) public authorizedServices;
    mapping(address => bool) public verifiedUsers;

    // Events
    event IdentityCreated(address indexed user, bytes32 indexed identityHash, uint256 timestamp);
    event AttributeUpdated(address indexed user, bytes32 indexed attributeKey, bytes32 attributeValue);
    event ServiceAuthorized(address indexed user, address indexed service, bool authorized);
    event IdentityVerified(address indexed user, address indexed verifier);
    event IdentityDeactivated(address indexed user);

    // Modifiers
    modifier onlyIdentityOwner(address user) {
        require(identities[user].owner == msg.sender, "Not identity owner");
        _;
    }

    modifier identityExists(address user) {
        require(identities[user].owner != address(0), "Identity does not exist");
        _;
    }

    modifier identityActive(address user) {
        require(identities[user].isActive, "Identity is not active");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
    }

    /**
     * @dev Create a new identity for the caller
     * @param identityHash Unique hash representing the identity
     */
    function createIdentity(bytes32 identityHash) external whenNotPaused nonReentrant {
        require(identities[msg.sender].owner == address(0), "Identity already exists");
        require(hashToAddress[identityHash] == address(0), "Identity hash already used");

        identities[msg.sender] = Identity({
            owner: msg.sender,
            identityHash: identityHash,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp,
            isActive: true
        });

        hashToAddress[identityHash] = msg.sender;

        emit IdentityCreated(msg.sender, identityHash, block.timestamp);
    }

    /**
     * @dev Update an attribute for the caller's identity
     * @param attributeKey Key of the attribute to update
     * @param attributeValue New value for the attribute
     */
    function updateAttribute(bytes32 attributeKey, bytes32 attributeValue) 
        external 
        whenNotPaused 
        nonReentrant 
        identityExists(msg.sender)
        identityActive(msg.sender)
    {
        userAttributes[msg.sender][attributeKey] = attributeValue;
        identities[msg.sender].lastUpdated = block.timestamp;

        emit AttributeUpdated(msg.sender, attributeKey, attributeValue);
    }

    /**
     * @dev Authorize a service to access identity data
     * @param service Address of the service to authorize
     * @param authorized Whether to authorize or revoke authorization
     */
    function authorizeService(address service, bool authorized) 
        external 
        whenNotPaused 
        nonReentrant 
        identityExists(msg.sender)
        identityActive(msg.sender)
    {
        authorizedServices[msg.sender][service] = authorized;
        emit ServiceAuthorized(msg.sender, service, authorized);
    }

    /**
     * @dev Verify a user's identity (only owner can call)
     * @param user Address of the user to verify
     */
    function verifyUser(address user) 
        external 
        onlyOwner 
        identityExists(user)
        identityActive(user)
    {
        verifiedUsers[user] = true;
        emit IdentityVerified(user, msg.sender);
    }

    /**
     * @dev Deactivate an identity (only owner or identity owner can call)
     * @param user Address of the user whose identity to deactivate
     */
    function deactivateIdentity(address user) 
        external 
        identityExists(user)
    {
        require(msg.sender == owner() || msg.sender == user, "Unauthorized");
        identities[user].isActive = false;
        emit IdentityDeactivated(user);
    }

    /**
     * @dev Get identity information for a user
     * @param user Address of the user
     * @return Identity struct containing user's identity data
     */
    function getIdentity(address user) external view returns (Identity memory) {
        return identities[user];
    }

    /**
     * @dev Get attribute value for a user
     * @param user Address of the user
     * @param attributeKey Key of the attribute
     * @return Attribute value
     */
    function getAttribute(address user, bytes32 attributeKey) external view returns (bytes32) {
        return userAttributes[user][attributeKey];
    }

    /**
     * @dev Check if a service is authorized for a user
     * @param user Address of the user
     * @param service Address of the service
     * @return Whether the service is authorized
     */
    function isServiceAuthorized(address user, address service) external view returns (bool) {
        return authorizedServices[user][service];
    }

    /**
     * @dev Check if a user is verified
     * @param user Address of the user
     * @return Whether the user is verified
     */
    function isUserVerified(address user) external view returns (bool) {
        return verifiedUsers[user];
    }

    /**
     * @dev Pause the contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Authorize upgrade (only owner)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}

