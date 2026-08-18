import { useSelector } from "react-redux";

type SessionUser = {
  name?: string;
  phone?: string;
  profile?: { name?: string; phone?: string };
};

export function useUserDisplayName(fallback = "Rider"): string {
  const user = useSelector((state: { session?: { user?: SessionUser } }) => state.session?.user);

  const name =
    user?.name ??
    user?.profile?.name ??
    (typeof user === "object" && user !== null && "data" in user
      ? (user as { data?: { name?: string } }).data?.name
      : undefined);

  if (name?.trim()) {
    return name.trim().split(" ")[0];
  }

  return fallback;
}

export function useUserProfile() {
  const user = useSelector((state: { session?: { user?: SessionUser } }) => state.session?.user);

  const name =
    user?.name ??
    user?.profile?.name ??
    (typeof user === "object" && user !== null && "data" in user
      ? (user as { data?: { name?: string; phone?: string } }).data?.name
      : undefined);

  const phone =
    user?.phone ??
    user?.profile?.phone ??
    (typeof user === "object" && user !== null && "data" in user
      ? (user as { data?: { phone?: string } }).data?.phone
      : undefined);

  return {
    name: name ?? "Rider",
    phone: phone ?? "",
    firstName: name?.trim() ? name.trim().split(" ")[0] : "Rider",
  };
}
