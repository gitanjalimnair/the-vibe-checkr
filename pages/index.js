// pages/index.js
import { useState, useRef } from 'react';

// Function to convert the uploaded file into a Base64 string
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    // Crucial: Only get the Base64 data part after the comma
    reader.onload = () => resolve(reader.result.split(',')[1]); 
    reader.onerror = (error) => reject(error);
  });
};

export default function VibeCheckr() {
  const [moodVibe, setMoodVibe] = useState('');
  const [paletteResult, setPaletteResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPaletteResult(null);

    const imageFile = fileInputRef.current.files[0];

    if (!imageFile || !moodVibe) {
      setError("Please upload an image and enter a Vibe!");
      setLoading(false);
      return;
    }

    try {
      // 1. Convert image to Base64
      const imageBase64 = await fileToBase64(imageFile);

      // 2. Call the secure Vercel API endpoint (/api/palette)
      const response = await fetch('/api/palette', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64, moodVibe }),
      });

      if (!response.ok) {
        // If the server returns an error code (400, 500, etc.)
        const errorData = await response.json();
        throw new Error(errorData.message || 'API request failed. Check Vercel logs.');
      }

      // 3. Get the structured JSON result from the Gemini model
      const data = await response.json();
      setPaletteResult(data);

    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during Vibe Check.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>💅 The Vibe Checkr 🎨</h1>
      <p style={styles.subtitle}>Let Chromatica, your AI Stylist, generate a palette based on your mood.</p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>1. Upload your image (Selfie or Inspiration):</label>
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            disabled={loading}
            style={styles.fileInput}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>2. Enter your Mood Vibe:</label>
          <input
            type="text"
            value={moodVibe}
            onChange={(e) => setMoodVibe(e.target.value)}
            placeholder="e.g., Electric, Cozy Sunday, Cinematic Villain"
            disabled={loading}
            required
            style={styles.textInput}
          />
        </div>

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Vibe Checking...' : '✨ Generate Palette'}
        </button>
      </form>

      {error && <p style={styles.error}>Error: {error}</p>}

      {paletteResult && (
        <div style={styles.resultContainer}>
          <h2 style={styles.resultTitle}>Vibe Result: {moodVibe.toUpperCase()}</h2>
          <p style={styles.notes}>**Chromatica's Notes:** {paletteResult.Stylist_Notes}</p>
          <p style={styles.undertone}>**Detected Undertone:** {paletteResult.User_Undertone}</p>
          
          <div style={styles.paletteGrid}>
            {paletteResult.Palette_Items.map((item, index) => (
              <div key={index} style={styles.paletteItem}>
                <div 
                  style={{
                    ...styles.colorSwatch, 
                    backgroundColor: item.Hex_Code
                  }}
                ></div>
                <p style={styles.productType}>**{item.Product_Type}**</p>
                <p style={styles.colorName}>{item.Vibe_Color} ({item.Hex_Code})</p>
                <p style={styles.tip}>*Tip:* {item.Application_Tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Basic Inline Styles
const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' },
  title: { textAlign: 'center', color: '#8A2BE2' },
  subtitle: { textAlign: 'center', color: '#6A5ACD', marginBottom: '30px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid #ddd', padding: '20px', borderRadius: '8px' },
  inputGroup: { display: 'flex', flexDirection: 'column' },
  label: { fontWeight: 'bold', marginBottom: '5px', color: '#4B0082' },
  textInput: { padding: '10px', borderRadius: '4px', border: '1px solid #ccc' },
  fileInput: { padding: '10px', border: '1px solid #ccc', borderRadius: '4px' },
  button: { padding: '12px', backgroundColor: '#FF69B4', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', marginTop: '10px' },
  error: { color: 'red', textAlign: 'center', marginTop: '15px' },
  resultContainer: { marginTop: '40px', padding: '20px', border: '2px solid #FF69B4', borderRadius: '8px', backgroundColor: '#FFF0F5' },
  resultTitle: { color: '#8A2BE2', borderBottom: '2px solid #FFC0CB', paddingBottom: '10px' },
  notes: { fontStyle: 'italic', marginTop: '10px' },
  undertone: { fontWeight: 'bold' },
  paletteGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' },
  paletteItem: { textAlign: 'center', padding: '10px', border: '1px dashed #FFC0CB', borderRadius: '6px' },
  colorSwatch: { width: '100%', height: '80px', borderRadius: '4px', marginBottom: '10px', border: '1px solid #333' },
  productType: { fontWeight: 'bold', fontSize: '1.1em' },
  colorName: { color: '#4B0082', fontSize: '0.9em' },
  tip: { fontStyle: 'italic', fontSize: '0.8em', marginTop: '5px' },
};