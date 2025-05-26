import { PartialType } from '@nestjs/swagger';
import { CreateAssetQuoteDto } from './create-asset-quote.dto';

export class UpdateAssetQuoteDto extends PartialType(CreateAssetQuoteDto) { }