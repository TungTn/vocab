import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.get('/google', (req, res, next) => {
    const prompt = req.query.prompt as string;
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: prompt || undefined, // 👈 pass prompt if provided
    })(req, res, next);
});

router.get(
    '/google/callback',
    passport.authenticate('google', { session: false }),
    (req, res) => {
        const user = req.user as any;
        const token = jwt.sign(user, process.env.JWT_SECRET!, { expiresIn: '1h' });

        // Send token to frontend (temporary: use redirect with token)
        res.redirect(`http://localhost:5173?token=${token}`);
    }
);

export default router;