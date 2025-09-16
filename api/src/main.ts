import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('🚀 Starting application bootstrap...');
  console.log('📊 Environment check:');
  console.log('  - NODE_ENV:', process.env.NODE_ENV);
  console.log('  - PORT from env:', process.env.PORT);
  console.log('  - DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('  - JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('  - BCRYPT_SALT_ROUNDS:', process.env.BCRYPT_SALT_ROUNDS);

  try {
    console.log('🏗️  Creating NestJS application...');
    const app = await NestFactory.create(AppModule);
    console.log('✅ NestJS application created successfully');

    console.log('🌐 Configuring CORS...');
    const allowedOrigins = [
      'http://localhost:3000',
      'https://your-vercel-app.vercel.app', // Replace with your actual Vercel URL
      process.env.FRONTEND_URL, // Add this env var in Render if you want
    ].filter(Boolean); // Remove any undefined values

    console.log('  - Allowed CORS origins:', allowedOrigins);
    
    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });
    console.log('✅ CORS configured successfully');

    // Determine port
    const port = process.env.PORT || 4000;
    console.log('🔌 Port configuration:');
    console.log('  - process.env.PORT:', process.env.PORT);
    console.log('  - Final port to use:', port);
    console.log('  - Port type:', typeof port);

    console.log('🎧 Starting server...');
    await app.listen(port);
    
    console.log('🎉 APPLICATION STARTED SUCCESSFULLY!');
    console.log(`📡 Server running on port ${port}`);
    console.log(`🌍 Health check: http://localhost:${port}`);
    console.log('📋 Available endpoints:');
    console.log('  - POST /auth/register');
    console.log('  - POST /auth/login');

  } catch (error) {
    console.error('❌ FATAL ERROR during bootstrap:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('❌ UNHANDLED ERROR in bootstrap:');
  console.error(error);
  process.exit(1);
});