const pagination = (query, defaultLimit = 20) => {
  const page = Number(query.page);
  const limit = Number(query.limit);
  return {
    page: Number.isInteger(page) && page > 0 ? Math.min(page, 100000) : 1,
    limit: Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : defaultLimit,
  };
};
const literalSearch = value => String(value || '').trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
module.exports = { pagination, literalSearch };
