const buildSearchQuery = (filters) => {
    const {
        query,
        minPrice,
        maxPrice,
        bedrooms,
        bathrooms,
        propertyType,
        amenities,
        city,
        state,
        sortBy,
        sortOrder,
        radius,
        lat,
        lng
    } = filters;

    let params = [];
    let conditions = ['active = true'];
    let orderClause = '';

    // Full-text search on title and description
    if (query) {
        params.push(`%${query}%`, `%${query}%`);
        conditions.push(`(
            title ILIKE $${params.length - 1} OR 
            description ILIKE $${params.length}
        )`);
    }

    // Price range
    if (minPrice) {
        params.push(minPrice);
        conditions.push(`price >= $${params.length}`);
    }
    if (maxPrice) {
        params.push(maxPrice);
        conditions.push(`price <= $${params.length}`);
    }

    // Bedrooms and bathrooms
    if (bedrooms) {
        params.push(bedrooms);
        conditions.push(`bedrooms >= $${params.length}`);
    }
    if (bathrooms) {
        params.push(bathrooms);
        conditions.push(`bathrooms >= $${params.length}`);
    }

    // Property type
    if (propertyType) {
        params.push(propertyType);
        conditions.push(`property_type = $${params.length}`);
    }

    // Location search
    if (city) {
        params.push(`%${city}%`);
        conditions.push(`city ILIKE $${params.length}`);
    }
    if (state) {
        params.push(`%${state}%`);
        conditions.push(`state ILIKE $${params.length}`);
    }

    // Radius search if coordinates provided
    if (lat && lng && radius) {
        conditions.push(`
            ST_DWithin(
                ST_MakePoint(longitude, latitude)::geography,
                ST_MakePoint($${params.length + 1}, $${params.length + 2})::geography,
                $${params.length + 3}
            )
        `);
        params.push(lng, lat, radius * 1000); // Convert radius from km to meters
    }

    // Amenities filter
    if (amenities && amenities.length > 0) {
        params.push(amenities);
        conditions.push(`amenities ?& $${params.length}`);
    }

    // Sorting
    const allowedSortFields = ['price', 'created_at', 'bedrooms', 'bathrooms'];
    const sort = sortBy && allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
    orderClause = ` ORDER BY ${sort} ${order}`;

    // Location-based sorting if coordinates provided
    if (lat && lng && !sortBy) {
        orderClause = `
            ORDER BY ST_Distance(
                ST_MakePoint(longitude, latitude)::geography,
                ST_MakePoint($${params.length + 1}, $${params.length + 2})::geography
            )
        `;
        if (!params.includes(lng)) {
            params.push(lng, lat);
        }
    }

    return {
        conditions: conditions.join(' AND '),
        params,
        orderClause
    };
};

const buildFacetedSearch = async (db, baseConditions, baseParams) => {
    const facets = {};

    // Price ranges
    const priceRanges = await db.query(`
        WITH ranges AS (
            SELECT 
                CASE 
                    WHEN price < 1000 THEN 'Under $1,000'
                    WHEN price >= 1000 AND price < 2000 THEN '$1,000 - $2,000'
                    WHEN price >= 2000 AND price < 3000 THEN '$2,000 - $3,000'
                    WHEN price >= 3000 AND price < 4000 THEN '$3,000 - $4,000'
                    ELSE 'Over $4,000'
                END AS range,
                COUNT(*) as count
            FROM properties
            WHERE ${baseConditions}
            GROUP BY range
            ORDER BY range
        )
        SELECT * FROM ranges WHERE count > 0
    `, baseParams);
    facets.priceRanges = priceRanges.rows;

    // Property types
    const propertyTypes = await db.query(`
        SELECT property_type, COUNT(*) as count
        FROM properties
        WHERE ${baseConditions}
        GROUP BY property_type
        HAVING COUNT(*) > 0
        ORDER BY count DESC
    `, baseParams);
    facets.propertyTypes = propertyTypes.rows;

    // Bedroom counts
    const bedrooms = await db.query(`
        SELECT bedrooms, COUNT(*) as count
        FROM properties
        WHERE ${baseConditions}
        GROUP BY bedrooms
        HAVING COUNT(*) > 0
        ORDER BY bedrooms
    `, baseParams);
    facets.bedrooms = bedrooms.rows;

    // Popular amenities
    const amenities = await db.query(`
        SELECT 
            jsonb_array_elements_text(amenities) as amenity,
            COUNT(*) as count
        FROM properties
        WHERE ${baseConditions}
        GROUP BY amenity
        HAVING COUNT(*) > 0
        ORDER BY count DESC
        LIMIT 10
    `, baseParams);
    facets.amenities = amenities.rows;

    // Popular locations
    const locations = await db.query(`
        SELECT city, state, COUNT(*) as count
        FROM properties
        WHERE ${baseConditions}
        GROUP BY city, state
        HAVING COUNT(*) > 0
        ORDER BY count DESC
        LIMIT 10
    `, baseParams);
    facets.locations = locations.rows;

    return facets;
};

module.exports = {
    buildSearchQuery,
    buildFacetedSearch
};