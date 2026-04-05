export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  // In production, fetch from API
  const property = {
    id: params.id,
    name: 'Cumulus Makati Condo A',
    location: 'Makati City, Metro Manila',
    description: 'Premium condominium in the heart of Makati business district. Modern units with stunning city views.',
    pricePerToken: 500000,
    tokensAvailable: 75,
    totalSupply: 100,
    maintenanceFee: 500,
    totalValue: 50000000,
    amenities: ['Swimming Pool', 'Gym', '24/7 Security', 'Parking', 'Function Room'],
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Property Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{property.name}</h1>
        <p className="text-gray-600">📍 {property.location}</p>
      </div>

      {/* Image Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="h-96 bg-gradient-to-br from-primary-200 to-primary-300 rounded-lg"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg"></div>
          <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg"></div>
          <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg"></div>
          <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Property Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold mb-4">About This Property</h2>
            <p className="text-gray-700 mb-4">{property.description}</p>
            
            <h3 className="font-semibold mb-2">Amenities:</h3>
            <ul className="grid grid-cols-2 gap-2">
              {property.amenities.map((amenity) => (
                <li key={amenity} className="flex items-center gap-2">
                  <span className="text-success">✓</span> {amenity}
                </li>
              ))}
            </ul>
          </div>

          {/* Token Economics */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Token Economics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-sm">Total Supply</p>
                <p className="text-2xl font-bold">{property.totalSupply} tokens</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Available</p>
                <p className="text-2xl font-bold text-success">{property.tokensAvailable} tokens</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Price per Token</p>
                <p className="text-2xl font-bold text-primary-600">₱{property.pricePerToken.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Property Value</p>
                <p className="text-2xl font-bold">₱{property.totalValue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Maintenance Fee */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Maintenance Fee</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Monthly fee per token</p>
                <p className="text-3xl font-bold text-primary-600">₱{property.maintenanceFee}/month</p>
              </div>
              <button className="btn-primary">
                Pay Maintenance
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Note: Tokens with unpaid maintenance cannot be transferred
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Buy Token CTA */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Buy Token</h3>
            <p className="text-3xl font-bold text-primary-600 mb-4">
              ₱{property.pricePerToken.toLocaleString()}
            </p>
            <button className="btn-primary w-full mb-2">
              Buy Token
            </button>
            <p className="text-sm text-gray-500 text-center">
              2.5% royalty applies on all secondary sales
            </p>
          </div>

          {/* Your Holdings */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Your Holdings</h3>
            <p className="text-gray-600">Connect wallet to view your tokens</p>
          </div>
        </div>
      </div>
    </div>
  );
}
