import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService, SupabaseProviderError } from './supabase.service';
import * as config from '../../config/supabase.config';

jest.mock('../../config/supabase.config', () => ({
  getSupabaseRuntimeConfig: jest.fn(),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn().mockReturnThis(),
      upload: jest.fn(),
      getPublicUrl: jest.fn(),
      remove: jest.fn(),
    },
  })),
}));

describe('SupabaseService', () => {
  let service: SupabaseService;
  let mockSupabaseClient: {
    storage: {
      from: jest.Mock;
      upload: jest.Mock;
      getPublicUrl: jest.Mock;
      remove: jest.Mock;
    };
  };

  beforeEach(async () => {
    (config.getSupabaseRuntimeConfig as jest.Mock).mockReturnValue({
      supabaseUrl: 'https://xyz.supabase.co',
      supabaseServiceRoleKey: 'secret-key',
      supabaseBucket: 'test-bucket',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [SupabaseService],
    }).compile();

    service = module.get<SupabaseService>(SupabaseService);
    mockSupabaseClient = (service as any).client;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload a file and return the public URL', async () => {
      const filePath = 'test/file.txt';
      const fileData = Buffer.from('hello world');
      const publicUrl = 'https://xyz.supabase.co/storage/v1/object/public/test-bucket/test/file.txt';

      mockSupabaseClient.storage.upload.mockResolvedValue({
        data: { path: filePath },
        error: null,
      });

      mockSupabaseClient.storage.getPublicUrl.mockReturnValue({
        data: { publicUrl },
      });

      const result = await service.uploadFile(filePath, fileData);

      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('test-bucket');
      expect(mockSupabaseClient.storage.upload).toHaveBeenCalledWith(filePath, fileData, {
        contentType: undefined,
        upsert: false,
      });
      expect(result).toBe(publicUrl);
    });

    it('should throw SupabaseProviderError if upload fails', async () => {
      mockSupabaseClient.storage.upload.mockResolvedValue({
        data: null,
        error: { message: 'Storage error', status: 400 },
      });

      await expect(service.uploadFile('path', 'data')).rejects.toThrow(SupabaseProviderError);
    });
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      const filePath = 'test/file.txt';

      mockSupabaseClient.storage.remove.mockResolvedValue({
        data: [{ name: filePath }],
        error: null,
      });

      await service.deleteFile(filePath);

      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('test-bucket');
      expect(mockSupabaseClient.storage.remove).toHaveBeenCalledWith([filePath]);
    });

    it('should throw SupabaseProviderError if deletion fails', async () => {
      mockSupabaseClient.storage.remove.mockResolvedValue({
        data: null,
        error: { message: 'Delete error', status: 500 },
      });

      await expect(service.deleteFile('path')).rejects.toThrow(SupabaseProviderError);
    });
  });
});
