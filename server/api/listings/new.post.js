export default defineEventHandler(async (event) => {
    if (event.context.user) {
        const userId = event.context.user.id;
        const {title, department, description, skills, experienceLevel, employmentType, customInstructions} = await readBody(event)

        try {
            const result = await pool.query(
                'INSERT INTO listings (title, department, description, skills, experience_level, employment_type, custom_instructions, user_id) VALUES ($1, $2, $3, $4::text[], $5, $6, $7, $8) RETURNING listing_uuid',
                [title, department, description, skills, experienceLevel, employmentType, customInstructions, userId]
            );

            return {
                statusCode: 200,
                listing_uuid: result.rows[0].listing_uuid,
                message: "Inserted"
            }
        } catch (error) {
            console.error('Error inserting listing:', error);
            throw createError({
                message: 'Failed to create listing',
                statusCode: 500,
            });
        }
    }
    else {
        throw createError({
            message: "Unauthorised Access not allowed",
            statusCode: 401
        });
    }
});