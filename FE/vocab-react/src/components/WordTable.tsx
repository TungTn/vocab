import React, { useEffect, useState } from 'react';
import { fetchWords } from '../services/api';

type Props = {
  onEdit: (word: any) => void;
};

export const WordTable: React.FC<Props> = ({ onEdit }) => {
  const [words, setWords] = useState<any[]>([]);

  useEffect(() => {
    fetchWords().then((res) => setWords(res.data.data));
  }, []);

  return (
    <table className="w-full border">
      <thead>
      <tr>
        <th className="border px-2 py-1">Word</th>
        <th className="border px-2 py-1">Translation</th>
        <th className="border px-2 py-1">Meaning</th>
        <th className="border px-2 py-1">Actions</th>
      </tr>
      </thead>
      <tbody>
      {words.map((w) => (
        <tr key={w.id}>
          <td className="border px-2 py-1">{w.word}</td>
          <td className="border px-2 py-1">{w.translation}</td>
          <td className="border px-2 py-1">{w.meaning}</td>
          <td className="border px-2 py-1">
            <button
              onClick={() => onEdit(w)}
              className="text-blue-500 underline"
            >
              Edit
            </button>
          </td>
        </tr>
      ))}
      </tbody>
    </table>
  );
};