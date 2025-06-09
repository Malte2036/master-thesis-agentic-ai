import OpenAI from 'openai';
// import { z } from 'zod/v4';
// import { AIProvider, AIGenerateTextOptions } from './types';
// import { Logger } from '../../logger';

// export class OpenAIProvider implements AIProvider {
//   private readonly openai: OpenAI;
//   public readonly model: string;
//   constructor(private readonly logger: Logger) {
//     const openaiApiKey = process.env['OPENAI_API_KEY'];
//     if (!openaiApiKey) {
//       throw new Error('OPENAI_API_KEY is not set');
//     }

//     this.openai = new OpenAI({
//       apiKey: openaiApiKey,
//     });
//     this.model = 'gpt-4.1-mini';
//   }

//   async generateJson<T>(
//     prompt: string,
//     options?: AIGenerateTextOptions,
//     jsonSchema?: z.ZodSchema,
//   ): Promise<T> {
//     const response = await this.openai.chat.completions.create({
//       model: this.model,
//       // model: 'gpt-4o-mini',
//       messages: [
//         ...(jsonSchema
//           ? [
//               {
//                 role: 'system' as const,
//                 content: `You are a JSON response generator.
//                 The response must be a single valid JSON object that strictly follows the provided schema.
//                 The schema of the JSON object is:
//                 ${JSON.stringify(z.toJSONSchema(jsonSchema), null, 2)}`,
//               },
//             ]
//           : []),
//         ...(options?.messages || []),
//         {
//           role: 'user' as const,
//           content: prompt,
//         },
//       ],
//       response_format: jsonSchema ? { type: 'json_object' } : undefined,
//     });

//     if (!response.choices[0].message.content) {
//       throw new Error('No response from OpenAI');
//     }

//     if (!jsonSchema) {
//       return response.choices[0].message.content as T;
//     }

//     let jsonResponse;
//     try {
//       jsonResponse = JSON.parse(response.choices[0].message.content);
//     } catch (error) {
//       this.logger.error('Failed to parse JSON response:', error);
//       throw new Error('Invalid JSON response format');
//     }

//     const parsedResponse = jsonSchema.safeParse(jsonResponse);
//     if (parsedResponse.success === false) {
//       this.logger.error(
//         'Invalid JSON response',
//         response.choices[0].message.content,
//         parsedResponse.error,
//       );
//       throw new Error('Invalid JSON response');
//     }

//     // console.log(
//     //   'Response from LLM is:\n',
//     //   JSON.stringify(parsedResponse.data, null, 2),
//     // );

//     return parsedResponse.data as T;
//   }
// }
