import { Upload } from 'lucide-react';
import React, { useState } from 'react';
import { generatePuzzleBatch } from '../services/BatchPuzzleGenerationService';
import { validateBatch } from '../services/PuzzleValidationService';

interface PuzzleUpload {
  date: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  image: File | null;
}

export const PuzzleUploader: React.FC = () => {
  const [generatedPuzzles, setGeneratedPuzzles] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleUpload>({
    date: '',
    title: '',
    difficulty: 'Easy',
    image: null
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCurrentPuzzle({ ...currentPuzzle, image: e.target.files[0] });
    }
  };

  const addPuzzle = () => {
    if (currentPuzzle.date && currentPuzzle.title && currentPuzzle.image) {
      setPuzzles([...puzzles, currentPuzzle]);
      setCurrentPuzzle({
        date: '',
        title: '',
        difficulty: 'Easy',
        image: null
      });
    }
  };

  const generateBatch = async () => {
  if (!currentPuzzle.image) {
    alert('Select an image first');
    return;
  }

  setIsGenerating(true);

  try {
    const generated =
      await generatePuzzleBatch(
        URL.createObjectURL(currentPuzzle.image),
        50
      );

    const valid =
      validateBatch(generated);

    setGeneratedPuzzles(valid);

    alert(
      `${valid.length} valid puzzles generated`
    );
  } catch (err) {
    console.error(err);

    alert('Generation failed');
  }

  setIsGenerating(false);
};

  const uploadPuzzles = async () => {
    // This will upload to your backend
    const formData = new FormData();
    puzzles.forEach((puzzle, index) => {
      formData.append(`puzzle-${index}`, JSON.stringify({
        date: puzzle.date,
        title: puzzle.title,
        difficulty: puzzle.difficulty
      }));
      if (puzzle.image) {
        formData.append(`image-${index}`, puzzle.image);
      }
    });

    try {
      const response = await fetch('/api/upload-puzzles', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        alert('Puzzles uploaded successfully!');
        setPuzzles([]);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Upload Monthly Puzzles</h1>
        
        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add Puzzle</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={currentPuzzle.date}
                onChange={(e) => setCurrentPuzzle({ ...currentPuzzle, date: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={currentPuzzle.title}
                onChange={(e) => setCurrentPuzzle({ ...currentPuzzle, title: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="Ocean Waves"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Difficulty</label>
            <select
              value={currentPuzzle.difficulty}
              onChange={(e) => setCurrentPuzzle({ ...currentPuzzle, difficulty: e.target.value as any })}
              className="w-full border rounded px-3 py-2">
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="w-full"
            />
            {currentPuzzle.image && (
              <p className="text-sm text-green-600 mt-2">âœ“ {currentPuzzle.image.name}</p>
            )}
          </div>
          <div className="flex gap-4">
            
            <button
              onClick={addPuzzle}
              className="bg-blue-600 text-white px-6 py-2 rounded">
              Add to List
            </button>
            
            <button
              onClick={generateBatch}
              disabled={isGenerating}
              className="bg-teal text-white px-6 py-2 rounded">
              {isGenerating?'Generating...': 'Generate 50 Variants'}
            </button>
          </div>

          {
generatedPuzzles.length > 0 && (

<div className="bg-white rounded-lg shadow-lg p-6 mb-6">

<h2 className="text-xl font-semibold mb-4">

Generated Preview
({generatedPuzzles.length})

</h2>

<div className="grid grid-cols-4 gap-4">

{
generatedPuzzles.map(
(p,index)=>(

<div
key={index}
className="border rounded p-3"
>

<div className="font-semibold">

Puzzle
{index+1}

</div>

<div>

Difficulty:
{
p.difficulty
}

</div>

<div>

Tiles:
{
p.tiles?.length
}

</div>

</div>

))
}

</div>

</div>

)
}
        {/* Puzzle List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Puzzles to Upload ({puzzles.length})</h2>
          
          {puzzles.length === 0 ? (
            <p className="text-gray-500">No puzzles added yet</p>
          ) : (
            <div className="space-y-3">
              {puzzles.map((puzzle, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <div className="font-semibold">{puzzle.date} - {puzzle.title}</div>
                    <div className="text-sm text-gray-600">
                      {puzzle.difficulty} â€¢ {puzzle.image?.name}
                    </div>
                  </div>
                  <button
                    onClick={() => setPuzzles(puzzles.filter((_, i) => i !== index))}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {puzzles.length > 0 && (
            <button
              onClick={uploadPuzzles}
              className="mt-6 w-full bg-teal text-white px-6 py-3 rounded hover:bg-coral font-semibold"
            >
              <Upload className="inline mr-2" size={20} />
              Upload All {puzzles.length} Puzzles
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

