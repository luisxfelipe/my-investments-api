import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { AssetTypesModule } from './asset-types/asset-types.module';
import { PlatformsModule } from './platforms/platforms.module';
import { AssetsModule } from './assets/assets.module';
import { TransactionTypesModule } from './transaction-types/transaction-types.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT') || '3306', 10),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: configService.get('DB_ENTITIES')
          ? [__dirname + configService.get('DB_ENTITIES')]
          : [__dirname + process.env.DB_ENTITIES],
        autoLoadEntities:
          Boolean(
            Number(configService.get<boolean>('DB_AUTO_LOAD_ENTITIES')),
          ) || Boolean(Number(process.env.DB_AUTO_LOAD_ENTITIES)),
        synchronize:
          Boolean(Number(configService.get<boolean>('DB_SYNCHRONIZE'))) ||
          Boolean(Number(process.env.DB_SYNCHRONIZE)),
        migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
        migrationsRun: Boolean(
          Number(configService.get<boolean>('DB_MIGRATIONS_RUN')),
        ),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    CategoriesModule,
    AssetTypesModule,
    PlatformsModule,
    AssetsModule,
    TransactionTypesModule,
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
