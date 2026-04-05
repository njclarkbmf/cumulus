export default function MarketplacePage() {
  // Mock data
  const listings = [
    {
      id: 1,
      tokenId: 5,
      propertyName: 'Cumulus Makati Condo A',
      seller: '0x1234...5678',
      price: 520000,
      listedAt: '2026-04-03',
    },
    {
      id: 2,
      tokenId: 12,
      propertyName: 'Cumulus BGC Tower Unit',
      seller: '0x8765...4321',
      price: 780000,
      listedAt: '2026-04-02',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Marketplace</h1>

      {/* Filters */}
      <div className="card mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="">All Properties</option>
              <option value="makati">Cumulus Makati Condo A</option>
              <option value="bgc">Cumulus BGC Tower Unit</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="date">Date Listed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="space-y-4">
        {listings.map((listing) => (
          <div key={listing.id} className="card flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{listing.propertyName}</h3>
              <p className="text-sm text-gray-600">Token #{listing.tokenId}</p>
              <p className="text-sm text-gray-500">Seller: {listing.seller}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary-600">₱{listing.price.toLocaleString()}</p>
              <button className="btn-primary mt-2">Buy Now</button>
              <p className="text-xs text-gray-500 mt-1">+ 2.5% royalty</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
