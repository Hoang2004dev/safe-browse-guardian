// popup/pages/home.ts
// popup/pages/home.ts
import { renderNav } from "../components/Navigation";
import { renderHeader, renderFooter } from "../components/Layout";
import { getDB } from "../storage";

export async function renderHome() {
  const root = document.body;
  root.innerHTML = "";

  renderHeader(root);
  renderNav(root);

  const db = await getDB();
  const blocked = db.blacklist?.length || 0;
  const threats = db.threatCount || 0;

  const section = document.createElement("section");

  section.innerHTML = `
    <h2>📊 Tổng quan</h2>
    <p><strong>🔒 Số lượng domain bị chặn:</strong> ${blocked}</p>
    <p><strong>🧨 Số URL nguy hiểm đã phát hiện:</strong> ${threats}</p>

    <h2>📘 Giới thiệu</h2>
    <p>SafeBrowse Guardian giúp bạn tránh các trang độc hại, chặn script theo dõi và phân tích hành vi trang web đáng ngờ.</p>

    <h2>🛠 Cách sử dụng</h2>
    <ul>
      <li>✏️ Thêm domain vào blacklist để chặn.</li>
      <li>🚨 Kiểm tra các cảnh báo đã ghi nhận.</li>
      <li>🔬 Bật sandbox để phân tích hành vi tự động.</li>
    </ul>

    <h2>🌐 Tham khảo & Liên hệ</h2>
    <p>Website giáo dục: <a href="https://edu.safe.vn" target="_blank">edu.safe.vn</a></p>
    <p>Email: <a href="mailto:contact@safe.vn">contact@safe.vn</a></p>
    <p>Website: <a href="https://safebrowse.vn" target="_blank">safebrowse.vn</a></p>
  `;

  root.appendChild(section);
  renderFooter(root);
}
