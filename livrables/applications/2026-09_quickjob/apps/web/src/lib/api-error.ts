export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as ErrorBody;
    const messages = Array.isArray(body.message) ? body.message : [body.message];
    return new ApiError(response.status, messages[0] ?? response.statusText, messages);
  } catch {
    return new ApiError(response.status, response.statusText);
  }
}
