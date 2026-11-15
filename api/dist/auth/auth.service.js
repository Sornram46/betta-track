"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const password_1 = require("./password");
const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;
function normalizeUsername(username) {
    return username.trim().toLowerCase();
}
let AuthService = AuthService_1 = class AuthService {
    supabase;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(supabase) {
        this.supabase = supabase;
    }
    async onModuleInit() {
        const username = process.env.OWNER_USERNAME;
        const password = process.env.OWNER_PASSWORD;
        if (!username || !password) {
            this.logger.warn('OWNER_USERNAME/OWNER_PASSWORD not set; skipping owner seed.');
            return;
        }
        const normalized = normalizeUsername(username);
        if (!USERNAME_PATTERN.test(normalized)) {
            this.logger.warn('OWNER_USERNAME must be 3-30 chars of a-z, 0-9, ".", "_" or "-"; skipping owner seed.');
            return;
        }
        try {
            await this.seedOwner(normalized, password, 'เจ้าของฟาร์ม');
        }
        catch (error) {
            this.logger.warn(`Could not seed owner user: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async findByUsername(username) {
        const { data, error } = await this.supabase.client
            .from('users')
            .select('id, username, email, password_hash, display_name, role')
            .eq('username', username)
            .maybeSingle();
        if (error) {
            throw new common_1.InternalServerErrorException(`Could not load user: ${error.message}`);
        }
        return data ?? null;
    }
    async seedOwner(username, password, displayName) {
        const existing = await this.findByUsername(username);
        if (existing)
            return;
        const passwordHash = await (0, password_1.hashPassword)(password);
        const { error } = await this.supabase.client.from('users').insert({
            username,
            password_hash: passwordHash,
            display_name: displayName,
            role: 'owner',
        });
        if (error) {
            if (error.code === '23505')
                return;
            throw new common_1.InternalServerErrorException(`Could not seed owner: ${error.message}`);
        }
        this.logger.log(`Seeded owner user: ${username}`);
    }
    async validateCredentials(input) {
        const username = normalizeUsername(input.username);
        const user = USERNAME_PATTERN.test(username) ? await this.findByUsername(username) : null;
        const isValid = user
            ? await (0, password_1.verifyPassword)(input.password, user.password_hash)
            : await (0, password_1.verifyPassword)(input.password, 'scrypt$00$00').then(() => false);
        if (!user || !isValid) {
            throw new common_1.UnauthorizedException('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        }
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.display_name,
            role: user.role,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AuthService);
//# sourceMappingURL=auth.service.js.map