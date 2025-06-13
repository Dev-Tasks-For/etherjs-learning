# Ethereum Wallet API - Complete Solution

Comprehensive NestJS backend application for wallet balance and transaction queries on Ethereum Mainnet and BSC.

## 🚀 Technologies

- **Node.js** (JavaScript/TypeScript)
- **NestJS 11** - Backend framework
- **Ethers.js v6+** - Ethereum blockchain interaction
- **Infura** - Ethereum/BSC RPC provider

## ✅ Features

- 🔍 **Native Balance:** ETH and BNB balance query
- 💰 **Token Balance:** USDT balance query (Ethereum + BSC)  
- 📊 **Transaction Query:** Transaction details by hash
- 🔍 **Transaction Parsing:** FROM, TO, Amount, Status information
- ✅ **Address validation** and error handling
- 📝 **Postman Collection** ready!

## 📋 API Endpoints

### **1. Native Balances**
```bash
GET /wallet/eth-balance?address=0x...     # ETH balance
GET /wallet/bnb-balance?address=0x...     # BNB balance
```

### **2. Token Balances**
```bash
GET /wallet/usdt-balance?address=0x...        # Ethereum USDT
GET /wallet/bsc-usdt-balance?address=0x...    # BSC USDT
```

### **3. Transaction Details**
```bash
GET /wallet/transaction?hash=0x...&network=ETH    # Ethereum TX
GET /wallet/transaction?hash=0x...&network=BSC    # BSC TX
```

## 🔧 Installation

```bash
# Clone the project
git clone <repo-url>
cd etherjs-wallet

# Install dependencies
npm install

# Start in development mode
npm run start:dev
```

## 📝 Postman Collection

**File:** `Ethereum_Wallet_API.postman_collection.json`

### How to Import:
1. Open Postman → **Import** 
2. **File** → Select `Ethereum_Wallet_API.postman_collection.json`
3. **Import** it

### Collection Contents:
- ✅ **6 Endpoints** (all APIs)
- ✅ **Variables** (baseUrl, test addresses) 
- ✅ **Example Responses** (sample responses)
- ✅ **Auto Tests** (automatic validation)
- ✅ **Error Cases** (error scenarios)

## 🧪 Test Examples

### Successful ETH Balance Response:
```json
{
  "success": true,
  "address": "0x876EabF441B2EE5B5b0554Fd502a8E0600950cFa",
  "balance": "3.912885883209562072", 
  "token": "ETH",
  "network": "Ethereum",
  "message": "ETH balance queried successfully"
}
```

### Transaction Details Response:
```json
{
  "success": true,
  "transaction": {
    "hash": "0x...",
    "from": "0x123...",      // FROM address
    "to": "0x456...",        // TO address  
    "value": "1.5",          // Amount (ETH/BNB)
    "gasPrice": "20.5",      // Gas price (gwei)
    "gasUsed": "21000",      // Gas usage
    "status": 1,             // 1=Success, 0=Failed
    "blockNumber": 18500000,
    "confirmations": 12,
    "timestamp": 1699123456,
    "network": "ETH"
  }
}
```

## Technologies

- **Node.js** (JavaScript/TypeScript)
- **NestJS 11** - Backend framework
- **Ethers.js v6+** - Ethereum blockchain interaction
- **Infura** - Ethereum RPC provider

## Features

- ✅ USDT balance query on Ethereum Mainnet
- ✅ ERC-20 token contract integration
- ✅ Human-readable format (string)
- ✅ Address validation
- ✅ Error handling

## Installation

```bash
# Install dependencies
npm install

# Start the application
npm run start

# Start in development mode
npm run start:dev
```

## API Usage

### USDT Balance Query

**Endpoint:** `GET /wallet/usdt-balance`

**Query Parameters:**
- `address` (string, required): Ethereum wallet address to query

**Example Request:**
```bash
curl "http://localhost:3000/wallet/usdt-balance?address=0x5041ed759Dd4aFc3a72b8192C143F72f4724081A"
```

**Example Response:**
```json
{
  "success": true,
  "address": "0x5041ed759Dd4aFc3a72b8192C143F72f4724081A",
  "balance": "15.23",
  "token": "USDT",
  "message": "USDT balance queried successfully"
}
```

## Technical Details

### USDT Token Information
- **Contract Address:** `0xdAC17F958D2ee523a2206206994597C13D831ec7`
- **Decimals:** 6
- **Network:** Ethereum Mainnet

### ERC-20 ABI
```javascript
[
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
]
```

### Provider Configuration
- **RPC URL:** `https://mainnet.infura.io/v3/4745b6b8a3ac4fa4a0552beca95c3ec8`
- **Network:** Ethereum Mainnet (Chain ID: 1)

## Test Wallet Addresses

You can test with these addresses:

1. **Binance Hot Wallet:** `0x5041ed759Dd4aFc3a72b8192C143F72f4724081A`
2. **Bitfinex Wallet:** `0x876EabF441B2EE5B5b0554Fd502a8E0600950cFa`
3. **Kraken Wallet:** `0x267be1C1D684F78cb4F6a176C4911b741E4Ffdc0`

## Development

```bash
# Run tests
npm run test

# Run E2E tests  
npm run test:e2e

# Build
npm run build

# Start production
npm run start:prod
```

## Error Codes

- `400 Bad Request`: Invalid wallet address or missing parameter
- `500 Internal Server Error`: RPC connection error or contract query error

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
