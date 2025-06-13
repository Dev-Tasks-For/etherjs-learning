import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [],
  controllers: [AppController, WalletController],
  providers: [AppService, WalletService],
})
export class AppModule {}
