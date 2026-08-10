import React, { useEffect, useMemo, useState } from "react";
import { api, getJsonPayload } from "./api";
import { config } from "./config";
import "./layout.css";
import "./fullscreen.css";
import loginBackground from "../LogoImages/avatars-92U9qxyH6xyFnXEG-BgKGTg-t500x500.jpg";
import klaLogo from "../LogoImages/KLA_Corporation-Logo.wine.png";

const dateInput = (date) => date.toISOString().slice(0, 10);
const pstDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        dateStyle: "short",
        timeStyle: "medium",
      }).format(new Date(value))
    : "-";
//const toApiDate = (value) => value ? new Intl.DateTimeFormat("en-GB", { timeZone: "America/Los_Angeles" }).format(new Date(`${value}T12:00:00`)).replace(/\//g, "/") : "";

const toApiDate = (value) => value || "";
const displayStatus = (status) => {
  const value = String(status || "").trim();
  return /^fail(?:ed)?$/i.test(value) ? "FAILED" : value;
};
const statusClass = (status = "") =>
  `status ${displayStatus(status).toLowerCase().replace("pending", "running")}`;
const columns = (items) => items.map(([label, key]) => ({ label, key }));
const nextSort = (sort, key) =>
  sort.key === key && sort.direction === "asc"
    ? { key, direction: "desc" }
    : { key, direction: "asc" };
const sortRows = (rows, sort) => {
  if (!sort.key) return rows;

  return [...rows].sort((left, right) => {
    const leftValue = left[sort.key];
    const rightValue = right[sort.key];
    const leftEmpty = leftValue === null || leftValue === undefined || leftValue === "";
    const rightEmpty = rightValue === null || rightValue === undefined || rightValue === "";
    if (leftEmpty || rightEmpty) return leftEmpty === rightEmpty ? 0 : leftEmpty ? 1 : -1;

    const comparison = String(leftValue).localeCompare(String(rightValue), undefined, {
      numeric: true,
      sensitivity: "base",
    });
    return sort.direction === "asc" ? comparison : -comparison;
  });
};

