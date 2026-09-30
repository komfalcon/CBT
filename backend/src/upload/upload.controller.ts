import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingleFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string
  ) {
    if (!file) {
      throw new BadRequestException('No file provided for upload');
    }

    const result = await this.uploadService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      folder || 'uploads'
    );

    return {
      success: true,
      url: result.url,
      provider: result.provider,
      filename: file.originalname,
    };
  }
}
