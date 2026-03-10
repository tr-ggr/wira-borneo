export interface LlmRuntimeConfig {
    llmServerUrl: string;
    llmTimeoutMs: number;
    llmInternalSecret: string;
}

function requireEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(
            `Missing required environment variable ${name}. Copy apps/api/.env.example and provide a valid value.`,
        );
    }
    return value;
}

export function getLlmRuntimeConfig(): LlmRuntimeConfig {
    const llmServerUrl = requireEnv('LLM_SERVER_URL');
    const llmInternalSecret = requireEnv('LLM_INTERNAL_SECRET');
    const llmTimeoutMs = parseInt(
        process.env.LLM_TIMEOUT_MS?.trim() || '15000',
        10,
    );

    if (isNaN(llmTimeoutMs) || llmTimeoutMs <= 0) {
        throw new Error(
            'LLM_TIMEOUT_MS must be a positive integer when provided.',
        );
    }

    return { llmServerUrl, llmTimeoutMs, llmInternalSecret };
}
