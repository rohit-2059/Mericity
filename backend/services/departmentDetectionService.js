const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || "your-api-key-here"
);

/**
 * Detects the appropriate department for a complaint using AI analysis
 * @param {string} description - The complaint description to analyze
 * @param {string} category - Optional category hint
 * @param {Object} location - Location information (city, state, etc.)
 * @returns {Promise<Object>} - Returns detected department info and confidence
 */
async function detectDepartment(description, category = "", location = {}) {
  try {
    // Check if API key is properly configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your-api-key-here" || apiKey.trim() === "") {
      console.log(
        "Gemini API key not configured, using fallback keyword detection"
      );
      return await fallbackDepartmentDetection(description, category);
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Define available departments and their responsibilities
    const departmentMap = {
      "Fire Department": [
        "fire emergencies",
        "fire safety",
        "fire hazards",
        "smoke",
        "burning",
        "fire prevention",
        "emergency rescue",
        "firefighting",
        "fire alarm",
        "fire extinguisher",
        "fire station",
        "fire truck",
        "fire safety inspection",
      ],
      "Police Department": [
        "crime",
        "theft",
        "robbery",
        "assault",
        "violence",
        "harassment",
        "traffic violations",
        "accidents",
        "law enforcement",
        "security",
        "vandalism",
        "drugs",
        "noise complaints",
        "domestic violence",
        "public safety",
        "criminal activity",
        "suspicious activity",
      ],
      "Water Department": [
        "water supply",
        "water leakage",
        "pipe burst",
        "water pressure",
        "water quality",
        "sewage",
        "drainage",
        "water contamination",
        "water shortage",
        "water billing",
        "water connection",
        "pipeline",
        "water treatment",
        "water waste",
        "flooding from pipes",
      ],
      "Road Department": [
        "road damage",
        "potholes",
        "road construction",
        "traffic signals",
        "street lights",
        "road maintenance",
        "traffic management",
        "road signs",
        "street repair",
        "pavement",
        "road safety",
        "traffic congestion",
        "road infrastructure",
        "highway issues",
      ],
      "Health Department": [
        "health hazards",
        "sanitation",
        "food safety",
        "disease outbreak",
        "public health",
        "medical emergencies",
        "health services",
        "hygiene issues",
        "contamination",
        "health inspection",
        "medical waste",
        "air quality",
        "health violations",
      ],
      "Electricity Department": [
        "power outage",
        "electrical issues",
        "power supply",
        "electricity",
        "electrical hazards",
        "power lines",
        "electrical maintenance",
        "power restoration",
        "electrical safety",
        "transformer issues",
        "electrical billing",
        "power grid",
        "electrical connection",
      ],
      "Municipal Corporation": [
        "waste management",
        "garbage collection",
        "street cleaning",
        "public facilities",
        "park maintenance",
        "municipal services",
        "civic amenities",
        "public toilets",
        "municipal taxes",
        "building permissions",
        "public spaces",
        "city planning",
      ],
    };

    // Create a comprehensive prompt for AI analysis
    const prompt = `
    You are an AI assistant that helps route citizen complaints to the appropriate government department.

    Available Departments and their typical responsibilities:
    ${Object.entries(departmentMap)
      .map(([dept, keywords]) => `${dept}: ${keywords.join(", ")}`)
      .join("\n")}

    Complaint Details:
    Description: "${description}"
    Category: "${category}"
    Location: ${location.city || "Unknown"}, ${location.state || "Unknown"}

    Based on the complaint description, determine which department should handle this issue.

    Please respond with ONLY a JSON object in this exact format:
    {
      "department": "Department Name",
      "confidence": 0.95,
      "reasoning": "Brief explanation of why this department was selected",
      "keywords_matched": ["keyword1", "keyword2"]
    }

    Rules:
    - Choose the most appropriate department from the list above
    - Confidence should be between 0.0 and 1.0
    - If unsure, default to "Municipal Corporation" with lower confidence
    - Consider the description content more than category
    - Match keywords and context, not just exact words
    `;

    // Generate response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    let aiResponse;
    try {
      // Clean the response text to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.warn("Failed to parse AI response, using fallback:", parseError);
      // Fallback analysis using simple keyword matching
      aiResponse = await fallbackDepartmentDetection(
        description,
        category,
        departmentMap
      );
    }

    // Validate and normalize the response
    if (
      !aiResponse.department ||
      !departmentMap.hasOwnProperty(aiResponse.department)
    ) {
      console.warn("Invalid department detected, using fallback");
      aiResponse = await fallbackDepartmentDetection(
        description,
        category,
        departmentMap
      );
    }

    return {
      success: true,
      department: aiResponse.department,
      confidence: aiResponse.confidence || 0.7,
      reasoning: aiResponse.reasoning || "AI-based analysis",
      keywords_matched: aiResponse.keywords_matched || [],
      analysis_method: "gemini-ai",
    };
  } catch (error) {
    console.error("AI department detection error:", error);

    // Fallback to rule-based detection if AI fails
    return await fallbackDepartmentDetection(description, category);
  }
}

/**
 * Fallback department detection using simple keyword matching
 */
