
export default defineEventHandler(async (event) => {
  try {
    const { listing_id } = await readBody(event)

    // Validate input
    if (!listing_id) {
      throw createError({
        statusCode: 400,
        message: 'Listing ID is required'
      })
    }

    // Query to get all applicants for the listing
    const result = await pool.query(
      `SELECT 
        a.id, 
        a.fullname, 
        a.email, 
        a.phone, 
        a.linkedin,
        a.resume_url,
        a.cover_letter,
        a.status,
        a.ai_score,
        a.ai_feedback,
        a.skills_match,
        a.experience_match,
        a.notes,
        a.created_at,
        a.updated_at
      FROM 
        applicants a
      WHERE 
        a.listing_id = $1
      ORDER BY 
        a.created_at DESC`,
      [listing_id]
    )

    return {
      success: true,
      applicants: result.rows,
      total: result.rowCount
    }
  } catch (error) {
    console.error('Error fetching applicants:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch applicants'
    })
  }
})