import express from 'express';
import { addWord, getWords, updateWord } from '../controllers/word.controller';
import { isAuthenticated } from '../middleware/auth.middleware';

const router = express.Router();

// @ts-ignore
router.get('/', isAuthenticated, getWords);
// @ts-ignore
router.post('/', isAuthenticated, addWord);
// @ts-ignore
router.put('/:id', isAuthenticated, updateWord);

export default router;