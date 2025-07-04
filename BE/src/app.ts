import express from 'express';
import cors from 'cors';
import wordRoutes from './routes/word.routes';
import { db } from './db';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/words', wordRoutes);

app.get('/api/ping', async (req, res) => {
    const [rows] = await db.query('SELECT NOW() as time');
    res.json({ time: (rows as any)[0].time });
});

export default app;