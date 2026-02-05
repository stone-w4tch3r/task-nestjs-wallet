import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { AdminModule as AdminJsNestModule } from '@adminjs/nestjs';
import { WalletModule } from '../wallet/wallet.module.js';
import { createAdminJS } from './adminjs.config.js';

@Module({
  imports: [
    WalletModule,
    AdminJsNestModule.createAdminAsync({
      imports: [WalletModule],
      useFactory: () => {
        return {
          adminJsOptions: createAdminJS(),
          sessionOptions: {
            resave: false,
            saveUninitialized: true,
            secret:
              process.env.ADMIN_COOKIE_SECRET ||
              'admin-secret-key-change-in-production',
          },
        };
      },
      inject: [],
    }),
  ],
  controllers: [AdminController],
})
export class AdminModule {}
