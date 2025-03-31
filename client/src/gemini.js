import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyBt2X1k_Wdgh3bV7FYLl8bK-2bYPIVO8Ao";
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

export async function getGeminiResponse(severityLevel, confidence) {
  try {
    const prompt = `You are an AI medical assistant specialized in diabetic retinopathy diagnosis. Given a severity level of "${severityLevel}" and a confidence score of ${confidence}%, generate a structured medical report with the following format:

    ### 1) **Clinical Features**
    - List key clinical observations based on the severity level.
    - Ensure bullet points with concise medical terms.
    
    ### 2) **Clinical Assessment**
    - **Risk Level:** (Low, Moderate, High)  
    - **Follow-up:** Recommended duration for the next eye examination.  
    - **Visual Acuity:** Expected impact on vision.  
    - **Progression Risk:** Percentage chance of condition worsening within a year.  
    
    ### 3) **Findings & Status**
    Present findings in a tabular format as follows:
    
    | Finding            | Description | Status (Detected / Not Detected) |
    |-------------------|-------------|-------------------------------|
    | **Microaneurysms** | Small red dots from vessel leakage. | [Detected/Not Detected] |
    | **Hemorrhages** | Large red spots from vessel bleeding. | [Detected/Not Detected] |
    | **Hard Exudates** | Yellow lipid/protein deposits. | [Detected/Not Detected] |
    | **Cotton Wool Spots** | White fluffy patches from nerve damage. | [Detected/Not Detected] |
    | **Neovascularization** | Abnormal new blood vessel growth. | [Detected/Not Detected] |
    
    ### 4) **Recommended Next Steps**
    1. Provide medical follow-up recommendations.
    2. Suggest lifestyle modifications (e.g., diet, exercise).
    3. Indicate if urgent medical intervention is needed.
    
    Ensure the response is structured exactly as above without any extra explanations or comments.`
    ;

    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    const result = await chatSession.sendMessage(prompt);
    const responseText = await result.response.text();
    return responseText;
  } catch (error) {
    console.error("Error:", error);
    return "An error occurred while processing the request.";
  }
}


