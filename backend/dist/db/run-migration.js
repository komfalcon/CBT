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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@libsql/client");
const dotenv = __importStar(require("dotenv"));
const fs = __importStar(require("fs"));
dotenv.config();
const runMigrate = async () => {
    try {
        const client = (0, client_1.createClient)({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });
        const sqlContent = fs.readFileSync('./drizzle/' + fs.readdirSync('./drizzle').find(f => f.endsWith('.sql')), 'utf8');
        const statements = sqlContent
            .split('--> statement-breakpoint')
            .map(s => s.trim().replace('CREATE TABLE', 'CREATE TABLE IF NOT EXISTS'))
            .filter(s => s);
        console.log('Running raw SQL migrations...');
        for (const stmt of statements) {
            try {
                await client.execute(stmt);
            }
            catch (err) {
                console.error('Failed statement:', stmt);
                throw err;
            }
        }
        console.log('Migrations complete!');
        process.exit(0);
    }
    catch (err) {
        console.error('Migration failed', err);
        process.exit(1);
    }
};
runMigrate();
//# sourceMappingURL=run-migration.js.map