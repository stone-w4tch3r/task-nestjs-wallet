import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { WalletModule } from './wallet/wallet.module.js';
import { AdminController } from './admin/admin.controller.js';
import { AdminModule as AdminJsNestModule } from '@adminjs/nestjs';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { Wallet } from './entities/wallet.entity.js';
import { Transaction } from './entities/transaction.entity.js';
import { DailyLimit } from './entities/daily-limit.entity.js';
import { IdempotencyLog } from './entities/idempotency-log.entity.js';
import { DataSource } from 'typeorm';
import { Resource } from '@adminjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'wallet',
      password: process.env.DB_PASSWORD || 'wallet123',
      database: process.env.DB_DATABASE || 'wallet',
      entities: [__dirname + '/**/*.entity{.ts,.mjs}'],
      synchronize: true,
      logging: false,
    }),
    WalletModule,
    AdminJsNestModule.createAdminAsync({
      imports: [TypeOrmModule],
      inject: [DataSource],
      useFactory: (dataSource: DataSource) => {
        Wallet.useDataSource(dataSource);
        Transaction.useDataSource(dataSource);
        DailyLimit.useDataSource(dataSource);
        IdempotencyLog.useDataSource(dataSource);
        return {
          adminJsOptions: {
            rootPath: '/db-admin',
            resources: [
              new Resource(Wallet),
              new Resource(Transaction),
              new Resource(DailyLimit),
              new Resource(IdempotencyLog),
            ],
            branding: {
              companyName: 'Wallet Admin',
              logo: '',
              favicon: '',
              softwareBrothers: false,
              madeWithLove: false,
            },
          },
          sessionOptions: {
            resave: false,
            saveUninitialized: true,
            secret:
              process.env.ADMIN_COOKIE_SECRET ||
              'admin-secret-key-change-in-production',
          },
        };
      },
    }),
  ],
  controllers: [AppController, AdminController],
  providers: [AppService],
})
export class AppModule {}
