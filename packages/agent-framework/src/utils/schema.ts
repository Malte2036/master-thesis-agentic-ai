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

      // Make required/optional status more explicit
      const status = isOptional ? '(optional)' : '(required)';
      return `"${key}": ${typeDescription} ${status}`;
    });

    // Add a note about required fields at the top of the object description
    const requiredFields = Object.entries(shape)
      .filter(([_, value]) => !(value instanceof z.ZodOptional))
      .map(([key]) => `"${key}"`)
      .join(', ');

    const requiredNote =
      requiredFields.length > 0 ? `Required fields: ${requiredFields}\n` : '';

    return `{\n  ${requiredNote}  ${entries.join(',\n  ')}\n}`;
  }
  if (schema instanceof z.ZodUnknown) {
    return 'unknown';
  }
  return schema._def.typeName;
}
