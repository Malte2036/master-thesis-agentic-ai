export const getContextIdFromMcpServerRequestHandlerExtra = (extra: {
  _meta?: unknown;
}): string => {
  const contextId = (extra._meta as { contextId: string })?.contextId;
  if (!contextId) {
    // eslint-disable-next-line no-console
    console.error('No context ID found in MCP server request handler extra');
    return 'no-context-id';
  }
  return contextId;
};
