export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-500 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              Real Estate Investment, Tokenized
            </h1>
            <p className="text-xl mb-8 text-primary-100">
              Own a piece of premium Philippine real estate. Buy, sell, and manage property tokens on the blockchain.
            </p>
            <div className="flex gap-4 justify-center">
              <a href="/properties" className="btn-primary bg-white text-primary-600 hover:bg-gray-100">
                Browse Properties
              </a>
              <a href="/dashboard" className="btn-secondary bg-primary-700 text-white hover:bg-primary-800">
                My Portfolio
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">3</div>
              <div className="text-gray-600">Properties Tokenized</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">₱15M+</div>
              <div className="text-gray-600">Total Value Tokenized</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">150+</div>
              <div className="text-gray-600">Token Holders</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Cumulus?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card">
              <div className="text-4xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold mb-2">Fractional Ownership</h3>
              <p className="text-gray-600">
                Own a fraction of premium properties. Start investing with as little as ₱50,000.
              </p>
            </div>
            <div className="card">
              <div className="text-4xl mb-4">💱</div>
              <h3 className="text-xl font-semibold mb-2">Secondary Trading</h3>
              <p className="text-gray-600">
                Buy and sell property tokens anytime. No waiting for property sales to complete.
              </p>
            </div>
            <div className="card">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">Blockchain Secured</h3>
              <p className="text-gray-600">
                All transactions recorded on Polygon blockchain. Transparent and tamper-proof.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties Preview */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Properties</h2>
            <a href="/properties" className="text-primary-600 hover:text-primary-700 font-medium">
              View All →
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Placeholder property cards */}
            <div className="card p-0 overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-primary-200 to-primary-300"></div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">Cumulus Makati Condo A</h3>
                <p className="text-gray-600 text-sm mb-2">📍 Makati City, Metro Manila</p>
                <div className="flex justify-between items-center">
                  <span className="text-primary-600 font-bold">₱500,000/token</span>
                  <span className="text-sm text-gray-500">75 tokens available</span>
                </div>
              </div>
            </div>
            <div className="card p-0 overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-primary-200 to-primary-300"></div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">Cumulus BGC Tower Unit</h3>
                <p className="text-gray-600 text-sm mb-2">📍 Bonifacio Global City</p>
                <div className="flex justify-between items-center">
                  <span className="text-primary-600 font-bold">₱750,000/token</span>
                  <span className="text-sm text-gray-500">50 tokens available</span>
                </div>
              </div>
            </div>
            <div className="card p-0 overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-primary-200 to-primary-300"></div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">Cumulus Ortigas Center</h3>
                <p className="text-gray-600 text-sm mb-2">📍 Ortigas Center, Pasig</p>
                <div className="flex justify-between items-center">
                  <span className="text-primary-600 font-bold">₱450,000/token</span>
                  <span className="text-sm text-gray-500">100 tokens available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Investing?</h2>
          <p className="text-xl mb-8 text-primary-100">
            Connect your wallet and browse available properties today.
          </p>
          <a href="/properties" className="btn-primary bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-3">
            Get Started
          </a>
        </div>
      </section>
    </div>
  );
}
