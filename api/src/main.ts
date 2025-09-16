import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

async function bootstrap() {
  // create app from root module
  const app = await NestFactory.create(AppModule);

  // allow requests from frontend 
  app.enableCors({
    origin: ['https://love-letters-1qpzdn4n5-ethanwong3s-projects.vercel.app'], // TODO: replace with vercel domain
    credentials: true,
  });

  // enforce DTO validation on every request
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,            // strip unknown fields
    forbidNonWhitelisted: true, // 400 if extra fields sent
    transform: true,            // transforms payloads to DTO classes
  }));

  // (We’ll enable Throttler after adding ThrottlerModule)
  // app.useGlobalGuards(new ThrottlerGuard());

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
