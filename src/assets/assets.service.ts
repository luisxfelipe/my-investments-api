import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { Asset } from './entities/asset.entity';
import { CategoriesService } from 'src/categories/categories.service';
import { AssetTypesService } from 'src/asset-types/asset-types.service';
import { PlatformsService } from 'src/platforms/platforms.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly repository: Repository<Asset>,
    private readonly categoriesService: CategoriesService,
    private readonly assetTypesService: AssetTypesService,
    private readonly platformsService: PlatformsService,
  ) { }

  async create(createAssetDto: CreateAssetDto): Promise<Asset> {
    // Verifica se a categoria existe
    await this.categoriesService.findOne(createAssetDto.categoryId);

    // Verifica se o tipo de ativo existe
    await this.assetTypesService.findOne(createAssetDto.assetTypeId);

    // Verifica se a plataforma existe
    await this.platformsService.findOne(createAssetDto.platformId);

    const asset = this.repository.create(createAssetDto);
    return this.repository.save(asset);
  }

  async findAll(): Promise<Asset[]> {
    return this.repository.find({
      relations: ['category', 'assetType', 'platform'],
    });
  }

  async findOne(id: number): Promise<Asset> {
    const asset = await this.repository.findOne({
      where: { id },
      relations: ['category', 'assetType', 'platform'],
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }

    return asset;
  }

  async update(id: number, updateAssetDto: UpdateAssetDto): Promise<Asset> {
    if (!updateAssetDto || Object.keys(updateAssetDto).length === 0) {
      throw new BadRequestException(`No properties provided for update`);
    }

    // Verifica se o ativo existe
    const asset = await this.findOne(id);

    // Verifica se a categoria existe, se foi fornecida
    if (updateAssetDto.categoryId) {
      await this.categoriesService.findOne(updateAssetDto.categoryId);
    }

    // Verifica se o tipo de ativo existe, se foi fornecido
    if (updateAssetDto.assetTypeId) {
      await this.assetTypesService.findOne(updateAssetDto.assetTypeId);
    }

    // Verifica se a plataforma existe, se foi fornecida
    if (updateAssetDto.platformId) {
      await this.platformsService.findOne(updateAssetDto.platformId);
    }

    this.repository.merge(asset, updateAssetDto);
    return this.repository.save(asset);
  }

  async remove(id: number): Promise<void> {
    // Verifica se o ativo existe
    await this.findOne(id);

    // Usa softDelete em vez de remove para fazer soft delete
    await this.repository.softDelete(id);
  }
}
