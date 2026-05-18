const DUTY_AUTHOR_KEY = "spillthetea-duty-author-name";
const DUTY_HELPER_KEY = "spillthetea-duty-helper-name";

export function getStoredDutyAuthorName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(DUTY_AUTHOR_KEY)?.trim() ?? "";
}

export function setStoredDutyAuthorName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DUTY_AUTHOR_KEY, name.trim());
}

export function getStoredDutyHelperName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(DUTY_HELPER_KEY)?.trim() ?? "";
}

export function setStoredDutyHelperName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DUTY_HELPER_KEY, name.trim());
}
