import { z } from 'zod';
// import { RouterResponseFriendlySchema } from '@master-thesis-agentic-rag/agent-framework';
import { RouterResponseFriendlySchema } from '../../lib/agent-types';

// Re-export the schema for use in other files
export const apiResponseSchema = RouterResponseFriendlySchema;

export type ApiResponse = z.infer<typeof apiResponseSchema>;

// Validation function for API response
export function validateApiResponse(response: unknown): ApiResponse {
  return apiResponseSchema.parse(response);
}

// Safe validation function that returns null instead of throwing
export function safeValidateApiResponse(response: unknown): ApiResponse | null {
  try {
    return apiResponseSchema.parse(response);
  } catch (error) {
    console.error('Failed to validate API response:', error);
    return null;
  }
}
