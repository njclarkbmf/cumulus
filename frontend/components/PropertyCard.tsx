import Link from 'next/link';
import Image from 'next/image';

interface PropertyCardProps {
  id: string;
  name: string;
  location: string;
  pricePerToken: number;
  tokensAvailable: number;
  totalSupply: number;
  imageUrl?: string;
}

export default function PropertyCard({
  id,
  name,
  location,
  pricePerToken,
  tokensAvailable,
  totalSupply,
  imageUrl,
}: PropertyCardProps) {
  const occupancyRate = ((totalSupply - tokensAvailable) / totalSupply) * 100;

  return (
    <Link href={`/properties/${id}`} className="block">
      <div className="card p-0 overflow-hidden hover:shadow-lg transition-shadow">
        {/* Property Image */}
        <div className="h-48 bg-gradient-to-br from-primary-200 to-primary-300 relative">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover"
            />
          )}
          <div className="absolute top-2 right-2">
            <span className="badge badge-success">
              {tokensAvailable} tokens left
            </span>
          </div>
        </div>

        {/* Property Details */}
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1 text-gray-800">{name}</h3>
          <p className="text-gray-600 text-sm mb-3">📍 {location}</p>

          {/* Price & Availability */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-primary-600 font-bold">
              ₱{pricePerToken.toLocaleString()}/token
            </span>
            <span className="text-sm text-gray-500">
              {tokensAvailable} of {totalSupply}
            </span>
          </div>

          {/* Occupancy Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full"
              style={{ width: `${occupancyRate}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {occupancyRate.toFixed(0)}% sold
          </p>
        </div>
      </div>
    </Link>
  );
}
