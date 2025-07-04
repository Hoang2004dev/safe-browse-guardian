//======================= threatTypes.ts

export type GoogleSBResult = {
  safe: boolean;
};

export type PhishTankResult = {
  phishing: boolean;
  source: "PhishTank";
};

export type URLScanResult = {
  suspicious: boolean;
  lastScanDate?: string;
  source: "URLScan.io";
};

export type AbuseIPDBResult = {
  abuseScore: number;
  totalReports: number;
  source: "AbuseIPDB";
};

export type SandboxReport = {
  attemptedRedirect: boolean;
  nestedDangerousIframe: boolean;
  externalScript: boolean;
  details: string[];
};

export type ThreatReport = {
  url: string;
  safe: boolean;
  issues: string[];
  detail: {
    google: GoogleSBResult;
    phish: PhishTankResult;
    urlscan: URLScanResult;
    abuse: AbuseIPDBResult;
  };
  sandbox?: SandboxReport;
};
