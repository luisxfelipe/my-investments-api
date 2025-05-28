import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { Asset } from './entities/asset.entity';
import { CategoriesService } from 'src/categories/categories.service';
import { AssetTypesService } from 'src/asset-types/asset-types.service';
import { PortfoliosService } from 'src/portfolios/portfolios.service';
import { AssetQuotesService } from 'src/asset-quotes/asset-quotes.service';
import { Repository, Not } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { In } from 'typeorm';
import { PaginatedResponseDto } from 'src/dtos/paginated-response.dto';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly repository: Repository<Asset>,
    private readonly categoriesService: CategoriesService,
    @Inject(forwardRef(() => AssetTypesService))
    private readonly assetTypesService: AssetTypesService,
    @Inject(forwardRef(() => PortfoliosService))
    private readonly portfoliosService: PortfoliosService,
    @Inject(forwardRef(() => AssetQuotesService))
    private readonly assetQuotesService: AssetQuotesService,
  ) {}

  async create(userId: number, createAssetDto: CreateAssetDto): Promise<Asset> {
    // Verifica se a categoria existe
    await this.categoriesService.findOneById(createAssetDto.categoryId);

    // Verifica se o tipo de ativo existe e pertence ao usuário
    await this.assetTypesService.findOne(createAssetDto.assetTypeId, userId);

    // Verifica se já existe um ativo com o mesmo nome para este usuário
    if (createAssetDto.name) {
      const existingByName = await this.repository.findOne({
        where: { userId, name: createAssetDto.name },
      });
      if (existingByName) {
        throw new BadRequestException(
          `Asset with name '${createAssetDto.name}' already exists for this user`,
        );
      }
    }

    // Verifica se já existe um ativo com o mesmo código para este usuário
    if (createAssetDto.code) {
      const existingByCode = await this.repository.findOne({
        where: { userId, code: createAssetDto.code },
      });
      if (existingByCode) {
        throw new BadRequestException(
          `Asset with code '${createAssetDto.code}' already exists for this user`,
        );
      }
    }

    const asset = this.repository.create({
      ...createAssetDto,
      userId,
    });
    return this.repository.save(asset);
  }

  async findAll(userId: number): Promise<Asset[]> {
    return this.repository.find({
      where: { userId },
      relations: ['category', 'assetType'],
    });
  }

  async findAllWithPagination(
    take = 10,
    page = 1,
    userId: number,
  ): Promise<PaginatedResponseDto<Asset>> {
    const skip = (page - 1) * take;

    const [assets, total] = await this.repository.findAndCount({
      where: { userId },
      take,
      skip,
      relations: ['category', 'assetType'],
      order: { name: 'ASC' },
    });

    return new PaginatedResponseDto(assets, total, take, page);
  }

  async findOne(id: number, userId: number): Promise<Asset> {
    const asset = await this.repository.findOne({
      where: { id, userId },
      relations: ['category', 'assetType'],
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }

    return asset;
  }

  async findByIds(ids: number[], userId: number): Promise<Asset[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    return this.repository.find({
      where: { id: In(ids), userId },
      relations: ['category', 'assetType'],
    });
  }

  async update(
    id: number,
    userId: number,
    updateAssetDto: UpdateAssetDto,
  ): Promise<Asset> {
    if (!updateAssetDto || Object.keys(updateAssetDto).length === 0) {
      throw new BadRequestException(`No properties provided for update`);
    }

    // Verifica se o ativo existe e pertence ao usuário
    const asset = await this.findOne(id, userId);

    // Verifica duplicação de nome
    if (updateAssetDto.name && updateAssetDto.name !== asset.name) {
      const existingByName = await this.repository.findOne({
        where: { userId, name: updateAssetDto.name, id: Not(id) },
      });
      if (existingByName) {
        throw new BadRequestException(
          `Asset with name '${updateAssetDto.name}' already exists for this user`,
        );
      }
    }

    // Verifica duplicação de código
    if (updateAssetDto.code && updateAssetDto.code !== asset.code) {
      const existingByCode = await this.repository.findOne({
        where: { userId, code: updateAssetDto.code, id: Not(id) },
      });
      if (existingByCode) {
        throw new BadRequestException(
          `Asset with code '${updateAssetDto.code}' already exists for this user`,
        );
      }
    }

    this.repository.merge(asset, updateAssetDto);
    return this.repository.save(asset);
  }

  async remove(id: number, userId: number): Promise<void> {
    // Verifica se o ativo existe e pertence ao usuário
    await this.findOne(id, userId);

    // Verifica se o ativo está sendo usado em portfolios
    const portfoliosUsingAsset = await this.portfoliosService.countByAssetId(
      id,
      userId,
    );

    if (portfoliosUsingAsset > 0) {
      throw new BadRequestException(
        `Cannot delete asset. It is being used in ${portfoliosUsingAsset} portfolio(s). Please remove the asset from all portfolios first.`,
      );
    }

    // Verifica se o ativo possui cotações
    const quotesCount = await this.assetQuotesService.countByAssetId(id);

    if (quotesCount > 0) {
      throw new BadRequestException(
        `Cannot delete asset. It has ${quotesCount} price quote(s). Please remove all quotes first.`,
      );
    }

    // Usa softDelete em vez de remove para fazer soft delete
    await this.repository.softDelete(id);
  }

  /**
   * Conta quantos ativos estão usando um tipo de ativo específico
   * Nota: Não filtramos por usuário aqui, pois um tipo de ativo só pode ser usado por seu próprio dono
   */
  async countByAssetTypeId(assetTypeId: number): Promise<number> {
    return this.repository.count({
      where: { assetTypeId },
    });
  }
}
