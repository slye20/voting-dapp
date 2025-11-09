// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Voting {
  struct Proposal {
    uint id;
    string description;
    uint voteCount;
    address payable admin;
    bool open;
    address[] voters;
  }

  Proposal[] public proposals;

  event VoteCast(address indexed voter, uint indexed proposalId);
  event ProposalCreated(uint indexed proposalId, string description, address admin);
  event VotingOpened(uint indexed proposalId);
  event VotingClosed(uint indexed proposalId);

  constructor(string[] memory descriptions) {
    for (uint i = 0; i < descriptions.length; i++) {
      proposals.push(
        Proposal({
          id: i,
          description: descriptions[i],
          voteCount: 0,
          admin: payable(msg.sender),
          open: true,
          voters: new address[](0)
        })
      );
      
      emit ProposalCreated(i, descriptions[i], msg.sender);
      emit VotingOpened(i);
    }
  }

  function vote(uint proposalId) external {
    require(proposalId < proposals.length, "Invalid proposal ID");
    require(proposals[proposalId].open, "Voting is not open for this proposal");
    require(!_hasVoted(proposalId, msg.sender), "Already voted on this proposal");
    
    proposals[proposalId].voters.push(msg.sender);
    proposals[proposalId].voteCount++;
    emit VoteCast(msg.sender, proposalId);
  }

  function _hasVoted(uint proposalId, address voter) internal view returns (bool) {
    address[] storage voters = proposals[proposalId].voters;
    for (uint i = 0; i < voters.length; i++) {
      if (voters[i] == voter) {
        return true;
      }
    }
    return false;
  }

  function hasVoted(uint proposalId, address voter) external view returns (bool) {
    require(proposalId < proposals.length, "Invalid proposal ID");
    return _hasVoted(proposalId, voter);
  }

  function closeVoting(uint proposalId) external {
    require(proposalId < proposals.length, "Invalid proposal ID");
    require(msg.sender == proposals[proposalId].admin, "Only admin can close voting");
    require(proposals[proposalId].open, "Voting already closed");
    
    proposals[proposalId].open = false;
    emit VotingClosed(proposalId);
  }

  function addProposal(string memory description) external {
    proposals.push(
      Proposal({
        id: proposals.length,
        description: description,
        voteCount: 0,
        admin: payable(msg.sender),
        open: true,
        voters: new address[](0)
      })
    );
    uint proposalId = proposals.length - 1;
    
    emit ProposalCreated(proposalId, description, msg.sender);
    emit VotingOpened(proposalId);
  }

  function proposalCount() external view returns (uint) {
    return proposals.length;
  }

  function getProposal(uint proposalId) external view returns (
    uint id,
    string memory description,
    uint voteCount,
    address admin,
    bool open,
    address[] memory voters
  ) {
    require(proposalId < proposals.length, "Invalid proposal ID");
    Proposal storage p = proposals[proposalId];
    return (p.id, p.description, p.voteCount, p.admin, p.open, p.voters);
  }
  
  function getVoters(uint proposalId) external view returns (address[] memory) {
    require(proposalId < proposals.length, "Invalid proposal ID");
    return proposals[proposalId].voters;
  }
}
