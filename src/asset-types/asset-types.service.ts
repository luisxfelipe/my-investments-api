import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CreateAssetTypeDto } from './dto/create-asset-type.dto';
import { UpdateAssetTypeDto } from './dto/update-asset-type.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AssetType } from './entities/asset-type.entity';
import { Repository } from 'typeorm';
import { AssetsService } from '../assets/assets.service';

@Injectable()
export class AssetTypesService {
  constructor(
    @InjectRepository(AssetType)
    private readonly repository: Repository<AssetType>,
    @Inject(forwardRef(() => AssetsService))
    private readonly assetsService: AssetsService,
  ) {}

  async create(
    createAssetTypeDto: CreateAssetTypeDto,
    userId: number,
  ): Promise<AssetType> {
    // Verifica se já existe um tipo de ativo com o mesmo nome para este usuário
    const existingAssetType = await this.findOneByName(
      createAssetTypeDto.name,
      userId,
    );

    if (existingAssetType) {
      throw new BadRequestException(
        `There is already an asset type with the name '${createAssetTypeDto.name}' for this user`,
      );
    }

    const assetType = this.repository.create({
      ...createAssetTypeDto,
      userId,
    });
    return this.repository.save(assetType);
  }

  async findAll(userId: number): Promise<AssetType[]> {
    return this.repository.find({
      where: { userId },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number, userId: number): Promise<AssetType> {
    const assetType = await this.repository.findOne({
      where: { id, userId },
    });

    if (!assetType) {
      throw new NotFoundException(
        `Asset Type with ID ${id} not found for this user`,
      );
    }

    return assetType;
  }

  async findOneByName(name: string, userId: number): Promise<AssetType | null> {
    return this.repository.findOne({
      where: { name, userId },
    });
  }

  async update(
    id: number,
    updateAssetTypeDto: UpdateAssetTypeDto,
    userId: number,
  ): Promise<AssetType> {
    if (!updateAssetTypeDto || Object.keys(updateAssetTypeDto).length === 0) {
      throw new BadRequestException(`No properties provided for update`);
    }

    const assetType = await this.findOne(id, userId);

    // Se estiver atualizando o nome, verifica se já existe outro tipo de ativo com esse nome para este usuário
    if (updateAssetTypeDto.name && updateAssetTypeDto.name !== assetType.name) {
      const existingAssetType = await this.findOneByName(
        updateAssetTypeDto.name,
        userId,
      );

      if (existingAssetType && existingAssetType.id !== id) {
        throw new BadRequestException(
          `There is already an asset type with the name '${updateAssetTypeDto.name}' for this user`,
        );
      }
    }

    this.repository.merge(assetType, updateAssetTypeDto);
    return this.repository.save(assetType);
  }

  async remove(id: number, userId: number): Promise<void> {
    // Verifica se o tipo de ativo existe e pertence ao usuário
    await this.findOne(id, userId);

    // Verifica se existem ativos usando este tipo de ativo
    const assetsUsingAssetType =
      await this.assetsService.countByAssetTypeId(id);

    if (assetsUsingAssetType > 0) {
      throw new BadRequestException(
        `Cannot delete asset type. It is being used by ${assetsUsingAssetType} asset(s). Please update or remove those assets first.`,
      );
    }

    // Usa softDelete em vez de remove para fazer soft delete
    await this.repository.softDelete(id);
  }

  // Método para compatibilidade com outros serviços que só precisam verificar se o tipo de ativo existe
  async findOneById(id: number): Promise<AssetType> {
    const assetType = await this.repository.findOne({
      where: { id },
    });

    if (!assetType) {
      throw new NotFoundException(`Asset Type with ID ${id} not found`);
    }

    return assetType;
  }
}
