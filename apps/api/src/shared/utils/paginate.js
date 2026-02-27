/**
 * Generate pagination metadata for API responses
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @returns {object} Pagination metadata object
 */
const getPaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const from = total > 0 ? (page - 1) * limit + 1 : 0;
  const to = Math.min(page * limit, total);

  return {
    current_page: page,
    per_page: limit,
    total_pages: totalPages,
    total_items: total,
    from,
    to,
    has_prev: page > 1,
    has_next: page < totalPages,
    prev_page: page > 1 ? page - 1 : null,
    next_page: page < totalPages ? page + 1 : null,
  };
};

export default getPaginationMeta;
