import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.get('/google', (req: express.Request<{}, {}, {}, { prompt?: string; client?: string }>, res, next) => {
  const { prompt, client } = req.query;

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: prompt || undefined,
  })(req, res, next);
});

router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
    const user = req.user as any;
    const token = jwt.sign(user, process.env.JWT_SECRET!, { expiresIn: '1h' });

    const client = req.query.client;
    let redirectBase: string;

    switch (client) {
      case 'vue':
        redirectBase = process.env.VUE_FRONTEND_URL!;
        break;
      case 'react':
        redirectBase = process.env.REACT_FRONTEND_URL!;
        break;
      case 'react-vite':
        redirectBase = process.env.REACT_VITE_FRONTEND_URL!;
        break;
      default:
        redirectBase = process.env.VUE_FRONTEND_URL!;
        break;
    }

    res.redirect(`${redirectBase}/login?token=${token}`);
  }
);

export default router;