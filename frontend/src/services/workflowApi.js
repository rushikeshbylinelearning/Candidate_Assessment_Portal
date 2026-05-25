import api from '../utils/api';

// Fetch all workflow data at once through backend proxy
export const fetchAllWorkflowData = async () => {
  try {
    const response = await api.get('/workflow/analytics/all');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch workflow data:', error);
    throw error;
  }
};

// Fetch workflow overview
export const fetchWorkflowOverview = async () => {
  try {
    const response = await api.get('/workflow/analytics/overview');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch workflow overview:', error);
    throw error;
  }
};

// Fetch workflow funnel data
export const fetchWorkflowFunnel = async () => {
  try {
    const response = await api.get('/workflow/analytics/funnel');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch workflow funnel:', error);
    throw error;
  }
};

// Fetch workflow performance data
export const fetchWorkflowPerformance = async () => {
  try {
    const response = await api.get('/workflow/analytics/performance');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch workflow performance:', error);
    throw error;
  }
};

// Fetch analytics data from workflow API
export const fetchWorkflowAnalytics = async () => {
  try {
    const response = await api.get('/workflow/analytics');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch workflow analytics:', error);
    throw error;
  }
};

export default {
  fetchAllWorkflowData,
  fetchWorkflowOverview,
  fetchWorkflowFunnel,
  fetchWorkflowPerformance,
  fetchWorkflowAnalytics,
};
