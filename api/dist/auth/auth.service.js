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
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
let AuthService = AuthService_1 = class AuthService {
    supabase;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(supabase) {
        this.supabase = supabase;
    }
    async onModuleInit() {
        const email = process.env.OWNER_EMAIL;
        const password = process.env.OWNER_PASSWORD;
        if (!email || !password) {
            this.logger.warn('OWNER_EMAIL/OWNER_PASSWORD not set; skipping owner seed.');
            return;
        }
        try {
            await this.seedOwner(normalizeEmail(email), password, 'เจ้าของฟาร์ม');
        }
        catch (error) {
            this.logger.warn(`Could not seed owner user: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async findByEmail(email) {
        const { data, error } = await this.supabase.client
            .from('users')
            .select('id, email, password_hash, display_name, role')
            .eq('email', email)
            .maybeSingle();
        if (error) {
            throw new common_1.InternalServerErrorException(`Could not load user: ${error.message}`);
        }
        return data ?? null;
    }
    async seedOwner(email, password, displayName) {
        const existing = await this.findByEmail(email);
        if (existing)
            return;
        const passwordHash = await (0, password_1.hashPassword)(password);
        const { error } = await this.supabase.client.from('users').insert({
            email,
            password_hash: passwordHash,
            display_name: displayName,
            role: 'owner',
        });
        if (error) {
            if (error.code === '23505')
                return;
            throw new common_1.InternalServerErrorException(`Could not seed owner: ${error.message}`);
        }
        this.logger.log(`Seeded owner user: ${email}`);
    }
    async validateCredentials(input) {
        const email = normalizeEmail(input.email);
        const user = await this.findByEmail(email);
        const isValid = user
            ? await (0, password_1.verifyPassword)(input.password, user.password_hash)
            : await (0, password_1.verifyPassword)(input.password, 'scrypt$00$00').then(() => false);
        if (!user || !isValid) {
            throw new common_1.UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        }
        return {
            id: user.id,
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