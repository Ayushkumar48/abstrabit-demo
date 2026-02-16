# Google OAuth Authentication Setup Guide

This Next.js application uses Google OAuth for authentication with server-side rendering (SSR). Follow the steps below to set up and run the application.

## 🚀 Features

- ✅ Google OAuth 2.0 authentication with PKCE
- ✅ Server-side rendering (SSR)
- ✅ Secure session management with HTTP-only cookies
- ✅ Beautiful, responsive UI with shadcn/ui
- ✅ PostgreSQL database with Drizzle ORM
- ✅ Protected routes with proxy.ts
- ✅ Automatic session renewal
- ✅ Dark mode support
- ✅ TypeScript support

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **Bun** (for package management)
- **PostgreSQL** database
- **Google Cloud Console** account

## 🔧 Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd abstrabit-demo
bun install
```

### 2. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen:
   - Add your app name, user support email, and developer contact
   - Add scopes: `email`, `profile`, `openid`
6. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Authorized JavaScript origins:
     - Development: `http://localhost:3000`
     - Production: `https://yourdomain.com`
   - Authorized redirect URIs:
     - Development: `http://localhost:3000/login/google/callback`
     - Production: `https://yourdomain.com/login/google/callback`
7. Copy your **Client ID** and **Client Secret**

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Update the `.env` file with your credentials:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/your_database

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Node Environment
NODE_ENV=development
```

### 4. Set Up the Database

Generate the database schema:

```bash
bun run db:generate
```

Run migrations:

```bash
bun run db:migrate
```

Or manually run the SQL migration file in `drizzle/` directory.

### 5. Run the Application

Start the development server:

```bash
bun run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
abstrabit-demo/
├── app/
│   ├── dashboard/          # Protected dashboard page
│   │   └── page.tsx
│   ├── login/              # Authentication routes
│   │   ├── page.tsx        # Sign-in page
│   │   └── google/
│   │       ├── route.ts    # OAuth initiation
│   │       └── callback/
│   │           └── route.ts # OAuth callback handler
│   ├── logout/
│   │   └── route.ts        # Logout handler
│   ├── layout.tsx
│   └── page.tsx            # Home page (redirects)
├── components/
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── auth.ts             # Authentication functions
│   ├── db/
│   │   ├── index.ts        # Database connection & Google OAuth config
│   │   └── schema.ts       # Database schema
│   └── utils.ts
├── proxy.ts                # Route protection (replaces middleware)
├── .env                    # Environment variables (create this)
├── .env.example            # Environment variables template
└── drizzle.config.ts       # Drizzle ORM configuration
```

## 🔐 Authentication Flow

### 1. User Clicks "Continue with Google"

```
/login → User clicks button → /login/google
```

### 2. Redirect to Google

The `/login/google` route:
- Generates a state parameter (CSRF protection)
- Generates a code verifier (PKCE)
- Stores both in HTTP-only cookies
- Redirects user to Google's authorization page

### 3. User Authorizes on Google

User signs in and grants permissions on Google's page.

### 4. Google Redirects to Callback

```
Google → /login/google/callback?code=...&state=...
```

The callback route:
- Validates the state parameter
- Exchanges the authorization code for tokens
- Decodes the ID token to get user information
- Checks if user exists in database
- Creates or retrieves user
- Creates a session
- Sets session cookie
- Redirects to dashboard

### 5. Protected Routes

The `proxy.ts` file:
- Checks for session cookie on every request
- Redirects unauthenticated users to `/login`
- Redirects authenticated users away from `/login`
- Allows access to protected routes for authenticated users

## 🗄️ Database Schema

### Users Table

```typescript
{
  id: string (primary key)
  googleId: string (unique, not null)
  name: string (not null)
  email: string (unique, not null)
  image: string (nullable)
  createdAt: timestamp (default now)
}
```

### Session Table

```typescript
{
  id: string (primary key)
  userId: string (foreign key to users.id)
  expiresAt: timestamp (not null)
}
```

## 🛡️ Security Features

### PKCE (Proof Key for Code Exchange)
- Protects against authorization code interception attacks
- Uses code verifier and code challenge

### State Parameter
- Prevents CSRF attacks
- Validated on callback

### HTTP-Only Cookies
- Session tokens stored in HTTP-only cookies
- Prevents XSS attacks
- Cannot be accessed by JavaScript

### Secure Session Management
- 30-day session expiration
- Automatic renewal within 15 days of expiration
- Session tokens hashed with SHA-256

### Route Protection
- `proxy.ts` protects all routes by default
- Explicit public routes configuration
- Automatic redirects for unauthorized access

## 🎨 UI Components

The application uses **shadcn/ui** components:

- `Button` - Interactive buttons with variants
- `Card` - Container components for content sections
- `Input` - Form input fields
- `Label` - Form labels

All components are fully customizable and support dark mode.

## 📝 API Routes

### GET `/login/google`
Initiates Google OAuth flow
- Generates state and code verifier
- Sets cookies
- Redirects to Google

### GET `/login/google/callback`
Handles OAuth callback
- Validates state
- Exchanges code for tokens
- Creates/retrieves user
- Creates session
- Redirects to dashboard

### GET `/logout`
Logs out the user
- Invalidates session
- Deletes session cookie
- Redirects to login

## 🚀 Deployment

### Environment Variables for Production

Update your production environment variables:

```env
DATABASE_URL=your_production_database_url
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NODE_ENV=production
```

### Important Notes

1. Update the redirect URI in Google Cloud Console to your production domain
2. Update the redirect URI in `lib/db/index.ts`:
   ```typescript
   isDev
     ? "http://localhost:3000/login/google/callback"
     : "https://yourdomain.com/login/google/callback"
   ```
3. Ensure your PostgreSQL database is accessible from your production environment
4. Run database migrations before deploying

### Vercel Deployment

```bash
# Install Vercel CLI
bun add -g vercel

