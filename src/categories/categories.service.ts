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

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Verifica se já existe uma categoria com o mesmo nome
    const existingCategory = await this.findOneByName(createCategoryDto.name);

    if (existingCategory) {
      throw new BadRequestException(
        `There is already a category with the name '${createCategoryDto.name}'`,
      );
    }

    const category = this.repository.create(createCategoryDto);
    return this.repository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.repository.find({
      order: { name: 'ASC' },
    });
  }

  async findAllWithPagination(
    take = 10,
    page = 1,
  ): Promise<PaginatedResponseDto<Category>> {
    const skip = (page - 1) * take;

    const [categories, total] = await this.repository.findAndCount({
      take,
      skip,
      order: { name: 'ASC' },
    });

    return new PaginatedResponseDto(categories, total, take, page);
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.repository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async findOneByName(name: string): Promise<Category | null> {
    return this.repository.findOne({
      where: { name },
    });
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    if (!updateCategoryDto || Object.keys(updateCategoryDto).length === 0) {
      throw new BadRequestException(`No properties provided for update`);
    }

    const category = await this.findOne(id);

    // Se estiver atualizando o nome, verifica se já existe outra categoria com esse nome
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.findOneByName(updateCategoryDto.name);

      if (existingCategory && existingCategory.id !== id) {
        throw new BadRequestException(
          `There is already a category with the name '${updateCategoryDto.name}'`,
        );
      }
    }

    this.repository.merge(category, updateCategoryDto);
    return this.repository.save(category);
  }

  async remove(id: number): Promise<void> {
    // Verifica se a categoria existe
    await this.findOne(id);

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
