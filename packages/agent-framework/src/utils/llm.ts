export const stripThoughts = (text: string) => {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '');
};

export const stripEvidenceJson = (text: string) => {
  return text.replace(/```evidence-json\n[\s\S]*?```/g, '');
};
