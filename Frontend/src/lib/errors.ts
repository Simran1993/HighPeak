import { AxiosError } from 'axios';
import type { ErrorResponse } from '@/types/api';
import { toast } from '@/stores/toastStore';

export function apiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ErrorResponse | undefined;
    if (data?.message) return data.message;
    if (error.code === 'ERR_NETWORK') return 'Cannot reach the server — is the backend running?';
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export function handleApiError(error: unknown) {
  toast.error(apiErrorMessage(error));
}
