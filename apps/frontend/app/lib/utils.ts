export function getModelColor(model: string) {
  if (model.includes('mixtral')) {
    return 'bg-purple-50 border-purple-100 text-purple-700';
  } else if (model.includes('llama')) {
    return 'bg-blue-50 border-blue-100 text-blue-700';
  } else if (model.includes('gpt')) {
    return 'bg-green-50 border-green-100 text-green-700';
  } else {
    return 'bg-gray-50 border-gray-100 text-gray-700';
  }
}
