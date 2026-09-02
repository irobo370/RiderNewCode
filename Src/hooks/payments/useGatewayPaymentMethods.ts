import { useQuery } from "@tanstack/react-query";

import { getGatewayPaymentMethods } from "../../service/paymentService/paymentGatewayService";

export function useGatewayPaymentMethods(enabled: boolean) {
  return useQuery({
    queryKey: ["payments", "gateway-methods"],
    queryFn: getGatewayPaymentMethods,
    enabled,
    staleTime: 30_000,
    retry: 1,
  });
}
