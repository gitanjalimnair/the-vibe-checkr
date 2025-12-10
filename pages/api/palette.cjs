// NOTE: Using 'require' syntax because the file extension is .cjs

const { GoogleGenAI } = require('@google/genai');

// Initialize the Gemini client using the environment variable
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

// Define the GOLDEN PROMPT content
const GOLDEN_PROMPT = `
You are Chromatica, the world's most innovative AI stylist specializing in creating bespoke makeup palettes. Your task is to analyze the user's uploaded image (for skin tone, lighting, and style) and the user's desired 'Vibe' keyword to generate a cohesive makeup palette.

RULES:
1. Multimodal Analysis: Use the image to determine the user's underlying skin undertone (warm, cool, or neutral).
2. Persona: The output MUST be in the voice of a confident, high-end stylist.
3. Structured Output: The final result MUST be a valid JSON object matching the requested schema. Do not include any text outside of the JSON block.

SCHEMA REQUESTED:
{
  "Stylist_Notes": "A creative summary explaining the palette choice.",
  "User_Undertone": "The detected skin undertone (Warm, Cool, or Neutral).",
  "Palette_Items": [
    {
      "Product_Type": "Foundation, Blush, Lipstick, Eyeshadow, or Highlight",
      "Vibe_Color": "A creative name for the color.",
      "Hex_Code": "#FFFFFF",
      "Application_Tip": "A professional application tip for this product."
    },
    // ... total of 3 to 5 items ...
  ]
}
`;

// Use module.exports for .cjs file extension
module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { imageBase64, moodVibe } = req.body;

        if (!imageBase64 || !moodVibe) {
            return res.status(400).json({ message: 'Missing image or mood vibe.' });
        }
        
        // 1. Structure the prompt parts correctly for multimodal input
        const promptParts = [
            { text: GOLDEN_PROMPT + `\n\nUser Vibe/Mood: ${moodVibe}` },
            { 
                inlineData: {
                    data: imageBase64,
                    // Sending the image data as a PNG or JPEG MIME type is critical
                    mimeType: 'image/jpeg' 
                }
            },
        ];

        // 2. Call the Gemini Model
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', 
            contents: promptParts,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        Stylist_Notes: { type: "string", description: "A creative summary." },
                        User_Undertone: { type: "string", description: "The detected skin undertone." },
                        Palette_Items: { 
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    Product_Type: { type: "string" },
                                    Vibe_Color: { type: "string" },
                                    Hex_Code: { type: "string" },
                                    Application_Tip: { type: "string" }
                                },
                                required: ["Product_Type", "Vibe_Color", "Hex_Code", "Application_Tip"]
                            }
                        }
                    },
                    required: ["Stylist_Notes", "User_Undertone", "Palette_Items"]
                }
            }
        });

        // 3. Parse the result and send it back to the frontend
        const jsonText = response.text.trim();
        const palette = JSON.parse(jsonText);

        res.status(200).json(palette);

    } catch (error) {
        // Log the error and return a clean, descriptive message
        console.error('Gemini API Error:', error.message);
        // This is the message the user will see on the site
        res.status(500).json({ 
            message: `AI Generation Failed. Please check Vercel logs for API key errors, or try a smaller image (under 4MB). Error: ${error.message}`
        });
    }
};
