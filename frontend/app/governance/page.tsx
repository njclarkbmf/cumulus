export default function GovernancePage() {
  const proposals = [
    {
      id: 1,
      propertyName: 'Cumulus Makati Condo A',
      title: 'Install New Security Cameras',
      description: 'Proposal to install 20 new CCTV cameras in common areas',
      costEstimate: 150000,
      forVotes: 45,
      againstVotes: 5,
      endsAt: '2026-04-15',
      status: 'active',
    },
    {
      id: 2,
      propertyName: 'Cumulus BGC Tower Unit',
      title: 'Renovate Gym Equipment',
      description: 'Replace old gym equipment with new modern machines',
      costEstimate: 250000,
      forVotes: 30,
      againstVotes: 20,
      endsAt: '2026-04-10',
      status: 'active',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Governance</h1>

      <div className="space-y-6">
        {proposals.map((proposal) => (
          <div key={proposal.id} className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="badge badge-success mb-2">{proposal.status}</span>
                <h3 className="text-xl font-bold">{proposal.title}</h3>
                <p className="text-gray-600">{proposal.propertyName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Ends: {proposal.endsAt}</p>
              </div>
            </div>

            <p className="text-gray-700 mb-4">{proposal.description}</p>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Estimated Cost: <span className="font-semibold">₱{proposal.costEstimate.toLocaleString()}</span></p>
              
              {/* Voting Progress */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-success">For: {proposal.forVotes}</span>
                    <span className="text-error">Against: {proposal.againstVotes}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-success h-3 rounded-full"
                      style={{ width: `${(proposal.forVotes / (proposal.forVotes + proposal.againstVotes)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="btn-success flex-1">Vote For</button>
              <button className="btn-error flex-1">Vote Against</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
