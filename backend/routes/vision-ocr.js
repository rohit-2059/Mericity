const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

// Configure multer for image uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Initialize Gemini AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE');

// Function to convert image buffer to base64
function fileToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(buffer).toString("base64"),
      mimeType
    },
  };
}

// Generate civic issue description using Gemini Vision API
async function generateCivicDescriptionWithGemini(imageBuffer, mimeType, fileName) {
  try {
    console.log('🤖 Calling Gemini Vision API for image analysis...');
    
    // Get a generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create the prompt for civic issue analysis
    const prompt = `You are a civic infrastructure expert analyzing images for government complaint systems in Jharkhand, India. 

Analyze this image and provide a detailed, professional description of any civic infrastructure issues you can identify. 

Your response should:
1. Describe what you see in the image in detail
2. Identify any infrastructure problems, damage, or civic issues
3. Explain the potential impact on citizens
4. Be specific about the type of infrastructure (roads, drainage, electrical, buildings, etc.)
5. Write in a formal, complaint-appropriate tone
6. Be between 50-150 words
7. Focus only on civic infrastructure issues visible in the image

If the image shows:
- Roads: Describe condition, potholes, cracks, surface damage
- Buildings: Structural issues, damage, maintenance needs  
- Utilities: Electrical problems, water issues, drainage problems
- Public spaces: Cleanliness, maintenance, safety concerns
- Traffic: Signal issues, signage problems, road markings

Do not make assumptions about location or specific departments. Focus only on what is clearly visible in the image.

Provide your analysis as a clear, factual description suitable for a government complaint form.`;

    // Convert image to the required format
    const imagePart = fileToGenerativePart(imageBuffer, mimeType);

    // Generate content
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    console.log('✅ Gemini Vision API Success!');
    console.log('🎯 Generated description:', text.substring(0, 100) + '...');

    return {
      success: true,
      extractedText: text,
      suggestion: text.trim(),
      confidence: 'high',
      method: 'gemini-vision-ai'
    };

  } catch (error) {
    console.error('❌ Gemini Vision API Error:', error);
    throw error;
  }
}

// Main Vision OCR Route with Gemini Vision API
router.post('/api/vision-ocr', upload.single('image'), async (req, res) => {
  try {
    console.log('📸 Vision OCR request received');
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No image file provided' 
      });
    }

    console.log(`📏 Processing image: ${req.file.originalname} (${req.file.size} bytes)`);
    
    try {
      // Use Gemini Vision API for intelligent analysis
      const result = await generateCivicDescriptionWithGemini(
        req.file.buffer, 
        req.file.mimetype, 
        req.file.originalname
      );
      
      res.json(result);

    } catch (geminiError) {
      console.error('❌ Gemini Vision API Error:', geminiError.message);
      
      // Enhanced fallback with more dynamic content
      const fallbackDescriptions = [
        `Civil infrastructure issue identified in the uploaded image "${req.file.originalname}". The image appears to show structural or maintenance concerns that require attention from local authorities. Please provide additional context about the specific problem, location details, and when this issue was first noticed. Include information about how this affects daily activities or poses safety concerns for residents and visitors in the area.`,
        
        `Infrastructure maintenance requirement detected from the submitted photograph "${req.file.originalname}". Based on the visual evidence provided, there appears to be a civic issue that needs administrative review and potential remedial action. To assist with proper routing and priority assessment, please describe the exact nature of the problem, its duration, and any immediate safety or accessibility impacts on the community.`,
        
        `Public infrastructure concern identified through image analysis of "${req.file.originalname}". The photograph suggests the presence of maintenance, safety, or functionality issues that may require intervention from municipal or district authorities. Please supplement this visual evidence with detailed information about the problem's severity, affected area size, and any previous reporting or temporary measures taken to address the situation.`
      ];
      
      // Select random fallback description
      const randomDescription = fallbackDescriptions[Math.floor(Math.random() * fallbackDescriptions.length)];
      
      const fallbackResult = {
        success: true,
        extractedText: randomDescription,
        suggestion: randomDescription,
        confidence: 'low',
        method: 'fallback-analysis',
        error: 'AI vision analysis unavailable - please add manual description'
      };
      
      res.json(fallbackResult);
    }

  } catch (error) {
    console.error('❌ Route error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: 'Check server console for more details'
    });
  }
});

module.exports = router;
