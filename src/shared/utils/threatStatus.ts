export const ThreatStatus = {
  SAFE: "safe",
  SPOOFING: "spoofing",
  NOT_FOUND: "not_found",
  ERROR: "error",
} as const;


export type ThreatStatusType = typeof ThreatStatus[keyof typeof ThreatStatus];
