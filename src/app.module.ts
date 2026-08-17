import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ImageModule } from './image/image.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LayersModule } from './layers/layers.module';
import { TemplatesModule } from './templates/templates.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        console.log('[AppModule] Configurando conexión a base de datos');
        console.log(
          `[AppModule] Timezone: ${configService.get('DB_TIMEZONE') || '+00:00'}`,
        );
        console.log(
          `[AppModule] Hora actual del sistema: ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`,
        );

        return {
          type: 'mariadb',
          host: configService.get<string>('api_db_host'),
          port: Number(configService.get<string>('api_db_port')),
          username: configService.get<string>('api_db_username'),
          password: configService.get<string>('api_db_password'),
          database: configService.get<string>('api_db_database'),
          synchronize: true,
          dropSchema: false,
          autoLoadEntities: true,
          timezone: '+00:00',
        };
      },
    }),
    ImageModule,
    LayersModule,
    TemplatesModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
