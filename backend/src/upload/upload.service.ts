import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { createHash } from 'crypto';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private byteshipClient: any = null;
  private readonly byteshipApiKey = process.env.BYTESHIP_API_KEY || '';

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
   * supporting both unsigned preset upload and signed API Key/Secret upload.
   * Byteship acts as an isolated backup provider if configured.
   */
  async uploadFile(
    fileBuffer: Buffer,
    filename: string,
    mimetype: string = 'image/png',
    folder: string = 'uploads'
  ): Promise<{ url: string; provider: 'cloudinary' | 'byteship' }> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const uint8Array = new Uint8Array(fileBuffer);
    const year = new Date().getFullYear();
    const safeFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const path = `${folder}/${year}/${safeFilename}`;

    // 1. Primary Attempt: Cloudinary Upload (signed or unsigned preset)
    if (cloudName && (uploadPreset || (apiKey && apiSecret))) {
      try {
        this.logger.log(`[Upload] Attempting primary upload to Cloudinary (${cloudName})...`);
        const formData = new FormData();
        const blob = new Blob([uint8Array], { type: mimetype });
        formData.append('file', blob, filename);
        formData.append('folder', folder);

        if (apiKey && apiSecret) {
          const timestamp = Math.round(Date.now() / 1000);
          const signatureStr = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
          const signature = createHash('sha1').update(signatureStr).digest('hex');
          formData.append('timestamp', timestamp.toString());
          formData.append('api_key', apiKey);
          formData.append('signature', signature);
        } else if (uploadPreset) {
          formData.append('upload_preset', uploadPreset);
        }

        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 10000,
          }
        );

        if (response.data?.secure_url || response.data?.url) {
          const url = response.data.secure_url || response.data.url;
          this.logger.log(`[Upload] Primary upload to Cloudinary succeeded: ${url}`);
          return { url, provider: 'cloudinary' };
        }
      } catch (cloudinaryErr: any) {
        this.logger.warn(
          `[Upload] Cloudinary upload failed: ${cloudinaryErr?.response?.data?.error?.message || cloudinaryErr.message}.`
        );
      }
    } else if (cloudName) {
      this.logger.warn('[Upload] CLOUDINARY_CLOUD_NAME is set, but neither CLOUDINARY_UPLOAD_PRESET nor CLOUDINARY_API_KEY / SECRET are provided in backend/.env.');
    } else {
      this.logger.log('[Upload] Cloudinary not configured (CLOUDINARY_CLOUD_NAME missing in backend/.env).');
    }

    // 2. Backup Attempt: Byteship (only if valid API key is present)
    if (this.byteshipApiKey && !this.byteshipApiKey.startsWith('bship_placeholder')) {
      try {
        this.logger.log(`[Upload] Attempting backup upload to Byteship...`);
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
            timeout: 8000,
          }
        );

        const url = response.data?.url || response.data?.publicUrl || `https://cdn.byteship.com/${path}`;
        this.logger.log(`[Upload] Backup upload to Byteship REST API succeeded: ${url}`);
        return { url, provider: 'byteship' };
      } catch (byteshipErr: any) {
        this.logger.warn(`[Upload] Byteship backup upload failed: ${byteshipErr?.response?.data?.message || byteshipErr.message}`);
      }
    }

    throw new Error('Storage upload unavailable (Cloudinary / Byteship unconfigured). Fast-failing to direct AI vision fallback.');
  }
}
