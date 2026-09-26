import React, { useEffect, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

type APIKey = {
  id: string;
  name: string;
  key_prefix: string;
  organization_name: string;
  is_active: boolean;
  created_at: string;
  last_used_at?: string | null;
};

function getAuthHeaders() {
  const token = localStorage.getItem("sentinelx_access_token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function ApiIntegrations() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [keyName, setKeyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newKey, setNewKey] = useState("");
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const storedUser = localStorage.getItem("sentinelx_user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  const organizationName =
    currentUser?.organization_name || "Unknown Organization";

  const loadKeys = async () => {
    try {
      setLoadingKeys(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/integrations/api-keys`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load API keys");
      }

      const data = await response.json();
      setKeys(data.api_keys || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load API keys");
    } finally {
      setLoadingKeys(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const generateKey = async () => {
    if (!keyName.trim()) {
      setError("Please enter an integration name.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setNewKey("");

      const response = await fetch(
        `${API_BASE_URL}/api/integrations/api-keys`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name: keyName.trim(),
             organization_name: organizationName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to generate API key");
      }

      setNewKey(data.api_key);
      setSuccess("API key generated successfully.");
      setKeyName("");

      await loadKeys();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate API key"
      );
    } finally {
      setLoading(false);
    }
  };

  const revokeKey = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to revoke this API key?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_BASE_URL}/api/integrations/api-keys/${id}/revoke`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to revoke API key");
      }

      setSuccess("API key revoked successfully.");
      await loadKeys();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to revoke API key"
      );
    }
  };

  const copyKey = async () => {
  if (!newKey) return;

  try {
    await navigator.clipboard.writeText(newKey);
    setSuccess("API key copied to clipboard.");
    setError("");
  } catch {
    setError("Could not copy API key.");
  }
};

const copyGeneratedKey = async (keyId: string) => {
  if (!newKey) return;

  try {
    await navigator.clipboard.writeText(newKey);
    setCopiedKeyId(keyId);
    setSuccess("API key copied to clipboard.");
    setError("");

    setTimeout(() => {
      setCopiedKeyId(null);
    }, 2000);
  } catch {
    setError("Could not copy API key.");
  }
};

  return (
    <div
      style={{
        padding: "30px",
        color: "#f5f7fb",
        minHeight: "100%",
      }}
    >
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "28px",
            fontWeight: 700,
          }}
        >
          API Integrations
        </h1>

        <p
          style={{
            marginTop: "8px",
            color: "#9ca3af",
            fontSize: "14px",
          }}
        >
          Connect your website or application with SentinelX security
          monitoring.
        </p>
      </div>

      {/* Organization */}
      <div
        style={{
          background: "#111827",
          border: "1px solid #1f2937",
          borderRadius: "14px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            color: "#9ca3af",
            marginBottom: "7px",
          }}
        >
          ORGANIZATION
        </div>

        <div
          style={{
            fontSize: "18px",
            fontWeight: 600,
          }}
        >
          {organizationName}
        </div>
      </div>

      {/* Generate API Key */}
      <div
        style={{
          background: "#111827",
          border: "1px solid #1f2937",
          borderRadius: "14px",
          padding: "24px",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            margin: "0 0 8px",
            fontSize: "19px",
          }}
        >
          Generate API Key
        </h2>

        <p
          style={{
            margin: "0 0 20px",
            color: "#9ca3af",
            fontSize: "14px",
          }}
        >
          Create an API key for your website or application.
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            maxWidth: "650px",
          }}
        >
          <input
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="Example: Production Website"
            style={{
              flex: 1,
              background: "#0b1220",
              border: "1px solid #374151",
              borderRadius: "9px",
              padding: "12px 14px",
              color: "#fff",
              outline: "none",
            }}
          />

          <button
            onClick={generateKey}
            disabled={loading}
            style={{
              border: "none",
              borderRadius: "9px",
              padding: "0 20px",
              background: "#2563eb",
              color: "#fff",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Generating..." : "Generate Key"}
          </button>
        </div>
      </div>

      {/* New API Key */}
      {newKey && (
        <div
          style={{
            background: "#10251b",
            border: "1px solid #166534",
            borderRadius: "14px",
            padding: "24px",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              margin: "0 0 8px",
              fontSize: "18px",
            }}
          >
            ⚠️ Your New API Key
          </h2>

          <p
            style={{
              color: "#a7f3d0",
              fontSize: "13px",
              marginBottom: "15px",
            }}
          >
            This is the only time the complete API key will be shown.
            Store it securely.
          </p>

          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <code
              style={{
                flex: 1,
                background: "#07140d",
                border: "1px solid #166534",
                borderRadius: "8px",
                padding: "13px",
                fontSize: "13px",
                wordBreak: "break-all",
              }}
            >
              {newKey}
            </code>

            <button
              onClick={copyKey}
              style={{
                border: "1px solid #374151",
                background: "#111827",
                color: "#fff",
                borderRadius: "8px",
                padding: "12px 16px",
                cursor: "pointer",
              }}
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      {success && (
        <div
          style={{
            background: "#0f2a1c",
            border: "1px solid #166534",
            color: "#86efac",
            padding: "12px 15px",
            borderRadius: "9px",
            marginBottom: "15px",
            fontSize: "14px",
          }}
        >
          {success}
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#2a1111",
            border: "1px solid #7f1d1d",
            color: "#fca5a5",
            padding: "12px 15px",
            borderRadius: "9px",
            marginBottom: "15px",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {/* Existing Keys */}
      <div
        style={{
          background: "#111827",
          border: "1px solid #1f2937",
          borderRadius: "14px",
          padding: "24px",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            margin: "0 0 18px",
            fontSize: "19px",
          }}
        >
          API Keys
        </h2>

        {loadingKeys ? (
          <div style={{ color: "#9ca3af" }}>Loading API keys...</div>
        ) : keys.length === 0 ? (
          <div
            style={{
              padding: "25px",
              textAlign: "center",
              color: "#9ca3af",
              border: "1px dashed #374151",
              borderRadius: "10px",
            }}
          >
            No API keys found.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>API Key</th>
                  <th style={thStyle}>Organization</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Created</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>

              <tbody>
                {keys.map((key) => (
                  <tr key={key.id}>
                    <td style={tdStyle}>{key.name}</td>

                    <td style={tdStyle}>
                      <code
                        style={{
                          color: "#93c5fd",
                        }}
                      >
                        {key.key_prefix}••••••••
                      </code>
                    </td>

                    <td style={tdStyle}>{key.organization_name}</td>

                    <td style={tdStyle}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "5px 9px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          background: key.is_active
                            ? "#064e3b"
                            : "#3f3f46",
                          color: key.is_active ? "#6ee7b7" : "#a1a1aa",
                        }}
                      >
                        {key.is_active ? "Active" : "Revoked"}
                      </span>
                    </td>

                    <td style={tdStyle}>
                      {new Date(key.created_at).toLocaleString()}
                    </td>

<td style={tdStyle}>
  <div
    style={{
      display: "flex",
      gap: "8px",
      alignItems: "center",
    }}
  >
    {newKey.startsWith(key.key_prefix) && (
      <button
        onClick={() => copyGeneratedKey(key.id)}
        style={{
          border: "1px solid #1d4ed8",
          background: "#172554",
          color: "#93c5fd",
          borderRadius: "7px",
          padding: "7px 11px",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        {copiedKeyId === key.id ? "Copied ✓" : "Copy"}
      </button>
    )}

    {key.is_active && (
      <button
        onClick={() => revokeKey(key.id)}
        style={{
          border: "1px solid #7f1d1d",
          background: "#2a1111",
          color: "#fca5a5",
          borderRadius: "7px",
          padding: "7px 11px",
          cursor: "pointer",
        }}
      >
        Revoke
      </button>
    )}
  </div>
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Integration Guide */}
      <div
        style={{
          background: "#111827",
          border: "1px solid #1f2937",
          borderRadius: "14px",
          padding: "24px",
        }}
      >
        <h2
          style={{
            margin: "0 0 10px",
            fontSize: "19px",
          }}
        >
          Integration Guide
        </h2>

        <p
          style={{
            color: "#9ca3af",
            fontSize: "14px",
            lineHeight: 1.6,
          }}
        >
          Integrate SentinelX with your application backend. Your application
          automatically sends security events to SentinelX whenever relevant
          activities occur.
        </p>

        <div
          style={{
            marginTop: "18px",
            background: "#0b1220",
            borderRadius: "10px",
            padding: "18px",
            border: "1px solid #1f2937",
          }}
        >
          <div
            style={{
              color: "#60a5fa",
              fontWeight: 600,
              marginBottom: "10px",
            }}
          >
            Endpoint
          </div>

          <code
            style={{
              fontSize: "13px",
              color: "#d1d5db",
            }}
          >
            POST {API_BASE_URL}/api/events/ingest
          </code>

          <div
            style={{
              color: "#60a5fa",
              fontWeight: 600,
              marginTop: "18px",
              marginBottom: "10px",
            }}
          >
            Authentication
          </div>

          <code
            style={{
              fontSize: "13px",
              color: "#d1d5db",
            }}
          >
            X-API-Key: YOUR_API_KEY
          </code>

          <div
            style={{
              color: "#60a5fa",
              fontWeight: 600,
              marginTop: "18px",
              marginBottom: "10px",
            }}
          >
            Example Event
          </div>

          <pre
            style={{
              margin: 0,
              padding: "15px",
              background: "#050a12",
              borderRadius: "8px",
              overflowX: "auto",
              color: "#d1d5db",
              fontSize: "12px",
              lineHeight: 1.6,
            }}
          >
{`{
  "event_type": "failed_login",
  "source_ip": "203.0.113.10",
  "username": "user@example.com",
  "device": "Chrome / Windows",
  "location": "Pune, India",
  "description": "Failed login attempt"
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "1px solid #374151",
  color: "#9ca3af",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "13px 12px",
  borderBottom: "1px solid #1f2937",
  color: "#e5e7eb",
  verticalAlign: "middle",
};