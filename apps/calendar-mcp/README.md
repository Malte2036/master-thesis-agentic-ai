# Calendar MCP

An MCP (Model Context Protocol) server for Google Calendar integration.

---

## 🔑 Environment Variables

The following environment variables must be set in your `.env` file (see `.env.example` in the project root):

| Variable                       | Required | Description                                                   |
| ------------------------------ | -------- | ------------------------------------------------------------- |
| `GOOGLE_CLIENT_ID`             | ✅       | OAuth 2.0 Client ID from Google Cloud Console                 |
| `GOOGLE_CLIENT_SECRET`         | ✅       | OAuth 2.0 Client Secret from Google Cloud Console             |
| `GOOGLE_REDIRECT_URI`          | ✅       | Redirect URI (default: `http://localhost:3004/auth/callback`) |
| `GOOGLE_PRIVATE_REFRESH_TOKEN` | ✅       | Refresh token for testing/development purposes only           |

---

## 🔧 Google OAuth Setup

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Enter a project name and click **Create**

### 2. Enable the Google Calendar API

1. In your project, go to **APIs & Services** → **Library**
2. Search for **Google Calendar API**
3. Click on it and press **Enable**

### 3. Configure the OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (or **Internal** if using Google Workspace)
3. Fill in the required fields:

- **App name**: Your application name
- **User support email**: Your email
- **Developer contact information**: Your email

4. Click **Save and Continue**
5. In the **Scopes** section, click **Add or Remove Scopes** and add:

- `https://www.googleapis.com/auth/calendar`

6. Click **Save and Continue**
7. In the **Test users** section, add your Google account email
8. Click **Save and Continue**

### 4. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application** as the application type
4. Enter a name for your OAuth client
5. Under **Authorized redirect URIs**, add:

- `http://localhost:3004/auth/callback`

6. Click **Create**
7. Copy the **Client ID** and **Client Secret** to your `.env` file

### 5. Obtain a Refresh Token

1. Start the Calendar MCP server:

```bash
pnpm dev
```

2. Navigate to the auth endpoint in your browser:

```
http://localhost:3004/auth?redirect_uri=http://localhost:3000/auth/callback
```

3. Sign in with your Google account and grant the requested permissions
4. After successful authentication, you'll receive a refresh token
5. Copy the refresh token to your `.env` file as `GOOGLE_PRIVATE_REFRESH_TOKEN`

> **Note:** If you've already authorized the app before, you may not receive a new refresh token. To force a new refresh token, go to [Google Account Security](https://myaccount.google.com/security), revoke access to your app under "Third-party apps with account access", then try the OAuth flow again.
