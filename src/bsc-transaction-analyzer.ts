import { ethers } from 'ethers';

// BSC RPC endpoint
const BSC_RPC_URL = 'https://bsc-dataseed1.binance.org/';

// Transaction hash to analyze
const TRANSACTION_HASH = '0xe21498b300adfc0b989b5f6a52d34d79e6b768f602056adcd2857c0f6a5116d0';

// Known EntryPoint addresses (EIP-4337)
const KNOWN_ENTRYPOINTS = [
  '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789', // EntryPoint v0.6.0
  '0x0576a174D229E3cFA37253523E645A78A0C91B57', // EntryPoint v0.5.0
];

// EntryPoint ABI - sadece ihtiyacımız olan fonksiyonlar
const ENTRYPOINT_ABI = [
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "sender",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "nonce",
            "type": "uint256"
          },
          {
            "internalType": "bytes",
            "name": "initCode",
            "type": "bytes"
          },
          {
            "internalType": "bytes",
            "name": "callData",
            "type": "bytes"
          },
          {
            "internalType": "uint256",
            "name": "callGasLimit",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "verificationGasLimit",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "preVerificationGas",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxFeePerGas",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxPriorityFeePerGas",
            "type": "uint256"
          },
          {
            "internalType": "bytes",
            "name": "paymasterAndData",
            "type": "bytes"
          },
          {
            "internalType": "bytes",
            "name": "signature",
            "type": "bytes"
          }
        ],
        "internalType": "struct UserOperation[]",
        "name": "ops",
        "type": "tuple[]"
      },
      {
        "internalType": "address payable",
        "name": "beneficiary",
        "type": "address"
      }
    ],
    "name": "handleOps",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Multicall interface - Bu genellikle multicall contract'larında kullanılan interface
const MULTICALL_ABI = [
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "target",
            "type": "address"
          },
          {
            "internalType": "bytes",
            "name": "callData",
            "type": "bytes"
          }
        ],
        "internalType": "struct Multicall3.Call[]",
        "name": "calls",
        "type": "tuple[]"
      }
    ],
    "name": "aggregate",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "blockNumber",
        "type": "uint256"
      },
      {
        "internalType": "bytes[]",
        "name": "returnData",
        "type": "bytes[]"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  }
];

// ERC-20 Transfer event signature
const ERC20_TRANSFER_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// Account Abstraction event signatures
const AA_EVENT_SIGNATURES = {
  UserOperationEvent: '0x49628fd1471006c1482da88028e9ce4dbb080b815c9b0344d39e5a8e6ec1419f',
  AccountDeployed: '0xd51a9c61267aa6196961883ecf5ff2da6619c37dac0fa92122513fb32c032d2d',
};

interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
}

interface TransferInfo {
  from: string;
  to: string;
  amount: string;
  token: string;
  symbol?: string;
  decimals?: number;
}

interface TransactionAnalysis {
  hash: string;
  from: string;
  to: string;
  value: string;
  valueInBNB: string;
  gasUsed: string;
  gasPrice: string;
  blockNumber: number;
  timestamp: number;
  isMulticall: boolean;
  isAccountAbstraction: boolean;
  isEntryPoint: boolean;
  userOperations?: UserOperation[];
  transfers: TransferInfo[];
  multicallCalls?: any[];
  contractInteractions: string[];
  beneficiary?: string;
}

