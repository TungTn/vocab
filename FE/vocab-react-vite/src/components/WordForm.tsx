import React, { useEffect, useState } from 'react';
import { addWord, updateWord } from '../services/api';

type Props = {
  selectedWord: any;
  onSubmitted: () => void;
};

export const WordForm: React.FC<Props> = ({ selectedWord, onSubmitted }) => {
  const [form, setForm] = useState({
    word: '',
    translation: '',
    meaning: '',
    verb1: '',
    verb2: '',
    verb3: '',
  });

  useEffect(() => {
    if (selectedWord) setForm(selectedWord);
  }, [selectedWord]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (selectedWord) {
      await updateWord(selectedWord.id, form);
    } else {
      await addWord(form);
    }
    onSubmitted();
  };

  return (
    <div className="space-y-3">
      {Object.entries(form).map(([key, value]) => (
        <input
          key={key}
          name={key}
          value={value}
          onChange={handleChange}
          placeholder={key}
          className="border px-3 py-2 w-full"
        />
      ))}
      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {selectedWord ? 'Update' : 'Add'}
      </button>
    </div>
  );
};