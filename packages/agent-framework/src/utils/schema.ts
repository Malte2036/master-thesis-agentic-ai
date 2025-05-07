import { z } from 'zod';

/**
 * Generates a human-readable description of a Zod schema
 * @param schema The Zod schema to generate a description for
 * @returns A string representation of the schema
 */
export function generateSchemaDescription(schema: z.ZodTypeAny): string {
  if (schema instanceof z.ZodArray) {
    const elementType = generateSchemaDescription(schema.element);
    return `Array<${elementType}>`;
  }
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const entries = Object.entries(shape).map(([key, value]) => {
      const isOptional = value instanceof z.ZodOptional;
      const baseType = isOptional ? value.unwrap() : value;
      let typeDescription = '';

      if (baseType instanceof z.ZodString) typeDescription = 'string';
      else if (baseType instanceof z.ZodNumber) typeDescription = 'number';
      else if (baseType instanceof z.ZodBoolean) typeDescription = 'boolean';
      else if (baseType instanceof z.ZodArray) {
        const elementType = generateSchemaDescription(baseType.element);
        typeDescription = `Array<${elementType}>`;
      } else if (baseType instanceof z.ZodRecord) {
        const valueType = generateSchemaDescription(baseType._def.valueType);
        typeDescription = `Record<string, ${valueType}>`;
      } else if (baseType instanceof z.ZodObject) {
        typeDescription = generateSchemaDescription(baseType);
      } else if (baseType instanceof z.ZodUnknown) {
        typeDescription = 'unknown';
      } else {
        typeDescription = baseType._def.typeName;
      }

      return `"${key}": ${typeDescription}${isOptional ? ' (optional)' : ''}`;
    });

    return `{\n  ${entries.join(',\n  ')}\n}`;
  }
  if (schema instanceof z.ZodUnknown) {
    return 'unknown';
  }
  return schema._def.typeName;
}