async function analyzeTransaction(): Promise<TransactionAnalysis> {
  try {
    // BSC provider oluştur
    const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
    
    console.log('🔍 Transaction analiz ediliyor:', TRANSACTION_HASH);
    
    // Transaction detaylarını al
    const tx = await provider.getTransaction(TRANSACTION_HASH);
    if (!tx) {
      throw new Error('Transaction bulunamadı');
    }
    
    // Transaction receipt'ini al
    const receipt = await provider.getTransactionReceipt(TRANSACTION_HASH);
    if (!receipt) {
      throw new Error('Transaction receipt bulunamadı');
    }
    
    // Block detaylarını al (timestamp için)
    const block = await provider.getBlock(receipt.blockNumber);
    if (!block) {
      throw new Error('Block bulunamadı');
    }
    
    console.log('📊 Transaction Detayları:');
    console.log('From:', tx.from);
    console.log('To:', tx.to);
    console.log('Value:', ethers.formatEther(tx.value), 'BNB');
    console.log('Gas Used:', receipt.gasUsed.toString());
    console.log('Gas Price:', ethers.formatUnits(tx.gasPrice || 0, 'gwei'), 'Gwei');
    console.log('Block Number:', receipt.blockNumber);
    console.log('Timestamp:', new Date(Number(block.timestamp) * 1000).toLocaleString());
    
    // EntryPoint kontrolü
    let isEntryPoint = false;
    let isAccountAbstraction = false;
    let userOperations: UserOperation[] = [];
    let beneficiary: string | undefined;
    
    if (tx.to && KNOWN_ENTRYPOINTS.includes(tx.to)) {
      isEntryPoint = true;
      isAccountAbstraction = true;
      console.log('🔐 EntryPoint Contract tespit edildi!', tx.to);
      
      // handleOps fonksiyon çağrısını decode et
      if (tx.data && tx.data.length > 10) {
        const functionSelector = tx.data.slice(0, 10);
        console.log('🔧 Function Selector:', functionSelector);
        
        if (functionSelector === '0x1fad948c') { // handleOps
          console.log('✅ handleOps fonksiyon çağrısı tespit edildi!');
          
          try {
            const entryPointInterface = new ethers.Interface(ENTRYPOINT_ABI);
            const decoded = entryPointInterface.parseTransaction({ data: tx.data });
            
            if (decoded && decoded.args) {
              userOperations = decoded.args[0] || [];
              beneficiary = decoded.args[1] || undefined;
              
              console.log('📱 UserOperation Sayısı:', userOperations.length);
              console.log('💰 Beneficiary (Fee Alıcısı):', beneficiary);
            }
          } catch (error) {
            console.log('⚠️  handleOps decode hatası:', error);
          }
        }
      }
    }
    
    // Multicall kontrolü
    let isMulticall = false;
    let multicallCalls: any[] = [];
    
    if (tx.data && tx.data.length > 10 && !isEntryPoint) {
      // Function selector'ı kontrol et
      const functionSelector = tx.data.slice(0, 10);
      console.log('🔧 Function Selector:', functionSelector);
      
      // Bilinen multicall selectors
      const multicallSelectors = [
        '0x252dba42', // aggregate(Call[])
        '0xbce38bd7', // tryAggregate(bool,Call[])
        '0x174dea71', // tryBlockAndAggregate(bool,Call[])
        '0x1749e1e3', // aggregate3(Call3[])
      ];
      
      if (multicallSelectors.includes(functionSelector)) {
        isMulticall = true;
        console.log('✅ Multicall transaction tespit edildi!');
        
        // Multicall call'larını decode etmeye çalış
        try {
          const multicallInterface = new ethers.Interface(MULTICALL_ABI);
          const decoded = multicallInterface.parseTransaction({ data: tx.data });
          if (decoded && decoded.args) {
            multicallCalls = decoded.args[0] || [];
            console.log('📞 Multicall içerisinde', multicallCalls.length, 'call tespit edildi');
          }
        } catch (error) {
          console.log('⚠️  Multicall decode hatası:', error);
        }
      }
    }
    
    // Additional Account Abstraction kontrolü (logs üzerinden)
    if (!isAccountAbstraction) {
      // UserOperation ve Account Abstraction belirtileri
      const aaIndicators = [
        'UserOperation',
        'EntryPoint',
        'validateUserOp',
        'executeUserOp',
        'handleOps',
      ];
      
      // Logs'ları kontrol et
      for (const log of receipt.logs) {
        try {
          // UserOperationEvent kontrolü
          if (log.topics[0] === AA_EVENT_SIGNATURES.UserOperationEvent) {
            isAccountAbstraction = true;
            console.log('🔐 UserOperationEvent tespit edildi!');
            break;
          }
          
          // Log topic'lerini kontrol et
          if (log.topics.some(topic => 
            aaIndicators.some(indicator => 
              topic.toLowerCase().includes(indicator.toLowerCase())
            )
          )) {
            isAccountAbstraction = true;
            break;
          }
        } catch (error) {
          // Ignore decode errors
        }
      }
    }
    
    // Transfer event'lerini analiz et
    const transfers: TransferInfo[] = [];
    const contractInteractions: string[] = [];
    
    for (const log of receipt.logs) {
      try {
        // ERC-20 Transfer event'lerini kontrol et
        if (log.topics[0] === ERC20_TRANSFER_SIGNATURE && log.topics.length >= 3) {
          const from = ethers.getAddress('0x' + log.topics[1].slice(26));
          const to = ethers.getAddress('0x' + log.topics[2].slice(26));
          const amount = ethers.toBigInt(log.data);
          
          // Token bilgilerini al
          try {
            const tokenInfo = await getTokenInfo(provider, log.address);
            transfers.push({
              from,
              to,
              amount: amount.toString(),
              token: log.address,
              symbol: tokenInfo.symbol,
              decimals: tokenInfo.decimals
            });
          } catch (tokenError) {
            transfers.push({
              from,
              to,
              amount: amount.toString(),
              token: log.address,
              symbol: 'Unknown Token',
              decimals: 18
            });
          }
        }
        
        // Contract interaction'ları kaydet
        if (log.address && !contractInteractions.includes(log.address)) {
          contractInteractions.push(log.address);
        }
      } catch (error) {
        // Ignore decode errors
      }
    }
    
    // Native BNB transfer'i kontrol et
    if (tx.value && tx.value > 0) {
      transfers.push({
        from: tx.from,
        to: tx.to || '0x0000000000000000000000000000000000000000',
        amount: tx.value.toString(),
        token: 'Native BNB',
        symbol: 'BNB',
        decimals: 18
      });
    }
    
    console.log('💰 Transfer Detayları:');
    if (transfers.length === 0) {
             console.log('⚠️  Direkte token transfer tespit edilmedi. Bu Account Abstraction transaction\'inda transferler UserOperation icerisinde olabilir.');
    } else {
      transfers.forEach((transfer, index) => {
        const formattedAmount = ethers.formatUnits(transfer.amount, transfer.decimals || 18);
        console.log(`${index + 1}. ${transfer.from} → ${transfer.to}`);
        console.log(`   Amount: ${formattedAmount} ${transfer.symbol}`);
        console.log(`   Token: ${transfer.token}`);
        console.log('');
      });
    }
    
    console.log('🏗️  Contract Interactions:', contractInteractions.length);
    contractInteractions.forEach((contract, index) => {
      console.log(`${index + 1}. ${contract}`);
    });
    
    if (isAccountAbstraction) {
      console.log('🔐 Account Abstraction özellikleri tespit edildi!');
      
      if (userOperations.length > 0) {
        console.log('\n👤 UserOperation Detayları:');
        for (let index = 0; index < userOperations.length; index++) {
          const userOp = userOperations[index];
          console.log(`UserOperation ${index + 1}:`);
          console.log(`  Sender (Smart Wallet): ${userOp.sender}`);
          console.log(`  Nonce: ${userOp.nonce}`);
          console.log(`  Call Data Length: ${userOp.callData.length} bytes`);
          console.log(`  Call Gas Limit: ${userOp.callGasLimit}`);
          console.log(`  Max Fee Per Gas: ${ethers.formatUnits(userOp.maxFeePerGas, 'gwei')} Gwei`);
          
          if (userOp.paymasterAndData && userOp.paymasterAndData !== '0x') {
            console.log(`  Paymaster: ${userOp.paymasterAndData.slice(0, 42)} (Gas sponsorlu!)`);
          }
          
          // CallData'yı decode et
          console.log('\n  📋 CallData Analizi:');
          const decodedOps = await decodeUserOpCallData(provider, userOp.callData);
          
          if (decodedOps.length > 0) {
            console.log(`  ✅ ${decodedOps.length} operation decode edildi:`);
            decodedOps.forEach((op, opIndex) => {
              console.log(`    ${opIndex + 1}. ${op.type}:`);
              if (op.from) {
                console.log(`       From: ${op.from}`);
              }
              console.log(`       To: ${op.to}`);
              console.log(`       Amount: ${op.formattedAmount} ${op.tokenSymbol}`);
              console.log(`       Token: ${op.tokenAddress}`);
            });
            
            // Transfers dizisine ekle
            decodedOps.forEach(op => {
              transfers.push({
                from: op.from || userOp.sender,
                to: op.to,
                amount: op.amount,
                token: op.tokenAddress,
                symbol: op.tokenSymbol,
                decimals: op.decimals
              });
            });
          } else {
            console.log('  ⚠️  CallData decode edilemedi');
          }
          console.log('');
        }
      }
    }
    
    return {
      hash: TRANSACTION_HASH,
      from: tx.from,
      to: tx.to || '0x0000000000000000000000000000000000000000',
      value: tx.value.toString(),
      valueInBNB: ethers.formatEther(tx.value),
      gasUsed: receipt.gasUsed.toString(),
      gasPrice: (tx.gasPrice || 0).toString(),
      blockNumber: receipt.blockNumber,
      timestamp: Number(block.timestamp),
      isMulticall,
      isAccountAbstraction,
      isEntryPoint,
      userOperations: userOperations.length > 0 ? userOperations : undefined,
      transfers,
      multicallCalls: multicallCalls.length > 0 ? multicallCalls : undefined,
      contractInteractions,
      beneficiary
    };
    
  } catch (error) {
    console.error('❌ Analiz hatası:', error);
    throw error;
  }
}

