import { FlaskAssistantProvider } from './flask-assistant.provider';
import { SimpleAssistantProvider } from './simple-assistant.provider';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FlaskAssistantProvider', () => {
    let provider: FlaskAssistantProvider;
    let fallback: SimpleAssistantProvider;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.LLM_SERVER_URL = 'http://localhost:5000';
        process.env.LLM_TIMEOUT_MS = '5001';

        fallback = new SimpleAssistantProvider();
        provider = new FlaskAssistantProvider(fallback);
        provider.onModuleInit();
    });

    afterEach(() => {
        delete process.env.LLM_SERVER_URL;
        delete process.env.LLM_TIMEOUT_MS;
    });

    const baseInput = {
        question: 'What should I do during a flood?',
        context: { hazardType: 'FLOOD', location: 'Kuching' },
    };

    it('returns LLM response on success', async () => {
        mockedAxios.post.mockResolvedValue({
            data: {
                answer: 'Move to higher ground immediately.',
                provider: 'sea-lion',
                disclaimer: 'General guidance only.',
            },
        });

        const result = await provider.answer(baseInput);

        expect(result.answer).toBe('Move to higher ground immediately.');
        expect(result.provider).toBe('sea-lion');
        expect(mockedAxios.post).toHaveBeenCalledWith(
            'http://localhost:5000/api/chat',
            {
                question: baseInput.question,
                context: baseInput.context,
            },
            { timeout: 5000 },
        );
    });

    it('falls back to SimpleAssistantProvider on network error', async () => {
        mockedAxios.post.mockRejectedValue(new Error('ECONNREFUSED'));

        const result = await provider.answer(baseInput);

        expect(result.provider).toBe('simple-disaster-assistant');
        expect(result.answer).toContain('prioritize official advisories');
    });

    it('falls back to SimpleAssistantProvider on timeout', async () => {
        mockedAxios.post.mockRejectedValue(new Error('timeout of 5000ms exceeded'));

        const result = await provider.answer(baseInput);

        expect(result.provider).toBe('simple-disaster-assistant');
    });

    it('falls back on 5xx server error', async () => {
        mockedAxios.post.mockRejectedValue({
            response: { status: 500 },
            message: 'Internal Server Error',
        });

        const result = await provider.answer(baseInput);

        expect(result.provider).toBe('simple-disaster-assistant');
    });

    it('truncates responses exceeding 2000 chars', async () => {
        const longAnswer = 'x'.repeat(2500);
        mockedAxios.post.mockResolvedValue({
            data: {
                answer: longAnswer,
                provider: 'gemini',
                disclaimer: 'test',
            },
        });

        const result = await provider.answer(baseInput);

        expect(result.answer.length).toBe(2001); // 2000 + "…"
        expect(result.answer.endsWith('…')).toBe(true);
    });

    it('does not truncate short responses', async () => {
        mockedAxios.post.mockResolvedValue({
            data: {
                answer: 'Stay safe.',
                provider: 'sea-lion',
                disclaimer: 'test',
            },
        });

        const result = await provider.answer(baseInput);

        expect(result.answer).toBe('Stay safe.');
    });
});

describe('LLM Config validation', () => {
    it('throws when LLM_SERVER_URL is missing', () => {
        delete process.env.LLM_SERVER_URL;

        const fallback = new SimpleAssistantProvider();
        const provider = new FlaskAssistantProvider(fallback);

        expect(() => provider.onModuleInit()).toThrow('LLM_SERVER_URL');
    });
});
