import { AuthRoutes, Logger } from '@master-thesis-agentic-ai/agent-framework';
import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  throw new Error(
    'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI must be set',
  );
}

export const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI,
);

export const setHardcodedTokens = () => {
  const refreshToken = process.env.GOOGLE_PRIVATE_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error('GOOGLE_PRIVATE_REFRESH_TOKEN is not set');
  }

  oauth2Client.setCredentials({ refresh_token: refreshToken });
};
setHardcodedTokens();

export const googleAuthRoutes = (logger: Logger): AuthRoutes => ({
  authEndpoint: (req, res) => {
    logger.log('Redirecting to Google authentication');
    const scopes = ['https://www.googleapis.com/auth/calendar'];
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
    res.redirect(url);
  },
  authCallbackEndpoint: async (req, res) => {
    const code = req.query.code as string;
    logger.log('Received code from Google authentication');
    const { tokens } = await oauth2Client.getToken(code);
    logger.log('Tokens acquired:', tokens);
    oauth2Client.setCredentials(tokens);

    const refreshToken = tokens.refresh_token;
    if (!refreshToken) {
      const errorMessage =
        'Refresh token not found. This usually happens if the app was already authorized.';
      logger.log('Error:', errorMessage);
      logger.log('Tokens received:', JSON.stringify(tokens, null, 2));
      throw new Error(errorMessage);
    }

    logger.log('Logged in with Google. Refresh token acquired:', refreshToken);
    res.send(
      'Authentication successful! You can close this tab. <br><br>Your refresh token is: ' +
        refreshToken,
    );
  },
});
