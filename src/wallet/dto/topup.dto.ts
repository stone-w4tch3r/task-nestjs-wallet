import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class TopupDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;
}
