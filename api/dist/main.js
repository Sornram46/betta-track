"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const node_path_1 = require("node:path");
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
(0, dotenv_1.config)({ path: (0, node_path_1.resolve)(__dirname, '..', '.env') });
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    app.enableCors({
        origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
//# sourceMappingURL=main.js.map