const logPages = {
  "create-part": {
    title: "Create Part",
    endpoint: "/audit/create-part-logs",
    jsonUsecase: "create-part-logs",
    summary: [
      "Total Parts Created",
      "Total Success",
      "Total Partial",
      "Total Failed",
    ],
    details: "metadata",
    columns: columns([
      ["Transaction ID", "transactionId"],
      ["Requester", "requester"],
      ["Host", "hostName"],
      ["CAD Primary", "cadPrimary"],
      ["Action", "edoc"],
      ["No. of Parts", "totalParts"],
      ["Status", "status"],
      ["Error", "message"],
      ["Request JSON", "request"],
      ["Response JSON", "response"],
      ["Request Timestamp", "reqTs"],
      ["Response Timestamp", "resTs"],
      ["Enovia Time", "executionTime"],
    ]),
  },
  dashroll: {
    title: "Dashroll",
    endpoint: "/audit/dashroll-logs",
    jsonUsecase: "dashroll-logs",
    summary: ["Total Dashroll Created", "Total Success", "Total Failed"],
    details: "component",
    columns: columns([
      ["Transaction ID", "transactionId"],
      ["Requester", "requester"],
      ["Host", "hostName"],
      ["CAD Primary", "cadPrimary"],
      ["Part Number", "partNumber"],
      ["Revision", "partRev"],
      ["Next Dash", "nextDash"],
      ["Description", "description"],
      ["Status", "status"],
      ["Error", "msg"],
      ["Request JSON", "request"],
      ["Response JSON", "response"],
      ["Request Timestamp", "reqTs"],
      ["Response Timestamp", "resTs"],
      ["Enovia Time", "executionTime"],
    ]),
  },
  upload: {
    title: "Upload to Enovia",
    endpoint: "/audit/upload-to-enovia-logs",
    jsonUsecase: "upload-to-enovia-logs",
    summary: ["Total Upload", "Total Success", "Total Failed"],
    details: "metadata",
    columns: columns([
      ["Transaction ID", "transactionId"],
      ["Requester", "requester"],
      ["Host", "hostName"],
      ["CAD Primary", "cadPrimary"],
      ["CO Name", "coName"],
      ["No. of Parts", "numberOfParts"],
      ["No. of Files", "numberOfFiles"],
      ["Status", "status"],
      ["Request JSON", "request"],
      ["Response JSON", "response"],
      ["Request Timestamp", "reqTs"],
      ["Response Timestamp", "resTs"],
      ["Enovia Time", "executionTime"],
    ]),
  },
  backflow: {
    title: "Backflow",
    endpoint: "/audit/backflow-logs",
    summary: [],
    columns: columns([
      ["Transaction ID", "transactionId"],
      ["Part Name", "enoviaObjectTnr"],
      ["PDM Vault", "cadPrimary"],
      ["JSON Data", "jsonData"],
      ["Enovia Update Timestamp", "enoviaUpdateTimestamp"],
      ["PDM Update Timestamp", "pdmUpdateTimestamp"],
      ["PDM Update Status", "pdmUpdateStatus"],
      ["PDM Update Message", "pdmUpdateError"],
    ]),
  },
  search: {
    title: "Search",
    endpoint: "/audit/search-logs",
    jsonUsecase: "search-logs",
    details: "component",
    columns: columns([
      ["Transaction ID", "transactionId"],
      ["Requester", "requester"],
      ["Host", "hostName"],
      ["CAD Primary", "cadPrimary"],
      ["No. of Parts", "searchcount"],
      ["Status", "status"],
      ["Error", "message"],
      ["Request JSON", "request"],
      ["Request Timestamp", "reqTs"],
      ["Response Timestamp", "resTs"],
      ["Enovia Time", "executionTime"],
    ]),
  },
  "higher-dash": {
    title: "Get Higher Dash",
    endpoint: "/audit/get-high-dash-logs",
    jsonUsecase: "get-high-dash-logs",
    details: "component",
    columns: columns([
      ["Transaction ID", "transactionId"],
      ["Requester", "requester"],
      ["CAD Primary", "cadPrimary"],
      ["Part Number", "partNumber"],
      ["Part Revision", "partRev"],
      ["Status", "status"],
      ["Error", "message"],
      ["Request JSON", "request"],
      ["Response JSON", "response"],
      ["Request Timestamp", "reqTs"],
      ["Response Timestamp", "resTs"],
      ["Enovia Time", "executionTime"],
    ]),
  },
  "get-co": {
    title: "Enovia Get CO",
    endpoint: "/audit/query-co-logs",
    jsonUsecase: "query-co-logs",
    details: "component",
    columns: columns([
      ["Transaction ID", "transactionId"],
      ["Requester", "requester"],
      ["CAD Primary", "cadPrimary"],
      ["Status", "status"],
      ["Error", "message"],
      ["Request JSON", "request"],
      ["CO Count", "fetchedCo"],
      ["Request Timestamp", "reqTs"],
      ["Response Timestamp", "resTs"],
      ["Enovia Time", "executionTime"],
    ]),
  },
  "enovia-projects": {
    title: "Enovia Projects",
    endpoint: "/audit/get-enovia-project-logs",
    details: "component",
    columns: columns([
      ["Transaction ID", "transactionId"],
      ["Requester", "requester"],
      ["CAD Primary", "cadPrimary"],
      ["Project Count", "successCount"],
      ["Status", "status"],
      ["Error", "message"],
      ["Request Timestamp", "reqTs"],
      ["Response Timestamp", "resTs"],
      ["Enovia Time", "executionTime"],
    ]),
  },
  "enovia-manufacturers": {
    title: "Enovia Manufacturers",
    endpoint: "/audit/get-enovia-manufacturer-logs",
    details: "component",
    columns: columns([
      ["Transaction ID", "transactionId"],
      ["Requester", "requester"],
      ["CAD Primary", "cadPrimary"],
      ["From Modified Date", "lastTransactionDate"],
      ["Manufacturer Count", "successCount"],
      ["Status", "status"],
      ["Error", "message"],
      ["Request Timestamp", "reqTs"],
      ["Response Timestamp", "resTs"],
      ["Enovia Time", "executionTime"],
    ]),
  },
  "edoc-project-logs": {
    title: "EDOC Projects",
    endpoint: "/audit/get-edoc-project-logs",
    details: "component",
    columns: columns([
      ["Transaction ID", "transactionId"],
      ["Requester", "requester"],
      ["CAD Primary", "cadPrimary"],
      ["EDOC Project Count", "fetchedEdocProject"],
      ["Status", "status"],
      ["Error", "message"],
      ["Request Timestamp", "reqTs"],
      ["Response Timestamp", "resTs"],
      ["Enovia Time", "executionTime"],
    ]),
  },
  "part-type-logs": {
    title: "Part Types",
    endpoint: "/audit/get-part-type-logs",
    details: "component",
    columns: columns([
      ["Transaction ID", "transactionId"],
      ["Requester", "requester"],
      ["CAD Primary", "cadPrimary"],
      ["Part Type Count", "fetchedPartTypes"],
      ["Status", "status"],
      ["Error", "message"],
      ["Request Timestamp", "reqTs"],
      ["Response Timestamp", "resTs"],
      ["Enovia Time", "executionTime"],
    ]),
  },
};

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <h2>{title}</h2>
          <button onClick={onClose} aria-label="Close dialog">
            x
          </button>
        </header>
        <div className="modal-content">{children}</div>
      </section>
    </div>
  );
}
function Status({ value }) {
  const label = displayStatus(value);
  return <span className={statusClass(label)}>{label || "UNKNOWN"}</span>;
}
function SortableHeader({ column, sortable, sort, onSort }) {
  if (!sortable) return <th>{column.label}</th>;

  const isSorted = sort.key === column.key;
  return (
    <th aria-sort={isSorted ? `${sort.direction}ending` : "none"}>
      <button
        className="sort-button"
        onClick={() => onSort(column.key)}
        title={`Sort by ${column.label}`}
      >
        {column.label} {isSorted ? (sort.direction === "asc" ? "▲" : "▼") : "↕"}
      </button>
    </th>
  );
}
function Table({
  title,
  columns: tableColumns,
  rows,
  onTransaction,
  onJson,
  onRefresh,
  sortableKeys = [],
  id,
  totalRecords,
}) {
  const [sort, setSort] = useState({ key: "", direction: "asc" });
  const sortedRows = useMemo(() => sortRows(rows, sort), [rows, sort]);
  const fullScreen = () => document.getElementById(id)?.requestFullscreen?.();
  return (
    <section className="panel" id={id}>
      <div className="panel-title">
        <h2>{title}</h2>
        <div className="panel-actions">
          {onRefresh && (
            <button className="refresh-button" onClick={onRefresh}>
              Refresh
            </button>
          )}
          <button
            className="icon-button"
            title="Expand table"
            onClick={fullScreen}
          >
            ⛶
          </button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {tableColumns.map((column) => (
                <SortableHeader
                  key={column.key}
                  column={column}
                  sortable={sortableKeys.includes(column.key)}
                  sort={sort}
                  onSort={(key) => setSort((current) => nextSort(current, key))}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.length ? (
              sortedRows.map((row, index) => (
                <tr
                  key={`${row.transactionId || row.objectId || row.userId || "row"}-${row.instanceId || row.component || index}-${index}`}
                >
                  {tableColumns.map((column) => (
                    <td key={column.key}>
                      {renderCell(row, column, onTransaction, onJson)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={tableColumns.length} className="empty">
                  No records match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        Total records: {totalRecords ?? rows.length}
      </div>
    </section>
  );
}
function renderCell(row, column, onTransaction, onJson) {
  const value = row[column.key];
  if (column.key === "transactionId")
    return onTransaction ? (
      <button className="link-button" onClick={() => onTransaction(value)}>
        {value}
      </button>
    ) : (
      value
    );
  if (column.key === "status" || column.key === "pdmUpdateStatus")
    return <Status value={value} />;
  if (column.key === "request" || column.key === "response")
    return (
      <button
        className="link-button"
        onClick={() =>
          onJson?.(row.transactionId, column.key === "request" ? "req" : "res")
        }
      >
        View
      </button>
    );
  if (column.key === "jsonData")
    return (
      <button
        className="link-button"
        onClick={() => onJson?.(row.transactionId, "data", value)}
      >
        View
      </button>
    );
  if (
    /^(?:reqTs|resTs|timeStamp|updatedAt|createdAt|lastTransactionDate)$/i.test(
      column.key,
    )
  )
    return pstDate(value);
  if (column.key === "executionTime")
    return value === undefined ? "-" : `${value}s`;
  return value === null || value === undefined || value === ""
    ? "-"
    : String(value);
}

function Login({ onLogin }) {
  const [form, setForm] = useState({ userId: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api("/auth/login", {
        method: "POST",
        body: { ...form, ssoAuthenticated: false },
      });
      onLogin(result.token, result.userId || form.userId);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  const signInWithSso = () => {
    if (!config.ssoLoginUrl) {
      setError("SSO login is enabled, but no SSO login URL is configured.");
      return;
    }
    window.location.assign(config.ssoLoginUrl);
  };
  useEffect(() => {
    if (!config.ssoEnabled) return;

    const userId = new URLSearchParams(window.location.search).get("userId");
    if (!userId) return;

    window.history.replaceState({}, "", window.location.pathname);
    const completeSsoLogin = async () => {
      setBusy(true);
      setError("");
      try {
        const result = await api("/auth/login", {
          method: "POST",
          body: { userId, password: "", ssoAuthenticated: true },
        });
        onLogin(result.token, result.userId || userId);
      } catch (reason) {
        setError(reason.message);
      } finally {
        setBusy(false);
      }
    };
    completeSsoLogin();
  }, [onLogin]);
  return (
    <main
      className="login-page"
      style={{ "--login-background": `url(${loginBackground})` }}
    >
      <section className="login-shell">
        <div className="login-hero">
          <div>
            <span className="eyebrow">KLA PDM TO ENOVIA</span>
            <h1>
              Integration
              <br />
              Admin Console
            </h1>
            <p>
              Monitor transactions, manage master data, and keep integration
              operations moving.
            </p>
          </div>
          <span className="hero-footer">Secure administrative access</span>
        </div>
        <form className="login-card" onSubmit={submit}>
          <img className="login-logo" src={klaLogo} alt="KLA" />
          <div className="login-card-title">
            <span>WELCOME BACK</span>
            <h2>Sign in to your console</h2>
            <p>Use your authorized administrator credentials.</p>
          </div>
          {error && <div className="alert error">{error}</div>}
          <label>
            Username
            <input
              autoComplete="username"
              placeholder="Enter your username"
              value={form.userId}
              onChange={(event) =>
                setForm({ ...form, userId: event.target.value })
              }
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
              required
            />
          </label>
          <button className="primary login-submit" disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </button>
          {config.ssoEnabled && (
            <button
              className="primary login-submit"
              type="button"
              onClick={signInWithSso}
              disabled={busy}
            >
              SSO Login
            </button>
          )}
          <small className="login-note">
            Mock mode accepts any non-empty username and password.
          </small>
        </form>
      </section>
    </main>
  );
}

function LogPage({ page }) {
  const [data, setData] = useState({ content: [] });
  const [query, setQuery] = useState("");
  const [localStatus, setLocalStatus] = useState("");
  const [server, setServer] = useState({
    from: dateInput(new Date(Date.now() - config.defaultLoadDays * 864e5)),
    to: dateInput(new Date()),
    status: "",
    cadPrimary: "",
  });
  const [selection, setSelection] = useState(null);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setData(
        await api(page.endpoint, {
          query: {
            startDate: toApiDate(server.from),
            endDate: toApiDate(server.to),
            status: server.status,
            cadPrimary: server.cadPrimary,
          },
        }),
      );
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  };
   useEffect(() => {
     load();
   }, []); // Initial dashboard load uses the configurable date range.



  useEffect(() => {
    if (!selection) return;

    const details = document.getElementById("transaction-details");
    details?.scrollIntoView({ behavior: "smooth", block: "start" });
    details?.focus({ preventScroll: true });
  }, [selection]);
  const rows = useMemo(
    () =>
      (data.content || []).filter(
        (row) =>
          (!localStatus ||
            displayStatus(row.status).toUpperCase() === localStatus ||
            displayStatus(row.pdmUpdateStatus).toUpperCase() === localStatus) &&
          JSON.stringify(row).toLowerCase().includes(query.toLowerCase()),
      ),
    [data, query, localStatus],
  );
  const selectTransaction = async (transactionId) => {
    if (!page.details) return;
    try {
      const result = await api(
        page.details === "metadata"
          ? `${page.endpoint}/metadata/${transactionId}`
          : `/audit/component-logs/transaction/${transactionId}`,
      );
      setSelection((current) => ({
        transactionId,
        data: result.data || result,
        version: (current?.version || 0) + 1,
      }));
    } catch (reason) {
      setError(reason.message);
    }
  };
  const showJson = async (transactionId, type, inlineValue) => {
    if (inlineValue) {
      try {
        setModal({ title: "JSON Data", value: JSON.parse(inlineValue) });
      } catch {
        setModal({ title: "JSON Data", value: inlineValue });
      }
      return;
    }
    try {
      setModal({
        title: `${type === "req" ? "Request" : "Response"} JSON`,
        value: await getJsonPayload(page.jsonUsecase, transactionId, type),
      });
    } catch (reason) {
      setError(reason.message);
    }
  };
  const cards = (page.summary || []).map((label, index) => (
    <div className="metric" key={label}>
      <span>{label}</span>
      <strong>
        {[data.total, data.success, data.partial, data.fail][index] || 0}
      </strong>
    </div>
  ));
  return (
    <section className="log-page">
      <div className="log-page-controls">
        {cards.length > 0 && <div className="metrics">{cards}</div>}
        <Filters
          server={server}
          setServer={setServer}
          onSearch={load}
          query={query}
          setQuery={setQuery}
          localStatus={localStatus}
          setLocalStatus={setLocalStatus}
          onReset={() => {
            setQuery("");
            setLocalStatus("");
          }}
          includePartialStatus={page.title === "Create Part"}
        />
        {error && <div className="alert error">{error}</div>}
      </div>
      <div className="log-page-results">
        {loading ? (
          <div className="loading">Loading transactions...</div>
        ) : (
          <Table
            id={`table-${page.title}`}
            title={`${page.title} Transactions`}
            columns={page.columns}
            rows={rows}
            onTransaction={page.details ? selectTransaction : undefined}
            onJson={showJson}
            onRefresh={load}
            totalRecords={data.totalElements ?? data.total ?? data.content?.length}
          />
        )}
        {selection && (
          <Details
            key={selection.version}
            page={page}
            selection={selection}
          />
        )}
      </div>
      {modal && (
        <Modal title={modal.title} onClose={() => setModal(null)}>
          <pre>
            {typeof modal.value === "string"
              ? modal.value
              : JSON.stringify(modal.value, null, 2)}
          </pre>
        </Modal>
      )}
    </section>
  );
}
function PageHeading({ title, subtitle, actions }) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions}
    </div>
  );
}
function Filters({
  server,
  setServer,
  onSearch,
  query,
  setQuery,
  localStatus,
  setLocalStatus,
  onReset,
  includeStatus = true,
  includePartialStatus = false,
}) {
  return (
    <section className="panel filters">
      <div>
        <h2>Filters</h2>
        <div className="filter-grid">
          <label>
            From date
            <input
              type="date"
              value={server.from}
              onChange={(event) =>
                setServer({ ...server, from: event.target.value })
              }
            />
          </label>
          <label>
            To date
            <input
              type="date"
              value={server.to}
              onChange={(event) =>
                setServer({ ...server, to: event.target.value })
              }
            />
          </label>
          {includeStatus && (
            <label>
              Server status
              <select
                value={server.status}
                onChange={(event) =>
                  setServer({ ...server, status: event.target.value })
                }
              >
                <option value="">All</option>
                <option>SUCCESS</option>
                {includePartialStatus && <option>PARTIAL</option>}
                <option value="FAILED">FAILED</option>
                <option>RUNNING</option>
              </select>
            </label>
          )}
          <label>
            PDM Vault
            <select
              value={server.cadPrimary}
              onChange={(event) =>
                setServer({ ...server, cadPrimary: event.target.value })
              }
            >
              <option value="">All</option>
              {config.cadPrimaryValues.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <button className="primary" onClick={onSearch}>
            Search
          </button>
        </div>
      </div>
      <div className="filter-grid local">
        <label>
          Browser search
          <input
            placeholder="Search loaded data"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {includeStatus && (
          <label>
            Browser status
            <select
              value={localStatus}
              onChange={(event) => setLocalStatus(event.target.value)}
            >
              <option value="">All</option>
              <option>SUCCESS</option>
              {includePartialStatus && <option>PARTIAL</option>}
              <option value="FAILED">FAILED</option>
              <option>RUNNING</option>
            </select>
          </label>
        )}
        <button onClick={onReset}>Reset</button>
      </div>
    </section>
  );
}
function Details({ page, selection }) {
  const info = selection.data;
  const parts = info.parts || [];
  const logs = info.componentLogs || (Array.isArray(info) ? info : []);
  const partColumns =
    page.title === "Upload to Enovia"
      ? columns([
          ["Transaction ID", "transactionId"],
          ["Instance ID", "instanceId"],
          ["Part Number", "partNumber"],
          ["Part Revision", "partRev"],
          ["File Name(s)", "fileNames"],
          ["CAD Identifier", "cadUniqueIdentifier"],
          ["PDM Update Status", "pdmStatus"],
          ["PDM Update Message", "pdmMessage"],
          ["Status", "status"],
          ["Message", "message"],
        ])
      : columns([
          ["Transaction ID", "transactionId"],
          ["Instance ID", "instanceId"],
          ["Part Number", "partNumber"],
          ["File Name", "fileName"],
          ["Project", "project"],
          ["MFR", "mfr"],
          ["Status", "status"],
          ["Error", "msg"],
        ]);
  const logColumns = columns([
    ["Transaction ID", "transactionId"],
    ["Component", "component"],
    ["Status", "status"],
    ["Message", "msg"],
    ["Timestamp", "timeStamp"],
  ]);
  return (
    <div
      id="transaction-details"
      className="details transaction-details-focus"
      tabIndex={-1}
    >
      <h2>
        Transaction details: <span>{selection.transactionId}</span>
      </h2>
      {parts.length > 0 && (
        <Table
          id="part-details"
          title={
            page.title === "Upload to Enovia"
              ? "Upload Files Transaction Details"
              : "Part Transaction Details"
          }
          columns={partColumns}
          rows={parts}
        />
      )}
      {logs.length > 0 && (
        <Table
          id="component-logs"
          title="Component Logs"
          columns={logColumns}
          rows={logs}
        />
      )}
    </div>
  );
}

function ManagePartTypes() {
  const [response, setResponse] = useState({ partTypes: [] });
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [modal, setModal] = useState(false);
  const [notice, setNotice] = useState("");
  const [sort, setSort] = useState({ key: "", direction: "asc" });
  const load = async () => setResponse(await api("/part-types"));
  useEffect(() => {
    load();
  }, []);
  const rows = useMemo(
    () =>
      response.partTypes
        .flatMap((part) => [
          part,
          ...(expanded[part.objectId]
            ? (part.subPartTypes || []).map((child) => ({ ...child, level: 1 }))
            : []),
        ])
        .filter((part) =>
          part.partTypeName.toLowerCase().includes(query.toLowerCase()),
        ),
    [response, expanded, query],
  );
  const toggle = (id) =>
    setSelected((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    );
  const update = async (isCad) => {
    const payload = selected.map((objectId) => ({ objectId, isCad }));
    const result = await api("/part-types/bulk-update", {
      method: "PUT",
      body: payload,
    });
    setNotice(
      `${result.updatedCount || payload.length} part type(s) updated successfully.`,
    );
    setSelected([]);
    setModal(false);
    await load();
  };
  const tableColumns = columns([
    ["Select", "select"],
    ["Object ID", "objectId"],
    ["Part Type", "partTypeName"],
    ["SAP Material Type", "sapMaterialType"],
    ["Is CAD", "isCad"],
    ["State", "partTypeState"],
    ["Updated Date", "updatedAt"],
    ["Updated By", "updatedBy"],
  ]);
  const sortedRows = useMemo(() => sortRows(rows, sort), [rows, sort]);
  const sortableKeys = ["partTypeName", "sapMaterialType", "isCad", "partTypeState"];
  const selectableIds = sortedRows
    .filter((part) => Boolean(part.sapMaterialType))
    .map((part) => part.objectId);
  const allVisibleSelected =
    selectableIds.length > 0 &&
    selectableIds.every((objectId) => selected.includes(objectId));
  const expandableIds = response.partTypes
    .filter((part) => part.subPartTypes?.length)
    .map((part) => part.objectId);
  const toggleAllVisible = () =>
    setSelected((items) =>
      allVisibleSelected
        ? items.filter((objectId) => !selectableIds.includes(objectId))
        : [...new Set([...items, ...selectableIds])],
    );
  const expandAll = () =>
    setExpanded(Object.fromEntries(expandableIds.map((objectId) => [objectId, true])));
  return (
    <>
      <PageHeading
        title="Manage Part Types"
        subtitle={`Total Part Types: ${(response.totalCad || 0) + (response.totalNonCad || 0)} | CAD: ${response.totalCad || 0} | Non-CAD: ${response.totalNonCad || 0}`}actions={
          <button
            className="primary"
            disabled={!selected.length}
            onClick={() => setModal(true)}
          >
            Edit selected ({selected.length})
          </button>
        }
      />
      {notice && <div className="alert success">{notice}</div>}
      <section className="panel inline-filters">
        <label>
          Search part type
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button onClick={() => setQuery("")}>Reset</button>
      </section>
      <section className="panel" id="manage-part-types">
        <div className="panel-title">
          <h2>Part Type Management</h2>
          <div className="panel-actions">
            <button onClick={load}>Refresh</button>
            <button onClick={expandAll} disabled={!expandableIds.length}>
              Expand all
            </button>
            <button onClick={() => setExpanded({})} disabled={!expandableIds.length}>
              Collapse all
            </button>
            <button
              className="icon-button"
              onClick={() =>
                document
                  .getElementById("manage-part-types")
                  ?.requestFullscreen?.()
              }
            >
              ⛶
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {tableColumns.map((column) =>
                  column.key === "select" ? (
                    <th key={column.key}>
                      <input
                        type="checkbox"
                        aria-label="Select all visible part types"
                        checked={allVisibleSelected}
                        disabled={!selectableIds.length}
                        onChange={toggleAllVisible}
                        title="Select all visible part types"
                      />
                    </th>
                  ) : (
                    <SortableHeader
                      key={column.key}
                      column={column}
                      sortable={sortableKeys.includes(column.key)}
                      sort={sort}
                      onSort={(key) => setSort((current) => nextSort(current, key))}
                    />
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => {
                const selectable = Boolean(row.sapMaterialType);
                return (
                  <tr key={row.objectId}>
                    <td>
                      <input
                        type="checkbox"
                        disabled={!selectable}
                        checked={selected.includes(row.objectId)}
                        onChange={() => toggle(row.objectId)}
                        title={
                          selectable
                            ? ""
                            : "Part types without SAP Material Type cannot be updated"
                        }
                      />
                    </td>
                    <td>{row.objectId}</td>
                    <td className={`tree level-${row.level || 0}`}>
                      {row.subPartTypes?.length > 0 && (
                        <button
                          className="tree-toggle"
                          onClick={() =>
                            setExpanded({
                              ...expanded,
                              [row.objectId]: !expanded[row.objectId],
                            })
                          }
                        >
                          {expanded[row.objectId] ? "−" : "+"}
                        </button>
                      )}
                      {row.partTypeName}
                    </td>
                    <td>{row.sapMaterialType || "-"}</td>
                    <td>{row.isCad ? "CAD" : "Non-CAD"}</td>
                    <td>{row.partTypeState}</td>
                    <td>{pstDate(row.updatedAt)}</td>
                    <td>{row.updatedBy || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      {modal && (
        <Modal title="Update CAD / Non-CAD" onClose={() => setModal(false)}>
          <p>Update {selected.length} selected part type(s).</p>
          <div className="dialog-actions">
            <button className="primary" onClick={() => update(true)}>
              Set CAD
            </button>
            <button onClick={() => update(false)}>Set Non-CAD</button>
          </div>
        </Modal>
      )}
    </>
  );
}
function ManageEdocProjects() {
  const [data, setData] = useState({ edocProjects: [] });
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const load = async () => setData(await api("/edoc-projects"));
  useEffect(() => {
    load();
  }, []);
  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setNotice("Only CSV files can be imported.");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    const result = await api("/upload/edoc-project", {
      method: "POST",
      body: form,
    });
    setNotice(result.message || "EDOC project import completed successfully.");
    event.target.value = "";
    await load();
  };
  const rows = data.edocProjects.filter((item) =>
    JSON.stringify(item).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        title="Manage EDOC Projects"
        subtitle={`Total EDOC Projects: ${data.projectcount || data.edocProjects.length}`}
        actions={
          <label className="primary file-button">
            Import EDOC Project
            <input type="file" accept=".csv,text/csv" onChange={upload} />
          </label>
        }
      />
      {notice && <div className="alert success">{notice}</div>}
      <section className="panel inline-filters">
        <label>
          Search projects
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button onClick={() => setQuery("")}>Reset</button>
      </section>
      <Table
        id="edoc-projects"
        title="EDOC Projects"
        rows={rows}
        onRefresh={load}
        sortableKeys={[
          "edocProjectId",
          "edocProjectName",
          "regionId",
          "regionName",
          "divId",
          "divName",
          "plmProject",
        ]}
        columns={columns([
          ["Project Number", "edocProjectId"],
          ["Project Name", "edocProjectName"],
          ["Region", "regionId"],
          ["Region Name", "regionName"],
          ["Div Num", "divId"],
          ["Div Name", "divName"],
          ["PLM Project", "plmProject"],
          ["PN List", "pnlist"],
          ["Updated By", "updatedBy"],
          ["Updated At", "updatedAt"],
        ])}
      />
    </>
  );
}
function Users() {
  const [data, setData] = useState({ content: [] });
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(null);
  const [notice, setNotice] = useState("");
  const load = async () => setData(await api("/users"));
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
if (!notice) return;

const timer = setTimeout(() => {
setNotice("");
}, 3000);

return () => clearTimeout(timer);
}, [notice]);
  const save = async (event) => {
    event.preventDefault();
    const isNew = !form.existing;
    const { existing, userId, role, ...user } = form;
    await api(isNew ? "/users" : "/users", {
      method: isNew ? "POST" : "PUT",
      query: isNew ? undefined : { userId },
      body: isNew ? { userId, role, ...user } : user,
    });
    setForm(null);
    setNotice(`User ${isNew ? "created" : "updated"} successfully.`);
    await load();
  };
  const remove = async (userId) => {
    if (!window.confirm(`Delete user ${userId}?`)) return;
    await api(`/users/${userId}`, { method: "DELETE" });
    setNotice("User deleted successfully.");
    await load();
  };
  const rows = data.content.filter((item) =>
    JSON.stringify(item).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        title="Users"
        subtitle="Manage authorized Admin Console users."
        actions={
          <button
            className="primary"
            onClick={() =>
              setForm({
                userId: "",
                firstName: "",
                lastName: "",
                email: "",
                role: "ADMIN",
                isActive: true,
                existing: false,
              })
            }
          >
            Add user
          </button>
        }
      />
      {notice && <div className="alert success">{notice}</div>}
      <section className="panel inline-filters">
        <label>
          Search users
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button onClick={() => setQuery("")}>Reset</button>
      </section>
      <section className="panel">
        <div className="panel-title">
          <h2>Users</h2>
          <button onClick={load}>Refresh</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {[
                  "User ID",
                  "First Name",
                  "Last Name",
                  "Email",
                  "Role",
                  "Active",
                  "Created At",
                  "Updated By",
                  "Updated At",
                  "Actions",
                ].map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((user) => (
                <tr key={user.userId}>
                  <td>{user.userId}</td>
                  <td>{user.firstName}</td>
                  <td>{user.lastName}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <Status value={user.isActive ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td>{pstDate(user.createdAt)}</td>
                  <td>{user.updatedBy || "-"}</td>
                  <td>{pstDate(user.updatedAt)}</td>
                  <td>
                    <button
                      className="link-button"
                      onClick={() => setForm({ ...user, existing: true })}
                    >
                      Update
                    </button>{" "}
                    <button
                      className="danger-link"
                      onClick={() => remove(user.userId)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {form && (
        <Modal
          title={form.existing ? "Update User" : "Add User"}
          onClose={() => setForm(null)}
        >
          <form className="form-grid" onSubmit={save}>
            <label>
              User ID
              <input
                disabled={form.existing}
                value={form.userId}
                onChange={(event) =>
                  setForm({ ...form, userId: event.target.value })
                }
                required
              />
            </label>
            <label>
              First name
              <input
                value={form.firstName}
                onChange={(event) =>
                  setForm({ ...form, firstName: event.target.value })
                }
                required
              />
            </label>
            <label>
              Last name
              <input
                value={form.lastName}
                onChange={(event) =>
                  setForm({ ...form, lastName: event.target.value })
                }
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                required
              />
            </label>
            <label>
              Role
              <select
                value={form.role}
                onChange={(event) =>
                  setForm({ ...form, role: event.target.value })
                }
              >
                <option>ADMIN</option>
              </select>
            </label>
            <label>
              Active
              <select
                value={String(form.isActive)}
                onChange={(event) =>
                  setForm({ ...form, isActive: event.target.value === "true" })
                }
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>
            <button className="primary">Save</button>
          </form>
        </Modal>
      )}
    </>
  );
}

const navGroups = [
  {
    label: "KLA PDM to ENOVIA Integration",
    items: [
      ["create-part", "Create Part"],
      ["dashroll", "Dashroll"],
      ["upload", "Upload to Enovia"],
      ["backflow", "Backflow"],
      ["search", "Search"],
    ],
  },
  {
    label: "Master Data",
    items: [
      ["higher-dash", "Get High Dash"],
      ["get-co", "Get CO"],
      ["enovia-projects", "Enovia Projects"],
      ["enovia-manufacturers", "Enovia Manufacturers"],
      ["part-type-logs", "Part Types"],
      ["edoc-project-logs", "EDOC Projects"],
    ],
  },
  {
    label: "Manage Master Data",
    items: [
      ["manage-part-types", "Part Types"],
      ["manage-edoc-projects", "EDOC Projects"],
      ["users", "Users"],
    ],
  },
];
function App() {
  const [auth, setAuth] = useState(() => ({
    token: localStorage.getItem("adminConsoleToken"),
    user: localStorage.getItem("adminConsoleUser"),
  }));
  const [pageId, setPageId] = useState("create-part");
  const [collapsed, setCollapsed] = useState(false);
  const [groups, setGroups] = useState({ 0: true, 1: true, 2: true });
  const login = (token, user) => {
    localStorage.setItem("adminConsoleToken", token);
    localStorage.setItem("adminConsoleUser", user);
    setAuth({ token, user });
  };
  const logout = () => {
    localStorage.removeItem("adminConsoleToken");
    localStorage.removeItem("adminConsoleUser");
    setAuth({ token: null, user: null });
  };
  useEffect(() => {
    if (!auth.token) return undefined;
    let timer;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(logout, config.sessionTimeoutMinutes * 60_000);
    };
    ["click", "keydown", "mousemove"].forEach((event) =>
      window.addEventListener(event, reset),
    );
    reset();
    return () => {
      clearTimeout(timer);
      ["click", "keydown", "mousemove"].forEach((event) =>
        window.removeEventListener(event, reset),
      );
    };
  }, [auth.token]);
  if (!auth.token) return <Login onLogin={login} />;
  const logPage = logPages[pageId];
  const content = logPage ? (
    <LogPage key={pageId} page={logPage} />
  ) : pageId === "manage-part-types" ? (
    <ManagePartTypes />
  ) : pageId === "manage-edoc-projects" ? (
    <ManageEdocProjects />
  ) : (
    <Users />
  );
  return (
    <div className={`app-shell ${collapsed ? "collapsed" : ""}`}>
      <aside>
        <div className="brand">
          <span>KLA PDM Integration</span>
          <button
            onClick={() => setCollapsed(!collapsed)}
            title="Collapse navigation"
          >
            ☰
          </button>
        </div>
        <nav>
          {navGroups.map((group, index) => (
            <div className="nav-group" key={group.label}>
              <button
                className="nav-heading"
                onClick={() =>
                  setGroups({ ...groups, [index]: !groups[index] })
                }
              >
                <span>{group.label}</span>
                <i>{groups[index] ? "⌄" : "›"}</i>
              </button>
              {groups[index] &&
                group.items.map(([id, label]) => (
                  <button
                    key={id}
                    className={pageId === id ? "active" : ""}
                    onClick={() => setPageId(id)}
                  >
                    <span>{label.slice(0, 1)}</span>
                    <em>{label}</em>
                  </button>
                ))}
            </div>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-context">
            <span className="topbar-brand">Admin Console</span>
            {logPage && (
              <PageHeading
                title={logPage.title}
                subtitle="Audit transactions and integration activity."
              />
            )}
          </div>
          <div>
            <span className="user-name">{auth.user}</span>
            <button onClick={logout}>Logout</button>
          </div>
        </header>
        {content}
      </main>
    </div>
  );
}
export default App;