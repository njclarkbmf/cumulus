'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';

interface MaintenanceFeeBadgeProps {
  tokenId: number;
  lastPaid: bigint;
  isCurrent: boolean;
  nextDueDate: bigint;
  maintenanceFee: bigint;
  propertyNftAddress: string;
}

export default function MaintenanceFeeBadge({
  tokenId,
  lastPaid,
  isCurrent,
  nextDueDate,
  maintenanceFee,
  propertyNftAddress,
}: MaintenanceFeeBadgeProps) {
  const { isConnected } = useAccount();
  const [showModal, setShowModal] = useState(false);

  // Calculate days until due or days overdue
  const now = BigInt(Math.floor(Date.now() / 1000));
  const daysRemaining = Number((nextDueDate - now) / 86400n);
  
  let statusText: string;
  let badgeClass: string;
  
  if (isCurrent) {
    if (daysRemaining > 7) {
      statusText = `Current (due in ${daysRemaining} days)`;
      badgeClass = 'badge-success';
    } else {
      statusText = `Due Soon (${daysRemaining} days)`;
      badgeClass = 'badge-warning';
    }
  } else {
    statusText = `Overdue (${Math.abs(daysRemaining)} days)`;
    badgeClass = 'badge-error';
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <span className={`badge ${badgeClass}`}>{statusText}</span>
        {isConnected && (
          <button
            onClick={() => setShowModal(true)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Pay Now
          </button>
        )}
      </div>

      {showModal && (
        <PayMaintenanceModal
          tokenId={tokenId}
          maintenanceFee={maintenanceFee}
          propertyNftAddress={propertyNftAddress}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

// Modal Component
function PayMaintenanceModal({
  tokenId,
  maintenanceFee,
  propertyNftAddress,
  onClose,
}: {
  tokenId: number;
  maintenanceFee: bigint;
  propertyNftAddress: string;
  onClose: () => void;
}) {
  const { writeContract, data: hash, isPending } = useWriteContract();
  
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });

  const handlePay = () => {
    writeContract({
      address: propertyNftAddress as `0x${string}`,
      functionName: 'payMaintenance',
      args: [BigInt(tokenId)],
      value: maintenanceFee,
    });
  };

  const maintenanceFeeEth = Number(maintenanceFee) / 1e18;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4">Pay Maintenance Fee</h3>
        
        <div className="space-y-4 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-600">Token ID:</span>
            <span className="font-mono">#{tokenId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Amount:</span>
            <span className="font-semibold">₱500 ({maintenanceFeeEth.toFixed(4)} MATIC)</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={isPending || isConfirming}
          >
            Cancel
          </button>
          <button
            onClick={handlePay}
            className="btn-success flex-1"
            disabled={isPending || isConfirming}
          >
            {isPending || isConfirming ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>

        {hash && (
          <p className="text-sm text-gray-600 mt-4 text-center">
            Transaction: <a href={`https://mumbai.polygonscan.com/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">
              View on Polygonscan
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
