import type { SandboxReport } from "./sandbox/types";

type ThreatDetail = {
  google?: { safe: boolean };
  phish?: { phishing: boolean };
  urlscan?: { suspicious: boolean; lastScanDate?: string };
  abuse?: { abuseScore: number; totalReports: number };
};

export function formatThreatMessage(
  isSafe: boolean,
  {
    issues,
    detail,
    sandbox,
  }: {
    issues: string[];
    detail: ThreatDetail;
    sandbox?: SandboxReport | null;
  }
): string {
  if (isSafe) {
    console.log("URL is safe, returning safe message.");
    return "🔁 Link này sẽ chuyển hướng đến:";
  }
  console.log("Checking safety status:", isSafe);

  const lines: string[] = [];

  //console.log("Issues being checked: ", issues);

  // Cảnh báo chính
  const dangerIssues = issues.filter(i => i && !/an toàn|safe|ok/i.test(i));
  console.log("Filtered Danger Issues: ", dangerIssues);
  if (dangerIssues.length > 0) {
    lines.push(`⚠️ Link có dấu hiệu nguy hiểm từ: ${dangerIssues.join(", ")}`);
  } else {
    lines.push("🔒 Link này được xác nhận là an toàn.");
  }

  // Phân tích chi tiết từ nguồn
  const sourceDetails: string[] = [];

  if (detail.google && !detail.google.safe) {
    sourceDetails.push("Google Safe Browsing: phát hiện mối đe dọa");
  }

  if (detail.phish?.phishing) {
    sourceDetails.push("PhishTank: URL bị đánh dấu là phishing hợp lệ");
  }

  if (detail.abuse && detail.abuse.abuseScore > 0) {
    sourceDetails.push(
      `AbuseIPDB: ${detail.abuse.abuseScore}/100 (${detail.abuse.totalReports} báo cáo)`
    );
  }

  if (detail.urlscan?.lastScanDate) {
    const formatted = new Date(detail.urlscan.lastScanDate).toLocaleString();
    sourceDetails.push(`URLScan: Quét gần nhất ${formatted}`);
  }

  if (issues.includes("Heuristic Pattern")) {
    sourceDetails.push("Heuristic: URL có mẫu đáng ngờ");
  }

  if (sourceDetails.length > 0) {
    lines.push(
      `<b>Thông tin từ nguồn dữ liệu:</b><br>${sourceDetails.join("<br>")}`
    );
  }

  // Phân tích sandbox
  const sandboxDetails: string[] = [];
  if (sandbox?.details?.length) {
    sandbox.details.forEach((raw) => {
      sandboxDetails.push(formatSandboxDetail(raw));
    });
  }

  if (sandboxDetails.length > 0) {
    lines.push(`<b>Phân tích sandbox:</b><br>${sandboxDetails.join("<br>")}`);
  }

  return lines.join("<br><br>");
}

// Chuẩn hóa chi tiết sandbox
function formatSandboxDetail(msg: string): string {
  if (/không thể truy cập nội dung iframe/i.test(msg))
    return "Không thể phân tích nội dung trang (iframe bị chặn)";
  if (/không thể truy cập url.*redirect/i.test(msg))
    return "Không thể kiểm tra chuyển hướng (iframe bị giới hạn CORS)";
  if (/iframe đáng ngờ/i.test(msg)) return msg;
  if (/script ngoài/i.test(msg)) return msg;
  return `Hành vi không xác định: ${msg}`;
}
