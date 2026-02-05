import { Controller, Post } from '@nestjs/common';
import { WalletService } from '../wallet/wallet.service.js';

@Controller('admin/db')
export class AdminController {
  constructor(private readonly walletService: WalletService) {}

  @Post('reset')
  async resetDb() {
    return this.walletService.resetDb();
  }
}
