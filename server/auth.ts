import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing required Google OAuth credentials: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET");
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('🔍 Google OAuth callback received for user:', profile.id);
      
      // Upsert user in database
      await storage.upsertUser({
        id: profile.id,
        email: profile.emails?.[0]?.value || '',
        firstName: profile.name?.givenName || '',
        lastName: profile.name?.familyName || '',
        profileImageUrl: profile.photos?.[0]?.value || '',
      });

      const user = {
        claims: {
          sub: profile.id,
          email: profile.emails?.[0]?.value || '',
          first_name: profile.name?.givenName || '',
          last_name: profile.name?.familyName || '',
          profile_image_url: profile.photos?.[0]?.value || '',
        },
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 7 // 1 week from now
      };

      console.log('✅ User authenticated successfully:', user.claims.email);
      return done(null, user);
    } catch (error) {
      console.error('❌ Google OAuth error:', error);
      return done(error, false);
    }
  }));

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Google auth routes
  app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
      console.log('🎉 Google OAuth callback successful, redirecting to home');
      res.redirect('/');
    }
  );

  // Login route (redirects to Google)
  app.get("/api/login", (req, res) => {
    res.redirect('/auth/google');
  });

  // Logout route
  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect('/');
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;
  
  console.log('🔐 Auth check - isAuthenticated():', req.isAuthenticated());
  console.log('🔐 Auth check - user exists:', !!user);
  console.log('🔐 Auth check - user.claims.sub:', user?.claims?.sub);

  if (!req.isAuthenticated() || !user?.claims?.sub) {
    console.log('❌ Authentication failed');
    return res.status(401).json({ message: "Unauthorized" });
  }

  console.log('✅ Authentication successful for user:', user.claims.email);
  return next();
};