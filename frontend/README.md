# Voting dApp Frontend

A modern, beautiful frontend for the decentralized voting application built with Next.js, TypeScript, Tailwind CSS, and ethers.js.

## Features

✅ **Wallet Connection** - Seamless MetaMask integration
✅ **View Proposals** - Browse all active and closed voting proposals
✅ **Cast Votes** - Vote on proposals with blockchain confirmation
✅ **Admin Controls** - Close voting and add new proposals
✅ **Real-time Updates** - Instant results after transaction confirmation
✅ **Responsive Design** - Beautiful UI that works on all devices
✅ **Transaction Status** - Live feedback during blockchain operations

## Prerequisites

- Node.js 18+ installed
- MetaMask browser extension
- Deployed Voting smart contract

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env
```

4. Add your deployed contract address to `.env`:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContractAddressHere
```

## Getting the Contract Address

After deploying your Voting contract using Hardhat, you'll find the contract address in:
- Console output after deployment
- `ignition/deployments/chain-{chainId}/deployed_addresses.json`

For Sepolia testnet deployment, look at:
```
ignition/deployments/chain-11155111/deployed_addresses.json
```

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Flow

### 1. Connect Wallet
- Click "Connect Wallet" button
- Approve MetaMask connection
- Your address will be displayed in the header

### 2. View Proposals
- All proposals load automatically from the blockchain
- See vote counts, descriptions, and status (Open/Closed)
- Green badge = Open for voting
- Gray badge = Closed

### 3. Cast a Vote
- Click "Cast Vote" on any open proposal
- Confirm the transaction in MetaMask
- Wait for blockchain confirmation
- Results update automatically after mining

### 4. Admin Features

**Close Voting** (if you're the proposal admin):
- Click "Close Voting" on your proposal
- Confirm the transaction
- Proposal status changes to "Closed"

**Add New Proposal**:
- Click "Add Proposal" in the header
- Enter your proposal description
- Confirm the transaction
- New proposal appears in the list

### 5. Real-time Updates
- Proposals refresh after each transaction
- Vote counts update instantly
- Transaction status shown inline

## Project Structure

```
frontend/
├── app/
│   ├── page.tsx          # Main application page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── ProposalCard.tsx       # Individual proposal card
│   └── AddProposalModal.tsx   # Modal for adding proposals
├── hooks/
│   ├── useWeb3.ts             # Web3/MetaMask connection hook
│   └── useVotingContract.ts   # Smart contract interaction hook
├── lib/
│   └── contract.ts            # Contract ABI and address
└── package.json
```

## Configuration

### Network Support

The app automatically detects your connected network. Supported networks:
- Ethereum Mainnet (Chain ID: 1)
- Sepolia Testnet (Chain ID: 11155111)
- Goerli Testnet (Chain ID: 5)
- Polygon (Chain ID: 137)
- Mumbai Testnet (Chain ID: 80001)
- Hardhat Local (Chain ID: 31337)

Make sure your MetaMask is connected to the same network where your contract is deployed.

### Contract ABI

The contract ABI is already included in `lib/contract.ts`. If you modify the Solidity contract, update the ABI from:
```
../artifacts/contracts/Voting.sol/Voting.json
```

## Building for Production

```bash
npm run build
npm start
```

The optimized production build will be created in the `.next` directory.

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Set the environment variable `NEXT_PUBLIC_CONTRACT_ADDRESS`
4. Deploy!

### Deploy to other platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Render

Make sure to set the `NEXT_PUBLIC_CONTRACT_ADDRESS` environment variable.

## Troubleshooting

### MetaMask Not Detected
- Make sure MetaMask extension is installed
- Refresh the page after installing MetaMask

### Wrong Network
- Switch to the correct network in MetaMask
- The network should match where your contract is deployed

### Transaction Failures
- Make sure you have enough ETH for gas fees
- Check if the proposal is still open for voting
- Verify you haven't already voted on the proposal

### Contract Not Found
- Verify `NEXT_PUBLIC_CONTRACT_ADDRESS` is set correctly
- Make sure the contract is deployed on the connected network
- Check the contract address format (should start with 0x)

## Technologies Used

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **ethers.js v6** - Ethereum interaction
- **MetaMask** - Wallet connection

## Features in Detail

### Wallet Connection
- Automatic account detection
- Network change handling
- Account switch detection
- Disconnect handling

### Voting System
- One vote per address per proposal
- Vote status checking
- Transaction confirmation
- Error handling with user feedback

### Admin Features
- Only proposal creators can close their proposals
- Anyone can add new proposals
- Admin badge shown on owned proposals

### UI/UX
- Loading states during transactions
- Error messages with descriptions
- Success confirmations
- Responsive grid layout
- Modern gradient designs
- Smooth animations

## License

This project is part of the Voting dApp smart contract system.

