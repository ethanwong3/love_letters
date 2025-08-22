import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envSchema, EnvVars } from './env.validation';

@Module({
  imports: [
    // load env vars once and globalising them
    ConfigModule.forRoot({
      isGlobal: true,
      // validate env at setup, throw readable error 
      validate: (rawEnv) => {
        const parsed = envSchema.safeParse(rawEnv);
        if (!parsed.success) {
          const formatted = parsed.error.format();
          throw new Error(`Invalid environment variables: ${JSON.stringify(formatted)}`);
        }
        return parsed.data as EnvVars;
      },
    }),
  ],
})
export class AppConfigModule {}
