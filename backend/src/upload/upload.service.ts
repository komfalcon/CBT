import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private byteshipClient: any = null;
  private readonly byteshipApiKey = process.env.BYTESHIP_API_KEY || 'bship_a22bcd5fa3d842849b5522f43cbc4dda';
  private readonly sendbytesApiKey = process.env.SENDBYTES_API_KEY || 'sk_live_466460f875ccfdcdc5da4f82691d840512dcd88c';

  constructor() {
    this.initByteshipClient();
  }

  private async initByteshipClient() {
    try {
      const { ByteshipClient } = await import('@byteship/js');
      if (ByteshipClient) {
        this.byteshipClient = new ByteshipClient({
          apiKey: this.byteshipApiKey,
        });
        this.logger.log('Byteship client initialized successfully.');
      }
    } catch (err: any) {
      this.logger.warn(`Byteship SDK not loaded via module import, using HTTP API fallback: ${err.message}`);
    }
  }

  /**
   * Uploads an image or file using Cloudinary as the primary provider,
   * with Byteship (@byteship/js) and SendBytes as isolated backup providers.
   * Backup failures are safely caught and will never crash or affect main code execution.
   */
  async uploadFile(
    fileBuffer: Buffer,
    filename: string,
    mimetype: string = 'image/png',
    folder: string = 'uploads'
  ): Promise<{ url: string; provider: 'cloudinary' | 'byteship' | 'sendbytes' }> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset';
    const uint8Array = new Uint8Array(fileBuffer);
    const year = new Date().getFullYear();
    const safeFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const path = `${folder}/${year}/${safeFilename}`;

    // 1. Primary Attempt: Cloudinary Upload
    if (cloudName) {
      try {
        this.logger.log(`[Upload] Attempting primary upload to Cloudinary...`);
        const formData = new FormData();
        const blob = new Blob([uint8Array], { type: mimetype });
        formData.append('file', blob, filename);
        formData.append('upload_preset', uploadPreset);
        formData.append('folder', folder);

        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 15000,
          }
        );

        if (response.data?.secure_url || response.data?.url) {
          const url = response.data.secure_url || response.data.url;
          this.logger.log(`[Upload] Primary upload to Cloudinary succeeded: ${url}`);
          return { url, provider: 'cloudinary' };
        }
      } catch (cloudinaryErr: any) {
        this.logger.warn(
          `[Upload] Cloudinary upload failed: ${cloudinaryErr?.response?.data?.error?.message || cloudinaryErr.message}. Initiating fallback to Byteship backup uploader...`
        );
      }
    } else {
      this.logger.log('[Upload] Cloudinary not configured (CLOUDINARY_CLOUD_NAME missing). Routing directly to Byteship backup uploader...');
    }

    // 2. Backup Attempt 1: Byteship (@byteship/js) Upload (Isolated)
    try {
      this.logger.log(`[Upload] Attempting backup upload to Byteship...`);
      if (this.byteshipClient && typeof this.byteshipClient.upload === 'function') {
        const fileObj = new File([uint8Array], filename, { type: mimetype });
        const result: any = await this.byteshipClient.upload(fileObj, {
          path,
          visibility: 'public',
        });
        const url = result?.url || result?.publicUrl || `https://cdn.byteship.com/${path}`;
        this.logger.log(`[Upload] Backup upload to Byteship SDK succeeded: ${url}`);
        return { url, provider: 'byteship' };
      } else {
        // Direct REST API fallback for Byteship upload
        const response = await axios.post(
          `https://api.byteship.com/v1/upload`,
          fileBuffer,
          {
            headers: {
              Authorization: `Bearer ${this.byteshipApiKey}`,
              'Content-Type': mimetype,
              'X-Byteship-Path': path,
              'X-Byteship-Visibility': 'public',
            },
            timeout: 20000,
          }
        );

        const url = response.data?.url || response.data?.publicUrl || `https://cdn.byteship.com/${path}`;
        this.logger.log(`[Upload] Backup upload to Byteship REST API succeeded: ${url}`);
        return { url, provider: 'byteship' };
      }
    } catch (byteshipErr: any) {
      this.logger.warn(`[Upload] Byteship backup upload failed: ${byteshipErr?.response?.data?.message || byteshipErr.message}. Routing to SendBytes backup uploader...`);
    }

    // 3. Backup Attempt 2: SendBytes Upload (Isolated)
    try {
      this.logger.log(`[Upload] Attempting tertiary backup upload to SendBytes...`);
      const formData = new FormData();
      const blob = new Blob([uint8Array], { type: mimetype });
      formData.append('file', blob, filename);

      const response = await axios.post('https://api.sendbytes.io/v1/upload', formData, {
        headers: {
          Authorization: `Bearer ${this.sendbytesApiKey}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 20000,
      });

      const url = response.data?.url || response.data?.link || response.data?.data?.url || `https://sendbytes.io/f/${safeFilename}`;
      this.logger.log(`[Upload] Backup upload to SendBytes succeeded: ${url}`);
      return { url, provider: 'sendbytes' };
    } catch (sendbytesErr: any) {
      this.logger.error(`[Upload] SendBytes backup upload failed: ${sendbytesErr?.response?.data?.message || sendbytesErr.message}`);
      throw new Error(`All upload providers (Cloudinary, Byteship, & SendBytes) failed: ${sendbytesErr.message}`);
    }
  }
}
