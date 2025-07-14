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

      // Use ?client=react or ?client=vue in the initial request
      const client = req.query.client;
      const redirectBase =
        client === 'vue'
          ? 'http://localhost:5173'
          : 'http://localhost:3001';

      res.redirect(`${redirectBase}/login?token=${token}`);
  }
);

export default router;