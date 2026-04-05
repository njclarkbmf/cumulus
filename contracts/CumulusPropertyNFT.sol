// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CumulusPropertyNFT
 * @dev ERC-721 NFT representing fractional ownership of a specific property
 * @notice Includes maintenance fee tracking and transfer restrictions
 */
contract CumulusPropertyNFT is ERC721, ERC721Enumerable, Ownable, Pausable {
    // Constants
    uint256 public constant MAINTENANCE_GRACE_PERIOD = 30 days;
    
    // State variables
    uint256 public monthlyMaintenanceFee; // in wei
    address public propertyTreasury;
    string public propertyAddress; // real-world location
    uint256 public totalPropertyValue; // in PHP (stored as wei equivalent)
    address public registryContract;
    
    // Maintenance fee tracking
    mapping(uint256 => uint256) public lastMaintenancePaid;
    
    // Events
    event MaintenancePaid(
        uint256 indexed tokenId,
        address indexed payer,
        uint256 amount,
        uint256 paidAt,
        uint256 nextDueDate
    );
    
    event MaintenanceFeeUpdated(uint256 newFee);
    event PropertyTreasuryUpdated(address newTreasury);
    event RegistryUpdated(address newRegistry);
    
    /**
     * @dev Constructor
     * @param name NFT name (e.g., "Cumulus Makati Condo A")
     * @param symbol NFT symbol (e.g., "CUMULUS-MKA")
     * @param _propertyTreasury Address where maintenance fees are sent
     * @param _monthlyMaintenanceFee Monthly maintenance fee in wei
     * @param _registry Address of the CumulusRegistry contract
     */
    constructor(
        string memory name,
        string memory symbol,
        address _propertyTreasury,
        uint256 _monthlyMaintenanceFee,
        address _registry
    ) ERC721(name, symbol) Ownable(msg.sender) {
        require(_propertyTreasury != address(0), "Invalid treasury");
        require(_registry != address(0), "Invalid registry");
        
        propertyTreasury = _propertyTreasury;
        monthlyMaintenanceFee = _monthlyMaintenanceFee;
        registryContract = _registry;
    }
    
    /**
     * @dev Mint a new token (admin only)
     * @param to Address to mint to
     * @param tokenId Token ID to mint
     * @param uri Metadata URI pointing to IPFS
     */
    function mint(
        address to,
        uint256 tokenId,
        string memory uri
    ) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(!_exists(tokenId), "Token already exists");
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        // Initialize maintenance tracking
        lastMaintenancePaid[tokenId] = block.timestamp;
    }
    
    /**
     * @dev Pay maintenance fee for a token
     * @param tokenId Token ID to pay maintenance for
     */
    function payMaintenance(uint256 tokenId) external payable {
        require(_exists(tokenId), "Token does not exist");
        require(msg.value >= monthlyMaintenanceFee, "Insufficient payment");
        
        // Update last paid timestamp
        lastMaintenancePaid[tokenId] = block.timestamp;
        
        // Transfer to treasury
        payable(propertyTreasury).transfer(msg.value);
        
        // Refund overpayment
        if (msg.value > monthlyMaintenanceFee) {
            payable(msg.sender).transfer(msg.value - monthlyMaintenanceFee);
        }
        
        emit MaintenancePaid(
            tokenId,
            msg.sender,
            monthlyMaintenanceFee,
            block.timestamp,
            block.timestamp + MAINTENANCE_GRACE_PERIOD
        );
    }
    
    /**
     * @dev Set the monthly maintenance fee (admin only)
     * @param newFee New fee amount in wei
     */
    function setMaintenanceFee(uint256 newFee) external onlyOwner {
        monthlyMaintenanceFee = newFee;
        emit MaintenanceFeeUpdated(newFee);
    }
    
    /**
     * @dev Set property treasury address (admin only)
     * @param newTreasury New treasury address
     */
    function setPropertyTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid address");
        propertyTreasury = newTreasury;
        emit PropertyTreasuryUpdated(newTreasury);
    }
    
    /**
     * @dev Set registry contract address (admin only)
     * @param newRegistry New registry address
     */
    function setRegistry(address newRegistry) external onlyOwner {
        require(newRegistry != address(0), "Invalid address");
        registryContract = newRegistry;
        emit RegistryUpdated(newRegistry);
    }
    
    /**
     * @dev Get maintenance status for a token
     * @param tokenId Token ID
     * @return lastPaid Timestamp of last payment
     * @return current Whether maintenance is current (not overdue)
     * @return nextDueDate Timestamp of next due date
     */
    function getMaintenanceStatus(uint256 tokenId) 
        external 
        view 
        returns (
            uint256 lastPaid,
            bool current,
            uint256 nextDueDate
        ) 
    {
        require(_exists(tokenId), "Token does not exist");
        
        lastPaid = lastMaintenancePaid[tokenId];
        nextDueDate = lastPaid + MAINTENANCE_GRACE_PERIOD;
        current = block.timestamp <= nextDueDate;
    }
    
    /**
     * @dev Get metadata URI for a token
     * @param tokenId Token ID
     * @return string Token URI
     */
    function getTokenURI(uint256 tokenId) external view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return tokenURI(tokenId);
    }
    
    /**
     * @dev Override to add maintenance check before transfer
     * @param from Sender address
     * @param to Recipient address
     * @param tokenId Token ID
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        address from = _ownerOf(tokenId);
        
        // Skip maintenance check for minting
        if (from != address(0)) {
            require(
                block.timestamp <= lastMaintenancePaid[tokenId] + MAINTENANCE_GRACE_PERIOD,
                "Maintenance overdue - bayad muna (pay maintenance fee to enable transfers)"
            );
        }
        
        // Check paused
        require(!paused(), "Contract paused");
        
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @dev Override for ERC721Enumerable compatibility
     * @param from Sender address
     * @param to Recipient address
     * @param tokenId Token ID
     */
    function _increaseBalance(
        address account,
        uint256 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }
    
    /**
     * @dev Pause all transfers (admin only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause all transfers (admin only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Check if contract is paused
     * @return bool True if paused
     */
    function isPaused() external view returns (bool) {
        return paused();
    }
    
    /**
     * @dev Support ERC-165 interface detection
     * @param interfaceId Interface ID
     * @return bool True if supports interface
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
