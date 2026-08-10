import { config } from "./config";

const fixtures = {
  "/audit/create-part-logs": "create-part-logs.json",
  "/audit/dashroll-logs": "audit_dashroll-logs.json",
  "/audit/upload-to-enovia-logs": "audit_upload-to-enovia-logs.json",
  "/audit/backflow-logs": "audit_backflow-logs.json",
  "/audit/search-logs": "audit_search-logs.json",
  "/audit/get-high-dash-logs": "audit_get-high-dash-logs.json",
  "/audit/query-co-logs": "audit_query-co-logs.json",
  "/audit/get-enovia-project-logs": "audit_get-enovia-project-logs.json",
  "/audit/get-enovia-manufacturer-logs": "audit_get-enovia-manufacturer-logs.json",
  "/audit/get-edoc-project-logs": "audit_get-edoc-project-logs.json",
  "/audit/get-part-type-logs": "audit_get-part-type-logs.json",
  "/part-types": "part-types.json",
  "/edoc-projects": "edoc-projects.json",
  "/users": "user.json",
};

const fixtureFor = (path) => {
  if (path.includes("/metadata/")) return path.includes("create-part") ? "create-part-logs_metadata.json" : "audit_upload-to-enovia-logs_metadata.json";
  if (path.includes("/component-logs/")) return "audit_component-logs_transaction.json";
  return fixtures[path];
};

export async function api(path, options = {}) {
  const method = options.method || "GET";
  if (config.useMockApi) {
    if (path === "/auth/login") {
      if (!options.body?.userId || (!options.body?.password && !options.body?.ssoAuthenticated)) throw new Error("Invalid username or password. Please try again or contact your administrator for assistance.");
      const response = await fetch("/mock/auth_login_response_suceess.json");
      if (!response.ok) throw new Error("Unable to load the mock login response.");
      return { ...await response.json(), userId: options.body.userId };
    }
    if (method !== "GET") return { status: "SUCCESS", message: "Mock request completed successfully", updatedCount: options.body?.length || 1, failedIds: [] };
    const fixture = fixtureFor(path);
    if (!fixture) return { transactionId: path.split("/").pop(), requestType: "mock", message: "No fixture is required for this response." };
    const response = await fetch(`/mock/${fixture}`);
    if (!response.ok) throw new Error(`Unable to load fixture ${fixture}`);
    return response.json();
  }

  const token = localStorage.getItem("adminConsoleToken");
  const search = options.query ? `?${new URLSearchParams(Object.entries(options.query).filter(([, value]) => value !== "")).toString()}` : "";
  const url = `${config.apiHost}${path}${search}`;
  const response = await fetch(url, {
    method,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? (options.body instanceof FormData ? options.body : JSON.stringify(options.body)) : undefined,
  });
  // if (!response.ok) {
  //   const error = await response.json().catch(() => ({}));
  //   throw new Error(error.message || `Request failed (${response.status})`);
  // }
  // return response.status === 204 ? {} : response.json();

  if (!response.ok) {
const errorText = await response.text();

try {
const errorJson = JSON.parse(errorText);
throw new Error(
errorJson.message || `Request failed (${response.status})`
);
} catch {
throw new Error(errorText || `Request failed (${response.status})`);
}
}

if (response.status === 204) {
return {};
}

const responseText = await response.text();

if (!responseText) {
return {};
}

try {
return JSON.parse(responseText);
} catch {
return responseText;
}
}

export const getJsonPayload = (usecase, transactionId, type) =>
  config.useMockApi
    ? Promise.resolve({ usecase, transactionId, type, payload: "Mock JSON payload. Configure VITE_USE_MOCK_API=false to call the backend." })
    : api(`/audit/${usecase}/${encodeURIComponent(transactionId)}?type=${type}`);