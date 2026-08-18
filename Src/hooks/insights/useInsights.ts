import { useQuery } from "@tanstack/react-query";
import { useIsFocused } from "@react-navigation/native";

import { getInsights } from "../../service/insightsService/insightsService";
import type { InsightsPeriod } from "../../service/api/types";

export const insightsQueryKeys = {
  all: ["insights"] as const,
  period: (period: InsightsPeriod) => [...insightsQueryKeys.all, period] as const,
};

export function useInsights(period: InsightsPeriod) {
  const isFocused = useIsFocused();

  return useQuery({
    queryKey: insightsQueryKeys.period(period),
    queryFn: () => getInsights(period),
    enabled: isFocused,
    staleTime: 0,
    refetchOnMount: "always",
  });
}
