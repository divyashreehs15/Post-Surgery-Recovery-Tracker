export type Role = "doctor" | "patient";

export function setRole(role: Role) {
  sessionStorage.setItem("active_role", role);
}

export function getRole(): Role {
  return (sessionStorage.getItem("active_role") as Role) || "patient";
}

export function saveSession(role: Role, token: string, user: any) {
  sessionStorage.setItem(`${role}_token`, token);
  sessionStorage.setItem(`${role}_user`, JSON.stringify(user));
  setRole(role);
}

export function getAuthToken(): string | null {
  const role = getRole();
  return sessionStorage.getItem(`${role}_token`);
}

export function clearSession(role: Role) {
  sessionStorage.removeItem(`${role}_token`);
  sessionStorage.removeItem(`${role}_user`);
}
export function getSession(role: Role) {
  const token = sessionStorage.getItem(`${role}_token`);
  const user = sessionStorage.getItem(`${role}_user`);

  if (!token || !user) return null;

  return {
    token,
    user: JSON.parse(user),
  };
}
