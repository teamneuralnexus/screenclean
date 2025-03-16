export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { 
        listing_uuid,
        fullName,
        email,
        phone,
        coverLetter,
        resumeUrl,
        linkedin
    } = body;

    try {
        // First get the listing_id from uuid
        const listingResult = await pool.query(
            'SELECT id FROM listings WHERE listing_uuid = $1',
            [listing_uuid]
        );

        if (listingResult.rows.length === 0) {
            throw createError({
                message: 'Listing not found',
                statusCode: 404
            });
        }

        const listing_id = listingResult.rows[0].id;
        
        // Check if user already applied to this listing
        const existingApplication = await pool.query(
            'SELECT id FROM applicants WHERE listing_id = $1 AND email = $2',
            [listing_id, email]
        );
        
        if (existingApplication.rows.length > 0) {
            return {
                success: false,
                message: 'You have already applied for this position with this email',
                statusCode: 409
            };
        }
        
        // Insert application with contact information
        const result = await pool.query(
            `INSERT INTO applicants 
            (listing_id, fullname, email, phone, linkedin, resume_url, cover_letter, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
            RETURNING id`,
            [
                listing_id,
                fullName,
                email,
                phone,
                linkedin,
                resumeUrl,
                coverLetter
            ]
        );

        return {
            success: true,
            application_id: result.rows[0].id
        };

    } catch (error) {
        console.error('Error submitting application:', error);
        
        // Handle unique constraint violation explicitly
        if (error.code === '23505' && error.constraint === 'unique_application') {
            throw createError({
                message: 'You have already applied for this position with this email',
                statusCode: 409
            });
        }
        
        throw createError({
            message: 'Failed to submit application. Please try again later.',
            statusCode: 500
        });
    }
});