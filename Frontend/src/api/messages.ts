import { api } from './client';
import type { FileMetadataResponse, MessageResponse } from '@/types/api';

export const messagesApi = {
  list: (tripId: string) =>
    api.get<MessageResponse[]>(`/trips/${tripId}/messages`).then((r) => r.data),

  send: (tripId: string, body: { content?: string; attachmentId?: string }) =>
    api.post<MessageResponse>(`/trips/${tripId}/messages`, body).then((r) => r.data),

  uploadAttachment: (tripId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post<FileMetadataResponse>(`/trips/${tripId}/messages/attachments`, form)
      .then((r) => r.data);
  },
};

/** Fetch any stored file as a blob (auth header goes through the interceptor). */
export const filesApi = {
  download: (fileId: string) =>
    api.get<Blob>(`/files/${fileId}`, { responseType: 'blob' }).then((r) => r.data),
};
