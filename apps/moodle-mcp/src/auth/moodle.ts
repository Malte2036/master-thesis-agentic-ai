import { AuthRoutes, Logger } from '@master-thesis-agentic-ai/agent-framework';
import { MoodleProvider } from '../providers/moodleProvider';

export const moodleAuthRoutes = (
  logger: Logger,
  moodleBaseUrl: string,
): AuthRoutes => ({
  authEndpoint: async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        logger.error('Missing username or password');
        res.status(400).json({ message: 'Missing username or password' });
        return;
      }

      logger.log('Authenticating with Moodle');

      const moodleProvider = new MoodleProvider(logger, moodleBaseUrl, 'auth');

      const token = await moodleProvider.getToken(username, password);

      logger.log('Successfully authenticated with Moodle');
      res.json({ token });
    } catch (error) {
      logger.error('Authentication error:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Authentication failed';

      // Check if it's a Moodle-specific error
      if (errorMessage.includes('HTTP error')) {
        res.status(401).json({
          message: 'Invalid username or password',
        });
      } else {
        res.status(500).json({
          message: 'Internal server error during authentication',
        });
      }
    }
  },

  authCallbackEndpoint: (req, res) => {
    // Not needed for Moodle, as it uses direct username/password authentication
    res.status(404).send('Not implemented');
  },
});
