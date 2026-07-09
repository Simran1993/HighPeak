import { api } from './client';
import type { FileMetadataResponse } from '@/types/api';

export const vaultApi = {
  list: () => api.get<FileMetadataResponse[]>('/vault').then((r) => r.data),

  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<FileMetadataResponse>('/vault', form).then((r) => r.data);
  },

  remove: (id: string) => api.delete(`/vault/${id}`),
};
