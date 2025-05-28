import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';
import { PaginatedResponseDto } from 'src/dtos/paginated-response.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly repository: Repository<Category>,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    userId: number,
  ): Promise<Category> {
    // Verifica se já existe uma categoria com o mesmo nome para este usuário
    const existingCategory = await this.findOneByName(
      createCategoryDto.name,
      userId,
    );

    if (existingCategory) {
      throw new BadRequestException(
        `There is already a category with the name '${createCategoryDto.name}' for this user`,
      );
    }

    const category = this.repository.create({
      ...createCategoryDto,
      userId,
    });
    return this.repository.save(category);
  }

  async findAll(userId: number): Promise<Category[]> {
    return this.repository.find({
      where: { userId },
      order: { name: 'ASC' },
    });
  }

  async findAllWithPagination(
    take = 10,
    page = 1,
    userId: number,
  ): Promise<PaginatedResponseDto<Category>> {
    const skip = (page - 1) * take;

    const [categories, total] = await this.repository.findAndCount({
      where: { userId },
      take,
      skip,
      order: { name: 'ASC' },
    });

    return new PaginatedResponseDto(categories, total, take, page);
  }

  async findOne(id: number, userId: number): Promise<Category> {
    const category = await this.repository.findOne({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException(
        `Category with ID ${id} not found for this user`,
      );
    }

    return category;
  }

  async findOneByName(name: string, userId: number): Promise<Category | null> {
    return this.repository.findOne({
      where: { name, userId },
    });
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
    userId: number,
  ): Promise<Category> {
    if (!updateCategoryDto || Object.keys(updateCategoryDto).length === 0) {
      throw new BadRequestException(`No properties provided for update`);
    }

    const category = await this.findOne(id, userId);

    // Se estiver atualizando o nome, verifica se já existe outra categoria com esse nome para este usuário
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.findOneByName(
        updateCategoryDto.name,
        userId,
      );

      if (existingCategory && existingCategory.id !== id) {
        throw new BadRequestException(
          `There is already a category with the name '${updateCategoryDto.name}' for this user`,
        );
      }
    }

    this.repository.merge(category, updateCategoryDto);
    return this.repository.save(category);
  }

  async remove(id: number, userId: number): Promise<void> {
    // Verifica se a categoria existe e pertence ao usuário
    await this.findOne(id, userId);

    // Usa softRemove em vez de remove para fazer soft delete
    await this.repository.softDelete(id);
  }

  // Método para compatibilidade com outros serviços que só precisam verificar se a categoria existe
  async findOneById(id: number): Promise<Category> {
    const category = await this.repository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }
}
