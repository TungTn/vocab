import passport from 'passport';
import { Strategy as GoogleStrategy, StrategyOptions } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import { db } from '../db';
dotenv.config();

const options: StrategyOptions = {
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: '/api/auth/google/callback',
};

passport.use(
    <passport.Strategy>new GoogleStrategy(
        options,
        async (accessToken, refreshToken, profile, done) => {
            const email = profile.emails?.[0]?.value;
            const name = profile.displayName;

            if (!email) {
                // @ts-ignore
                return done(new Error('No email found'), null);
            }

            try {
                // Check if user exists in DB
                const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
                let user = (rows as any)[0];

                if (!user) {
                    // Insert new user
                    const [result] = await db.query(
                        'INSERT INTO users (email, name) VALUES (?, ?)',
                        [email, name]
                    );

                    user = {
                        id: (result as any).insertId,
                        email,
                        name,
                    };
                }

                return done(null, user);
            } catch (err) {
                console.error('Error inserting user:', err);
                // @ts-ignore
                return done(err as any, null);
            }
        }
    )
);