import { apiGet } from "../api/apiClient";
import { INSIGHTS_ENDPOINTS } from "../config/apiEndPoint";
import type { InsightsData, InsightsPeriod } from "../api/types";

export const getInsights = (period: InsightsPeriod): Promise<InsightsData> => {
  return apiGet<InsightsData>(INSIGHTS_ENDPOINTS.Insights, {
    params: { period },
  });
};
