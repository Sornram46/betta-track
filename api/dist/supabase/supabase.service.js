"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseService = void 0;
const common_1 = require("@nestjs/common");
const supabase_js_1 = require("@supabase/supabase-js");
let SupabaseService = class SupabaseService {
    supabaseClient;
    get client() {
        if (this.supabaseClient)
            return this.supabaseClient;
        const url = process.env.SUPABASE_URL;
        const secretKey = process.env.SUPABASE_SECRET_KEY;
        if (!url || !secretKey) {
            throw new common_1.ServiceUnavailableException('Set SUPABASE_URL and SUPABASE_SECRET_KEY in api/.env before database requests.');
        }
        this.supabaseClient = (0, supabase_js_1.createClient)(url, secretKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
        return this.supabaseClient;
    }
    async checkConnection() {
        const { error } = await this.client.from('ponds').select('id', {
            head: true,
            count: 'exact',
        });
        if (error) {
            throw new common_1.InternalServerErrorException(`Supabase query failed: ${error.message}`);
        }
    }
};
exports.SupabaseService = SupabaseService;
exports.SupabaseService = SupabaseService = __decorate([
    (0, common_1.Injectable)()
], SupabaseService);
//# sourceMappingURL=supabase.service.js.map