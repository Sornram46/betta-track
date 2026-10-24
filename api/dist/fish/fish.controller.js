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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FishController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const api_key_guard_1 = require("../common/api-key.guard");
const create_fish_dto_1 = require("./dto/create-fish.dto");
const fish_service_1 = require("./fish.service");
let FishController = class FishController {
    fishService;
    constructor(fishService) {
        this.fishService = fishService;
    }
    findAll() {
        return this.fishService.findAll();
    }
    create(createFishDto) {
        return this.fishService.create(createFishDto);
    }
    uploadImage(id, image, role) {
        if (role && !['fish', 'father', 'mother'].includes(role)) {
            throw new common_1.BadRequestException('ประเภทภาพไม่ถูกต้อง');
        }
        return this.fishService.uploadImage(id, image, (role ?? 'fish'));
    }
};
exports.FishController = FishController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FishController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_fish_dto_1.CreateFishDto]),
    __metadata("design:returntype", void 0)
], FishController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/image'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', {
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_request, file, callback) => {
            const supported = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
            callback(supported ? null : new common_1.BadRequestException('รองรับเฉพาะ JPEG, PNG หรือ WebP'), supported);
        },
    })),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], FishController.prototype, "uploadImage", null);
exports.FishController = FishController = __decorate([
    (0, common_1.Controller)('fish'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    __metadata("design:paramtypes", [fish_service_1.FishService])
], FishController);
//# sourceMappingURL=fish.controller.js.map