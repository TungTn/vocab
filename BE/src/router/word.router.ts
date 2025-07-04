import express from 'express';
import { addWord, getWords, updateWord } from '../controllers/word.controller';

const router = express.Router();

router.post('/', addWord)
router.get('/', getWords)
router.put('/:id', updateWord)

export default router;