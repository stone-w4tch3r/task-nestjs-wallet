import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service.js';
import type { Response } from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  getHello(): string {
    return this.appService.getHello();
  }

  @Get()
  getFrontend(@Res() res: Response): void {
    const indexPath = join(__dirname, 'frontend', 'index.html');
    const html = readFileSync(indexPath, 'utf-8');
    res.type('text/html').send(html);
  }
}
