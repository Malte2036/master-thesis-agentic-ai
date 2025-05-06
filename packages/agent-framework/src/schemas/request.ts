export interface RequestPayload {
  query: Record<string, string>;
  params: Record<string, string>;
  body: unknown;
}

export interface ResponseError extends Error {
  statusCode: number;
}

export const createResponseError = (
  message: string,
  statusCode: number,
): ResponseError => {
  const error = new Error(message) as ResponseError;
  error.statusCode = statusCode;
  return error;
};
