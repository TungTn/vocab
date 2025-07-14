import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { WordForm } from '../components/WordForm';
import { getWordById } from '../services/api';

const WordEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [word, setWord] = useState<any>(null);

  useEffect(() => {
    if (id) {
      getWordById(Number(id)).then((res) => {
        setWord(res.data);
      });
    }
  }, [id]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">{id ? 'Edit Word' : 'Add New Word'}</h2>
      <WordForm selectedWord={word} onSubmitted={() => navigate('/home')} />
    </div>
  );
};

export default WordEditorPage;