// Token bilgilerini al (ERC-20 için)
async function getTokenInfo(provider: ethers.JsonRpcProvider, tokenAddress: string) {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)'
    ], provider);
    
    const [name, symbol, decimals] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.decimals()
    ]);
    
    return { name, symbol, decimals };
  } catch (error) {
    return { name: 'Unknown Token', symbol: 'UNKNOWN', decimals: 18 };
  }
}

// UserOperation callData'sını decode et
async function decodeUserOpCallData(provider: ethers.JsonRpcProvider, callData: string): Promise<any[]> {
  const operations: any[] = [];
  
  try {
    // Common function selectors
    const functionSelectors = {
      '0xa9059cbb': 'transfer(address,uint256)', // ERC-20 transfer
      '0x23b872dd': 'transferFrom(address,address,uint256)', // ERC-20 transferFrom
      '0x095ea7b3': 'approve(address,uint256)', // ERC-20 approve
      '0x5d9d2d15': 'executeBatch(address[],uint256[],bytes[])', // Batch execution
      '0x51945447': 'execute(address,uint256,bytes)', // Single execution
    };
    
    const selector = callData.slice(0, 10);
    
    if (selector === '0x51945447') {
      // Single execute call
      console.log('🔍 Single execute call tespit edildi');
      
      try {
        const executeInterface = new ethers.Interface([
          'function execute(address target, uint256 value, bytes calldata data)'
        ]);
        
        const decoded = executeInterface.parseTransaction({ data: callData });
        if (decoded && decoded.args) {
          const target = decoded.args[0];
          const value = decoded.args[1];
          const data = decoded.args[2];
          
          console.log(`  Target Contract: ${target}`);
          console.log(`  Value: ${ethers.formatEther(value)} BNB`);
          console.log(`  Data Length: ${data.length} bytes`);
          
          // İç function call'ını decode et
          const innerSelector = data.slice(0, 10);
          if (innerSelector === '0xa9059cbb') {
            // ERC-20 transfer
            const transferInterface = new ethers.Interface([
              'function transfer(address to, uint256 amount)'
            ]);
            
            try {
              const transferDecoded = transferInterface.parseTransaction({ data: data });
              if (transferDecoded && transferDecoded.args) {
                const to = transferDecoded.args[0];
                const amount = transferDecoded.args[1];
                
                // Token bilgilerini al
                const tokenInfo = await getTokenInfo(provider, target);
                const formattedAmount = ethers.formatUnits(amount, tokenInfo.decimals);
                
                operations.push({
                  type: 'ERC20_TRANSFER',
                  tokenAddress: target,
                  tokenSymbol: tokenInfo.symbol,
                  tokenName: tokenInfo.name,
                  decimals: tokenInfo.decimals,
                  to: to,
                  amount: amount.toString(),
                  formattedAmount: formattedAmount
                });
                
                console.log(`  🎯 ERC-20 Transfer: ${formattedAmount} ${tokenInfo.symbol} → ${to}`);
              }
            } catch (e) {
              console.log('  ⚠️  Transfer decode hatası:', e);
            }
          } else if (innerSelector === '0x23b872dd') {
            // ERC-20 transferFrom
            const transferInterface = new ethers.Interface([
              'function transferFrom(address from, address to, uint256 amount)'
            ]);
            
            try {
              const transferDecoded = transferInterface.parseTransaction({ data: data });
              if (transferDecoded && transferDecoded.args) {
                const from = transferDecoded.args[0];
                const to = transferDecoded.args[1];
                const amount = transferDecoded.args[2];
                
                // Token bilgilerini al
                const tokenInfo = await getTokenInfo(provider, target);
                const formattedAmount = ethers.formatUnits(amount, tokenInfo.decimals);
                
                operations.push({
                  type: 'ERC20_TRANSFER_FROM',
                  tokenAddress: target,
                  tokenSymbol: tokenInfo.symbol,
                  tokenName: tokenInfo.name,
                  decimals: tokenInfo.decimals,
                  from: from,
                  to: to,
                  amount: amount.toString(),
                  formattedAmount: formattedAmount
                });
                
                console.log(`  🎯 ERC-20 TransferFrom: ${formattedAmount} ${tokenInfo.symbol} from ${from} → ${to}`);
              }
            } catch (e) {
              console.log('  ⚠️  TransferFrom decode hatası:', e);
            }
          } else if (value > 0) {
            // Native token transfer
            operations.push({
              type: 'NATIVE_TRANSFER',
              tokenAddress: 'native',
              tokenSymbol: 'BNB',
              tokenName: 'BNB',
              decimals: 18,
              to: target,
              amount: value.toString(),
              formattedAmount: ethers.formatEther(value)
            });
            
            console.log(`  🎯 Native BNB Transfer: ${ethers.formatEther(value)} BNB → ${target}`);
          }
        }
      } catch (error) {
        console.log('⚠️  Execute decode hatası:', error);
      }
    } else if (selector === '0x5d9d2d15') {
      // Batch execution
      console.log('🔍 Batch execute call tespit edildi');
      
      try {
        const batchInterface = new ethers.Interface([
          'function executeBatch(address[] targets, uint256[] values, bytes[] datas)'
        ]);
        
        const decoded = batchInterface.parseTransaction({ data: callData });
        if (decoded && decoded.args) {
          const targets = decoded.args[0];
          const values = decoded.args[1];
          const datas = decoded.args[2];
          
          console.log(`  Batch içerisinde ${targets.length} operation`);
          
          for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            const value = values[i];
            const data = datas[i];
            
            console.log(`  Operation ${i + 1}:`);
            console.log(`    Target: ${target}`);
            console.log(`    Value: ${ethers.formatEther(value)} BNB`);
            
            // Her bir operation'ı decode et
            const innerSelector = data.slice(0, 10);
            if (innerSelector === '0xa9059cbb') {
              // ERC-20 transfer
              const transferInterface = new ethers.Interface([
                'function transfer(address to, uint256 amount)'
              ]);
              
              try {
                const transferDecoded = transferInterface.parseTransaction({ data: data });
                if (transferDecoded && transferDecoded.args) {
                  const to = transferDecoded.args[0];
                  const amount = transferDecoded.args[1];
                  
                  // Token bilgilerini al
                  const tokenInfo = await getTokenInfo(provider, target);
                  const formattedAmount = ethers.formatUnits(amount, tokenInfo.decimals);
                  
                  operations.push({
                    type: 'ERC20_TRANSFER',
                    tokenAddress: target,
                    tokenSymbol: tokenInfo.symbol,
                    tokenName: tokenInfo.name,
                    decimals: tokenInfo.decimals,
                    to: to,
                    amount: amount.toString(),
                    formattedAmount: formattedAmount
                  });
                  
                  console.log(`    🎯 ERC-20 Transfer: ${formattedAmount} ${tokenInfo.symbol} → ${to}`);
                }
              } catch (e) {
                console.log('    ⚠️  Transfer decode hatası');
              }
            } else if (value > 0) {
              // Native token transfer
              operations.push({
                type: 'NATIVE_TRANSFER',
                tokenAddress: 'native',
                tokenSymbol: 'BNB',
                tokenName: 'BNB',
                decimals: 18,
                to: target,
                amount: value.toString(),
                formattedAmount: ethers.formatEther(value)
              });
              
              console.log(`    🎯 Native BNB Transfer: ${ethers.formatEther(value)} BNB → ${target}`);
            }
          }
        }
      } catch (error) {
        console.log('⚠️  Batch decode hatası:', error);
      }
    } else {
      console.log('🔍 Bilinmeyen function selector:', selector);
      
      // Eğer direkt ERC-20 function ise
      if (selector === '0xa9059cbb') {
        const transferInterface = new ethers.Interface([
          'function transfer(address to, uint256 amount)'
        ]);
        
        try {
          const transferDecoded = transferInterface.parseTransaction({ data: callData });
          if (transferDecoded && transferDecoded.args) {
            const to = transferDecoded.args[0];
            const amount = transferDecoded.args[1];
            
            operations.push({
              type: 'ERC20_TRANSFER',
              tokenAddress: 'unknown',
              tokenSymbol: 'UNKNOWN',
              tokenName: 'Unknown Token',
              decimals: 18,
              to: to,
              amount: amount.toString(),
              formattedAmount: ethers.formatUnits(amount, 18)
            });
            
            console.log(`🎯 Direct ERC-20 Transfer: ${ethers.formatUnits(amount, 18)} → ${to}`);
          }
        } catch (e) {
          console.log('⚠️  Direct transfer decode hatası');
        }
      }
    }
    
  } catch (error) {
    console.log('⚠️  CallData decode genel hatası:', error);
  }
  
  return operations;
}

