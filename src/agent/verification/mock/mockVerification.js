// MOCK ONLY - replace with real backend and identity provider before production
export const MOCK_VERIFICATION_STORE_KEY = "rentbridge-agent-verification";
export const MOCK_DEVICE_SIGNUP_COUNT_KEY = "rentbridge-agent-signups-on-device";
export const MOCK_DEVICE_SIGNUP_LIMIT = 3;
export const MOCK_DOCUMENT_MAX_BYTES = 5 * 1024 * 1024;
export const MOCK_DOCUMENT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export const MOCK_ID_TYPES = ["NIN", "International passport", "Driver's license", "Voter's card"];
export const MOCK_DISPOSABLE_EMAIL_DOMAINS = [
  "10minutemail.com", "guerrillamail.com", "mailinator.com", "tempmail.com", "yopmail.com",
];
export const MOCK_SEEDED_VERIFIED_AGENT_IDS = [
  "agent-demo", "agent-ada", "agent-ife", "agent-amina", "agent-zainab", "agent-micheal", "agent-samuel",
];

// Production must enforce device and IP rate limits, identity provider checks,
// duplicate detection, encrypted document storage, retention rules, and audit logs.
// Use fictional test details here. The prototype stores file names only and never stores raw ID numbers or file contents.
