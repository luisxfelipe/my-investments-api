import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto';
import { UpdateTransactionTypeDto } from './dto/update-transaction-type.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionType } from './entities/transaction-type.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TransactionTypesService {
  constructor(
    @InjectRepository(TransactionType)
    private readonly repository: Repository<TransactionType>,
  ) { }

  async create(createTransactionTypeDto: CreateTransactionTypeDto): Promise<TransactionType> {
    // Verifica se já existe um tipo de transação com o mesmo nome
    const existingTransactionType = await this.findOneByName(createTransactionTypeDto.name);

    if (existingTransactionType) {
      throw new BadRequestException(`There is already a transaction type with the name '${createTransactionTypeDto.name}'`);
    }

    const transactionType = this.repository.create(createTransactionTypeDto);
    return this.repository.save(transactionType);
  }

  async findAll(): Promise<TransactionType[]> {
    return this.repository.find();
  }

  async findOne(id: number): Promise<TransactionType> {
    const transactionType = await this.repository.findOne({ where: { id } });

    if (!transactionType) {
      throw new NotFoundException(`Transaction Type with ID ${id} not found`);
    }

    return transactionType;
  }

  async findOneByName(name: string): Promise<TransactionType | null> {
    return this.repository.findOne({ where: { name } });
  }

  async update(id: number, updateTransactionTypeDto: UpdateTransactionTypeDto): Promise<TransactionType> {
    if (!updateTransactionTypeDto || Object.keys(updateTransactionTypeDto).length === 0) {
      throw new BadRequestException(`No properties provided for update`);
    }

    const transactionType = await this.findOne(id);

    // Se estiver atualizando o nome, verifica se já existe outro tipo de transação com esse nome
    if (updateTransactionTypeDto.name && updateTransactionTypeDto.name !== transactionType.name) {
      const existingTransactionType = await this.findOneByName(updateTransactionTypeDto.name);

      if (existingTransactionType && existingTransactionType.id !== id) {
        throw new BadRequestException(`There is already a transaction type with the name '${updateTransactionTypeDto.name}'`);
      }
    }

    this.repository.merge(transactionType, updateTransactionTypeDto);
    return this.repository.save(transactionType);
  }

  async remove(id: number): Promise<void> {
    // Verifica se o tipo de transação existe
    await this.findOne(id);

    // Usa softDelete em vez de remove para fazer soft delete
    await this.repository.softDelete(id);
  }
}
