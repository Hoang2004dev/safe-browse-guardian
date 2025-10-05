export function injectPopupStyles(): void {
  const styleId = "popup-style";

  if (document.getElementById(styleId)) return;

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    /* Overlay Style */
    .safebrowse-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.7); z-index: 9999;
      display: flex; justify-content: center; align-items: center;
      backdrop-filter: blur(10px); /* Tăng độ mờ cho nền */
    }

    /* Popup Style */
    .safebrowse-popup {
      background: linear-gradient(145deg, #ffffff, #f1f1f1); /* Gradient nền đẹp */
      padding: 40px 30px;
      border-radius: 20px; /* Bo tròn góc để nhìn mềm mại */
      max-width: 650px; /* Kích thước tối đa vừa phải */
      width: 90%;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15); /* Bóng mờ tinh tế */
      text-align: center;
      font-family: 'Arial', sans-serif;
      border: 2px solid #e0e0e0;
      animation: popupFadeIn 0.4s ease-out;
      max-height: 80vh; /* Giới hạn chiều cao để tránh tràn màn hình */
      overflow-y: auto; /* Cho phép cuộn nếu nội dung dài */
    }

    /* Header Style */
    .scan-popup-icon {
      font-size: 48px;
      margin-bottom: 10px;
    }

    .popup-header {
      font-size: 22px; /* Using px for readability */
      font-weight: bold;
      color: #e53935; /* Màu đỏ nổi bật cho tiêu đề */
      margin-bottom: 20px;
    }

    /* Level-specific Styles */
    .level-message {
      font-size: 18px;
      margin-top: 10px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .level-critical {
      color: #ff3b30; /* Red for critical */
    }

    .level-warning {
      color: #ff9500; /* Orange for warning */
    }

    .level-info {
      color: #007aff; /* Blue for info */
    }

    /* Details (popup-details) Styles */
    .popup-details {
      background-color: #f1f1f1;
      padding: 16px;
      border-radius: 10px;
      margin-top: 20px;
      text-align: left;
      border: 1px solid #ddd;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: max-height 0.3s ease, padding 0.3s ease;
    }

    .popup-details summary {
      font-size: 18px;
      font-weight: bold;
      color: #000000ff; /* Blue color for the summary */
      cursor: pointer;
      margin-bottom: 10px;
      padding: 8px;
      background-color: #f1f1f1; /* Light blue background */
      border-radius: 5px;
      transition: background-color 0.3s ease;
    }

    .popup-details summary:hover {
      background-color: #d9d9d9ff; /* Darker blue on hover */
    }

    .popup-details[open] {
      padding-bottom: 20px; /* Extra padding when expanded */
    }

  /* Button Styles */
  .safebrowse-popup button {
    padding: 10px 18px;
    margin: 8px;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600; /* Đậm chữ để dễ nhìn hơn */
    transition: background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease, opacity 0.2s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    width: auto; /* Điều chỉnh nút để không bị quá rộng */
    min-width: 120px; /* Thiết lập chiều rộng tối thiểu để nút không quá nhỏ */
    text-transform: uppercase; /* Viết hoa để các nút trông mạnh mẽ hơn */
    font-family: 'Arial', sans-serif; /* Chọn font dễ đọc */
    opacity: 1; /* Đảm bảo nút không bị mờ */
  }

  .safebrowse-popup button i {
    margin-right: 10px; /* Thêm khoảng cách giữa icon và chữ */
  }

  /* Button Container */
  .button-container {
    display: flex;                /* Sử dụng Flexbox để xếp các nút theo hàng ngang */
    justify-content: center;      /* Căn giữa các nút theo chiều ngang */
    align-items: center;          /* Căn giữa các nút theo chiều dọc */
    flex-wrap: wrap;              /* Cho phép các nút chuyển sang dòng mới nếu không đủ chỗ */
    gap: 10px;                    /* Khoảng cách giữa các nút giảm xuống */
  }

  /* Button Color Classes */
  .btn-continue {
    background-color: #4CAF50; /* Green */
    color: white; /* Màu chữ trắng cho tương phản tốt */
  }

  .btn-continue:hover {
    background-color: #45a049; /* Darker green */
    transform: translateY(-5px); /* Nút nổi lên khi hover */
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2); /* Hiệu ứng bóng khi hover */
  }

  .btn-block {
    background-color: #d32f2f; /* Red */
    color: white; /* Màu chữ trắng cho tương phản tốt */
  }

  .btn-block:hover {
    background-color: #b71c1c; /* Darker red */
    transform: translateY(-5px); /* Nút nổi lên khi hover */
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2); /* Hiệu ứng bóng khi hover */
  }

  .btn-cancel {
    background-color: #9e9e9e; /* Grey */
    color: white; /* Màu chữ trắng */
  }

  .btn-cancel:hover {
    background-color: #757575; /* Darker grey */
    transform: translateY(-5px); /* Nút nổi lên khi hover */
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2); /* Hiệu ứng bóng khi hover */
  }

  /* Button Hover Styles */
  .safebrowse-popup button:hover {
    opacity: 0.9; /* Hiệu ứng làm mờ nhẹ khi hover để tạo sự nổi bật */
  }

  /* Add Icon to button */
  .safebrowse-popup button i {
    font-size: 18px; /* Tăng kích thước icon cho dễ nhìn */
    vertical-align: middle; /* Căn giữa icon với chữ */
  }

  /* Popup Fade In Animation */
  @keyframes popupFadeIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }
  `;

  document.head.appendChild(style);
}

export function injectScanPopupStyles(): void {
  const styleId = "scan-popup-style";

  if (document.getElementById(styleId)) return;

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    .scan-popup-overlay {
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      backdrop-filter: blur(4px);
      animation: scan-popup-fadeIn 0.3s ease;
    }

    .scan-popup-box {
      background: #fff;
      padding: 30px 26px;
      border-radius: 16px;
      max-width: 600px;
      width: 90%;
      box-shadow: 0 10px 40px rgba(0,0,0,0.25);
      text-align: center;
      font-family: "Segoe UI", Roboto, sans-serif;
      animation: scan-popup-slideUp 0.4s ease;
      border-top: 6px solid #ccc;
    }

    .scan-popup-icon {
      font-size: 48px;
      margin-bottom: 10px;
    }

    .scan-popup-pattern {
      font-weight: bold;
      margin: 10px 0 16px;
      color: #444;
    }

    .scan-popup-details {
      margin: 16px 0 20px;
      font-size: 0.95em;
      color: #333;
      text-align: left;
      background: #f9f9f9;
      padding: 12px 16px;
      border-radius: 10px;
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #ddd;
    }

    .scan-popup-details summary {
      cursor: pointer;
      font-weight: bold;
      margin-bottom: 10px;
    }

    .scan-popup-button {
      padding: 10px 20px;
      border: none;
      border-radius: 50px;
      font-size: 1em;
      cursor: pointer;
      transition: background 0.3s ease;
      color: #fff;
      background: #6b07075c;
      box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    }

    .scan-popup-button:hover {
      background: #6b0707c4;
      transform: translateY(-3px); /* Tạo hiệu ứng nổi lên */
    }

    .scan-popup-button:active {
      background: #6b0707;  /* Màu đậm hơn khi nhấn */
      transform: translateY(1px); /* Nhấn xuống */
    }

    /* Màu theo mức độ */
    .scan-popup-info {
      border-top-color: #1976d2;
    }
    .scan-popup-warning {
      border-top-color: #f57c00;
    }
    .scan-popup-critical {
      border-top-color: #d32f2f;
    }

    .scan-popup-info .scan-popup-icon {
      color: #1976d2;
    }
    .scan-popup-warning .scan-popup-icon {
      color: #f57c00;
    }
    .scan-popup-critical .scan-popup-icon {
      color: #d32f2f;
    }

    @keyframes scan-popup-fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scan-popup-slideUp {
      from { transform: translateY(40px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes popupFadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
  `;
  document.head.appendChild(style);
}
