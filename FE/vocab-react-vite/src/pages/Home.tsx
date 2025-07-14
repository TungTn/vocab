import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WordTable } from '../components/WordTable';

const HomePage = () => {
  const navigate = useNavigate();
  const [reloadKey, setReloadKey] = useState(0);

  const handleEdit = (word: any) => {
    navigate(`/edit/${word.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Word List</h2>
        <button onClick={() => navigate('/edit')} className="bg-green-600 text-white px-3 py-1 rounded">
          Add Word
        </button>
      </div>
      <WordTable key={reloadKey} onEdit={handleEdit} />
    </div>
  );
};

export default HomePage;