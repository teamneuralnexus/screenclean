export default defineEventHandler(async (event) => {
    const { listing_uuid } = await readBody(event);

    try {
        const result = await pool.query(
            'SELECT title, description, department, employment_type, experience_level, skills FROM listings WHERE listing_uuid = $1',
            [listing_uuid]
        );

        if (result.rows.length > 0) {
            return result.rows[0];
        } else {
            throw createError({
                message: 'Listing not found',
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
