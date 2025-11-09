import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Voting Contract", function () {
  let voting: any;
  let owner: any;
  let addr1: any;
  let addr2: any;
  let addr3: any;

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // Deploy contract with initial proposals
    const initialProposals = [
      "Proposal 1: Increase budget",
      "Proposal 2: Hire new staff",
      "Proposal 3: Upgrade equipment"
    ];
    
    voting = await ethers.deployContract("Voting", [initialProposals]);
    await voting.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should create proposals from constructor", async function () {
      const count = await voting.proposalCount();
      expect(count).to.equal(3);
    });

    it("Should set deployer as admin for initial proposals", async function () {
      const proposal = await voting.getProposal(0);
      expect(proposal.admin).to.equal(owner.address);
    });

    it("Should set all initial proposals as open", async function () {
      const proposal0 = await voting.getProposal(0);
      const proposal1 = await voting.getProposal(1);
      const proposal2 = await voting.getProposal(2);
      
      expect(proposal0.open).to.be.true;
      expect(proposal1.open).to.be.true;
      expect(proposal2.open).to.be.true;
    });

    it("Should emit ProposalCreated and VotingOpened events", async function () {
      const initialProposals = ["Test Proposal"];
      const newVoting = await ethers.deployContract("Voting", [initialProposals]);
      
      await expect(newVoting.deploymentTransaction())
        .to.emit(newVoting, "ProposalCreated")
        .withArgs(0, "Test Proposal", owner.address);
      
      await expect(newVoting.deploymentTransaction())
        .to.emit(newVoting, "VotingOpened")
        .withArgs(0);
    });

    it("Should initialize proposals with correct data", async function () {
      const proposal = await voting.getProposal(0);
      
      expect(proposal.id).to.equal(0);
      expect(proposal.description).to.equal("Proposal 1: Increase budget");
      expect(proposal.voteCount).to.equal(0);
      expect(proposal.open).to.be.true;
      expect(proposal.voters.length).to.equal(0);
    });
  });

  describe("Adding Proposals", function () {
    it("Should allow anyone to add a proposal", async function () {
      await voting.connect(addr1).addProposal("New proposal from addr1");
      
      const count = await voting.proposalCount();
      expect(count).to.equal(4);
      
      const proposal = await voting.getProposal(3);
      expect(proposal.description).to.equal("New proposal from addr1");
      expect(proposal.admin).to.equal(addr1.address);
    });

    it("Should emit ProposalCreated and VotingOpened events when adding", async function () {
      await expect(voting.connect(addr1).addProposal("New proposal"))
        .to.emit(voting, "ProposalCreated")
        .withArgs(3, "New proposal", addr1.address)
        .and.to.emit(voting, "VotingOpened")
        .withArgs(3);
    });

    it("Should set new proposal as open", async function () {
      await voting.connect(addr1).addProposal("New proposal");
      const proposal = await voting.getProposal(3);
      expect(proposal.open).to.be.true;
    });

    it("Should initialize new proposal with zero votes", async function () {
      await voting.connect(addr1).addProposal("New proposal");
      const proposal = await voting.getProposal(3);
      expect(proposal.voteCount).to.equal(0);
      expect(proposal.voters.length).to.equal(0);
    });
  });

  describe("Voting", function () {
    it("Should allow a user to vote on an open proposal", async function () {
      await voting.connect(addr1).vote(0);
      
      const proposal = await voting.getProposal(0);
      expect(proposal.voteCount).to.equal(1);
    });

    it("Should emit VoteCast event when voting", async function () {
      await expect(voting.connect(addr1).vote(0))
        .to.emit(voting, "VoteCast")
        .withArgs(addr1.address, 0);
    });

    it("Should add voter to voters array", async function () {
      await voting.connect(addr1).vote(0);
      
      const voters = await voting.getVoters(0);
      expect(voters.length).to.equal(1);
      expect(voters[0]).to.equal(addr1.address);
    });

    it("Should prevent double voting on same proposal", async function () {
      await voting.connect(addr1).vote(0);
      
      await expect(voting.connect(addr1).vote(0))
        .to.be.revertedWith("Already voted on this proposal");
    });

    it("Should allow same user to vote on different proposals", async function () {
      await voting.connect(addr1).vote(0);
      await voting.connect(addr1).vote(1);
      
      const proposal0 = await voting.getProposal(0);
      const proposal1 = await voting.getProposal(1);
      
      expect(proposal0.voteCount).to.equal(1);
      expect(proposal1.voteCount).to.equal(1);
    });

    it("Should track multiple voters correctly", async function () {
      await voting.connect(addr1).vote(0);
      await voting.connect(addr2).vote(0);
      await voting.connect(addr3).vote(0);
      
      const proposal = await voting.getProposal(0);
      expect(proposal.voteCount).to.equal(3);
      expect(proposal.voters.length).to.equal(3);
    });

    it("Should reject voting on invalid proposal ID", async function () {
      await expect(voting.connect(addr1).vote(999))
        .to.be.revertedWith("Invalid proposal ID");
    });

    it("Should reject voting on closed proposal", async function () {
      await voting.closeVoting(0);
      
      await expect(voting.connect(addr1).vote(0))
        .to.be.revertedWith("Voting is not open for this proposal");
    });
  });

  describe("Checking Vote Status", function () {
    it("Should correctly report if user has voted", async function () {
      expect(await voting.hasVoted(0, addr1.address)).to.be.false;
      
      await voting.connect(addr1).vote(0);
      
      expect(await voting.hasVoted(0, addr1.address)).to.be.true;
    });

    it("Should correctly track votes per proposal", async function () {
      await voting.connect(addr1).vote(0);
      await voting.connect(addr1).vote(1);
      
      expect(await voting.hasVoted(0, addr1.address)).to.be.true;
      expect(await voting.hasVoted(1, addr1.address)).to.be.true;
      expect(await voting.hasVoted(2, addr1.address)).to.be.false;
    });

    it("Should reject checking vote status for invalid proposal", async function () {
      await expect(voting.hasVoted(999, addr1.address))
        .to.be.revertedWith("Invalid proposal ID");
    });
  });

  describe("Closing Voting", function () {
    it("Should allow admin to close their proposal", async function () {
      await voting.closeVoting(0);
      
      const proposal = await voting.getProposal(0);
      expect(proposal.open).to.be.false;
    });

    it("Should emit VotingClosed event", async function () {
      await expect(voting.closeVoting(0))
        .to.emit(voting, "VotingClosed")
        .withArgs(0);
    });

    it("Should reject non-admin from closing voting", async function () {
      await expect(voting.connect(addr1).closeVoting(0))
        .to.be.revertedWith("Only admin can close voting");
    });

    it("Should allow proposal creator to close their own proposal", async function () {
      await voting.connect(addr1).addProposal("Addr1's proposal");
      const proposalId = (await voting.proposalCount()) - 1n;
      
      await voting.connect(addr1).closeVoting(proposalId);
      
      const proposal = await voting.getProposal(proposalId);
      expect(proposal.open).to.be.false;
    });

    it("Should reject closing already closed proposal", async function () {
      await voting.closeVoting(0);
      
      await expect(voting.closeVoting(0))
        .to.be.revertedWith("Voting already closed");
    });

    it("Should reject closing invalid proposal ID", async function () {
      await expect(voting.closeVoting(999))
        .to.be.revertedWith("Invalid proposal ID");
    });
  });

  describe("Getting Proposal Data", function () {
    it("Should return correct proposal data", async function () {
      await voting.connect(addr1).vote(0);
      await voting.connect(addr2).vote(0);
      
      const proposal = await voting.getProposal(0);
      
      expect(proposal.id).to.equal(0);
      expect(proposal.description).to.equal("Proposal 1: Increase budget");
      expect(proposal.voteCount).to.equal(2);
      expect(proposal.admin).to.equal(owner.address);
      expect(proposal.open).to.be.true;
      expect(proposal.voters.length).to.equal(2);
    });

    it("Should reject getting invalid proposal", async function () {
      await expect(voting.getProposal(999))
        .to.be.revertedWith("Invalid proposal ID");
    });
  });

  describe("Getting Voters", function () {
    it("Should return all voters for a proposal", async function () {
      await voting.connect(addr1).vote(0);
      await voting.connect(addr2).vote(0);
      await voting.connect(addr3).vote(0);
      
      const voters = await voting.getVoters(0);
      
      expect(voters.length).to.equal(3);
      expect(voters[0]).to.equal(addr1.address);
      expect(voters[1]).to.equal(addr2.address);
      expect(voters[2]).to.equal(addr3.address);
    });

    it("Should return empty array for proposal with no votes", async function () {
      const voters = await voting.getVoters(0);
      expect(voters.length).to.equal(0);
    });

    it("Should reject getting voters for invalid proposal", async function () {
      await expect(voting.getVoters(999))
        .to.be.revertedWith("Invalid proposal ID");
    });
  });

  describe("Proposal Count", function () {
    it("Should return correct count after adding proposals", async function () {
      expect(await voting.proposalCount()).to.equal(3);
      
      await voting.connect(addr1).addProposal("New proposal");
      expect(await voting.proposalCount()).to.equal(4);
      
      await voting.connect(addr2).addProposal("Another proposal");
      expect(await voting.proposalCount()).to.equal(5);
    });
  });

  describe("Complex Scenarios", function () {
    it("Should handle multiple users voting on multiple proposals", async function () {
      // Addr1 votes on all proposals
      await voting.connect(addr1).vote(0);
      await voting.connect(addr1).vote(1);
      await voting.connect(addr1).vote(2);
      
      // Addr2 votes on first two
      await voting.connect(addr2).vote(0);
      await voting.connect(addr2).vote(1);
      
      // Addr3 votes on first one only
      await voting.connect(addr3).vote(0);
      
      const proposal0 = await voting.getProposal(0);
      const proposal1 = await voting.getProposal(1);
      const proposal2 = await voting.getProposal(2);
      
      expect(proposal0.voteCount).to.equal(3);
      expect(proposal1.voteCount).to.equal(2);
      expect(proposal2.voteCount).to.equal(1);
    });

    it("Should allow voting after closing unrelated proposal", async function () {
      await voting.closeVoting(0);
      
      await voting.connect(addr1).vote(1);
      
      const proposal1 = await voting.getProposal(1);
      expect(proposal1.voteCount).to.equal(1);
    });

    it("Should handle proposal lifecycle correctly", async function () {
      // Create new proposal
      await voting.connect(addr1).addProposal("Test proposal");
      const proposalId = (await voting.proposalCount()) - 1n;
      
      // Vote on it
      await voting.connect(addr2).vote(proposalId);
      await voting.connect(addr3).vote(proposalId);
      
      // Check votes
      let proposal = await voting.getProposal(proposalId);
      expect(proposal.voteCount).to.equal(2);
      expect(proposal.open).to.be.true;
      
      // Close it
      await voting.connect(addr1).closeVoting(proposalId);
      
      // Verify closed
      proposal = await voting.getProposal(proposalId);
      expect(proposal.open).to.be.false;
      
      // Try to vote (should fail)
      await expect(voting.connect(owner).vote(proposalId))
        .to.be.revertedWith("Voting is not open for this proposal");
    });
  });
});

