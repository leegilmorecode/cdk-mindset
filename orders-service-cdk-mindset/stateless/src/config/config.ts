type ConfigSchema = {
  stage: string;
  tableName: string;
  idempotencyTableName: string;
  createLatency: string;
  createError: string;
  service: string;
  namespace: string;
};

const schema: Record<keyof ConfigSchema, { env: string; default: string }> = {
  stage: { env: 'STAGE', default: '' },
  tableName: { env: 'TABLE_NAME', default: '' },
  idempotencyTableName: { env: 'IDEMPOTENCY_TABLE_NAME', default: '' },
  createLatency: { env: 'CREATE_LATENCY', default: 'false' },
  createError: { env: 'CREATE_ERROR', default: 'false' },
  service: { env: 'POWERTOOLS_SERVICE_NAME', default: '' },
  namespace: { env: 'POWERTOOLS_METRICS_NAMESPACE', default: '' },
};

const loaded: ConfigSchema = Object.entries(schema).reduce(
  (acc, [key, { env, default: def }]) => {
    acc[key as keyof ConfigSchema] = process.env[env] ?? def;
    return acc;
  },
  {} as ConfigSchema,
);
class Config {
  private values: ConfigSchema;
  constructor(values: ConfigSchema) {
    this.values = values;
  }
  get<K extends keyof ConfigSchema>(key: K): ConfigSchema[K] {
    if (!(key in this.values)) {
      throw new Error(`Unknown config key: ${String(key)}`);
    }
    return this.values[key];
  }
}

export const config = new Config(loaded);
