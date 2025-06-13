# Ethereum Wallet API - Complete Solution

Ethereum Mainnet ve BSC üzerinde wallet bakiyesi ve transaction sorguları yapan kapsamlı NestJS backend uygulaması.

## 🚀 Teknolojiler

- **Node.js** (JavaScript/TypeScript)
- **NestJS 11** - Backend framework
- **Ethers.js v6+** - Ethereum blockchain ile etkileşim
- **Infura** - Ethereum/BSC RPC provider

## ✅ Özellikler

- 🔍 **Native Balance:** ETH ve BNB bakiye sorgusu
- 💰 **Token Balance:** USDT bakiye sorgusu (Ethereum + BSC)
- 📊 **Transaction Query:** Hash ile transaction detayları
- 🔍 **Transaction Parsing:** FROM, TO, Amount, Status bilgileri
- ✅ **Adres validasyonu** ve error handling
- 📝 **Postman Collection** hazır!

## 📋 API Endpoints

### **1. Native Balances**
```bash
GET /wallet/eth-balance?address=0x...     # ETH bakiyesi
GET /wallet/bnb-balance?address=0x...     # BNB bakiyesi
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

## 🔧 Kurulum

```bash
# Projeyi klonla
git clone <repo-url>
cd etherjs-wallet

# Bağımlılıkları yükle
npm install

# Development modunda başlat
npm run start:dev
```

## 📝 Postman Collection

**Dosya:** `Ethereum_Wallet_API.postman_collection.json`

### Import Etme:
1. Postman açın → **Import** 
2. **File** → `Ethereum_Wallet_API.postman_collection.json` seçin
3. **Import** edin

### Collection İçeriği:
- ✅ **6 Endpoint** (tüm API'ler)
- ✅ **Variables** (baseUrl, test adresleri) 
- ✅ **Example Responses** (örnek cevaplar)
- ✅ **Auto Tests** (otomatik validasyon)
- ✅ **Error Cases** (hata senaryoları)

## 🧪 Test Örnekleri

### Başarılı ETH Balance Response:
```json
{
  "success": true,
  "address": "0x876EabF441B2EE5B5b0554Fd502a8E0600950cFa",
  "balance": "3.912885883209562072", 
  "token": "ETH",
  "network": "Ethereum",
  "message": "ETH bakiyesi başarıyla sorgulandı"
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
    "gasUsed": "21000",      // Gas kullanımı
    "status": 1,             // 1=Success, 0=Failed
    "blockNumber": 18500000,
    "confirmations": 12,
    "timestamp": 1699123456,
    "network": "ETH"
  }
}
```

## Teknolojiler

- **Node.js** (JavaScript/TypeScript)
- **NestJS 11** - Backend framework
- **Ethers.js v6+** - Ethereum blockchain ile etkileşim
- **Infura** - Ethereum RPC provider

## Özellikler

- ✅ Ethereum Mainnet üzerinde USDT bakiye sorgulama
- ✅ ERC-20 token contract entegrasyonu
- ✅ Insan tarafından okunabilir format (string)
- ✅ Adres validasyonu
- ✅ Error handling

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Uygulamayı başlat
npm run start

# Development modunda başlat
npm run start:dev
```

## API Kullanımı

### USDT Bakiye Sorgulama

**Endpoint:** `GET /wallet/usdt-balance`

**Query Parameters:**
- `address` (string, zorunlu): Sorgulanacak Ethereum wallet adresi

**Örnek İstek:**
```bash
curl "http://localhost:3000/wallet/usdt-balance?address=0x5041ed759Dd4aFc3a72b8192C143F72f4724081A"
```

**Örnek Yanıt:**
```json
{
  "success": true,
  "address": "0x5041ed759Dd4aFc3a72b8192C143F72f4724081A",
  "balance": "15.23",
  "token": "USDT",
  "message": "USDT bakiyesi başarıyla sorgulandı"
}
```

## Teknik Detaylar

### USDT Token Bilgileri
- **Contract Adresi:** `0xdAC17F958D2ee523a2206206994597C13D831ec7`
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

## Test Wallet Adresleri

Bu adreslerle test edebilirsiniz:

1. **Binance Hot Wallet:** `0x5041ed759Dd4aFc3a72b8192C143F72f4724081A`
2. **Bitfinex Wallet:** `0x876EabF441B2EE5B5b0554Fd502a8E0600950cFa`
3. **Kraken Wallet:** `0x267be1C1D684F78cb4F6a176C4911b741E4Ffdc0`

## Geliştirme

```bash
# Test çalıştır
npm run test

# E2E test çalıştır  
npm run test:e2e

# Build
npm run build

# Production başlat
npm run start:prod
```

## Hata Kodları

- `400 Bad Request`: Geçersiz wallet adresi veya eksik parametre
- `500 Internal Server Error`: RPC bağlantı hatası veya contract sorgu hatası

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
