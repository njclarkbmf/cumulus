// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CumulusRegistry
 * @dev Registry contract for managing properties, KYC status, and foreign ownership tracking
 * @notice This is the compliance hub for the Cumulus platform
 */
contract CumulusRegistry is AccessControl {
    // Roles
    bytes32 public constant KYC_PROVIDER_ROLE = keccak256("KYC_PROVIDER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Foreign ownership cap (default 40% for condominiums)
    uint256 public foreignOwnershipCap = 40; // percentage

    // Property information
    struct PropertyInfo {
        string propertyId;
        address nftContract;
        uint256 maxSupply;
        uint256 foreignTokenCount;
        bool registered;
    }

    // KYC information for users (minimal data on-chain)
    struct UserKYC {
        bool verified;
        string nationality;
        uint256 verifiedAt;
    }

    // Storage
    mapping(address => PropertyInfo) public properties; // nftContract => PropertyInfo
    mapping(address => UserKYC) public kycData; // wallet address => UserKYC
    mapping(address => mapping(address => bool)) public foreignOwners; // nftContract => owner => isForeign
    
    // Array of registered property contracts for iteration
    address[] public propertyContracts;
    mapping(address => bool) public isPropertyContract;

    // Events
    event PropertyRegistered(
        string indexed propertyId,
        address indexed nftContract,
        uint256 maxSupply
    );

    event KYCStatusUpdated(
        address indexed user,
        bool verified,
        string nationality,
        uint256 timestamp
    );

    event OwnershipUpdated(
        address indexed nftContract,
        address indexed owner,
        bool isForeign
    );

    event ForeignOwnershipCapUpdated(uint256 newCap);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(KYC_PROVIDER_ROLE, msg.sender);
    }

    /**
     * @dev Register a new property in the registry
     * @param propertyId Unique identifier for the property
     * @param nftContract Address of the PropertyNFT contract
     * @param maxSupply Maximum number of tokens for this property
     */
    function registerProperty(
        string memory propertyId,
        address nftContract,
        uint256 maxSupply
    ) external onlyRole(ADMIN_ROLE) {
        require(!properties[nftContract].registered, "Property already registered");
        require(nftContract != address(0), "Invalid NFT contract");
        require(maxSupply > 0, "Max supply must be > 0");

        properties[nftContract] = PropertyInfo({
            propertyId: propertyId,
            nftContract: nftContract,
            maxSupply: maxSupply,
            foreignTokenCount: 0,
            registered: true
        });

        propertyContracts.push(nftContract);
        isPropertyContract[nftContract] = true;

        emit PropertyRegistered(propertyId, nftContract, maxSupply);
    }

    /**
     * @dev Set foreign ownership cap (only for condominiums)
     * @param capPercentage Percentage cap (e.g., 40 for 40%)
     */
    function setForeignOwnershipCap(uint256 capPercentage) external onlyRole(ADMIN_ROLE) {
        require(capPercentage <= 100, "Cap must be <= 100%");
        foreignOwnershipCap = capPercentage;
        emit ForeignOwnershipCapUpdated(capPercentage);
    }

    /**
     * @dev Set KYC status for a user (only KYC providers)
     * @param user Wallet address of the user
     * @param verified Whether the user is KYC verified
     * @param nationality User's nationality (e.g., "Filipino", "American")
     */
    function setKYCStatus(
        address user,
        bool verified,
        string memory nationality
    ) external onlyRole(KYC_PROVIDER_ROLE) {
        kycData[user] = UserKYC({
            verified: verified,
            nationality: nationality,
            verifiedAt: verified ? block.timestamp : 0
        });

        emit KYCStatusUpdated(user, verified, nationality, block.timestamp);
    }

    /**
     * @dev Check if a user is KYC verified
     * @param user Wallet address to check
     * @return bool True if verified
     */
    function isKYCVerified(address user) external view returns (bool) {
        return kycData[user].verified;
    }

    /**
     * @dev Get user's nationality
     * @param user Wallet address
     * @return string Nationality
     */
    function getUserNationality(address user) external view returns (string memory) {
        return kycData[user].nationality;
    }

    /**
     * @dev Update ownership tracking for foreign ownership calculation
     * @param nftContract NFT contract address
     * @param owner Owner address
     * @param isForeign Whether the owner is foreign
     */
    function updateOwnership(
        address nftContract,
        address owner,
        bool isForeign
    ) external onlyRole(ADMIN_ROLE) {
        require(owner != address(0), "Invalid owner address");
        require(properties[nftContract].registered, "Property not registered");
        
        // Check if ownership status is changing
        bool wasForeign = foreignOwners[nftContract][owner];
        
        foreignOwners[nftContract][owner] = isForeign;
        
        // Update foreign token count if status changed
        if (wasForeign && !isForeign) {
            properties[nftContract].foreignTokenCount--;
        } else if (!wasForeign && isForeign) {
            properties[nftContract].foreignTokenCount++;
        }

        emit OwnershipUpdated(nftContract, owner, isForeign);
    }

    /**
     * @dev Calculate foreign ownership percentage for a property
     * @param nftContract NFT contract address
     * @return uint256 Foreign ownership percentage (0-100)
     */
    function getForeignOwnershipPercentage(address nftContract) public view returns (uint256) {
        require(properties[nftContract].registered, "Property not registered");
        
        PropertyInfo storage prop = properties[nftContract];
        if (prop.maxSupply == 0) return 0;
        
        return (prop.foreignTokenCount * 100) / prop.maxSupply;
    }

    /**
     * @dev Check if a transfer is allowed (KYC + foreign ownership compliance)
     * @param nftContract NFT contract address
     * @param from Sender address (address(0) for minting)
     * @param to Recipient address
     * @return allowed Whether transfer is allowed
     * @return reason Reason if not allowed
     */
    function canTransfer(
        address nftContract,
        address from,
        address to
    ) external view returns (bool allowed, string memory reason) {
        // Skip compliance check for minting (from == address(0))
        if (from == address(0)) {
            return (true, "");
        }

        // Check KYC status
        if (!kycData[to].verified) {
            return (false, "Buyer not KYC verified - mag-submit ng KYC documents muna");
        }

        // Skip foreign ownership check for Filipino buyers
        if (isFilipino(kycData[to].nationality)) {
            return (true, "");
        }

        // Check foreign ownership cap for foreign buyers
        PropertyInfo storage prop = properties[nftContract];
        if (!prop.registered) {
            return (false, "Property not registered");
        }

        uint256 currentForeignPercentage = getForeignOwnershipPercentage(nftContract);
        
        // Allow if under cap
        if (currentForeignPercentage >= foreignOwnershipCap) {
            return (
                false,
                "Foreign ownership cap reached (40%) - bawal na sa foreigners"
            );
        }

        return (true, "");
    }

    /**
     * @dev Check if user is eligible for property redemption
     * @param user Wallet address
     * @param nftContract NFT contract address
     * @return bool True if eligible
     */
    function isEligibleForRedemption(address user, address nftContract) external view returns (bool) {
        if (!kycData[user].verified) {
            return false;
        }

        // Filipino citizens are eligible
        if (isFilipino(kycData[user].nationality)) {
            return true;
        }

        // Foreigners eligible only for condos (not land)
        // This would require property type tracking - simplified for PoC
        return getForeignOwnershipPercentage(nftContract) < foreignOwnershipCap;
    }

    /**
     * @dev Get property count
     * @return uint256 Number of registered properties
     */
    function getPropertyCount() external view returns (uint256) {
        return propertyContracts.length;
    }

    /**
     * @dev Get property contract at index
     * @param index Index in array
     * @return address Property contract address
     */
    function getPropertyContract(uint256 index) external view returns (address) {
        require(index < propertyContracts.length, "Index out of bounds");
        return propertyContracts[index];
    }

    /**
     * @dev Check if nationality is Filipino
     * @param nationality Nationality string
     * @return bool True if Filipino
     */
    function isFilipino(string memory nationality) internal pure returns (bool) {
        return (
            keccak256(abi.encodePacked(nationality)) == keccak256(abi.encodePacked("Filipino")) ||
            keccak256(abi.encodePacked(nationality)) == keccak256(abi.encodePacked("filipino"))
        );
    }
}
