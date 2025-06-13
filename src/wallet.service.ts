import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

// AA Transaction interfaces
export interface UserOperation {
  sender: string;
  nonce: bigint;
  initCode: string;
  callData: string;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: string;
  signature: string;
}

export interface ParsedUserOperation {
  index: number;
  sender: string;
  nonce: string;
  callData: string;
  decodedCallData: any;
  gasLimits: {
    callGasLimit: string;
    verificationGasLimit: string;
    preVerificationGas: string;
  };
  fees: {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  };
  paymaster: string | null;
}

export interface AATransactionResult {
  transactionHash: string;
  entryPoint: string;
  bundler: string;
  userOperations: ParsedUserOperation[];
  events: any[];
  transfers: any[];
}

@Injectable()
export class WalletService {
  private readonly ethProvider: ethers.JsonRpcProvider;
  private readonly bscProvider: ethers.JsonRpcProvider;

  // Ethereum Mainnet USDT contract address
  private readonly ethUsdtContractAddress =
    '0xdAC17F958D2ee523a2206206994597C13D831ec7';

  // BSC USDT contract address (Binance-Peg BSC-USD)
  private readonly bscUsdtContractAddress =
    '0x55d398326f99059fF775485246999027B3197955';

  // ERC-20 ABI only balanceOf and decimals functions
  private readonly erc20Abi = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
  ];

  // Entry Point ABI - ERC-4337 standard
  private readonly entryPointInterface = new ethers.Interface([
    'function handleOps(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)[] calldata ops, address payable beneficiary)',
    'event UserOperationEvent(bytes32 indexed userOpHash, address indexed sender, address indexed paymaster, uint256 nonce, bool success, uint256 actualGasCost, uint256 actualGasUsed)'
  ]);

  // Smart Contract Wallet ABI for decoding calls
  private readonly walletInterface = new ethers.Interface([
    'function multicall(bytes[] calldata data) returns (bytes[] memory results)',
    'function execute(address to, uint256 value, bytes calldata data)',
    'function executeBatch(address[] calldata to, uint256[] calldata values, bytes[] calldata data)',
    // Common wallet functions
    'function execTransactionFromModule(address to, uint256 value, bytes calldata data, uint8 operation)',
    'function execTransaction(address to, uint256 value, bytes calldata data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes calldata signatures)',
    // SimpleAccount (common AA implementation)
    'function execute(address dest, uint256 value, bytes calldata func)',
    'function executeBatch(address[] calldata dest, bytes[] calldata func)',
    'function executeBatch(address[] calldata dest, uint256[] calldata values, bytes[] calldata func)'
  ]);

  // Common token interfaces for decoding
  private readonly tokenInterfaces = {
    erc20: new ethers.Interface([
      'function transfer(address to, uint256 amount) returns (bool)',
      'function transferFrom(address from, address to, uint256 amount) returns (bool)',
      'function approve(address spender, uint256 amount) returns (bool)',
      'function mint(address to, uint256 amount)',
      'function burn(uint256 amount)',
      'function burn(address from, uint256 amount)'
    ]),
    erc721: new ethers.Interface([
      'function transferFrom(address from, address to, uint256 tokenId)',
      'function safeTransferFrom(address from, address to, uint256 tokenId)',
      'function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data)',
      'function approve(address to, uint256 tokenId)',
      'function setApprovalForAll(address operator, bool approved)'
    ]),
    erc1155: new ethers.Interface([
      'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data)',
      'function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data)',
      'function setApprovalForAll(address operator, bool approved)'
    ])
  };

  constructor() {
    // Ethereum Mainnet provider
    this.ethProvider = new ethers.JsonRpcProvider(
      'https://mainnet.infura.io/v3/4745b6b8a3ac4fa4a0552beca95c3ec8',
    );

    // BSC Mainnet provider - using alternative RPC
    this.bscProvider = new ethers.JsonRpcProvider(
      'https://bsc-dataseed1.binance.org/',
    );
  }

  async getEthBalance(address: string): Promise<string> {
    try {
      if (!ethers.isAddress(address)) {
        throw new Error('Invalid Ethereum address');
      }

      const balance = await this.ethProvider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      throw new Error(`ETH balance fetch failed: ${error.message}`);
    }
  }

  async getBnbBalance(address: string): Promise<string> {
    try {
      if (!ethers.isAddress(address)) {
        throw new Error('Geçersiz Ethereum adresi');
      }

      const balance = await this.bscProvider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      throw new Error(`BNB bakiye sorgulanamadı: ${error.message}`);
    }
  }

  async getTransactionDetails(
    txHash: string,
    network: 'ETH' | 'BSC',
  ): Promise<any> {
    try {
      const provider = network === 'ETH' ? this.ethProvider : this.bscProvider;

      // Query transaction and receipt in parallel
      const [tx, receipt] = await Promise.all([
        provider.getTransaction(txHash),
        provider.getTransactionReceipt(txHash),
      ]);

      if (!tx) {
        throw new Error('Transaction not found');
      }

      // Parsed transaction information
      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value || 0), // Native coin amount
        gasPrice: tx.gasPrice ? ethers.formatUnits(tx.gasPrice, 'gwei') : null,
        gasLimit: tx.gasLimit ? tx.gasLimit.toString() : null,
        gasUsed: receipt?.gasUsed ? receipt.gasUsed.toString() : null,
        status: receipt?.status, // 1 = success, 0 = failed
        blockNumber: tx.blockNumber,
        confirmations: await tx.confirmations(),
        timestamp: tx.blockNumber
          ? (await provider.getBlock(tx.blockNumber))?.timestamp
          : null,
        network: network,
        data: tx.data, // Contract interaction data
        nonce: tx.nonce,
      };
    } catch (error) {
      throw new Error(`Transaction fetch failed: ${error.message}`);
    }
  }

  async getTokenBalance(
    address: string,
    network: 'ETH' | 'BSC',
  ): Promise<string> {
    try {
      // Check address format
      if (!ethers.isAddress(address)) {
        throw new Error('Invalid Ethereum address');
      }

      // Select provider and contract address based on the network
      const provider = network === 'ETH' ? this.ethProvider : this.bscProvider;
      const contractAddress =
        network === 'ETH'
          ? this.ethUsdtContractAddress
          : this.bscUsdtContractAddress;

      // Create USDT contract instance
      const usdtContract = new ethers.Contract(
        contractAddress,
        this.erc20Abi,
        provider,
      );

      // Get balance and decimals information
      const [balance, decimals] = await Promise.all([
        usdtContract.balanceOf(address),
        usdtContract.decimals(),
      ]);

      // Convert balance to human readable format
      const formattedBalance = ethers.formatUnits(balance, decimals);

      return formattedBalance;
    } catch (error) {
      throw new Error(`${network} USDT balance fetch failed: ${error.message}`);
    }
  }

  async getUsdtTransactionDetails(
    txHash: string,
    network: 'ETH' | 'BSC',
  ): Promise<any> {
    try {
      const provider = network === 'ETH' ? this.ethProvider : this.bscProvider;
      const contractAddress =
        network === 'ETH'
          ? this.ethUsdtContractAddress
          : this.bscUsdtContractAddress;

      // Get transaction and receipt
      const [tx, receipt] = await Promise.all([
        provider.getTransaction(txHash),
        provider.getTransactionReceipt(txHash),
      ]);

      if (!tx) {
        throw new Error('Transaction not found');
      }

      // Basic transaction info
      const basicTxInfo = {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        gasPrice: tx.gasPrice ? ethers.formatUnits(tx.gasPrice, 'gwei') : null,
        gasLimit: tx.gasLimit ? tx.gasLimit.toString() : null,
        gasUsed: receipt?.gasUsed ? receipt.gasUsed.toString() : null,
        status: receipt?.status, // 1 = success, 0 = failed
        blockNumber: tx.blockNumber,
        confirmations: await tx.confirmations(),
        timestamp: tx.blockNumber
          ? (await provider.getBlock(tx.blockNumber))?.timestamp
          : null,
        network: network,
        nonce: tx.nonce,
      };

      console.log(tx);

      // Check if this is a USDT contract interaction
      if (tx.to?.toLowerCase() === contractAddress.toLowerCase()) {
        // Create contract instance
        const usdtContract = new ethers.Contract(
          contractAddress,
          this.erc20Abi,
          provider,
        );

        // Parse transaction logs for USDT transfers
        const transferEvents: Array<{
          from: string;
          to: string;
          value: string;
          formattedValue: string;
          token: string;
        }> = [];
        if (receipt && receipt.logs) {
          for (const log of receipt.logs) {
            try {
              // Try to parse the log as a Transfer event
              if (log.address.toLowerCase() === contractAddress.toLowerCase()) {
                const parsedLog = usdtContract.interface.parseLog(log);
                if (parsedLog && parsedLog.name === 'Transfer') {
                  const decimals = await usdtContract.decimals();
                  transferEvents.push({
                    from: parsedLog.args.from,
                    to: parsedLog.args.to,
                    value: parsedLog.args.value.toString(),
                    formattedValue: ethers.formatUnits(
                      parsedLog.args.value,
                      decimals,
                    ),
                    token: 'USDT',
                  });
                }
              }
            } catch (parseError) {
              // Skip logs that can't be parsed
            }
          }
        }

        return {
          ...basicTxInfo,
          type: 'USDT_TRANSFER',
          contractAddress,
          tokenTransfers: transferEvents,
          isTokenTransaction: true,
        };
      } else {
        // Regular ETH/BNB transaction
        return {
          ...basicTxInfo,
          value: ethers.formatEther(tx.value || 0),
          type: network === 'ETH' ? 'ETH_TRANSFER' : 'BNB_TRANSFER',
          isTokenTransaction: false,
        };
      }
    } catch (error) {
      throw new Error(`USDT transaction fetch failed: ${error.message}`);
    }
  }

  /**
   * Decode Account Abstraction (ERC-4337) transaction
   */
  async decodeAATransaction(
    txHash: string,
    network: 'ETH' | 'BSC' = 'ETH'
  ): Promise<AATransactionResult> {
    try {
      const provider = network === 'ETH' ? this.ethProvider : this.bscProvider;

      // 1. Get transaction first
      const tx = await provider.getTransaction(txHash);
      if (!tx) {
        throw new Error('Transaction not found');
      }

      // 2. Check if transaction is mined (has receipt) - retry mechanism
      let receipt = await provider.getTransactionReceipt(txHash);
      
      // If transaction is mined but receipt not found, retry once after short delay
      if (!receipt && tx.blockNumber) {
        console.log(`Receipt not found on first try, retrying for mined transaction...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        receipt = await provider.getTransactionReceipt(txHash);
      }
      
      if (!receipt) {
        // Transaction exists but receipt not found
        const status = tx.blockNumber ? 'Mined' : 'Pending';
        const blockInfo = tx.blockNumber || 'None';
        
        if (tx.blockNumber) {
          // Transaction is mined but receipt not found - possible network mismatch or provider issue
          throw new Error(`Transaction is mined but receipt not found. This might be a network mismatch. Hash: ${txHash}, Network: ${network}, Block: ${blockInfo}. Please verify the transaction is on the correct network.`);
        } else {
          // Transaction is still pending
          throw new Error(`Transaction found but still pending. Hash: ${txHash}, Status: ${status}, Block: ${blockInfo}`);
        }
      }

      // 3. Check transaction status
      if (receipt.status === 0) {
        throw new Error(`Transaction failed. Hash: ${txHash}, Block: ${receipt.blockNumber}`);
      }

      // 4. Decode Entry Point call
      const decodedInput = this.entryPointInterface.parseTransaction({
        data: tx.data,
        value: tx.value
      });

      if (!decodedInput || decodedInput.name !== 'handleOps') {
        throw new Error(`This is not a valid AA transaction. Entry point call not found. Transaction to: ${tx.to}, Data starts with: ${tx.data?.slice(0, 10)}`);
      }

      // 5. Extract UserOperations
      const userOps: any[] = decodedInput.args.ops;
      
      // 6. Decode event logs
      const userOpEvents = receipt.logs
        .filter(log => log.address.toLowerCase() === tx.to?.toLowerCase())
        .map(log => {
          try {
            const parsedLog = this.entryPointInterface.parseLog(log);
            // Convert BigInt values to strings for serialization
            return this.serializeBigIntValues(parsedLog);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      // 7. Extract transfers from logs  
      const transfers = await this.extractTransfers(receipt, network);

      const result = {
        transactionHash: txHash,
        entryPoint: tx.to || '',
        bundler: tx.from || '',
        userOperations: this.parseUserOperations(userOps),
        events: userOpEvents,
        transfers: transfers
      };

      // Serialize all BigInt values to strings
      return this.serializeBigIntValues(result);
    } catch (error) {
      throw new Error(`AA transaction decode failed: ${error.message}`);
    }
  }

  /**
   * Parse UserOperations array
   */
  private parseUserOperations(userOps: any[]): ParsedUserOperation[] {
    return userOps.map((op, index) => ({
      index,
      sender: op.sender,
      nonce: op.nonce.toString(),
      callData: op.callData,
      decodedCallData: this.decodeMulticall(op.callData),
      gasLimits: {
        callGasLimit: op.callGasLimit.toString(),
        verificationGasLimit: op.verificationGasLimit.toString(),
        preVerificationGas: op.preVerificationGas.toString()
      },
      fees: {
        maxFeePerGas: ethers.formatUnits(op.maxFeePerGas, 'gwei'),
        maxPriorityFeePerGas: ethers.formatUnits(op.maxPriorityFeePerGas, 'gwei')
      },
      paymaster: op.paymasterAndData !== '0x' ? op.paymasterAndData.slice(0, 42) : null
    }));
  }

  /**
   * Decode multicall or batch execution data
   */
  private decodeMulticall(callData: string): any {
    try {
      // Try to decode as wallet call
      const walletDecoded = this.walletInterface.parseTransaction({ data: callData });
      
      if (walletDecoded?.name === 'multicall') {
        return {
          type: 'multicall',
          calls: walletDecoded.args.data.map((data: string, index: number) => ({
            index,
            data,
            // Try to decode individual calls
            decoded: this.tryDecodeCall(data)
          }))
        };
      }

      if (walletDecoded?.name === 'execute') {
        return {
          type: 'execute',
          to: walletDecoded.args.to || walletDecoded.args.dest,
          value: ethers.formatEther(walletDecoded.args.value || 0),
          data: walletDecoded.args.data || walletDecoded.args.func,
          decoded: this.tryDecodeCall(walletDecoded.args.data || walletDecoded.args.func)
        };
      }

      if (walletDecoded?.name === 'executeBatch') {
        // Handle different executeBatch signatures
        const targets = walletDecoded.args.to || walletDecoded.args.dest;
        const values = walletDecoded.args.values || [];
        const datas = walletDecoded.args.data || walletDecoded.args.func;
        
        return {
          type: 'executeBatch',
          calls: targets.map((to: string, index: number) => ({
            to,
            value: values[index] ? ethers.formatEther(values[index]) : '0',
            data: datas[index],
            decoded: this.tryDecodeCall(datas[index])
          }))
        };
      }

      // If not multicall, return raw data
      return {
        type: 'unknown',
        data: callData
      };
    } catch {
      return {
        type: 'raw',
        data: callData
      };
    }
  }

  /**
   * Try to decode individual call data
   */
  private tryDecodeCall(data: string): any {
    if (!data || data === '0x' || data === '0x00') {
      return {
        type: 'NATIVE_TRANSFER',
        description: 'Native token transfer (ETH/BNB/MATIC etc.)'
      };
    }

    try {
      // Try ERC-20 functions
      try {
        const erc20Decoded = this.tokenInterfaces.erc20.parseTransaction({ data });
        if (erc20Decoded) {
          switch (erc20Decoded.name) {
            case 'transfer':
              return {
                type: 'ERC20_TRANSFER',
                function: 'transfer',
                to: erc20Decoded.args.to,
                amount: erc20Decoded.args.amount.toString(),
                formattedAmount: ethers.formatUnits(erc20Decoded.args.amount, 6) // Common for USDT/USDC
              };
            case 'transferFrom':
              return {
                type: 'ERC20_TRANSFER_FROM',
                function: 'transferFrom',
                from: erc20Decoded.args.from,
                to: erc20Decoded.args.to,
                amount: erc20Decoded.args.amount.toString(),
                formattedAmount: ethers.formatUnits(erc20Decoded.args.amount, 18)
              };
            case 'approve':
              return {
                type: 'ERC20_APPROVE',
                function: 'approve',
                spender: erc20Decoded.args.spender,
                amount: erc20Decoded.args.amount.toString(),
                formattedAmount: ethers.formatUnits(erc20Decoded.args.amount, 18)
              };
            case 'mint':
              return {
                type: 'ERC20_MINT',
                function: 'mint',
                to: erc20Decoded.args.to,
                amount: erc20Decoded.args.amount.toString(),
                formattedAmount: ethers.formatUnits(erc20Decoded.args.amount, 18)
              };
            case 'burn':
              return {
                type: 'ERC20_BURN',
                function: 'burn',
                amount: erc20Decoded.args.amount.toString(),
                formattedAmount: ethers.formatUnits(erc20Decoded.args.amount, 18)
              };
          }
        }
      } catch { /* Continue to next decoder */ }

      // Try ERC-721 functions
      try {
        const erc721Decoded = this.tokenInterfaces.erc721.parseTransaction({ data });
        if (erc721Decoded) {
          switch (erc721Decoded.name) {
            case 'transferFrom':
            case 'safeTransferFrom':
              return {
                type: 'ERC721_TRANSFER',
                function: erc721Decoded.name,
                from: erc721Decoded.args.from,
                to: erc721Decoded.args.to,
                tokenId: erc721Decoded.args.tokenId.toString()
              };
            case 'approve':
              return {
                type: 'ERC721_APPROVE',
                function: 'approve',
                to: erc721Decoded.args.to,
                tokenId: erc721Decoded.args.tokenId.toString()
              };
            case 'setApprovalForAll':
              return {
                type: 'ERC721_APPROVAL_FOR_ALL',
                function: 'setApprovalForAll',
                operator: erc721Decoded.args.operator,
                approved: erc721Decoded.args.approved
              };
          }
        }
      } catch { /* Continue to next decoder */ }

      // Try ERC-1155 functions
      try {
        const erc1155Decoded = this.tokenInterfaces.erc1155.parseTransaction({ data });
        if (erc1155Decoded) {
          switch (erc1155Decoded.name) {
            case 'safeTransferFrom':
              return {
                type: 'ERC1155_TRANSFER',
                function: 'safeTransferFrom',
                from: erc1155Decoded.args.from,
                to: erc1155Decoded.args.to,
                id: erc1155Decoded.args.id.toString(),
                amount: erc1155Decoded.args.amount.toString()
              };
            case 'safeBatchTransferFrom':
              return {
                type: 'ERC1155_BATCH_TRANSFER',
                function: 'safeBatchTransferFrom',
                from: erc1155Decoded.args.from,
                to: erc1155Decoded.args.to,
                ids: erc1155Decoded.args.ids.map((id: any) => id.toString()),
                amounts: erc1155Decoded.args.amounts.map((amount: any) => amount.toString())
              };
          }
        }
      } catch { /* Continue to next decoder */ }

      // If no specific decoder worked, return function signature info
      const functionSelector = data.slice(0, 10);
      return {
        type: 'UNKNOWN_FUNCTION',
        functionSelector,
        data,
        description: `Unknown function with selector ${functionSelector}`
      };

    } catch {
      return {
        type: 'RAW_DATA',
        data,
        description: 'Raw data that could not be decoded'
      };
    }
  }

  /**
   * Convert BigInt values to strings for JSON serialization
   */
  private serializeBigIntValues(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj === 'bigint') {
      return obj.toString();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.serializeBigIntValues(item));
    }
    
    if (typeof obj === 'object') {
      const serialized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          serialized[key] = this.serializeBigIntValues(obj[key]);
        }
      }
      return serialized;
    }
    
    return obj;
  }

  /**
   * Extract token transfers from transaction logs
   */
  private async extractTransfers(receipt: ethers.TransactionReceipt, network: 'ETH' | 'BSC'): Promise<any[]> {
    const transfers: any[] = [];
    
    // ERC-20 Transfer event signature
    const transferEventSignature = ethers.id('Transfer(address,address,uint256)');
    
    for (const log of receipt.logs) {
      if (log.topics[0] === transferEventSignature) {
        try {
          const erc20Interface = new ethers.Interface(this.erc20Abi);
          const parsedLog = erc20Interface.parseLog(log);
          
          if (parsedLog?.name === 'Transfer') {
            // Try to get token info
            let tokenInfo = { symbol: 'UNKNOWN', decimals: 18 };
            
            try {
              const provider = network === 'ETH' ? this.ethProvider : this.bscProvider;
              const tokenContract = new ethers.Contract(log.address, [
                'function symbol() view returns (string)',
                'function decimals() view returns (uint8)'
              ], provider);
              
              const [symbol, decimals] = await Promise.all([
                tokenContract.symbol().catch(() => 'UNKNOWN'),
                tokenContract.decimals().catch(() => 18)
              ]);
              
              tokenInfo = { symbol, decimals };
            } catch {
              // Use defaults if token info fetch fails
            }
            
            transfers.push({
              type: 'ERC20_TRANSFER',
              token: {
                address: log.address,
                symbol: tokenInfo.symbol,
                decimals: tokenInfo.decimals
              },
              from: parsedLog.args.from,
              to: parsedLog.args.to,
              value: parsedLog.args.value.toString(),
              formattedValue: ethers.formatUnits(parsedLog.args.value, tokenInfo.decimals)
            });
          }
        } catch {
          // Skip logs that can't be parsed
        }
      }
    }
    
    return transfers;
  }
}
