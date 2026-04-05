import PropertyCard from '@/components/PropertyCard';

// Mock data - will be replaced with API calls
const mockProperties = [
  {
    id: 'PROP-MKT-001',
    name: 'Cumulus Makati Condo A',
    location: 'Makati City, Metro Manila',
    pricePerToken: 500000,
    tokensAvailable: 75,
    totalSupply: 100,
  },
  {
    id: 'PROP-BGC-001',
    name: 'Cumulus BGC Tower Unit',
    location: 'Bonifacio Global City, Taguig',
    pricePerToken: 750000,
    tokensAvailable: 50,
    totalSupply: 100,
  },
  {
    id: 'PROP-ORT-001',
    name: 'Cumulus Ortigas Center',
    location: 'Ortigas Center, Pasig',
    pricePerToken: 450000,
    tokensAvailable: 100,
    totalSupply: 150,
  },
];

export default function PropertiesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Browse Properties</h1>
      
      {/* Filters */}
      <div className="card mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="">All Locations</option>
              <option value="makati">Makati City</option>
              <option value="bgc">Bonifacio Global City</option>
              <option value="ortigas">Ortigas Center</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price Range
            </label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="">Any Price</option>
              <option value="0-500000">Under ₱500,000</option>
              <option value="500000-750000">₱500,000 - ₱750,000</option>
              <option value="750000+">Over ₱750,000</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Availability
            </label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="">Any Availability</option>
              <option value="available">Available Now</option>
              <option value="sold-out">Sold Out</option>
            </select>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockProperties.map((property) => (
          <PropertyCard
            key={property.id}
            id={property.id}
            name={property.name}
            location={property.location}
            pricePerToken={property.pricePerToken}
            tokensAvailable={property.tokensAvailable}
            totalSupply={property.totalSupply}
          />
        ))}
      </div>
    </div>
  );
}
