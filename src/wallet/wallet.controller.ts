import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { WalletService } from './wallet.service.js';
import { TopupDto } from './dto/topup.dto.js';
import { ChargeDto } from './dto/charge.dto.js';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('topup')
  async topup(@Body(new ValidationPipe({ transform: true })) dto: TopupDto) {
    return this.walletService.topup(dto);
  }

  @Post('charge')
  async charge(@Body(new ValidationPipe({ transform: true })) dto: ChargeDto) {
    return this.walletService.charge(dto);
  }

  @Get('balance')
  async getBalance(@Query('userId') userId: string) {
    return this.walletService.getBalance(userId);
  }
}
