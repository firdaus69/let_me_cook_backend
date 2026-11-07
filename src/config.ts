import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1, 'is required'),
  JWT_SECRET: z.string().min(32, 'must be at least 32 characters (see .env.example)'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
});

export type Config = z.infer<typeof EnvSchema>;

/** Reads and validates environment variables, exiting with a clear message if any are wrong. */
export function loadConfig(): Config {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`);
    console.error(`Invalid environment configuration:\n${lines.join('\n')}`);
    process.exit(1);
  }
  return result.data;
}
