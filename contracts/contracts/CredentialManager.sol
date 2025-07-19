// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./IdentityRegistry.sol";

/**
 * @title CredentialManager
 * @dev Manages verifiable credentials for the identity system
 * @notice Digital diploma or certificate system where institutions can issue verifiable credentials
 */
contract CredentialManager is 
    Initializable, 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable, 
    PausableUpgradeable, 
    UUPSUpgradeable 
{
    struct Credential {
        bytes32 id;
        address issuer;
        address holder;
        bytes32 credentialType;
        bytes32 dataHash;
        uint256 issuedAt;
        uint256 expiresAt;
        bool revoked;
        bool exists;
    }

    // State variables
    IdentityRegistry public identityRegistry;
    
    // Mappings
    mapping(bytes32 => Credential) public credentials;
    mapping(address => bool) public authorizedIssuers;
    mapping(address => bytes32[]) public holderCredentials;
    mapping(address => bytes32[]) public issuerCredentials;
    mapping(bytes32 => mapping(address => bool)) public credentialVerifiers;

    // Events
    event CredentialIssued(
        bytes32 indexed credentialId,
        address indexed issuer,
        address indexed holder,
        bytes32 credentialType,
        uint256 expiresAt
    );
    event CredentialRevoked(bytes32 indexed credentialId, address indexed revoker);
    event IssuerAuthorized(address indexed issuer, bool authorized);
    event CredentialVerified(bytes32 indexed credentialId, address indexed verifier);

    // Modifiers
    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender] || msg.sender == owner(), "Not authorized issuer");
        _;
    }

    modifier credentialExists(bytes32 credentialId) {
        require(credentials[credentialId].exists, "Credential does not exist");
        _;
    }

    modifier onlyCredentialParties(bytes32 credentialId) {
        Credential memory cred = credentials[credentialId];
        require(
            msg.sender == cred.issuer || 
            msg.sender == cred.holder || 
            msg.sender == owner(),
            "Not authorized for this credential"
        );
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _identityRegistry) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        
        identityRegistry = IdentityRegistry(_identityRegistry);
    }

    /**
     * @dev Issue a new credential
     * @param credentialId Unique identifier for the credential
     * @param holder Address of the credential holder
     * @param credentialType Type of credential being issued
     * @param dataHash Hash of the credential data
     * @param expiresAt Expiration timestamp (0 for non-expiring)
     */
    function issueCredential(
        bytes32 credentialId,
        address holder,
        bytes32 credentialType,
        bytes32 dataHash,
        uint256 expiresAt
    ) external whenNotPaused nonReentrant onlyAuthorizedIssuer {
        require(!credentials[credentialId].exists, "Credential already exists");
        require(holder != address(0), "Invalid holder address");
        
        // Verify holder has an active identity
        IdentityRegistry.Identity memory holderIdentity = identityRegistry.getIdentity(holder);
        require(holderIdentity.owner != address(0) && holderIdentity.isActive, "Holder must have active identity");

        credentials[credentialId] = Credential({
            id: credentialId,
            issuer: msg.sender,
            holder: holder,
            credentialType: credentialType,
            dataHash: dataHash,
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            revoked: false,
            exists: true
        });

        holderCredentials[holder].push(credentialId);
        issuerCredentials[msg.sender].push(credentialId);

        emit CredentialIssued(credentialId, msg.sender, holder, credentialType, expiresAt);
    }

    /**
     * @dev Revoke a credential
     * @param credentialId ID of the credential to revoke
     */
    function revokeCredential(bytes32 credentialId) 
        external 
        whenNotPaused 
        nonReentrant 
        credentialExists(credentialId)
        onlyCredentialParties(credentialId)
    {
        require(!credentials[credentialId].revoked, "Credential already revoked");
        
        credentials[credentialId].revoked = true;
        emit CredentialRevoked(credentialId, msg.sender);
    }

    /**
     * @dev Verify a credential
     * @param credentialId ID of the credential to verify
     */
    function verifyCredential(bytes32 credentialId) 
        external 
        view 
        credentialExists(credentialId)
        returns (bool isValid, string memory reason)
    {
        Credential memory cred = credentials[credentialId];
        
        if (cred.revoked) {
            return (false, "Credential has been revoked");
        }
        
        if (cred.expiresAt > 0 && block.timestamp > cred.expiresAt) {
            return (false, "Credential has expired");
        }
        
        // Check if issuer is still authorized
        if (!authorizedIssuers[cred.issuer] && cred.issuer != owner()) {
            return (false, "Issuer is no longer authorized");
        }
        
        // Check if holder still has active identity
        IdentityRegistry.Identity memory holderIdentity = identityRegistry.getIdentity(cred.holder);
        if (holderIdentity.owner == address(0) || !holderIdentity.isActive) {
            return (false, "Holder identity is not active");
        }
        
        return (true, "Credential is valid");
    }

    /**
     * @dev Authorize or deauthorize an issuer
     * @param issuer Address of the issuer
     * @param authorized Whether to authorize or deauthorize
     */
    function setIssuerAuthorization(address issuer, bool authorized) 
        external 
        onlyOwner 
    {
        authorizedIssuers[issuer] = authorized;
        emit IssuerAuthorized(issuer, authorized);
    }

    /**
     * @dev Get credential details
     * @param credentialId ID of the credential
     * @return Credential struct
     */
    function getCredential(bytes32 credentialId) 
        external 
        view 
        credentialExists(credentialId)
        returns (Credential memory) 
    {
        return credentials[credentialId];
    }

    /**
     * @dev Get all credentials held by an address
     * @param holder Address of the holder
     * @return Array of credential IDs
     */
    function getHolderCredentials(address holder) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        return holderCredentials[holder];
    }

    /**
     * @dev Get all credentials issued by an address
     * @param issuer Address of the issuer
     * @return Array of credential IDs
     */
    function getIssuerCredentials(address issuer) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        return issuerCredentials[issuer];
    }

    /**
     * @dev Check if an address is an authorized issuer
     * @param issuer Address to check
     * @return Whether the address is authorized
     */
    function isAuthorizedIssuer(address issuer) external view returns (bool) {
        return authorizedIssuers[issuer] || issuer == owner();
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

