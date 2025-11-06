export type McpServiceName = 'calendar' | 'moodle';

const getMcpServiceUrl = (service: McpServiceName): string => {
  let url: string | undefined = undefined;
  switch (service) {
    case 'calendar':
      url = process.env.NEXT_PUBLIC_CALENDAR_MCP_URL;
      break;
    case 'moodle':
      url = process.env.NEXT_PUBLIC_MOODLE_MCP_URL;
      break;
  }
  if (!url) {
    throw new Error(`Environment variable ${service} is not set`);
  }
  return url;
};

export const getMcpServiceAuthUrl = (provider: McpServiceName): URL => {
  const url = new URL('/auth', getMcpServiceUrl(provider));

  const redirectUri = new URL(
    `${window.location.origin}/auth/callback?provider=${provider}`,
  );
  url.searchParams.set('redirect_uri', redirectUri.toString());
  return url;
};

export const authenticateMoodle = async (
  username: string,
  password: string,
): Promise<string> => {
  const moodleMcpUrl = getMcpServiceUrl('moodle');

  const response = await fetch(`${moodleMcpUrl}/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Authentication failed');
  }

  const data = await response.json();
  return data.token;
};
