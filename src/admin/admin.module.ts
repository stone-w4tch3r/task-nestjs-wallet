import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { WalletModule } from '../wallet/wallet.module.js';

@Module({
  imports: [WalletModule],
  controllers: [AdminController],
})
export class AdminModule {}