async function fallbackDepartmentDetection(
  description,
  category = "",
  departmentMap = null
) {
  const departments = departmentMap || {
    "Fire Department": [
      "fire",
      "smoke",
      "burning",
      "flame",
      "emergency rescue",
    ],
    "Police Department": [
      "crime",
      "theft",
      "violence",
      "safety",
      "law",
      "police",
    ],
    "Water Department": [
      "water",
      "pipe",
      "leak",
      "drainage",
      "sewage",
      "flood",
    ],
    "Road Department": [
      "road",
      "pothole",
      "traffic",
      "street",
      "highway",
      "signal",
    ],
    "Health Department": [
      "health",
      "sanitation",
      "disease",
      "medical",
      "hygiene",
    ],
    "Electricity Department": [
      "power",
      "electric",
      "outage",
      "electricity",
      "current",
    ],
    "Municipal Corporation": [
      "waste",
      "garbage",
      "municipal",
      "civic",
      "public",
    ],
  };

  const text = (description + " " + category).toLowerCase();
  let bestMatch = { department: "Municipal Corporation", score: 0 };

  for (const [dept, keywords] of Object.entries(departments)) {
    const score = keywords.reduce((acc, keyword) => {
      return text.includes(keyword) ? acc + 1 : acc;
    }, 0);

    if (score > bestMatch.score) {
      bestMatch = { department: dept, score };
    }
  }

  return {
    success: true,
    department: bestMatch.department,
    confidence:
      bestMatch.score > 0 ? Math.min(bestMatch.score * 0.2 + 0.5, 0.9) : 0.6,
    reasoning: `Keyword-based matching (${bestMatch.score} matches)`,
    keywords_matched: [],
    analysis_method: "fallback-keywords",
  };
}

/**
 * Find departments in a specific location
 * @param {string} departmentType - Type of department needed
 * @param {Object} location - Location object with city, state, district
 * @returns {Promise<Array>} - Array of matching departments
 */
async function findDepartmentsByLocation(departmentType, location) {
  try {
    const Department = require("../models/Department");

    console.log(`Looking for ${departmentType} in location:`, location);

    // Priority 1: Exact city match
    let departments = await Department.find({
      departmentType: departmentType,
      isActive: true,
      assignedCity: { $regex: new RegExp(`^${location.city}$`, "i") },
    }).select("-password");

    if (departments.length > 0) {
      console.log(
        `Found ${departments.length} departments with exact city match`
      );
      return departments;
    }

    // Priority 2: City contains or partial match
    departments = await Department.find({
      departmentType: departmentType,
      isActive: true,
      assignedCity: { $regex: new RegExp(location.city || "", "i") },
    }).select("-password");

    if (departments.length > 0) {
      console.log(
        `Found ${departments.length} departments with city partial match`
      );
      return departments;
    }

    // Priority 3: District match
    if (location.district) {
      departments = await Department.find({
        departmentType: departmentType,
        isActive: true,
        assignedDistrict: { $regex: new RegExp(location.district, "i") },
      }).select("-password");

      if (departments.length > 0) {
        console.log(
          `Found ${departments.length} departments with district match`
        );
        return departments;
      }
    }

    // Priority 4: State match (broader search)
    departments = await Department.find({
      departmentType: departmentType,
      isActive: true,
      assignedState: { $regex: new RegExp(location.state || "", "i") },
    }).select("-password");

    if (departments.length > 0) {
      console.log(`Found ${departments.length} departments with state match`);
      return departments;
    }

    console.log(`No ${departmentType} found in any location level`);
    return departments;
  } catch (error) {
    console.error("Error finding departments by location:", error);
    return [];
  }
}

/**
 * Main function to detect and route complaint to appropriate department
 * @param {Object} complaintData - Complete complaint data
 * @returns {Promise<Object>} - Routing decision with department info
 */
async function routeComplaintToDepartment(complaintData) {
  try {
    const { description, category, location } = complaintData;

    // Validate input
    if (!description || !location) {
      console.error("Invalid complaint data provided to routing function");
      return {
        success: false,
        error: "Invalid complaint data - missing description or location",
      };
    }

    // Step 1: Detect appropriate department type using AI
    let detection;
    try {
      detection = await detectDepartment(description, category, location);
    } catch (detectionError) {
      console.error("Department detection failed:", detectionError);
      detection = await fallbackDepartmentDetection(description, category);
    }

    if (!detection.success) {
      console.warn(
        "Department detection failed, using Municipal Corporation fallback"
      );
      detection = {
        success: true,
        department: "Municipal Corporation",
        confidence: 0.5,
        reasoning: "Fallback due to detection failure",
        analysis_method: "fallback-error",
      };
    }

    // Step 2: Find specific departments in the location
    let availableDepartments = [];
    try {
      availableDepartments = await findDepartmentsByLocation(
        detection.department,
        location
      );
    } catch (locationError) {
      console.error("Error finding departments by location:", locationError);
      availableDepartments = [];
    }

    if (availableDepartments.length === 0) {
      console.warn(`No ${detection.department} found in location:`, location);

      // Try to find Municipal Corporation as fallback
      const fallbackDepartments = await findDepartmentsByLocation(
        "Municipal Corporation",
        location
      );

      return {
        success: true,
        detectedDepartment: detection.department,
        assignedDepartment: fallbackDepartments[0] || null,
        confidence: detection.confidence * 0.7, // Reduced confidence for fallback
        reasoning: `${detection.reasoning}. No ${detection.department} available in location, assigned to Municipal Corporation.`,
        analysis_method: detection.analysis_method,
        is_fallback: true,
      };
    }

    // Step 3: Return the best matching department
    // For now, return the first available department
    // This can be enhanced with additional criteria like workload, proximity, etc.
    return {
      success: true,
      detectedDepartment: detection.department,
      assignedDepartment: availableDepartments[0],
      confidence: detection.confidence,
      reasoning: detection.reasoning,
      analysis_method: detection.analysis_method,
      alternatives: availableDepartments.slice(1), // Other available departments
      is_fallback: false,
    };
  } catch (error) {
    console.error("Complaint routing error:", error);
    return {
      success: false,
      error: "Failed to route complaint",
      details: error.message,
    };
  }
}

module.exports = {
  detectDepartment,
  findDepartmentsByLocation,
  routeComplaintToDepartment,
};
