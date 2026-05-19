import { PRODUCTION_APP_URL } from "@/lib/app-url";

export const APP_NAME = "SpillTheTea";
export const APP_LEGAL_URL = PRODUCTION_APP_URL;
export const LEGAL_LAST_UPDATED = "May 19, 2026";

export const PRIVACY_POLICY_PATH = "/privacy";
export const TERMS_OF_SERVICE_PATH = "/terms";

export const PRIVACY_POLICY_URL = `${APP_LEGAL_URL}${PRIVACY_POLICY_PATH}`;
export const TERMS_OF_SERVICE_URL = `${APP_LEGAL_URL}${TERMS_OF_SERVICE_PATH}`;
