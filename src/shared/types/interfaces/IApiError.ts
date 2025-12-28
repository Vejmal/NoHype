interface IApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type { IApiError };
