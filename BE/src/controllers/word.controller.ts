import { Request, Response } from 'express';
import { db } from '../db';

export const addWord = async (req: Request, res: Response)  => {
    const { word, translation, meaning, verb1, verb2, verb3 } = req.body;

    if (!word || !translation) {
        return res.status(400).json({ message: 'Word and translation are required' });
    }

    try {
        await db.query(
            `INSERT INTO words (word, translation, meaning, verb1, verb2, verb3) VALUES (?, ?, ?, ?, ?, ?)`,
            [word, translation, meaning, verb1, verb2, verb3]
        );

        res.status(201).json({ message: 'Word added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error adding word' });
    }
};

export const getWords = async (req: Request, res: Response) => {
    const search = req.query.search?.toString() || '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    try {
        const [rows] = await db.query(
            `SELECT * FROM words WHERE word LIKE ? OR translation LIKE ? LIMIT ? OFFSET ?`,
            [`%${search}%`, `%${search}%`, limit, offset]
        );

        const [countResult] = await db.query(
            `SELECT COUNT(*) as total FROM words WHERE word LIKE ? OR translation LIKE ?`,
            [`%${search}%`, `%${search}%`]
        );

        const total = (countResult as any)[0].total;

        res.json({ data: rows, total });
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving words' });
    }
};

export const updateWord = async (req: Request, res: Response) => {
    const id = req.params.id;
    const { word, translation, meaning, verb1, verb2, verb3 } = req.body;

    try {
        await db.query(
            `UPDATE words SET word = ?, translation = ?, meaning = ?, verb1 = ?, verb2 = ?, verb3 = ? WHERE id = ?`,
            [word, translation, meaning, verb1, verb2, verb3, id]
        );

        res.json({ message: 'Word updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating word' });
    }
};