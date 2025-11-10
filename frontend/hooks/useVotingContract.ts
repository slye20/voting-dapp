import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { VOTING_CONTRACT_ADDRESS, VOTING_ABI } from '../lib/contract';

export interface Proposal {
  id: number;
  description: string;
  voteCount: number;
  admin: string;
  open: boolean;
  voters: string[];
}

export function useVotingContract(
  provider: ethers.BrowserProvider | null,
  signer: ethers.Signer | null,
  account: string | null
) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContract = useCallback((needsSigner: boolean = false) => {
    if (!VOTING_CONTRACT_ADDRESS) {
      throw new Error('Contract address not configured');
    }
    
    if (needsSigner && !signer) {
      throw new Error('Wallet not connected');
    }

    return new ethers.Contract(
      VOTING_CONTRACT_ADDRESS,
      VOTING_ABI,
      needsSigner ? signer : provider
    );
  }, [provider, signer]);

  const loadProposals = useCallback(async () => {
    if (!provider) return;

    try {
      setLoading(true);
      setError(null);

      const contract = getContract(false);
      const count = await contract.proposalCount();
      const proposalsData: Proposal[] = [];

      for (let i = 0; i < Number(count); i++) {
        const proposal = await contract.getProposal(i);
        proposalsData.push({
          id: Number(proposal[0]),
          description: proposal[1],
          voteCount: Number(proposal[2]),
          admin: proposal[3],
          open: proposal[4],
          voters: proposal[5],
        });
      }

      setProposals(proposalsData);
    } catch (err: any) {
      console.error('Error loading proposals:', err);
      setError(err.message || 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  }, [provider, getContract]);

  const vote = async (proposalId: number) => {
    try {
      setLoading(true);
      setError(null);

      const contract = getContract(true);
      const tx = await contract.vote(proposalId);
      
      await tx.wait();
      await loadProposals();

      return { success: true };
    } catch (err: any) {
      console.error('Error voting:', err);
      const message = err.reason || err.message || 'Failed to vote';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const closeVoting = async (proposalId: number) => {
    try {
      setLoading(true);
      setError(null);

      const contract = getContract(true);
      const tx = await contract.closeVoting(proposalId);
      
      await tx.wait();
      await loadProposals();

      return { success: true };
    } catch (err: any) {
      console.error('Error closing voting:', err);
      const message = err.reason || err.message || 'Failed to close voting';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const addProposal = async (description: string) => {
    try {
      setLoading(true);
      setError(null);

      const contract = getContract(true);
      const tx = await contract.addProposal(description);
      
      await tx.wait();
      await loadProposals();

      return { success: true };
    } catch (err: any) {
      console.error('Error adding proposal:', err);
      const message = err.reason || err.message || 'Failed to add proposal';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const hasVoted = async (proposalId: number, voterAddress: string): Promise<boolean> => {
    try {
      const contract = getContract(false);
      return await contract.hasVoted(proposalId, voterAddress);
    } catch (err: any) {
      console.error('Error checking vote status:', err);
      return false;
    }
  };

  useEffect(() => {
    if (provider) {
      loadProposals();
    }
  }, [provider, loadProposals]);

  return {
    proposals,
    loading,
    error,
    vote,
    closeVoting,
    addProposal,
    hasVoted,
    refreshProposals: loadProposals,
  };
}

