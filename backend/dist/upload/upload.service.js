"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var UploadService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
let UploadService = UploadService_1 = class UploadService {
    constructor() {
        this.logger = new common_1.Logger(UploadService_1.name);
        this.byteshipClient = null;
        this.byteshipApiKey = process.env.BYTESHIP_API_KEY || '';
        this.initByteshipClient();
    }
    async initByteshipClient() {
        try {
            const { ByteshipClient } = await Promise.resolve().then(() => __importStar(require('@byteship/js')));
            if (ByteshipClient) {
                this.byteshipClient = new ByteshipClient({
                    apiKey: this.byteshipApiKey,
                });
                this.logger.log('Byteship client initialized successfully.');
            }
        }
        catch (err) {
            this.logger.warn(`Byteship SDK not loaded via module import, using HTTP API fallback: ${err.message}`);
        }
    }
    async uploadFile(fileBuffer, filename, mimetype = 'image/png', folder = 'uploads') {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;
        const uint8Array = new Uint8Array(fileBuffer);
        const year = new Date().getFullYear();
        const safeFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const path = `${folder}/${year}/${safeFilename}`;
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
                    const signature = (0, crypto_1.createHash)('sha1').update(signatureStr).digest('hex');
                    formData.append('timestamp', timestamp.toString());
                    formData.append('api_key', apiKey);
                    formData.append('signature', signature);
                }
                else if (uploadPreset) {
                    formData.append('upload_preset', uploadPreset);
                }
                const response = await axios_1.default.post(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    timeout: 10000,
                });
                if (response.data?.secure_url || response.data?.url) {
                    const url = response.data.secure_url || response.data.url;
                    const key = response.data.public_id || filename;
                    this.logger.log(`[Upload] Primary upload to Cloudinary succeeded: ${url} (id: ${key})`);
                    return { url, provider: 'cloudinary', key };
                }
            }
            catch (cloudinaryErr) {
                this.logger.warn(`[Upload] Cloudinary upload failed: ${cloudinaryErr?.response?.data?.error?.message || cloudinaryErr.message}.`);
            }
        }
        else if (cloudName) {
            this.logger.warn('[Upload] CLOUDINARY_CLOUD_NAME is set, but neither CLOUDINARY_UPLOAD_PRESET nor CLOUDINARY_API_KEY / SECRET are provided in backend/.env.');
        }
        else {
            this.logger.log('[Upload] Cloudinary not configured (CLOUDINARY_CLOUD_NAME missing in backend/.env).');
        }
        if (this.byteshipApiKey && !this.byteshipApiKey.startsWith('bship_placeholder')) {
            try {
                this.logger.log(`[Upload] Attempting backup upload to Byteship...`);
                const response = await axios_1.default.post(`https://api.byteship.com/v1/upload`, fileBuffer, {
                    headers: {
                        Authorization: `Bearer ${this.byteshipApiKey}`,
                        'Content-Type': mimetype,
                        'X-Byteship-Path': path,
                        'X-Byteship-Visibility': 'public',
                    },
                    timeout: 8000,
                });
                const url = response.data?.url || response.data?.publicUrl || `https://cdn.byteship.com/${path}`;
                this.logger.log(`[Upload] Backup upload to Byteship REST API succeeded: ${url} (path: ${path})`);
                return { url, provider: 'byteship', key: path };
            }
            catch (byteshipErr) {
                this.logger.warn(`[Upload] Byteship backup upload failed: ${byteshipErr?.response?.data?.message || byteshipErr.message}`);
            }
        }
        throw new Error('Storage upload unavailable (Cloudinary / Byteship unconfigured). Fast-failing to direct AI vision fallback.');
    }
    async deleteFile(keyOrUrl, provider) {
        if (!keyOrUrl)
            return false;
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;
        const isCloudinary = provider === 'cloudinary' || keyOrUrl.includes('cloudinary.com') || (cloudName && !provider);
        if (isCloudinary && cloudName) {
            try {
                let publicId = keyOrUrl;
                if (keyOrUrl.startsWith('http')) {
                    const match = keyOrUrl.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
                    if (match && match[1]) {
                        publicId = match[1];
                    }
                }
                if (apiKey && apiSecret) {
                    const timestamp = Math.round(Date.now() / 1000);
                    const signatureStr = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
                    const signature = (0, crypto_1.createHash)('sha1').update(signatureStr).digest('hex');
                    const formData = new URLSearchParams();
                    formData.append('public_id', publicId);
                    formData.append('timestamp', timestamp.toString());
                    formData.append('api_key', apiKey);
                    formData.append('signature', signature);
                    const res = await axios_1.default.post(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, formData.toString(), {
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        timeout: 8000,
                    });
                    this.logger.log(`[Upload] Cloudinary asset destroyed (${publicId}): ${res.data?.result}`);
                    return res.data?.result === 'ok';
                }
                else {
                    this.logger.warn(`[Upload] Skipping Cloudinary destroy for ${publicId}: CLOUDINARY_API_KEY & CLOUDINARY_API_SECRET required for authenticated deletion.`);
                    return false;
                }
            }
            catch (err) {
                this.logger.warn(`[Upload] Cloudinary destroy failed for ${keyOrUrl}: ${err?.response?.data?.error?.message || err.message}`);
                return false;
            }
        }
        if (this.byteshipApiKey) {
            try {
                let path = keyOrUrl;
                if (keyOrUrl.startsWith('http')) {
                    const parts = keyOrUrl.split('.com/');
                    if (parts[1])
                        path = parts[1];
                }
                await axios_1.default.delete(`https://api.byteship.com/v1/files/${encodeURIComponent(path)}`, {
                    headers: {
                        Authorization: `Bearer ${this.byteshipApiKey}`,
                    },
                    timeout: 8000,
                });
                this.logger.log(`[Upload] Byteship file deleted (${path})`);
                return true;
            }
            catch (err) {
                this.logger.warn(`[Upload] Byteship delete failed for ${keyOrUrl}: ${err?.response?.data?.message || err.message}`);
                return false;
            }
        }
        return false;
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = UploadService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], UploadService);
//# sourceMappingURL=upload.service.js.map