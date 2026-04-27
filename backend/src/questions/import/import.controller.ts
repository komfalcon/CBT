import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import * as amqp from 'amqplib';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ImportQuestionsDto } from '../dto/import-questions.dto';
import { ImportService } from './import.service';

@Controller('questions/import')
export class ImportController {
  constructor(
    private readonly importService: ImportService,
    private readonly configService: ConfigService,
  ) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.importService.uploadAndParse(file);
  }

  @Get(':importId/preview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  preview(@Param('importId') importId: string) {
    return this.importService.getPreview(importId);
  }

  @Post('commit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async commit(
    @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: ImportQuestionsDto,
    @Req() req: Request & { user?: { sub?: string; userId?: string } },
  ) {
    const actorUserId = req.user?.sub ?? req.user?.userId;
    if (!actorUserId) {
      throw new BadRequestException('Authenticated user required');
    }

    if (dto.async) {
      const rabbitUrl = this.configService.get<string>('RABBITMQ_URL');
      if (!rabbitUrl) {
        throw new BadRequestException('RABBITMQ_URL is not configured for async import');
      }

      const connection = await amqp.connect(rabbitUrl, { timeout: 2000 });
      const channel = await connection.createChannel();
      await channel.assertQueue('questions.import.commit', { durable: true });
      channel.sendToQueue(
        'questions.import.commit',
        Buffer.from(
          JSON.stringify({
            importId: dto.importId,
            actorUserId,
            columnMapping: dto.columnMapping,
          }),
        ),
        { persistent: true },
      );
      await channel.close().catch(() => undefined);
      await connection.close().catch(() => undefined);

      return {
        message: 'Import queued successfully',
        importId: dto.importId,
      };
    }

    return this.importService.commitImport(dto, actorUserId);
  }
}
