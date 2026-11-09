import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import './auth/passport';
import wordRoutes from './routes/word.routes';
import authRoutes from './routes/auth.routes';
import { db } from './db';

const app = express();

// ✅ Enable session middleware
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
}));

// ✅ Passport setup
app.use(passport.initialize());
app.use(passport.session());

// ✅ Allow cross-origin from multiple FE ports + cookies
app.use(cors({
    origin: [
        process.env.VUE_FRONTEND_URL!,
        process.env.REACT_FRONTEND_URL!,
        process.env.REACT_VITE_FRONTEND_URL!
    ],
    credentials: true
}));

app.use(express.json());

// ✅ Routes
app.use('/api/words', wordRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/ping', async (req, res) => {
    const [rows] = await db.query('SELECT NOW() as time');
    res.json({ time: (rows as any)[0].time });
});

export default app;