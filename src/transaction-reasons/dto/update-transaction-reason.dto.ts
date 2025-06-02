import { PartialType } from '@nestjs/swagger';
import { CreateTransactionReasonDto } from './create-transaction-reason.dto';

export class UpdateTransactionReasonDto extends PartialType(
  CreateTransactionReasonDto,
) {}
