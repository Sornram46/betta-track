"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FishModule = void 0;
const common_1 = require("@nestjs/common");
const api_key_guard_1 = require("../common/api-key.guard");
const fish_controller_1 = require("./fish.controller");
const fish_qr_controller_1 = require("./fish-qr.controller");
const fish_service_1 = require("./fish.service");
let FishModule = class FishModule {
};
exports.FishModule = FishModule;
exports.FishModule = FishModule = __decorate([
    (0, common_1.Module)({
        controllers: [fish_controller_1.FishController, fish_qr_controller_1.FishQrController],
        providers: [fish_service_1.FishService, api_key_guard_1.ApiKeyGuard],
    })
], FishModule);
//# sourceMappingURL=fish.module.js.map