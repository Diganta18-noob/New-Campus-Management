import { usersAPI } from '../services/api';

export const directoryKey = ({ role, search, page, limit }) => ['people-directory', role, search, page, limit];

export const directoryOptions = ({ role, search, page, limit }) => ({
  queryKey: directoryKey({ role, search, page, limit }),
  queryFn: () => usersAPI.getAll({ page, limit, view: 'directory', ...(role !== 'ALL' && { role }), ...(search && { search }) }),
  staleTime: 5 * 60 * 1000,
  gcTime: 20 * 60 * 1000,
});
