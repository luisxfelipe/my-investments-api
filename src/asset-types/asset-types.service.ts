import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAssetTypeDto } from './dto/create-asset-type.dto';
import { UpdateAssetTypeDto } from './dto/update-asset-type.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AssetType } from './entities/asset-type.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AssetTypesService {
  constructor(
    @InjectRepository(AssetType)
    private readonly repository: Repository<AssetType>,
  ) { }

  async create(createAssetTypeDto: CreateAssetTypeDto): Promise<AssetType> {
    // Verifica se já existe um tipo de ativo com o mesmo nome
    const existingAssetType = await this.findOneByName(createAssetTypeDto.name);

    if (existingAssetType) {
      throw new BadRequestException(`There is already an asset type with the name '${createAssetTypeDto.name}'`);
    }

    const assetType = this.repository.create(createAssetTypeDto);
    return this.repository.save(assetType);
  }

  async findAll(): Promise<AssetType[]> {
    return this.repository.find();
  }

  async findOne(id: number): Promise<AssetType> {
    const assetType = await this.repository.findOne({ where: { id } });

    if (!assetType) {
      throw new NotFoundException(`Asset Type with ID ${id} not found`);
    }

    return assetType;
  }

  async findOneByName(name: string): Promise<AssetType | null> {
    return this.repository.findOne({ where: { name } });
  }

  async update(id: number, updateAssetTypeDto: UpdateAssetTypeDto): Promise<AssetType> {
    if (!updateAssetTypeDto || Object.keys(updateAssetTypeDto).length === 0) {
      throw new BadRequestException(`No properties provided for update`);
    }

    const assetType = await this.findOne(id);

    // Se estiver atualizando o nome, verifica se já existe outro tipo de ativo com esse nome
    if (updateAssetTypeDto.name && updateAssetTypeDto.name !== assetType.name) {
      const existingAssetType = await this.findOneByName(updateAssetTypeDto.name);

      if (existingAssetType && existingAssetType.id !== id) {
        throw new BadRequestException(`There is already an asset type with the name '${updateAssetTypeDto.name}'`);
      }
    }

    this.repository.merge(assetType, updateAssetTypeDto);
    return this.repository.save(assetType);
  }

  async remove(id: number): Promise<void> {
    // Verifica se o tipo de ativo existe
    await this.findOne(id);

    // Usa softDelete em vez de remove para fazer soft delete
    await this.repository.softDelete(id);
  }
}
