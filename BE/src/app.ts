import express from 'express';
import cors from 'cors';
import wordRoutes from './routes/word.routes';
import { db } from './db';
import session from 'express-session';
import passport from 'passport';
import './auth/passport';
import authRoutes from './routes/auth.routes';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/words', wordRoutes);

app.get('/api/ping', async (req, res) => {
    const [rows] = await db.query('SELECT NOW() as time');
    res.json({ time: (rows as any)[0].time });
});

app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authRoutes);

export default app;