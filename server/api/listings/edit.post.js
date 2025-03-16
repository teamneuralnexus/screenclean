export default defineEventHandler(async (event) => {
    if (event.context.user) {
        const userId = event.context.user.id;
        const {listing_uuid, title, department, description, skills, experienceLevel, employmentType, customInstructions} = await readBody(event);

        try {
            // First verify that the listing belongs to the user
            const checkOwnership = await pool.query(
                'SELECT user_id FROM listings WHERE listing_uuid = $1',
                [listing_uuid]
            );

            if (checkOwnership.rows.length === 0) {
                throw createError({
                    message: 'Listing not found',
                    statusCode: 404,
                });
            }

            if (checkOwnership.rows[0].user_id !== userId) {
                throw createError({
                    message: 'Unauthorized to edit this listing',
                    statusCode: 403,
                });
            }

            // Update the listing
            await pool.query(
                `UPDATE listings 
                 SET title = $1, 
                     department = $2, 
                     description = $3, 
                     skills = $4, 
                     experience_level = $5, 
                     employment_type = $6, 
                     custom_instructions = $7
                                      WHERE listing_uuid = $8`,
                [title, department, description, skills, experienceLevel, employmentType, customInstructions, listing_uuid]
            );

            return {
                statusCode: 200,
                message: "Listing updated successfully"
            }
        } catch (error) {
            console.error('Error updating listing:', error);
            throw createError({
                message: error.message || 'Failed to update listing',
                statusCode: error.statusCode || 500,
            });
        }
    } else {
        throw createError({
            message: "Unauthorized access not allowed",
            statusCode: 401
        });
    }
});