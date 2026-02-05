import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { WalletModule } from './wallet/wallet.module.js';
import { AdminController } from './admin/admin.controller.js';
import { AdminModule as AdminJsNestModule } from '@adminjs/nestjs';
import { createAdminJS } from './admin/adminjs.config.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, 'frontend'),
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
  controllers: [AppController, AdminController],
  providers: [AppService],
})
export class AppModule {}
