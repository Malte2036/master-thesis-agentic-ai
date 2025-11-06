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
    const redirectUri = req.query.redirect_uri as string;

    if (!redirectUri) {
      logger.error('Missing redirect_uri parameter');
      res.status(400).send('Missing redirect_uri parameter');
      return;
    }

    logger.log('Redirecting to Google authentication');
    logger.log('Frontend redirect_uri:', redirectUri);

    const scopes = ['https://www.googleapis.com/auth/calendar'];

    // Encode the redirect_uri in the state parameter so we can retrieve it after OAuth
    const state = Buffer.from(
      JSON.stringify({ redirect_uri: redirectUri }),
    ).toString('base64');

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: state,
    });
    res.redirect(url);
  },

  authCallbackEndpoint: async (req, res) => {
    const code = req.query.code as string;
    const state = req.query.state as string;

    logger.log('Received code from Google authentication');

    // Decode the state to get the original redirect_uri
    let redirectUri: string | undefined;
    try {
      const decodedState = JSON.parse(
        Buffer.from(state, 'base64').toString('utf-8'),
      );
      redirectUri = decodedState.redirect_uri;
    } catch (error) {
      logger.error('Failed to decode state parameter:', error);
    }

    const { tokens } = await oauth2Client.getToken(code);
    logger.log('Tokens acquired:', tokens);
    oauth2Client.setCredentials(tokens);

    const refreshToken = tokens.refresh_token;
    if (!refreshToken) {
      const errorMessage =
        'Refresh token not found. This usually happens if the app was already authorized.';
      logger.log('Error:', errorMessage);
      logger.log('Tokens received:', JSON.stringify(tokens, null, 2));

      // Redirect back to frontend with error if redirect_uri is available
      if (redirectUri) {
        const errorUrl = new URL(redirectUri);
        errorUrl.searchParams.set('error', 'no_refresh_token');
        errorUrl.searchParams.set('message', errorMessage);
        res.redirect(errorUrl.toString());
        return;
      }

      throw new Error(errorMessage);
    }

    logger.log('Logged in with Google. Refresh token acquired:', refreshToken);

    // Redirect back to frontend with success status and refresh token
    if (redirectUri) {
      const successUrl = new URL(redirectUri);
      successUrl.searchParams.set('status', 'success');
      successUrl.searchParams.set('refresh_token', refreshToken);
      res.redirect(successUrl.toString());
    } else {
      // Fallback to old behavior if no redirect_uri
      res.send(
        'Authentication successful! You can close this tab. <br><br>Your refresh token is: ' +
          refreshToken,
      );
    }
  },
});
