import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route path="/security-events" element={<div>Security Events</div>} />
        <Route path="/incidents" element={<div>Incidents</div>} />
        <Route path="/threat-analytics" element={<div>Threat Analytics</div>} />
        <Route path="/threat-intelligence" element={<div>Threat Intelligence</div>} />
        <Route path="/ai-copilot" element={<div>AI Security Copilot</div>} />
        <Route path="/ml-detection" element={<div>ML Detection</div>} />
        <Route path="/reports" element={<div>Reports</div>} />
        <Route path="/api-integrations" element={<div>API Integrations</div>} />
        <Route path="/settings" element={<div>Settings</div>} />
        <Route path="/super-admin" element={<div>Super Admin</div>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}