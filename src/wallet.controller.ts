import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  // 1. Native ETH Balance
  @Get('eth-balance')
  async getEthBalance(@Query('address') address: string) {
    if (!address) {
      throw new BadRequestException('Wallet address is required');
    }

    try {
      const balance = await this.walletService.getEthBalance(address);
      return {
        success: true,
        address,
        balance,
        token: 'ETH',
        network: 'Ethereum',
        message: 'ETH balance queried successfully'
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // 2. Native BNB Balance
  @Get('bnb-balance')
  async getBnbBalance(@Query('address') address: string) {
    if (!address) {
      throw new BadRequestException('Wallet address is required');
    }

    try {
      const balance = await this.walletService.getBnbBalance(address);
      return {
        success: true,
        address,
        balance,
        token: 'BNB',
        network: 'BSC',
        message: 'BNB balance queried successfully'
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // 3. USDT Balance (Unified - Both ETH and BSC)
  @Get('usdt-balance')
  async getUsdtBalance(
    @Query('address') address: string,
    @Query('network') network: string
  ) {
    if (!address) {
      throw new BadRequestException('Wallet address required');
    }

    if (!network || !['ETH', 'BSC'].includes(network.toUpperCase())) {
      throw new BadRequestException('Network must be ETH or BSC');
    }

    try {
      const networkUpper = network.toUpperCase() as 'ETH' | 'BSC';
      const balance = await this.walletService.getTokenBalance(address, networkUpper);
      
      return {
        success: true,
        address,
        balance,
        token: 'USDT',
        network: networkUpper === 'ETH' ? 'Ethereum' : 'BSC',
        message: `${networkUpper === 'ETH' ? 'Ethereum' : 'BSC'} USDT balance queried successfully`
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // 4. Transaction Details
  @Get('transaction')
  async getTransactionDetails(
    @Query('hash') hash: string,
    @Query('network') network: string
  ) {
    if (!hash) {
      throw new BadRequestException('Transaction hash required');
    }

    if (!network || !['ETH', 'BSC'].includes(network.toUpperCase())) {
      throw new BadRequestException('Network must be ETH or BSC');
    }

    try {
      const transaction = await this.walletService.getTransactionDetails(
        hash,
        network.toUpperCase() as 'ETH' | 'BSC'
      );
      
      return {
        success: true,
        transaction,
        message: 'Transaction details fetched successfully'
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // 5. USDT Transaction Details
  @Get('usdt-transaction')
  async getUsdtTransactionDetails(
    @Query('hash') hash: string,
    @Query('network') network: string
  ) {
    if (!hash) {
      throw new BadRequestException('Transaction hash is required');
    }

    if (!network || !['ETH', 'BSC'].includes(network.toUpperCase())) {
      throw new BadRequestException('Network must be ETH or BSC');
    }

    try {
      const transaction = await this.walletService.getUsdtTransactionDetails(
        hash,
        network.toUpperCase() as 'ETH' | 'BSC'
      );
      
      return {
        success: true,
        transaction,
        message: 'USDT transaction details fetched successfully'
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // 6. AA Transaction Decoder
  @Get('aa-transaction')
  async decodeAATransaction(
    @Query('hash') hash: string,
    @Query('network') network: string = 'ETH'
  ) {
    if (!hash) {
      throw new BadRequestException('Transaction hash is required');
    }

    if (!['ETH', 'BSC'].includes(network.toUpperCase())) {
      throw new BadRequestException('Network must be ETH or BSC');
    }

    try {
      const aaTransaction = await this.walletService.decodeAATransaction(
        hash,
        network.toUpperCase() as 'ETH' | 'BSC'
      );
      
      return {
        success: true,
        aaTransaction,
        message: 'Account Abstraction transaction decoded successfully'
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}  