import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.setGlobalPrefix("api");
  app.enableCors({
    origin: true,
    credentials: true
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT", 4000);

  await app.listen(port);
  logger.log(`🚀 LinguaFlow API is running at: http://localhost:${port}/api`);
  logger.log(`🩺 Health check available at: http://localhost:${port}/api/health`);
}

bootstrap();
