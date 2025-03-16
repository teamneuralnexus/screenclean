import { defineCronHandler } from '#nuxt/cron'
import { getTextExtractor } from 'office-text-extractor'
import OpenAI from "openai"

export default defineCronHandler('everyMinute', async () => {
    console.log('🤖 Starting AI resume screening process...')
    const config = useRuntimeConfig()

    // Initialize OpenAI client with Gemini API configuration
    const openai = new OpenAI({
        apiKey: config.gemini,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
    })

    try {
        // Get all pending applications that need processing
        const pendingResult = await pool.query(`
      SELECT 
        a.id, 
        a.fullname,
        a.email, 
        a.resume_url,
        a.cover_letter,
        a.listing_id,
        l.title as job_title,
        l.description as job_description,
        l.skills as job_skills,
        l.custom_instructions,
        l.experience_level,
        l.employment_type,
        l.department
      FROM 
        applicants a
      JOIN 
        listings l ON a.listing_id = l.id
      WHERE 
        a.status = 'pending'
      LIMIT 10
    `)

        const pendingApplicants = pendingResult.rows
        console.log(`Found ${pendingApplicants.length} pending applications to process`)

        // Process each pending application
        for (const applicant of pendingApplicants) {
            // Update status to review to prevent duplicate processing
            await pool.query(
                `UPDATE applicants SET status = 'review', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                [applicant.id]
            )

            console.log(`Processing application #${applicant.id} from ${applicant.fullname} for ${applicant.job_title}`)

            try {
                // PROCESSING STEPS
                // ================

                // 1. Extract resume data from URL
                const resumeText = await extractTextFromResume(applicant.resume_url)

                // 2. Prepare AI prompt with job description, required skills, and custom instructions
                const prompt = `
          Please evaluate this candidate for the ${applicant.job_title} position.
          
          JOB DESCRIPTION:
          ${applicant.job_description}
          
          REQUIRED SKILLS:
          ${Array.isArray(applicant.job_skills)
                        ? applicant.job_skills.join(', ')
                        : applicant.job_skills}
          
          EXPERIENCE LEVEL:
          ${applicant.experience_level}
          
          ${applicant.custom_instructions ? `ADDITIONAL SCREENING CRITERIA:\n${applicant.custom_instructions}` : ''}

          CANDIDATE RESUME:
          ${resumeText}
          
          ${applicant.cover_letter ? `COVER LETTER:\n${applicant.cover_letter}` : ''}

          Please provide:
          1. An overall match score between 0-100
          2. List of matching skills found in resume
          3. Brief analysis of candidate's experience
          4. Recommendation (reject, consider, strong match)
          
          Format your response as a JSON object with the following structure:
          {
            "score": number,
            "matchingSkills": string[],
            "experienceAnalysis": string,
            "recommendation": string
          }
        `

                // 3. Call AI service to analyze resume
                const aiResponse = await callAIService(openai, prompt)

                // 4. Parse AI response
                const {
                    score,
                    matchingSkills,
                    experienceAnalysis,
                    recommendation
                } = parseAIResponse(aiResponse)

                // Determine final status based on score only
                let finalStatus
                if (score > 70) {
                    finalStatus = 'interview'
                } else if (score >= 50) {
                    finalStatus = 'review'
                } else {
                    finalStatus = 'rejected'
                }

                // 5. Update database with AI results
                await pool.query(`
          UPDATE applicants 
          SET 
            status = $1,
            ai_score = $2,
            skills_match = $3,
            experience_match = $4,
            ai_feedback = $5,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $6
        `, [
                    finalStatus,
                    score,
                    matchingSkills,
                    experienceAnalysis,
                    `AI Recommendation: ${recommendation.toUpperCase()}. Score: ${score}/100.`,
                    applicant.id
                ])

                console.log(`✅ Processed application #${applicant.id} - Score: ${score}, Status: ${finalStatus}`)

            } catch (processingError) {
                console.error(`Error processing application #${applicant.id}:`, processingError)

                // Update status to indicate processing error
                await pool.query(
                    `UPDATE applicants SET status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                    [applicant.id]
                )
            }
        }

        console.log('🎉 Completed AI resume screening process')
    } catch (error) {
        console.error('Error in resume screening cron job:', error)
    }
}, {
    runOnInit: true
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

async function callAIService(openaiClient, prompt) {
    try {
        const response = await openaiClient.chat.completions.create({
            model: "gemini-2.0-flash",
            messages: [
                {
                    role: "system",
                    content: "You are an AI resume screening assistant. Evaluate candidates based on job requirements and provide structured feedback."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
        })

        return response.choices[0].message.content
    } catch (error) {
        console.error("Error calling AI service:", error)
        throw new Error("Failed to get AI analysis")
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
            score: parsed.score || 0,
            matchingSkills: parsed.matchingSkills || [],
            experienceAnalysis: parsed.experienceAnalysis || "No analysis provided",
            recommendation: parsed.recommendation || "reject"
        }
    } catch (error) {
        console.error("Error parsing AI response:", error, "Response:", aiResponse)
        // Return default values if parsing fails
        return {
            score: 0,
            matchingSkills: [],
            experienceAnalysis: "Failed to analyze resume",
            recommendation: "reject"
        }
    }
}