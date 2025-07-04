export const getOverlayStyle = () => `
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.4); z-index: 9999; display: flex;
  justify-content: center; align-items: center;
  backdrop-filter: blur(4px);
`;

export const getPopupStyle = () => `
  background: #ffffff;
  padding: 24px 20px;
  border-radius: 16px;
  max-width: 420px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
`;

export const getLevelStyle = (level: string): string => {
  const base = "margin: 0 0 15px; font-weight: 600;";
  switch (level) {
    case "critical": return `${base} color: #d32f2f;`;
    case "warning": return `${base} color: #f57c00;`;
    case "info": return `${base} color: #1976d2;`;
    default: return base;
  }
};

export const getDetailsStyle = () => `
  margin: 0 0 15px;
  font-size: 0.9em;
  color: #444;
  text-align: left;
  background: #fafafa;
  padding: 10px;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
`;

export const getButtonStyle = (bgColor: string) => `
  padding: 10px 18px;
  margin: 5px 8px;
  background: ${bgColor};
  color: white;
  border: none;
  border-radius: 100px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background 0.2s ease-in-out;
`;
