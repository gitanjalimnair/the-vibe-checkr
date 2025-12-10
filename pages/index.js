import { useState, useRef } from 'react';

// CORRECTED: Function signature fixed to resolve last error
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
            style={{ ...styles.textInput, ...styles.fileInput }} 
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
                <p style={styles.productType}>{item.Product_Type}</p>
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

// *** PROFESSIONAL INLINE STYLES ***
const styles = {
  container: { maxWidth: '900px', margin: '30px auto', padding: '30px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)', borderRadius: '15px', backgroundColor: '#FFFFFF', border: '1px solid #E0E0E0' },
  title: { textAlign: 'center', color: '#6A1B9A', borderBottom: '3px solid #E0BEEB', paddingBottom: '15px', marginBottom: '20px' },
  subtitle: { textAlign: 'center', color: '#4A148C', marginBottom: '35px', fontStyle: 'italic', fontSize: '1.1em' },
  form: { display: 'flex', flexDirection: 'column', gap: '25px', padding: '30px', borderRadius: '10px', backgroundColor: '#F9F9F9', border: '1px solid #EEE' },
  inputGroup: { display: 'flex', flexDirection: 'column' },
  label: { fontWeight: 'bold', marginBottom: '8px', color: '#4A148C', fontSize: '1.05em' },
  textInput: { padding: '12px', borderRadius: '6px', border: '1px solid #CCC', fontSize: '16px' },
  fileInput: { padding: '12px', border: '1px solid #CCC' },
  button: { 
    padding: '15px', 
    backgroundColor: '#9C27B0', // Medium Purple
    color: 'white', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontSize: '17px', 
    marginTop: '15px', 
    transition: 'background-color 0.3s' 
  },
  error: { color: '#B71C1C', textAlign: 'center', marginTop: '20px', padding: '10px', backgroundColor: '#FFEBEE', border: '1px solid #B71C1C', borderRadius: '4px' },
  resultContainer: { marginTop: '50px', padding: '30px', border: '3px solid #9C27B0', borderRadius: '15px', backgroundColor: '#F3E5F5' },
  resultTitle: { color: '#6A1B9A', borderBottom: '2px solid #9C27B0', paddingBottom: '10px', marginBottom: '20px' },
  notes: { fontStyle: 'italic', marginTop: '15px', marginBottom: '10px', lineHeight: '1.4' },
  undertone: { fontWeight: 'bold', fontSize: '1.1em', marginBottom: '25px', color: '#4A148C' },
  paletteGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '25px', marginTop: '20px' },
  paletteItem: { textAlign: 'center', padding: '15px', border: '1px solid #E0BEEB', borderRadius: '8px', backgroundColor: '#FFFFFF', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' },
  colorSwatch: { width: '100%', height: '100px', borderRadius: '6px', marginBottom: '10px', border: '1px solid #333' },
  productType: { fontWeight: 'bold', fontSize: '1.15em', color: '#4A148C' },
  colorName: { color: '#6A1B9A', fontSize: '0.95em', margin: '5px 0' },
  tip: { fontStyle: 'italic', fontSize: '0.85em', marginTop: '8px', color: '#757575' },
};
