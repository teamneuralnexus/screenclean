export default defineEventHandler(async (event) => {
    if (event.context.user) {
        const userId = event.context.user.id;
        
        try {
            const result = await pool.query(
                'SELECT * FROM listings WHERE user_id = $1 ORDER BY created_at DESC',
                [userId]
            );

            return {
                statusCode: 200,
                listings: result.rows,
                message: "Success"
            }
        } catch (error) {
            console.error('Error fetching listings:', error);
            throw createError({
                message: 'Failed to fetch listings',
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