# Deploy
vercel
```

Add environment variables in Vercel dashboard:
- Project Settings → Environment Variables
- Add all variables from `.env`

## 🧪 Testing

### Test Authentication Flow

1. Visit `http://localhost:3000`
2. Click "Continue with Google"
3. Sign in with your Google account
4. You should be redirected to the dashboard
5. Your profile information should be displayed

### Test Protected Routes

1. Open a new incognito window
2. Try to access `http://localhost:3000/dashboard`
3. You should be redirected to `/login`

### Test Logout

1. While logged in, click "Logout"
2. You should be redirected to `/login`
3. Session cookie should be deleted

## 🐛 Troubleshooting

### "Invalid redirect URI" Error

**Problem**: Google OAuth returns an error about invalid redirect URI.

**Solution**: 
1. Check that your redirect URI in Google Cloud Console matches exactly
2. Must include `http://` or `https://`
3. No trailing slashes
4. Port number must match (`:3000` for local development)

### "Invalid state parameter" Error

**Problem**: State validation fails on callback.

**Solution**:
1. Clear your cookies
2. Ensure cookies are being set properly
3. Check that `sameSite` is set to `lax`

### Database Connection Error

**Problem**: Cannot connect to PostgreSQL database.

**Solution**:
1. Verify `DATABASE_URL` is correct
2. Ensure PostgreSQL is running
3. Check database credentials
4. Verify network connectivity

### Session Not Persisting

**Problem**: User gets logged out immediately.

**Solution**:
1. Check cookie settings in browser
2. Ensure cookies are enabled
3. Verify `secure` flag is only set in production
4. Check cookie expiration time

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Arctic (OAuth Library)](https://arctic.js.org/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

## 📄 License

This project is open source and available under the MIT License.

## 💡 Tips

- Use environment variables for all sensitive data
- Never commit `.env` files to version control
- Regularly rotate your OAuth secrets
- Monitor session activity for security
- Implement rate limiting for production
- Add logging for debugging authentication issues
- Consider adding email verification for additional security

## 🤝 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review the error logs in your console
3. Verify your Google Cloud Console settings
4. Ensure all environment variables are set correctly

---
