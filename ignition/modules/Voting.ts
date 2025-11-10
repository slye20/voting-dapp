import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VotingModule = buildModule("VotingModule", (m) => {
  // Define initial proposals for the voting contract
  const initialProposals = m.getParameter("initialProposals", [
    "Proposal 1: Increase community funding by 20%",
    "Proposal 2: Implement quarterly governance meetings",
    "Proposal 3: Create a developer grant program"
  ]);

  // Deploy the Voting contract with initial proposals
  const voting = m.contract("Voting", [initialProposals]);

  return { voting };
});

export default VotingModule;

