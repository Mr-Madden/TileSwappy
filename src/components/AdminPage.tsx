import React, { useState } from 'react';
import { Lock } from 'lucide-react';

// Conditionally import admin functions only in development
const isDevelopment = process.env.NODE_ENV === 'development';

// Create a placeholder for production
const adminUploadPuzzleImage = isDevelopment 
  ? require('../services/adminSupabase').adminUploadPuzzleImage 
  : async () => { throw new Error('Admin features disabled in production'); };

const adminUploadPuzzle = isDevelopment 
  ? require('../services/adminSupabase').adminUploadPuzzle 
  : async () => { throw new Error('Admin features disabled in production'); };

export const AdminPage: React.FC = () => {
  // ALL HOOKS MUST BE AT THE TOP - BEFORE ANY CONDITIONAL RETURNS
  // Password protection state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [puzzleDate, setPuzzleDate] = useState('');
  const [puzzleTitle, setPuzzleTitle] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({
    type: '',
    message: ''
  });

  // Password check handler
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = process.env.REACT_APP_ADMIN_PASSWORD;
    
    if (passwordInput === correctPassword) {
      setIsAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('❌ Incorrect password');
      setPasswordInput('');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setUploadStatus({ type: '', message: '' });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !puzzleDate || !puzzleTitle) {
      setUploadStatus({
        type: 'error',
        message: 'Please fill in all fields and select an image'
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus({ type: '', message: '' });

    try {
      // Use ADMIN functions with service role key
      const imageUrl = await adminUploadPuzzleImage(selectedFile, puzzleDate);

      await adminUploadPuzzle({
        date: puzzleDate,
        title: puzzleTitle,
        difficulty: difficulty,
        image_url: imageUrl,
        gradient: ['#FF4C4C', '#2EC4B6', '#F4F4F4'] // Default TileSwappy colors
      });

      setUploadStatus({
        type: 'success',
        message: `✅ Puzzle "${puzzleTitle}" uploaded successfully for ${puzzleDate}!`
      });

      // Reset form
      setSelectedFile(null);
      setPreviewUrl('');
      setPuzzleTitle('');
      setDifficulty('Medium');
      
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadStatus({
        type: 'error',
        message: `❌ Upload failed: ${error.message || 'Unknown error'}`
      });
    } finally {
      setIsUploading(false);
    }
  };

  // NOW we can do conditional rendering - AFTER all hooks
  // If not in development, show message
  if (!isDevelopment) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-4">
        <div className="bg-navy-light rounded-2xl p-8 max-w-md w-full shadow-2xl border-2 border-navy-dark text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-navy-dark rounded-3xl mb-4 border-2 border-coral">
            <Lock className="text-coral" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-offwhite mb-4">Admin Access Disabled</h1>
          <p className="text-teal mb-6">Admin features are only available in development mode for security reasons.</p>
          <a 
            href="/" 
            className="inline-flex items-center gap-2 text-teal hover:text-coral transition font-semibold"
          >
            ← Back to TileSwappy
          </a>
        </div>
      </div>
    );
  }

  // Show password screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-4">
        <div className="bg-navy-light rounded-2xl p-8 max-w-md w-full shadow-2xl border-2 border-navy-dark">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-navy-dark rounded-3xl mb-4 border-2 border-coral">
              <Lock className="text-coral" size={40} />
            </div>
            <h1 className="text-3xl font-bold text-offwhite mb-2">Admin Access</h1>
            <p className="text-teal">Enter password to continue</p>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 rounded-xl bg-navy border-2 border-navy-dark text-offwhite focus:border-teal outline-none mb-4"
              autoFocus
            />
            
            {passwordError && (
              <p className="text-coral text-sm mb-4 text-center">{passwordError}</p>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-coral to-teal text-white py-3 rounded-xl font-bold hover:opacity-90 transition"
            >
              Unlock Admin Panel
            </button>
          </form>

          <div className="mt-6 text-center">
            <a 
              href="/" 
              className="inline-flex items-center gap-2 text-teal hover:text-coral transition text-sm"
            >
              ← Back to TileSwappy
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Main admin interface (only shown after authentication)
  return (
    <div className="min-h-screen bg-navy p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-navy-light rounded-3xl mb-4 border-2 border-teal">
            <span className="text-4xl">📅</span>
          </div>
          <h1 className="text-4xl font-bold text-offwhite mb-2">TileSwappy Admin</h1>
          <p className="text-teal text-lg">TileSwappy Uploader</p>
        </div>

        {/* Main Upload Card */}
        <div className="bg-navy-light rounded-2xl p-8 shadow-2xl border-2 border-navy-dark">
          {/* Status Messages */}
          {uploadStatus.message && (
            <div className={`mb-6 p-4 rounded-xl border-2 ${
              uploadStatus.type === 'success' 
                ? 'bg-teal/20 border-teal text-teal' 
                : 'bg-coral/20 border-coral text-coral'
            }`}>
              <p className="font-semibold">{uploadStatus.message}</p>
            </div>
          )}

          {/* Form Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-teal text-sm font-semibold mb-2">
                  Puzzle Date *
                </label>
                <input
                  type="date"
                  value={puzzleDate}
                  onChange={(e) => setPuzzleDate(e.target.value)}
                  className="w-full px-4 py-3 bg-navy-dark text-offwhite rounded-xl border-2 border-navy focus:border-teal outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-teal text-sm font-semibold mb-2">
                  Puzzle Title *
                </label>
                <input
                  type="text"
                  value={puzzleTitle}
                  onChange={(e) => setPuzzleTitle(e.target.value)}
                  placeholder="e.g., Mountain Sunset"
                  className="w-full px-4 py-3 bg-navy-dark text-offwhite rounded-xl border-2 border-navy focus:border-teal outline-none transition placeholder-offwhite/40"
                  required
                />
              </div>

              <div>
                <label className="block text-teal text-sm font-semibold mb-2">
                  Difficulty Level *
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')}
                  className="w-full px-4 py-3 bg-navy-dark text-offwhite rounded-xl border-2 border-navy focus:border-teal outline-none transition"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-teal text-sm font-semibold mb-2">
                  Puzzle Image *
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="block w-full px-4 py-3 bg-navy-dark text-offwhite rounded-xl border-2 border-navy hover:border-teal cursor-pointer transition text-center"
                  >
                    {selectedFile ? selectedFile.name : '📁 Choose Image File'}
                  </label>
                </div>
                <p className="text-xs text-offwhite/60 mt-2">
                  Recommended: Square image, at least 1000x1000px
                </p>
              </div>
            </div>

            {/* Right Column - Preview */}
            <div>
              <label className="block text-teal text-sm font-semibold mb-2">
                Preview
              </label>
              <div className="bg-navy-dark rounded-xl p-4 border-2 border-navy aspect-square flex items-center justify-center">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-center text-offwhite/40">
                    <svg 
                      width="64" 
                      height="64" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      className="mx-auto mb-2"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <p className="text-sm">No image selected</p>
                  </div>
                )}
              </div>

              {/* Upload Info */}
              <div className="mt-4 bg-navy-dark rounded-xl p-4 border border-navy">
                <h3 className="text-offwhite font-semibold text-sm mb-2">Upload Info</h3>
                <div className="space-y-1 text-xs text-offwhite/60">
                  <p>📅 Date: {puzzleDate || 'Not set'}</p>
                  <p>🎨 Title: {puzzleTitle || 'Not set'}</p>
                  <p>⭐ Difficulty: {difficulty}</p>
                  <p>🖼️ File: {selectedFile?.name || 'No file'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Button */}
          <div className="mt-8 pt-6 border-t border-navy">
            <button
              onClick={handleUpload}
              disabled={isUploading || !selectedFile || !puzzleDate || !puzzleTitle}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition ${
                isUploading || !selectedFile || !puzzleDate || !puzzleTitle
                  ? 'bg-navy-dark text-offwhite/40 cursor-not-allowed border-2 border-navy'
                  : 'bg-gradient-to-r from-coral to-teal hover:from-coral-dark hover:to-teal-dark text-offwhite shadow-lg'
              }`}
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                '🚀 Upload Daily Puzzle'
              )}
            </button>
          </div>
        </div>

        {/* Instructions Card */}
        <div className="mt-6 bg-navy-light rounded-xl p-6 border border-navy-dark">
          <h3 className="text-offwhite font-bold text-lg mb-3 flex items-center gap-2">
            <span className="text-teal">💡</span>
            Quick Guide
          </h3>
          <ul className="space-y-2 text-sm text-offwhite/80">
            <li className="flex items-start gap-2">
              <span className="text-coral">1.</span>
              <span>Select a date for the puzzle (future dates recommended)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-coral">2.</span>
              <span>Give your puzzle a descriptive title</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-coral">3.</span>
              <span>Choose difficulty: Easy (guests), Medium/Hard (signed-in users)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-coral">4.</span>
              <span>Upload a square image (1000x1000px or larger)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-coral">5.</span>
              <span>Click upload and the puzzle will be live on the selected date!</span>
            </li>
          </ul>
        </div>

        {/* Back to App Link + Logout */}
        <div className="mt-6 text-center flex items-center justify-center gap-4">
          <a 
            href="/" 
            className="inline-flex items-center gap-2 text-teal hover:text-coral transition font-semibold"
          >
            ← Back to TileSwappy
          </a>
          <span className="text-offwhite/40">•</span>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-coral hover:text-coral-dark transition font-semibold"
          >
            🔒 Logout
          </button>
        </div>
      </div>
    </div>
  );
};