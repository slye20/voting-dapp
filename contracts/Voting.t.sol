// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Voting} from "./Voting.sol";
import {Test} from "forge-std/Test.sol";

contract VotingTest is Test {
  Voting voting;
  address owner;
  address addr1;
  address addr2;
  address addr3;

  function setUp() public {
    owner = address(this);
    addr1 = address(0x1);
    addr2 = address(0x2);
    addr3 = address(0x3);

    // Create initial proposals
    string[] memory descriptions = new string[](3);
    descriptions[0] = "Proposal 1: Increase budget";
    descriptions[1] = "Proposal 2: Hire new staff";
    descriptions[2] = "Proposal 3: Upgrade equipment";

    voting = new Voting(descriptions);
  }

  // Deployment Tests
  function test_InitialProposalCount() public view {
    require(voting.proposalCount() == 3, "Should have 3 initial proposals");
  }

  function test_InitialProposalsAreOpen() public view {
    (,, , , bool open,) = voting.getProposal(0);
    require(open == true, "Proposal 0 should be open");
    
    (,, , , bool open1,) = voting.getProposal(1);
    require(open1 == true, "Proposal 1 should be open");
    
    (,, , , bool open2,) = voting.getProposal(2);
    require(open2 == true, "Proposal 2 should be open");
  }

  function test_DeployerIsAdmin() public view {
    (, , , address admin, ,) = voting.getProposal(0);
    require(admin == owner, "Deployer should be admin");
  }

  function test_InitialVoteCountIsZero() public view {
    (, , uint voteCount, , ,) = voting.getProposal(0);
    require(voteCount == 0, "Initial vote count should be 0");
  }

  function test_InitialProposalData() public view {
    (uint id, string memory description, uint voteCount, address admin, bool open, address[] memory voters) = voting.getProposal(0);
    
    require(id == 0, "ID should be 0");
    require(keccak256(bytes(description)) == keccak256(bytes("Proposal 1: Increase budget")), "Description mismatch");
    require(voteCount == 0, "Vote count should be 0");
    require(admin == owner, "Admin should be owner");
    require(open == true, "Should be open");
    require(voters.length == 0, "Should have no voters");
  }

  // Adding Proposals Tests
  function test_AddProposal() public {
    vm.prank(addr1);
    voting.addProposal("New proposal from addr1");
    
    require(voting.proposalCount() == 4, "Should have 4 proposals");
    
    (, string memory description, , address admin, bool open,) = voting.getProposal(3);
    require(keccak256(bytes(description)) == keccak256(bytes("New proposal from addr1")), "Description mismatch");
    require(admin == addr1, "Admin should be addr1");
    require(open == true, "New proposal should be open");
  }

  function test_AddProposalEmitsEvents() public {
    vm.expectEmit(true, false, false, true);
    emit Voting.ProposalCreated(3, "New proposal", addr1);
    
    vm.expectEmit(true, false, false, false);
    emit Voting.VotingOpened(3);
    
    vm.prank(addr1);
    voting.addProposal("New proposal");
  }

  function test_NewProposalHasZeroVotes() public {
    vm.prank(addr1);
    voting.addProposal("New proposal");
    
    (, , uint voteCount, , , address[] memory voters) = voting.getProposal(3);
    require(voteCount == 0, "Should have 0 votes");
    require(voters.length == 0, "Should have no voters");
  }

  // Voting Tests
  function test_Vote() public {
    vm.prank(addr1);
    voting.vote(0);
    
    (, , uint voteCount, , ,) = voting.getProposal(0);
    require(voteCount == 1, "Vote count should be 1");
  }

  function test_VoteEmitsEvent() public {
    vm.expectEmit(true, true, false, false);
    emit Voting.VoteCast(addr1, 0);
    
    vm.prank(addr1);
    voting.vote(0);
  }

  function test_VoteAddsToVotersArray() public {
    vm.prank(addr1);
    voting.vote(0);
    
    address[] memory voters = voting.getVoters(0);
    require(voters.length == 1, "Should have 1 voter");
    require(voters[0] == addr1, "Voter should be addr1");
  }

  function test_CannotVoteTwice() public {
    vm.prank(addr1);
    voting.vote(0);
    
    vm.expectRevert("Already voted on this proposal");
    vm.prank(addr1);
    voting.vote(0);
  }

  function test_CanVoteOnDifferentProposals() public {
    vm.prank(addr1);
    voting.vote(0);
    
    vm.prank(addr1);
    voting.vote(1);
    
    (, , uint voteCount0, , ,) = voting.getProposal(0);
    (, , uint voteCount1, , ,) = voting.getProposal(1);
    
    require(voteCount0 == 1, "Proposal 0 should have 1 vote");
    require(voteCount1 == 1, "Proposal 1 should have 1 vote");
  }

  function test_MultipleUsersCanVote() public {
    vm.prank(addr1);
    voting.vote(0);
    
    vm.prank(addr2);
    voting.vote(0);
    
    vm.prank(addr3);
    voting.vote(0);
    
    (, , uint voteCount, , , address[] memory voters) = voting.getProposal(0);
    require(voteCount == 3, "Should have 3 votes");
    require(voters.length == 3, "Should have 3 voters");
  }

  function test_CannotVoteOnInvalidProposal() public {
    vm.expectRevert("Invalid proposal ID");
    vm.prank(addr1);
    voting.vote(999);
  }

  function test_CannotVoteOnClosedProposal() public {
    voting.closeVoting(0);
    
    vm.expectRevert("Voting is not open for this proposal");
    vm.prank(addr1);
    voting.vote(0);
  }

  // HasVoted Tests
  function test_HasVotedReturnsFalseInitially() public view {
    require(voting.hasVoted(0, addr1) == false, "Should not have voted");
  }

  function test_HasVotedReturnsTrueAfterVoting() public {
    vm.prank(addr1);
    voting.vote(0);
    
    require(voting.hasVoted(0, addr1) == true, "Should have voted");
  }

  function test_HasVotedTracksPerProposal() public {
    vm.prank(addr1);
    voting.vote(0);
    
    vm.prank(addr1);
    voting.vote(1);
    
    require(voting.hasVoted(0, addr1) == true, "Should have voted on proposal 0");
    require(voting.hasVoted(1, addr1) == true, "Should have voted on proposal 1");
    require(voting.hasVoted(2, addr1) == false, "Should not have voted on proposal 2");
  }

  function test_HasVotedRevertsOnInvalidProposal() public {
    vm.expectRevert("Invalid proposal ID");
    voting.hasVoted(999, addr1);
  }

  // Close Voting Tests
  function test_AdminCanCloseVoting() public {
    voting.closeVoting(0);
    
    (, , , , bool open,) = voting.getProposal(0);
    require(open == false, "Voting should be closed");
  }

  function test_CloseVotingEmitsEvent() public {
    vm.expectEmit(true, false, false, false);
    emit Voting.VotingClosed(0);
    
    voting.closeVoting(0);
  }

  function test_NonAdminCannotCloseVoting() public {
    vm.expectRevert("Only admin can close voting");
    vm.prank(addr1);
    voting.closeVoting(0);
  }

  function test_ProposalCreatorCanCloseTheirProposal() public {
    vm.prank(addr1);
    voting.addProposal("Addr1's proposal");
    
    uint proposalId = voting.proposalCount() - 1;
    
    vm.prank(addr1);
    voting.closeVoting(proposalId);
    
    (, , , , bool open,) = voting.getProposal(proposalId);
    require(open == false, "Voting should be closed");
  }

  function test_CannotCloseAlreadyClosedProposal() public {
    voting.closeVoting(0);
    
    vm.expectRevert("Voting already closed");
    voting.closeVoting(0);
  }

  function test_CannotCloseInvalidProposal() public {
    vm.expectRevert("Invalid proposal ID");
    voting.closeVoting(999);
  }

  // GetProposal Tests
  function test_GetProposalReturnsCorrectData() public {
    vm.prank(addr1);
    voting.vote(0);
    
    vm.prank(addr2);
    voting.vote(0);
    
    (uint id, string memory description, uint voteCount, address admin, bool open, address[] memory voters) = voting.getProposal(0);
    
    require(id == 0, "ID should be 0");
    require(keccak256(bytes(description)) == keccak256(bytes("Proposal 1: Increase budget")), "Description mismatch");
    require(voteCount == 2, "Vote count should be 2");
    require(admin == owner, "Admin should be owner");
    require(open == true, "Should be open");
    require(voters.length == 2, "Should have 2 voters");
  }

  function test_GetProposalRevertsOnInvalidId() public {
    vm.expectRevert("Invalid proposal ID");
    voting.getProposal(999);
  }

  // GetVoters Tests
  function test_GetVotersReturnsAllVoters() public {
    vm.prank(addr1);
    voting.vote(0);
    
    vm.prank(addr2);
    voting.vote(0);
    
    vm.prank(addr3);
    voting.vote(0);
    
    address[] memory voters = voting.getVoters(0);
    
    require(voters.length == 3, "Should have 3 voters");
    require(voters[0] == addr1, "First voter should be addr1");
    require(voters[1] == addr2, "Second voter should be addr2");
    require(voters[2] == addr3, "Third voter should be addr3");
  }

  function test_GetVotersReturnsEmptyForNoVotes() public view {
    address[] memory voters = voting.getVoters(0);
    require(voters.length == 0, "Should have no voters");
  }

  function test_GetVotersRevertsOnInvalidProposal() public {
    vm.expectRevert("Invalid proposal ID");
    voting.getVoters(999);
  }

  // ProposalCount Tests
  function test_ProposalCountIncreases() public {
    require(voting.proposalCount() == 3, "Initial count should be 3");
    
    vm.prank(addr1);
    voting.addProposal("New proposal");
    require(voting.proposalCount() == 4, "Count should be 4");
    
    vm.prank(addr2);
    voting.addProposal("Another proposal");
    require(voting.proposalCount() == 5, "Count should be 5");
  }

  // Complex Scenario Tests
  function test_MultipleUsersMultipleProposals() public {
    // Addr1 votes on all proposals
    vm.startPrank(addr1);
    voting.vote(0);
    voting.vote(1);
    voting.vote(2);
    vm.stopPrank();
    
    // Addr2 votes on first two
    vm.startPrank(addr2);
    voting.vote(0);
    voting.vote(1);
    vm.stopPrank();
    
    // Addr3 votes on first one only
    vm.prank(addr3);
    voting.vote(0);
    
    (, , uint voteCount0, , ,) = voting.getProposal(0);
    (, , uint voteCount1, , ,) = voting.getProposal(1);
    (, , uint voteCount2, , ,) = voting.getProposal(2);
    
    require(voteCount0 == 3, "Proposal 0 should have 3 votes");
    require(voteCount1 == 2, "Proposal 1 should have 2 votes");
    require(voteCount2 == 1, "Proposal 2 should have 1 vote");
  }

  function test_VotingAfterClosingUnrelatedProposal() public {
    voting.closeVoting(0);
    
    vm.prank(addr1);
    voting.vote(1);
    
    (, , uint voteCount, , ,) = voting.getProposal(1);
    require(voteCount == 1, "Should be able to vote on proposal 1");
  }

  function test_FullProposalLifecycle() public {
    // Create new proposal
    vm.prank(addr1);
    voting.addProposal("Test proposal");
    uint proposalId = voting.proposalCount() - 1;
    
    // Vote on it
    vm.prank(addr2);
    voting.vote(proposalId);
    
    vm.prank(addr3);
    voting.vote(proposalId);
    
    // Check votes
    (, , uint voteCount, , bool open,) = voting.getProposal(proposalId);
    require(voteCount == 2, "Should have 2 votes");
    require(open == true, "Should be open");
    
    // Close it
    vm.prank(addr1);
    voting.closeVoting(proposalId);
    
    // Verify closed
    (, , , , bool closedNow,) = voting.getProposal(proposalId);
    require(closedNow == false, "Should be closed");
    
    // Try to vote (should fail)
    vm.expectRevert("Voting is not open for this proposal");
    vm.prank(owner);
    voting.vote(proposalId);
  }

  // Fuzz Testing
  function testFuzz_Vote(address voter) public {
    vm.assume(voter != address(0));
    
    vm.prank(voter);
    voting.vote(0);
    
    require(voting.hasVoted(0, voter) == true, "Voter should have voted");
  }

  function testFuzz_AddProposal(string memory description) public {
    vm.assume(bytes(description).length > 0);
    
    uint countBefore = voting.proposalCount();
    
    vm.prank(addr1);
    voting.addProposal(description);
    
    require(voting.proposalCount() == countBefore + 1, "Proposal count should increase");
  }

  function testFuzz_MultipleVotes(uint8 numVoters) public {
    vm.assume(numVoters > 0 && numVoters <= 100);
    
    for (uint8 i = 0; i < numVoters; i++) {
      address voter = address(uint160(i + 1));
      vm.prank(voter);
      voting.vote(0);
    }
    
    (, , uint voteCount, , ,) = voting.getProposal(0);
    require(voteCount == numVoters, "Vote count should match number of voters");
  }
}