// Ana fonksiyon
async function main() {
  try {
    console.log('🚀 BSC Transaction Analyzer başlatılıyor...\n');
    
    const analysis = await analyzeTransaction();
    
    console.log('\n📋 ÖZET RAPOR:');
    console.log('=====================================');
    console.log('Transaction Hash:', analysis.hash);
    console.log('Gönderen (EOA):', analysis.from);
    console.log('Alıcı (Contract):', analysis.to);
    console.log('Değer:', analysis.valueInBNB, 'BNB');
    console.log('Gas Kullanılan:', analysis.gasUsed);
    console.log('Block Number:', analysis.blockNumber);
    console.log('Timestamp:', new Date(analysis.timestamp * 1000).toLocaleString());
    console.log('Multicall:', analysis.isMulticall ? '✅ Evet' : '❌ Hayır');
    console.log('Account Abstraction:', analysis.isAccountAbstraction ? '✅ Evet' : '❌ Hayır');
    console.log('EntryPoint Contract:', analysis.isEntryPoint ? '✅ Evet' : '❌ Hayır');
    console.log('Transfer Sayısı:', analysis.transfers.length);
    console.log('Contract Interaction Sayısı:', analysis.contractInteractions.length);
    
    if (analysis.beneficiary) {
      console.log('Gas Fee Beneficiary:', analysis.beneficiary);
    }
    
    if (analysis.userOperations && analysis.userOperations.length > 0) {
      console.log('UserOperation Sayısı:', analysis.userOperations.length);
      
      console.log('\n🎯 SONUÇ - Account Abstraction Analizi:');
      console.log('Bu transaction bir Coinbase Smart Wallet (Account Abstraction) transaction\'ıdır.');
      console.log('Gerçek transferler UserOperation callData içerisinde kodlanmıştır.');
      
      analysis.userOperations.forEach((userOp, index) => {
        console.log(`\nSmart Wallet ${index + 1}: ${userOp.sender}`);
        console.log('Bu smart wallet üzerinden yapılan işlem(ler) callData içerisindedir.');
      });
      
      if (analysis.transfers.length > 0) {
        console.log('\n💸 DECODE EDİLEN TRANSFERLER:');
        analysis.transfers.forEach((transfer, index) => {
          const formattedAmount = ethers.formatUnits(transfer.amount, transfer.decimals || 18);
          console.log(`${index + 1}. Transfer:`);
          console.log(`   From: ${transfer.from}`);
          console.log(`   To: ${transfer.to}`);
          console.log(`   Amount: ${formattedAmount} ${transfer.symbol}`);
          console.log(`   Token: ${transfer.token}`);
          console.log('');
        });
      }
    }
    
    if (analysis.multicallCalls && analysis.multicallCalls.length > 0) {
      console.log('\n🔄 Multicall Detayları:');
      analysis.multicallCalls.forEach((call, index) => {
        console.log(`${index + 1}. Target: ${call.target}`);
        console.log(`   CallData: ${call.callData.slice(0, 20)}...`);
      });
    }
    
  } catch (error) {
    console.error('❌ Program hatası:', error);
  }
}

// Script'i çalıştır
if (require.main === module) {
  main();
}

export { analyzeTransaction, TransactionAnalysis }; 