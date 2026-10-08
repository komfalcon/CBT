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
let UploadService = UploadService_1 = class UploadService {
    constructor() {
        this.logger = new common_1.Logger(UploadService_1.name);
        this.byteshipClient = null;
        this.byteshipApiKey = process.env.BYTESHIP_API_KEY || '';
        this.sendbytesApiKey = process.env.SENDBYTES_API_KEY || '';
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
        const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset';
        const uint8Array = new Uint8Array(fileBuffer);
        const year = new Date().getFullYear();
        const safeFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const path = `${folder}/${year}/${safeFilename}`;
        if (cloudName) {
            try {
                this.logger.log(`[Upload] Attempting primary upload to Cloudinary...`);
                const formData = new FormData();
                const blob = new Blob([uint8Array], { type: mimetype });
                formData.append('file', blob, filename);
                formData.append('upload_preset', uploadPreset);
                formData.append('folder', folder);
                const response = await axios_1.default.post(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    timeout: 15000,
                });
                if (response.data?.secure_url || response.data?.url) {
                    const url = response.data.secure_url || response.data.url;
                    this.logger.log(`[Upload] Primary upload to Cloudinary succeeded: ${url}`);
                    return { url, provider: 'cloudinary' };
                }
            }
            catch (cloudinaryErr) {
                this.logger.warn(`[Upload] Cloudinary upload failed: ${cloudinaryErr?.response?.data?.error?.message || cloudinaryErr.message}. Initiating fallback to Byteship backup uploader...`);
            }
        }
        else {
            this.logger.log('[Upload] Cloudinary not configured (CLOUDINARY_CLOUD_NAME missing). Routing directly to Byteship backup uploader...');
        }
        try {
            this.logger.log(`[Upload] Attempting backup upload to Byteship...`);
            if (this.byteshipClient && typeof this.byteshipClient.upload === 'function') {
                const fileObj = new File([uint8Array], filename, { type: mimetype });
                const result = await this.byteshipClient.upload(fileObj, {
                    path,
                    visibility: 'public',
                });
                const url = result?.url || result?.publicUrl || `https://cdn.byteship.com/${path}`;
                this.logger.log(`[Upload] Backup upload to Byteship SDK succeeded: ${url}`);
                return { url, provider: 'byteship' };
            }
            else {
                const response = await axios_1.default.post(`https://api.byteship.com/v1/upload`, fileBuffer, {
                    headers: {
                        Authorization: `Bearer ${this.byteshipApiKey}`,
                        'Content-Type': mimetype,
                        'X-Byteship-Path': path,
                        'X-Byteship-Visibility': 'public',
                    },
                    timeout: 20000,
                });
                const url = response.data?.url || response.data?.publicUrl || `https://cdn.byteship.com/${path}`;
                this.logger.log(`[Upload] Backup upload to Byteship REST API succeeded: ${url}`);
                return { url, provider: 'byteship' };
            }
        }
        catch (byteshipErr) {
            this.logger.warn(`[Upload] Byteship backup upload failed: ${byteshipErr?.response?.data?.message || byteshipErr.message}. Routing to SendBytes backup uploader...`);
        }
        try {
            this.logger.log(`[Upload] Attempting tertiary backup upload to SendBytes...`);
            const formData = new FormData();
            const blob = new Blob([uint8Array], { type: mimetype });
            formData.append('file', blob, filename);
            const response = await axios_1.default.post('https://api.sendbytes.io/v1/upload', formData, {
                headers: {
                    Authorization: `Bearer ${this.sendbytesApiKey}`,
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 20000,
            });
            const url = response.data?.url || response.data?.link || response.data?.data?.url || `https://sendbytes.io/f/${safeFilename}`;
            this.logger.log(`[Upload] Backup upload to SendBytes succeeded: ${url}`);
            return { url, provider: 'sendbytes' };
        }
        catch (sendbytesErr) {
            this.logger.error(`[Upload] SendBytes backup upload failed: ${sendbytesErr?.response?.data?.message || sendbytesErr.message}`);
            throw new Error(`All upload providers (Cloudinary, Byteship, & SendBytes) failed: ${sendbytesErr.message}`);
        }
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = UploadService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], UploadService);
//# sourceMappingURL=upload.service.js.map