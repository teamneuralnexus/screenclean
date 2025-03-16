export default defineEventHandler(async (event) => {
    if (!event.context.user) {
        throw createError({
            message: "Unauthorized access",
            statusCode: 401
        });
    }

    try {
        const userId = event.context.user.id;

        // Get recent screenings
        const recentScreeningsResult = await pool.query(`
            SELECT 
                a.fullname as name,
                l.title as position,
                a.ai_score as score,
                a.updated_at,
                CASE
                    WHEN a.ai_score >= 80 THEN 'bg-green-500'
                    WHEN a.ai_score >= 60 THEN 'bg-yellow-500'
                    ELSE 'bg-red-500'
                END as status_color
            FROM applicants a
            JOIN listings l ON a.listing_id = l.id
            WHERE l.user_id = $1 
            AND a.status != 'pending'
            ORDER BY a.updated_at DESC
            LIMIT 4
        `, [userId]);

        // Format time ago for recent screenings
        const recentScreenings = recentScreeningsResult.rows.map(screening => ({
            ...screening,
            time: formatTimeAgo(screening.updated_at)
        }));

        // Get total processed resumes and average score
        const processedStats = await pool.query(`
            SELECT 
                COUNT(*) as total_processed,
                ROUND(AVG(ai_score)::numeric, 2) as avg_score
            FROM applicants a
            JOIN listings l ON a.listing_id = l.id
            WHERE l.user_id = $1 AND a.status != 'pending'
        `, [userId]);

        // Get qualified candidates (those with interview status)
        const qualifiedStats = await pool.query(`
            SELECT COUNT(*) as qualified_count
            FROM applicants a
            JOIN listings l ON a.listing_id = l.id
            WHERE l.user_id = $1 AND a.status = 'interview'
        `, [userId]);

        // Get pending reviews count
        const pendingStats = await pool.query(`
            SELECT COUNT(*) as pending_count
            FROM applicants a
            JOIN listings l ON a.listing_id = l.id
            WHERE l.user_id = $1 AND a.status = 'pending'
        `, [userId]);

        // Get week-over-week change in processed applications
        const weeklyChange = await pool.query(`
            WITH current_week AS (
                SELECT COUNT(*) as current_count
                FROM applicants a
                JOIN listings l ON a.listing_id = l.id
                WHERE l.user_id = $1
                AND a.created_at >= NOW() - INTERVAL '7 days'
            ),
            previous_week AS (
                SELECT COUNT(*) as previous_count
                FROM applicants a
                JOIN listings l ON a.listing_id = l.id
                WHERE l.user_id = $1
                AND a.created_at >= NOW() - INTERVAL '14 days'
                AND a.created_at < NOW() - INTERVAL '7 days'
            )
            SELECT 
                CASE 
                    WHEN previous_count = 0 THEN 100
                    ELSE ROUND(((current_count - previous_count) / previous_count::float * 100)::numeric, 1)
                END as weekly_change
            FROM current_week, previous_week
        `, [userId]);

        // Calculate success rate
        const totalProcessed = parseInt(processedStats.rows[0].total_processed);
        const qualifiedCount = parseInt(qualifiedStats.rows[0].qualified_count);
        const successRate = totalProcessed > 0 
            ? Math.round((qualifiedCount / totalProcessed) * 100) 
            : 0;

        return {
            statusCode: 200,
            stats: {
                processedCount: totalProcessed,
                qualifiedCount: qualifiedCount,
                pendingCount: parseInt(pendingStats.rows[0].pending_count),
                averageScore: parseFloat(processedStats.rows[0].avg_score || 0),
                weeklyChange: parseFloat(weeklyChange.rows[0].weekly_change || 0),
                successRate: successRate,
                recentScreenings
            }
        };
    } catch (error) {
        console.error('Error fetching statistics:', error);
        throw createError({
            message: 'Failed to fetch statistics',
            statusCode: 500,
        });
    }
});

// Helper function to format time ago
function formatTimeAgo(date) {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);
    
    if (diff < 60) return `${diff} sec ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
}
