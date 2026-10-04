import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, Body, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingleFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') rawFolder?: string
  ) {
    if (!file) {
      throw new BadRequestException('No file provided for upload');
    }

    const safeFolder = rawFolder
      ? rawFolder.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50) || 'uploads'
      : 'uploads';

    const result = await this.uploadService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      safeFolder
    );

    return {
      success: true,
      url: result.url,
      provider: result.provider,
      filename: file.originalname,
    };
  }
}
