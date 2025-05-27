import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetQuote } from './entities/asset-quote.entity';
import { CreateAssetQuoteDto } from './dto/create-asset-quote.dto';
import { UpdateAssetQuoteDto } from './dto/update-asset-quote.dto';
import { PaginatedResponseDto } from 'src/dtos/paginated-response.dto';

@Injectable()
export class AssetQuotesService {
  constructor(
    @InjectRepository(AssetQuote)
    private readonly repository: Repository<AssetQuote>,
  ) {}

  async create(createAssetQuoteDto: CreateAssetQuoteDto): Promise<AssetQuote> {
    // Cria uma nova cotação
    const assetQuote = this.repository.create({
      ...createAssetQuoteDto,
      timestamp: createAssetQuoteDto.timestamp || new Date(),
    });
    return this.repository.save(assetQuote);
  }

  async findOne(id: number): Promise<AssetQuote> {
    const quote = await this.repository.findOne({
      where: { id },
      relations: ['asset'],
    });
    if (!quote) {
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }
    return quote;
  }

  async findLatestByAssetId(assetId: number): Promise<AssetQuote> {
    const quote = await this.repository.findOne({
      where: { assetId },
      order: { timestamp: 'DESC' },
      relations: ['asset'],
    });
    if (!quote) {
      throw new NotFoundException('Quote not found for the asset provided.');
    }
    return quote;
  }

  /**
   * Retorna a cotação mais recente de cada ativo.
   * Útil para exibir o valor atual de todos os ativos em uma única consulta.
   */
  async findLatestForAllAssets(): Promise<AssetQuote[]> {
    // Consulta usando subquery para pegar a última cotação (maior timestamp) de cada assetId
    const subQuery = this.repository
      .createQueryBuilder('sub')
      .select('MAX(sub.timestamp)', 'maxTimestamp')
      .addSelect('sub.assetId', 'assetId')
      .groupBy('sub.assetId');

    // Junta com a tabela principal para pegar os registros completos
    const latestQuotes = await this.repository
      .createQueryBuilder('quote')
      .innerJoin(
        '(' + subQuery.getQuery() + ')',
        'sq',
        'quote.assetId = sq.assetId AND quote.timestamp = sq.maxTimestamp',
      )
      .getMany();

    return latestQuotes;
  }

  /**
   * Retorna a cotação mais recente de cada ativo, de forma paginada.
   * Útil para exibir o valor atual de todos os ativos em uma única consulta paginada.
   */
  async findLatestForAllAssetsWithPagination(
    take = 10,
    page = 1,
  ): Promise<PaginatedResponseDto<AssetQuote>> {
    const skip = (page - 1) * take;
    // Subquery para pegar a última cotação (maior timestamp) de cada assetId
    const subQuery = this.repository
      .createQueryBuilder('sub')
      .select('MAX(sub.timestamp)', 'maxTimestamp')
      .addSelect('sub.assetId', 'assetId')
      .groupBy('sub.assetId');

    // Consulta principal com paginação
    const [quotes, total] = await this.repository
      .createQueryBuilder('quote')
      .innerJoin(
        '(' + subQuery.getQuery() + ')',
        'sq',
        'quote.assetId = sq.assetId AND quote.timestamp = sq.maxTimestamp',
      )
      .orderBy('quote.assetId', 'ASC')
      .take(take)
      .skip(skip)
      .getManyAndCount();

    return new PaginatedResponseDto(quotes, total, take, page);
  }

  async findAllByAssetId(assetId: number): Promise<AssetQuote[]> {
    return this.repository.find({
      where: { assetId },
      order: { timestamp: 'DESC' },
      relations: ['asset'],
    });
  }

  async findLatestForAssetIds(assetIds: number[]): Promise<AssetQuote[]> {
    if (!assetIds || assetIds.length === 0) {
      return [];
    }
    // Subquery para pegar a última cotação (maior timestamp) de cada assetId informado
    const subQuery = this.repository
      .createQueryBuilder('sub')
      .select('MAX(sub.timestamp)', 'maxTimestamp')
      .addSelect('sub.assetId', 'assetId')
      .where('sub.assetId IN (:...assetIds)', { assetIds })
      .groupBy('sub.assetId');

    // Junta com a tabela principal para pegar os registros completos
    const latestQuotes = await this.repository
      .createQueryBuilder('quote')
      .innerJoin(
        '(' + subQuery.getQuery() + ')',
        'sq',
        'quote.assetId = sq.assetId AND quote.timestamp = sq.maxTimestamp',
      )
      .setParameters(subQuery.getParameters())
      .getMany();

    return latestQuotes;
  }

  async update(
    id: number,
    updateData: UpdateAssetQuoteDto,
  ): Promise<AssetQuote> {
    if (!updateData || Object.keys(updateData).length === 0) {
      throw new BadRequestException('No properties provided for update');
    }
    // Verifica se a cotação existe
    const quote = await this.findOne(id);
    Object.assign(quote, updateData);
    return this.repository.save(quote);
  }

  async delete(id: number): Promise<void> {
    // Verifica se a cotação existe
    await this.findOne(id);
    // Usa softDelete em vez de delete para fazer soft delete
    await this.repository.softDelete(id);
  }

  /**
   * Conta quantas cotações existem para um ativo específico
   */
  async countByAssetId(assetId: number): Promise<number> {
    return this.repository.count({
      where: { assetId },
    });
  }
}
