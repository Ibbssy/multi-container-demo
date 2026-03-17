const buildQuery = (params) => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.set(key, value);
        }
    });

    const query = searchParams.toString();
    return query ? `?${query}` : '';
};

const buildPathWithQuery = (path, params) => `${path}${buildQuery(params)}`;

const encodePathSegment = (value = '') => encodeURIComponent(String(value));

module.exports = {
    buildPathWithQuery,
    encodePathSegment
};
