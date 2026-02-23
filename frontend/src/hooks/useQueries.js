import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

// ============= BATCHES QUERIES =============

export const useBatches = (options = {}) => {
  return useQuery({
    queryKey: ['batches', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);
      if (options.status) params.append('status', options.status);
      if (options.search) params.append('search', options.search);

      const response = await api.get(`/batches?${params.toString()}`);
      return response.data;
    },
    ...options.queryConfig,
  });
};

export const useBatchById = (id, options = {}) => {
  return useQuery({
    queryKey: ['batches', id],
    queryFn: async () => {
      const response = await api.get(`/batches/${id}`);
      return response.data;
    },
    enabled: !!id,
    ...options.queryConfig,
  });
};

export const useBatchStats = (id, options = {}) => {
  return useQuery({
    queryKey: ['batches', id, 'stats'],
    queryFn: async () => {
      const response = await api.get(`/batches/${id}/stats`);
      return response.data;
    },
    enabled: !!id,
    ...options.queryConfig,
  });
};

// ============= USERS QUERIES =============

export const useUsers = (options = {}) => {
  return useQuery({
    queryKey: ['users', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);
      if (options.role) params.append('role', options.role);
      if (options.search) params.append('search', options.search);
      if (options.isActive !== undefined) params.append('isActive', options.isActive);

      const response = await api.get(`/users?${params.toString()}`);
      return response.data;
    },
    ...options.queryConfig,
  });
};

export const useUserById = (id, options = {}) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const response = await api.get(`/users/${id}`);
      return response.data;
    },
    enabled: !!id,
    ...options.queryConfig,
  });
};

export const useCurrentUser = (options = {}) => {
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const response = await api.get('/auth/me');
      return response.data;
    },
    ...options.queryConfig,
  });
};

// ============= ATTENDANCE QUERIES =============

export const useAttendance = (options = {}) => {
  return useQuery({
    queryKey: ['attendance', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.batch) params.append('batch', options.batch);
      if (options.date) params.append('date', options.date);
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);
      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);

      const response = await api.get(`/attendance?${params.toString()}`);
      return response.data;
    },
    ...options.queryConfig,
  });
};

export const useAttendanceByLearner = (learnerId, options = {}) => {
  return useQuery({
    queryKey: ['attendance', 'learner', learnerId],
    queryFn: async () => {
      const response = await api.get(`/attendance/learner/${learnerId}`);
      return response.data;
    },
    enabled: !!learnerId,
    ...options.queryConfig,
  });
};

// ============= DAILY UPDATES QUERIES =============

export const useDailyUpdates = (options = {}) => {
  return useQuery({
    queryKey: ['daily-updates', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.batch) params.append('batch', options.batch);
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);
      if (options.status) params.append('status', options.status);

      const response = await api.get(`/daily-updates?${params.toString()}`);
      return response.data;
    },
    ...options.queryConfig,
  });
};

export const useDailyUpdateById = (id, options = {}) => {
  return useQuery({
    queryKey: ['daily-updates', id],
    queryFn: async () => {
      const response = await api.get(`/daily-updates/${id}`);
      return response.data;
    },
    enabled: !!id,
    ...options.queryConfig,
  });
};

// ============= DEPARTMENTS QUERIES =============

export const useDepartments = (options = {}) => {
  return useQuery({
    queryKey: ['departments', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);

      const response = await api.get(`/departments?${params.toString()}`);
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - less frequently changed
    ...options.queryConfig,
  });
};

// ============= CLASSROOMS QUERIES =============

export const useClassrooms = (options = {}) => {
  return useQuery({
    queryKey: ['classrooms', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);

      const response = await api.get(`/classrooms?${params.toString()}`);
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
    ...options.queryConfig,
  });
};

// ============= DASHBOARD QUERIES =============

export const useDashboardStats = (options = {}) => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    ...options.queryConfig,
  });
};
