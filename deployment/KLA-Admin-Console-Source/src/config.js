const value = (name, fallback) => import.meta.env[name] || fallback;

export const config = {
  apiHost: value("VITE_API_HOST", "http://localhost:8080").replace(/\/$/, ""),
  useMockApi: value("VITE_USE_MOCK_API", "true") === "true",
  ssoEnabled: value("VITE_SSO_ENABLED", "false") === "true",
  ssoLoginUrl: value("VITE_SSO_LOGIN_URL", ""),
  sessionTimeoutMinutes: Number(value("VITE_SESSION_TIMEOUT_MINUTES", "30")),
  defaultLoadDays: Number(value("VITE_DEFAULT_LOAD_DAYS", "7")),
  cadPrimaryValues: value("VITE_CAD_PRIMARY_VALUES", "CREO_KLA,CREO_ORBK,CREO_LIS,SW_KLA,SW_ICOS,SW_FILM,SW_ORBK")
    .split(",").map((item) => item.trim()).filter(Boolean),
};
