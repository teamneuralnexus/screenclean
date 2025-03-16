export default defineEventHandler(async (event) => {
    const { listing_uuid } = await readBody(event);
    const userId = event.context.user.id;

    try {
        const result = await pool.query(
            'SELECT * FROM listings WHERE listing_uuid = $1 AND user_id = $2',
            [listing_uuid, userId]
        );

        if (result.rows.length > 0) {
            return result.rows[0];
        } else {
            throw createError({
                message: 'Listing not found or unauthorized',
                statusCode: 404,
            });
        }
    } catch (error) {
        console.error('Error fetching listing:', error);
        throw createError({
            message: 'Failed to fetch listing',
            statusCode: 500,
        });
    }
});