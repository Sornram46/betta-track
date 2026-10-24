"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyGuard = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
let ApiKeyGuard = class ApiKeyGuard {
    canActivate(context) {
        const expected = process.env.API_ACCESS_TOKEN;
        if (!expected) {
            throw new common_1.ServiceUnavailableException('Set API_ACCESS_TOKEN in api/.env before using protected endpoints.');
        }
        const request = context.switchToHttp().getRequest();
        const authorization = request.headers.authorization ?? '';
        const supplied = authorization.startsWith('Bearer ')
            ? authorization.slice(7)
            : '';
        const expectedBytes = Buffer.from(expected);
        const suppliedBytes = Buffer.from(supplied);
        if (suppliedBytes.length !== expectedBytes.length ||
            !(0, node_crypto_1.timingSafeEqual)(suppliedBytes, expectedBytes)) {
            throw new common_1.UnauthorizedException();
        }
        return true;
    }
};
exports.ApiKeyGuard = ApiKeyGuard;
exports.ApiKeyGuard = ApiKeyGuard = __decorate([
    (0, common_1.Injectable)()
], ApiKeyGuard);
//# sourceMappingURL=api-key.guard.js.map