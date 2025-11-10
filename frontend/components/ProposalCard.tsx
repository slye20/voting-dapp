import { useState } from 'react';
import { Proposal } from '../hooks/useVotingContract';

interface ProposalCardProps {
  proposal: Proposal;
  account: string | null;
  onVote: (proposalId: number) => Promise<{ success: boolean; error?: string }>;
  onClose: (proposalId: number) => Promise<{ success: boolean; error?: string }>;
  hasVoted: boolean;
  isLoading: boolean;
}

export default function ProposalCard({
  proposal,
  account,
  onVote,
  onClose,
  hasVoted,
  isLoading,
}: ProposalCardProps) {
  const [txStatus, setTxStatus] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  const isAdmin = account?.toLowerCase() === proposal.admin.toLowerCase();

  const handleVote = async () => {
    setActionLoading(true);
    setTxStatus('Sending transaction...');
    
    const result = await onVote(proposal.id);
    
    if (result.success) {
      setTxStatus('Vote submitted successfully! ✓');
      setTimeout(() => setTxStatus(''), 3000);
    } else {
      setTxStatus(`Error: ${result.error}`);
      setTimeout(() => setTxStatus(''), 5000);
    }
    
    setActionLoading(false);
  };

  const handleClose = async () => {
    if (!confirm('Are you sure you want to close voting for this proposal?')) {
      return;
    }

    setActionLoading(true);
    setTxStatus('Closing voting...');
    
    const result = await onClose(proposal.id);
    
    if (result.success) {
      setTxStatus('Voting closed successfully! ✓');
      setTimeout(() => setTxStatus(''), 3000);
    } else {
      setTxStatus(`Error: ${result.error}`);
      setTimeout(() => setTxStatus(''), 5000);
    }
    
    setActionLoading(false);
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-gray-900">
              Proposal #{proposal.id}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                proposal.open
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {proposal.open ? 'Open' : 'Closed'}
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-2">
            Admin: {formatAddress(proposal.admin)}
            {isAdmin && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                You
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-gray-800 text-lg leading-relaxed">
          {proposal.description}
        </p>
      </div>

      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-primary-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path
              fillRule="evenodd"
              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {proposal.voteCount}
            </p>
            <p className="text-xs text-gray-600">
              {proposal.voteCount === 1 ? 'Vote' : 'Votes'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-600">
            {proposal.voters.length} {proposal.voters.length === 1 ? 'voter' : 'voters'}
          </p>
        </div>
      </div>

      {txStatus && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            txStatus.includes('Error')
              ? 'bg-red-50 text-red-700'
              : txStatus.includes('✓')
              ? 'bg-green-50 text-green-700'
              : 'bg-blue-50 text-blue-700'
          }`}
        >
          {txStatus}
        </div>
      )}

      <div className="flex gap-3">
        {proposal.open && account && !hasVoted && (
          <button
            onClick={handleVote}
            disabled={actionLoading || isLoading}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {actionLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Cast Vote
              </>
            )}
          </button>
        )}

        {proposal.open && hasVoted && (
          <div className="flex-1 bg-gray-100 text-gray-600 font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Already Voted
          </div>
        )}

        {!proposal.open && (
          <div className="flex-1 bg-gray-100 text-gray-600 font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            Voting Closed
          </div>
        )}

        {isAdmin && proposal.open && (
          <button
            onClick={handleClose}
            disabled={actionLoading || isLoading}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {actionLoading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Close Voting
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

