export class TransactionDto {
  id!: string;
  type!: string;
  amount!: number;
  reason!: string | null;
  createdAt!: Date;
}

export class BalanceResponseDto {
  userId!: string;
  balance!: number;
  transactions!: TransactionDto[];
}
