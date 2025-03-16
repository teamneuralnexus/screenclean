import { getTextExtractor } from 'office-text-extractor'
import OpenAI from "openai"

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { resumeUrl, jobDescription, jobTitle, skills } = body

    if (!resumeUrl) {
      return {
        success: false,
        message: 'Resume URL is required'
      }
    }

    if (!jobDescription) {
      return {
        success: false,
        message: 'Job description is required'
      }
    }

    // Extract text from resume
    const resumeText = await extractTextFromResume(resumeUrl)

    // Get AI analysis
    const analysis = await getResumeAnalysis(resumeText, jobTitle, jobDescription, skills)

    return {
      success: true,
      analysis
    }
  } catch (error) {
    console.error('Resume check error:', error)
    return {
      success: false,
      message: error.message || 'Failed to check resume compatibility'
    }
  }
})

async function extractTextFromResume(resumeUrl) {
  try {
    const extractor = getTextExtractor()
    const text = await extractor.extractText({ input: resumeUrl, type: 'url' })
    return text || "No text could be extracted from resume"
  } catch (error) {
    console.error("Error extracting text from resume:", error)
    return "Error extracting resume content"
  }
}

async function getResumeAnalysis(resumeText, jobTitle, jobDescription, skills) {
  const config = useRuntimeConfig()

  // Initialize OpenAI client with Gemini API configuration
  const openai = new OpenAI({
    apiKey: config.gemini,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
  })

  const prompt = `
    Please provide a quick assessment of how well this resume matches the job position.
    
    JOB TITLE: ${jobTitle}
    
    JOB DESCRIPTION:
    ${jobDescription}
    
    REQUIRED SKILLS:
    ${Array.isArray(skills) ? skills.join(', ') : skills}
    
    CANDIDATE RESUME:
    ${resumeText}
    
    Please provide:
    1. A brief match assessment (3 sentences maximum)
    2. A match score between 0-100
    3. A simple recommendation (Good fit, Consider applying, Not recommended)
    
    Format your response as a JSON object with the following structure:
    {
      "assessment": string,
      "matchScore": number,
      "recommendation": string
    }
  `

  try {
    const response = await openai.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "system",
          content: "You are a helpful job application assistant that provides brief and honest assessments about resume compatibility with job listings."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    })

    const aiResponse = response.choices[0].message.content
    return parseAIResponse(aiResponse)
  } catch (error) {
    console.error("Error calling AI service:", error)
    throw new Error("Failed to analyze resume compatibility")
  }
}

function parseAIResponse(aiResponse) {
  try {
    // Extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    const jsonString = jsonMatch ? jsonMatch[0] : null

    if (!jsonString) {
      throw new Error("No valid JSON found in AI response")
    }

    const parsed = JSON.parse(jsonString)

    return {
      assessment: parsed.assessment || "Unable to provide an assessment",
      matchScore: parsed.matchScore || 0,
      recommendation: parsed.recommendation || "Not recommended"
    }
  } catch (error) {
    console.error("Error parsing AI response:", error)
    return {
      assessment: "Unable to analyze resume compatibility",
      matchScore: 0,
      recommendation: "Not recommended"
    }
  }
}
