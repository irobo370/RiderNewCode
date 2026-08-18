import { useQuery } from "@tanstack/react-query";
import { useIsFocused } from "@react-navigation/native";
import { listAddresses } from "../../service/addressService/addressService";
import type { SavedAddress } from "../../service/api/types";

function matchLabel(address: SavedAddress, target: "home" | "work") {
  return address.label.trim().toLowerCase() === target;
}

export function useSavedPlaces(enabled = true) {
  const isFocused = useIsFocused();
  const query = useQuery({
    queryKey: ["addresses", "saved-places"],
    queryFn: () => listAddresses(),
    enabled: enabled && isFocused,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const addresses = query.data ?? [];
  const home = addresses.find((item) => matchLabel(item, "home")) ?? null;
  const work = addresses.find((item) => matchLabel(item, "work")) ?? null;

  return {
    ...query,
    home,
    work,
    savedPlaces: { home, work },
  };
}
