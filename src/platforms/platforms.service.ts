import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { UpdatePlatformDto } from './dto/update-platform.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Platform } from './entities/platform.entity';
import { Repository } from 'typeorm';
import { PaginatedResponseDto } from 'src/dtos/paginated-response.dto';

@Injectable()
export class PlatformsService {
  constructor(
    @InjectRepository(Platform)
    private readonly repository: Repository<Platform>,
  ) { }

  async create(createPlatformDto: CreatePlatformDto): Promise<Platform> {
    // Verifica se já existe uma plataforma com o mesmo nome
    const existingPlatform = await this.findOneByName(createPlatformDto.name);

    if (existingPlatform) {
      throw new BadRequestException(`There is already a platform with the name '${createPlatformDto.name}'`);
    }

    const platform = this.repository.create(createPlatformDto);
    return this.repository.save(platform);
  }

  async findAll(): Promise<Platform[]> {
    return this.repository.find();
  }

  async findAllWithPagination(
    take = 10,
    page = 1,
  ): Promise<PaginatedResponseDto<Platform>> {
    const skip = (page - 1) * take;

    const [platforms, total] = await this.repository.findAndCount({
      take,
      skip,
    });

    return new PaginatedResponseDto(platforms, total, take, page);
  }

  async findOne(id: number): Promise<Platform> {
    const platform = await this.repository.findOne({ where: { id } });

    if (!platform) {
      throw new NotFoundException(`Platform with ID ${id} not found`);
    }

    return platform;
  }

  async findOneByName(name: string): Promise<Platform | null> {
    return this.repository.findOne({ where: { name } });
  }

  async update(id: number, updatePlatformDto: UpdatePlatformDto): Promise<Platform> {
    if (!updatePlatformDto || Object.keys(updatePlatformDto).length === 0) {
      throw new BadRequestException(`No properties provided for update`);
    }

    const platform = await this.findOne(id);

    // Se estiver atualizando o nome, verifica se já existe outra plataforma com esse nome
    if (updatePlatformDto.name && updatePlatformDto.name !== platform.name) {
      const existingPlatform = await this.findOneByName(updatePlatformDto.name);

      if (existingPlatform && existingPlatform.id !== id) {
        throw new BadRequestException(`There is already a platform with the name '${updatePlatformDto.name}'`);
      }
    }

    this.repository.merge(platform, updatePlatformDto);
    return this.repository.save(platform);
  }

  async remove(id: number): Promise<void> {
    // Verifica se a plataforma existe
    await this.findOne(id);

    // Usa softRemove em vez de remove para fazer soft delete
    await this.repository.softDelete(id);
  }
}
