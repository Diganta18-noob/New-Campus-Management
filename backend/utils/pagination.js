/**
 * Pagination utility for MongoDB queries
 * Provides consistent pagination across all API endpoints
 */

/**
 * Get pagination parameters from request query
 * @param {object} req - Express request object
 * @param {number} defaultLimit - Default items per page (default: 20)
 * @param {number} maxLimit - Maximum items per page allowed (default: 100)
 * @returns {object} - { page, limit, skip }
 */
const getPaginationParams = (req, defaultLimit = 20, maxLimit = 100) => {
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || defaultLimit;

  // Ensure page is at least 1
  if (page < 1) page = 1;

  // Ensure limit is between 1 and maxLimit
  if (limit < 1) limit = 1;
  if (limit > maxLimit) limit = maxLimit;

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Format pagination response data
 * @param {array} data - Array of documents
 * @param {number} total - Total count of documents
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} - Formatted pagination metadata
 */
const formatPaginationResponse = (data, total, page, limit) => ({
  success: true,
  count: data.length,
  total,
  totalPages: Math.ceil(total / limit),
  currentPage: page,
  hasNextPage: page < Math.ceil(total / limit),
  hasPreviousPage: page > 1,
  data,
});

/**
 * Cursor-based pagination for large datasets
 * @param {object} req - Express request object
 * @param {string} cursorField - Field to use for cursor (e.g., 'createdAt', '_id')
 * @param {number} defaultLimit - Default items per page (default: 20)
 * @returns {object} - { query, limit, sort }
 */
const getCursorPaginationParams = (req, cursorField = 'createdAt', defaultLimit = 20) => {
  let limit = parseInt(req.query.limit) || defaultLimit;
  const cursor = req.query.cursor;
  const direction = req.query.direction || 'next'; // 'next' or 'prev'

  if (limit < 1) limit = 1;
  if (limit > 100) limit = 100;

  const query = {};
  const sort = { [cursorField]: -1 };

  if (cursor) {
    if (direction === 'next') {
      query[cursorField] = { $lt: cursor };
    } else {
      query[cursorField] = { $gt: cursor };
      sort[cursorField] = 1; // Reverse order to get previous results
    }
  }

  return { query, limit: limit + 1, sort, cursor };
};

/**
 * Format cursor-based pagination response
 * @param {array} data - Array of documents
 * @param {string} cursorField - Field used for cursor
 * @param {number} limit - Original limit requested
 * @param {string} direction - Pagination direction
 * @returns {object} - Formatted cursor pagination metadata
 */
const formatCursorPaginationResponse = (data, cursorField, limit, direction = 'next') => {
  const hasMore = data.length > limit;
  const results = hasMore ? data.slice(0, limit) : data;

  let nextCursor = null;
  let previousCursor = null;

  if (hasMore) {
    nextCursor = results[results.length - 1][cursorField];
  }

  if (direction === 'prev' && results.length > 0) {
    results.reverse();
  }

  if (results.length > 0) {
    previousCursor = results[0][cursorField];
  }

  return {
    success: true,
    count: results.length,
    hasMore,
    nextCursor,
    previousCursor,
    data: results,
  };
};

module.exports = {
  getPaginationParams,
  formatPaginationResponse,
  getCursorPaginationParams,
  formatCursorPaginationResponse,
};
