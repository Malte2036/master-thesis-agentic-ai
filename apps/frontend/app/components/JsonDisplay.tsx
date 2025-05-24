type JsonValue = string | number | boolean | null | JsonObject;
interface JsonObject {
  [key: string]: JsonValue;
}

interface JsonDisplayProps {
  data: {
    [key: string]: unknown;
  };
}

export function JsonDisplay({ data }: JsonDisplayProps) {
  return (
    <div className="text-xs">
      {'{'}
      {Object.entries(data).map(([key, value], index, array) => (
        <div key={key} className="ml-4">
          <span className="text-blue-600">{`"${key}"`}</span>
          <span className="text-gray-600">: </span>
          <span className="text-gray-800">
            {typeof value === 'object' && value !== null
              ? JSON.stringify(value, null, 2)
              : typeof value === 'string'
                ? `"${value}"`
                : String(value)}
          </span>
          {index < array.length - 1 && <span className="text-gray-600">,</span>}
        </div>
      ))}
      {'}'}
    </div>
  );
}
