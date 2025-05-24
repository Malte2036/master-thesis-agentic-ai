export interface ModelOption {
  value: string;
  label: string;
  size: string;
  color: {
    bg: string;
    border: string;
    text: string;
  };
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    value: 'deepseek-v2:latest',
    label: 'DeepSeek V2',
    size: '8.9 GB',
    color: {
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      text: 'text-blue-700',
    },
  },
  {
    value: 'yi:34b',
    label: 'Yi 34B',
    size: '19 GB',
    color: {
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      text: 'text-purple-700',
    },
  },
  {
    value: 'llama3.1:8b',
    label: 'Llama 3.1 8B',
    size: '4.9 GB',
    color: {
      bg: 'bg-green-50',
      border: 'border-green-100',
      text: 'text-green-700',
    },
  },
  {
    value: 'llama3:8b',
    label: 'Llama 3 8B',
    size: '4.7 GB',
    color: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      text: 'text-indigo-700',
    },
  },
  {
    value: 'mixtral:8x7b',
    label: 'Mixtral 8x7B',
    size: '26 GB',
    color: {
      bg: 'bg-red-50',
      border: 'border-red-100',
      text: 'text-red-700',
    },
  },
  {
    value: 'mistral:instruct',
    label: 'Mistral Instruct',
    size: '4.1 GB',
    color: {
      bg: 'bg-orange-50',
      border: 'border-orange-100',
      text: 'text-orange-700',
    },
  },
];

export const getModelColor = (modelValue: string) => {
  const model = AVAILABLE_MODELS.find((m) => m.value === modelValue);
  return (
    model?.color || {
      bg: 'bg-gray-50',
      border: 'border-gray-100',
      text: 'text-gray-700',
    }
  );
};
