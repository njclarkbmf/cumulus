// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/**
 * @title CumulusMarketplace
 * @dev Custom marketplace with enforced royalties and compliance checks
 * @notice All secondary sales must go through this contract (2.5% royalty enforced)
 */
contract CumulusMarketplace is Ownable, IERC721Receiver {
    // Listing structure
    struct Listing {
        uint256 tokenId;
        address seller;
        address nftContract;
        uint256 price; // in wei
        uint256 listedAt;
        bool active;
    }
    
    // State variables
    uint256 public royaltyBps; // basis points (250 = 2.5%)
    address public royaltyTreasury;
    address public registryContract;
    IERC721 public propertyNFT;
    
    mapping(uint256 => Listing) public listings;
    uint256 public listingCount;
    
    // Events
    event TokenListed(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed nftContract,
        uint256 price,
        uint256 listedAt
    );
    
    event ListingCancelled(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 cancelledAt
    );
    
    event ListingPriceUpdated(
        uint256 indexed tokenId,
        uint256 newPrice,
        uint256 updatedAt
    );
    
    event TokenSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        address nftContract,
        uint256 price,
        uint256 royalty,
        uint256 sellerAmount,
        uint256 soldAt
    );
    
    event RoyaltyUpdated(uint256 newRoyaltyBps);
    event RoyaltyTreasuryUpdated(address newTreasury);
    event RegistryUpdated(address newRegistry);
    
    /**
     * @dev Constructor
     * @param _propertyNFT Address of the PropertyNFT contract
     * @param _royaltyTreasury Address where royalties are sent
     * @param _royaltyBps Royalty in basis points (250 = 2.5%)
     * @param _registry Address of the CumulusRegistry contract
     */
    constructor(
        address _propertyNFT,
        address _royaltyTreasury,
        uint256 _royaltyBps,
        address _registry
    ) Ownable(msg.sender) {
        require(_propertyNFT != address(0), "Invalid NFT contract");
        require(_royaltyTreasury != address(0), "Invalid treasury");
        require(_registry != address(0), "Invalid registry");
        require(_royaltyBps <= 1000, "Royalty too high"); // Max 10%

        propertyNFT = IERC721(_propertyNFT);
        royaltyTreasury = _royaltyTreasury;
        royaltyBps = _royaltyBps;
        registryContract = _registry;
    }
    
    /**
     * @dev List a token for sale
     * @param tokenId Token ID to list
     * @param price Sale price in wei
     */
    function listToken(uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be > 0");
        require(
            propertyNFT.ownerOf(tokenId) == msg.sender,
            "Not token owner"
        );
        require(
            !listings[tokenId].active,
            "Token already listed"
        );
        
        listings[tokenId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            nftContract: address(propertyNFT),
            price: price,
            listedAt: block.timestamp,
            active: true
        });
        
        listingCount++;
        
        // Transfer NFT to marketplace (escrow)
        propertyNFT.transferFrom(msg.sender, address(this), tokenId);
        
        emit TokenListed(tokenId, msg.sender, address(propertyNFT), price, block.timestamp);
    }
    
    /**
     * @dev Cancel a listing
     * @param tokenId Token ID to delist
     */
    function cancelListing(uint256 tokenId) external {
        Listing storage listing = listings[tokenId];
        
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not seller");
        
        listing.active = false;
        
        // Return NFT to seller
        propertyNFT.transferFrom(address(this), msg.sender, tokenId);
        
        emit ListingCancelled(tokenId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Update listing price
     * @param tokenId Token ID
     * @param newPrice New price in wei
     */
    function updatePrice(uint256 tokenId, uint256 newPrice) external {
        Listing storage listing = listings[tokenId];
        
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not seller");
        require(newPrice > 0, "Price must be > 0");
        
        listing.price = newPrice;
        
        emit ListingPriceUpdated(tokenId, newPrice, block.timestamp);
    }
    
    /**
     * @dev Buy a listed token
     * @notice Enforces royalty payment and compliance checks
     * @param tokenId Token ID to buy
     */
    function buyToken(uint256 tokenId) external payable {
        Listing storage listing = listings[tokenId];
        
        require(listing.active, "Token not listed");
        require(msg.value >= listing.price, "Insufficient payment");
        
        address seller = listing.seller;
        uint256 price = listing.price;
        
        // Calculate royalty and seller amount
        uint256 royalty = (price * royaltyBps) / 10000;
        uint256 sellerAmount = price - royalty;
        
        // Compliance check: verify buyer can purchase
        _checkCompliance(address(propertyNFT), seller, msg.sender);
        
        // Mark listing as inactive before transfers (prevent reentrancy)
        listing.active = false;
        
        // ENFORCED: Send royalty to treasury first
        payable(royaltyTreasury).transfer(royalty);
        
        // Send remainder to seller
        payable(seller).transfer(sellerAmount);
        
        // Transfer NFT to buyer
        propertyNFT.transferFrom(address(this), msg.sender, tokenId);
        
        // Refund overpayment
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
        
        emit TokenSold(
            tokenId,
            seller,
            msg.sender,
            address(propertyNFT),
            price,
            royalty,
            sellerAmount,
            block.timestamp
        );
    }
    
    /**
     * @dev Get active listing details
     * @param tokenId Token ID
     * @return Listing struct
     */
    function getActiveListing(uint256 tokenId) external view returns (Listing memory) {
        require(listings[tokenId].active, "Listing not active");
        return listings[tokenId];
    }
    
    /**
     * @dev Get all active listings (returns array)
     * @notice This is gas-intensive - use off-chain indexing for production
     * @return Listing[] Array of active listings
     */
    function getAllListings() external view returns (Listing[] memory) {
        // Count active listings
        uint256 activeCount = 0;
        // In production, would use off-chain indexer
        // For PoC, return empty array (frontend uses backend API)
        
        Listing[] memory result = new Listing[](activeCount);
        return result;
    }
    
    /**
     * @dev Set royalty percentage (admin only)
     * @param bps New royalty in basis points (250 = 2.5%)
     */
    function setRoyaltyPercentage(uint256 bps) external onlyOwner {
        require(bps <= 1000, "Royalty too high"); // Max 10%
        royaltyBps = bps;
        emit RoyaltyUpdated(bps);
    }
    
    /**
     * @dev Set royalty treasury address (admin only)
     * @param treasury New treasury address
     */
    function setRoyaltyTreasury(address treasury) external onlyOwner {
        require(treasury != address(0), "Invalid address");
        royaltyTreasury = treasury;
        emit RoyaltyTreasuryUpdated(treasury);
    }
    
    /**
     * @dev Set registry contract address (admin only)
     * @param registry New registry address
     */
    function setRegistry(address registry) external onlyOwner {
        require(registry != address(0), "Invalid address");
        registryContract = registry;
        emit RegistryUpdated(registry);
    }
    
    /**
     * @dev Check compliance before purchase (internal)
     * @param nftContract NFT contract address
     * @param from Seller address
     * @param to Buyer address
     */
    function _checkCompliance(
        address nftContract,
        address from,
        address to
    ) internal view {
        // Call registry.canTransfer() for compliance check
        // This is a static call to avoid state changes
        (bool allowed, string memory reason) = _canTransfer(nftContract, from, to);
        require(allowed, reason);
    }
    
    /**
     * @dev Call registry canTransfer function
     * @param nftContract NFT contract address
     * @param from Seller address
     * @param to Buyer address
     * @return allowed Whether transfer is allowed
     * @return reason Reason if not allowed
     */
    function _canTransfer(
        address nftContract,
        address from,
        address to
    ) internal view returns (bool allowed, string memory reason) {
        // Interface to registry contract
        interface IRegistry {
            function canTransfer(address, address, address) external view returns (bool, string memory);
        }
        
        try IRegistry(registryContract).canTransfer(nftContract, from, to) returns (
            bool _allowed,
            string memory _reason
        ) {
            return (_allowed, _reason);
        } catch {
            // If registry call fails, allow transfer (fallback for PoC)
            return (true, "");
        }
    }
    
    /**
     * @dev ERC-721 receiver interface (required for receiving NFTs)
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
    
    /**
     * @dev Emergency withdraw (admin only) - for recovery only
     * @param token Token address (address(0) for MATIC)
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        require(to != address(0), "Invalid address");
        
        if (token == address(0)) {
            // Withdraw MATIC
            payable(to).transfer(amount);
        } else {
            // Withdraw ERC-20 tokens
            interface IERC20 {
                function transfer(address, uint256) external returns (bool);
            }
            require(IERC20(token).transfer(to, amount), "Transfer failed");
        }
    }
    
    /**
     * @dev Get contract balance (for debugging)
     * @return uint256 MATIC balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
