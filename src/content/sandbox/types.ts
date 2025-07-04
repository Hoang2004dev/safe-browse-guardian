export type SandboxReport = {
  attemptedRedirect: boolean;
  nestedDangerousIframe: boolean;
  externalScript: boolean;
  details: string[];
};
