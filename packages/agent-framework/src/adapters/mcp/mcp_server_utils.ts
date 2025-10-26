export const getContextIdFromMcpServerRequestHandlerExtra = (extra: {
  _meta?: unknown;
}): string => {
  const contextId = (extra._meta as { contextId: string })?.contextId;
  if (!contextId) {
    // eslint-disable-next-line no-console
    console.error('Context ID is required', JSON.stringify(extra, null, 2));
    throw new Error('Context ID is required');
  }
  return contextId;
};
