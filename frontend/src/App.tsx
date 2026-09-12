import './App.css'
import { useEffect, useState } from 'react'

const API_BASE_URL = 'http://127.0.0.1:8000'

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('sentinelx_access_token')

  return token
    ? {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    : {
        'Content-Type': 'application/json',
      }
}

function App() {
  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem('sentinelx_access_token')
  )
  const [currentUser, setCurrentUser] = useState<{
    username: string
    email: string
    role: string
  } | null>(() => {
    const savedUser = localStorage.getItem('sentinelx_user')
    try {
      return savedUser ? JSON.parse(savedUser) : null
    } catch {
      return null
    }
  })

  const currentRole = currentUser?.role || 'viewer'
  const isAdmin = currentRole === 'admin'
  const isAnalyst = currentRole === 'analyst'
  const isViewer = currentRole === 'viewer'

  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const [dashboardStats, setDashboardStats] = useState({
    total_events: 0,
    threats_detected: 0,
    critical_threats: 0,
    blocked_ips: 0,
    critical_count: 0,
    high_count: 0,
    medium_count: 0,
    low_count: 0,
  })

  const [incidents, setIncidents] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])

  // Security Events
  const [securityEvents, setSecurityEvents] = useState<any[]>([])
  const [eventSearch, setEventSearch] = useState('')
  const [eventSeverity, setEventSeverity] = useState('all')
  const [eventType, setEventType] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)

  // AI Security Copilot state
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<string>('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string>('')
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [statusError, setStatusError] = useState<string>('')

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!loginUsername.trim() || !loginPassword) {
      setLoginError('Please enter your username and password.')
      return
    }

    setLoginLoading(true)
    setLoginError('')

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: loginUsername.trim(),
            password: loginPassword,
          }),
        }
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.detail || 'Invalid username or password.')
      }

      if (!data?.access_token || !data?.user) {
        throw new Error('Invalid login response from SentinelX API.')
      }

      localStorage.setItem('sentinelx_access_token', data.access_token)
      localStorage.setItem('sentinelx_user', JSON.stringify(data.user))

      setAccessToken(data.access_token)
      setCurrentUser(data.user)
      setLoginPassword('')
    } catch (error) {
      console.error('SentinelX login failed:', error)
      setLoginError(
        error instanceof Error
          ? error.message
          : 'Unable to login to SentinelX.'
      )
    } finally {
      setLoginLoading(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('sentinelx_access_token')
    localStorage.removeItem('sentinelx_user')
    setAccessToken(null)
    setCurrentUser(null)
    setLoginUsername('')
    setLoginPassword('')
  }

  useEffect(() => {
    async function loadDashboardStats() {
      try {
        const response = await fetch(
       `${API_BASE_URL}/api/dashboard/stats`,
       {
       headers: getAuthHeaders(),
       }
      )

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()

        console.log('SentinelX Dashboard Stats:', data)

        setDashboardStats(data)
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      }
    }

    async function loadIncidents() {
      try {
        const response = await fetch(
       `${API_BASE_URL}/api/incidents/`,
       {
        headers: getAuthHeaders(),
       }
      )

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()

        console.log('SentinelX Incidents:', data)

        setIncidents(data.incidents)

        // Automatically select the latest incident
        if (data.incidents && data.incidents.length > 0) {
          setSelectedIncident(data.incidents[0])
        }
      } catch (error) {
        console.error('Failed to fetch incidents:', error)
      }
    }

    async function loadActivity() {
      try {
        const response = await fetch(
  `${API_BASE_URL}/api/dashboard/activity`,
  {
    headers: getAuthHeaders(),
  }
)

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()

        console.log('SentinelX Threat Activity:', data)

        setActivity(data.activity)
      } catch (error) {
        console.error('Failed to fetch threat activity:', error)
      }
    }

    async function loadSecurityEvents() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/events/`,
          {
            headers: getAuthHeaders(),
          }
        )

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        console.log('SentinelX Security Events:', data)
        setSecurityEvents(data.events || [])
      } catch (error) {
        console.error('Failed to fetch security events:', error)
      }
    }

    loadDashboardStats()
    loadIncidents()
    loadActivity()
    loadSecurityEvents()
  }, [accessToken])

  if (!accessToken) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'radial-gradient(circle at top right, rgba(66,133,244,0.16), transparent 35%), #070b12',
          color: '#f5f7fb',
          fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '430px',
            padding: '34px',
            borderRadius: '18px',
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'rgba(13,19,31,0.94)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '30px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'grid', placeItems: 'center', fontSize: '24px', fontWeight: 800, background: '#4285F4', color: '#fff' }}>
              S
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '25px' }}>SentinelX</h1>
              <span style={{ fontSize: '12px', opacity: 0.55 }}>Security Operations Center</span>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <p style={{ margin: '0 0 7px', fontSize: '11px', letterSpacing: '0.12em', opacity: 0.55 }}>SECURE ACCESS</p>
            <h2 style={{ margin: 0, fontSize: '28px' }}>Welcome back</h2>
            <p style={{ margin: '8px 0 0', opacity: 0.58, fontSize: '14px' }}>
              Sign in to access the SentinelX security dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <label style={{ display: 'block', marginBottom: '7px', fontSize: '13px', fontWeight: 600 }}>Username</label>
            <input
              type="text"
              value={loginUsername}
              onChange={(event) => setLoginUsername(event.target.value)}
              placeholder="Enter username"
              autoComplete="username"
              disabled={loginLoading}
              style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', marginBottom: '16px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.11)', background: '#0a101b', color: '#fff', outline: 'none' }}
            />

            <label style={{ display: 'block', marginBottom: '7px', fontSize: '13px', fontWeight: 600 }}>Password</label>
            <input
              type="password"
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              disabled={loginLoading}
              style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', marginBottom: '14px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.11)', background: '#0a101b', color: '#fff', outline: 'none' }}
            />

            {loginError && (
              <div style={{ marginBottom: '14px', padding: '11px 12px', borderRadius: '9px', border: '1px solid rgba(255,80,80,0.25)', background: 'rgba(255,80,80,0.08)', fontSize: '13px' }}>
                ⚠ {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              style={{ width: '100%', padding: '13px 16px', border: 0, borderRadius: '9px', background: '#4285F4', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: loginLoading ? 'wait' : 'pointer', opacity: loginLoading ? 0.7 : 1 }}
            >
              {loginLoading ? 'Signing in...' : 'Sign in to SentinelX →'}
            </button>
          </form>

          <div style={{ marginTop: '22px', paddingTop: '17px', borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center', fontSize: '11px', opacity: 0.45 }}>
            Protected Security Operations Environment
          </div>
        </div>
      </div>
    )
  }

  // AI Security Copilot
  async function analyzeIncident(incident: any) {
    if (!incident?.incident_number) {
      return
    }

    setSelectedIncident(incident)
    setAiLoading(true)
    setAiError('')
    setAiAnalysis('')

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/incidents/${encodeURIComponent(
          incident.incident_number
        )}/analyze`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
        }
      )

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`)
      }

      const data = await response.json()

      console.log('SentinelX AI Analysis:', data)

      if (data.ai_analysis?.success) {
        setAiAnalysis(data.ai_analysis.analysis || 'No AI analysis returned.')
      } else {
        setAiError(
          data.ai_analysis?.analysis ||
            'AI Security Copilot is currently unavailable.'
        )
      }
    } catch (error) {
      console.error('Failed to analyze incident:', error)

      setAiError(
        'Unable to connect to SentinelX AI Security Copilot. Make sure the backend and Ollama are running.'
      )
    } finally {
      setAiLoading(false)
    }
  }

  // Incident Management
  async function updateIncidentStatus(incident: any, newStatus: string) {
    if (!incident?.incident_number || !newStatus) {
      return
    }

    setStatusUpdating(true)
    setStatusError('')

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/incidents/${encodeURIComponent(
          incident.incident_number
        )}/status?status=${encodeURIComponent(newStatus)}`,
        {
          method: 'PATCH',
          headers: getAuthHeaders(),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(
          errorData?.detail?.message ||
            errorData?.detail ||
            `Status update failed: ${response.status}`
        )
      }

      const data = await response.json()

      setIncidents((previousIncidents) =>
        previousIncidents.map((item) =>
          item.incident_number === incident.incident_number
            ? { ...item, status: data.status }
            : item
        )
      )

      setSelectedIncident((previousIncident: any) =>
        previousIncident?.incident_number === incident.incident_number
          ? { ...previousIncident, status: data.status }
          : previousIncident
      )
    } catch (error) {
      console.error('Failed to update incident status:', error)
      setStatusError(
        error instanceof Error
          ? error.message
          : 'Unable to update incident status.'
      )
    } finally {
      setStatusUpdating(false)
    }
  }

  const activityPoints = activity
    .map((item, index) => {
      const x =
        (index / Math.max(activity.length - 1, 1)) * 800

      const maxCount = Math.max(
        ...activity.map((a) => a.count),
        1
      )

      const y =
        220 - (item.count / maxCount) * 190

      return `${x},${y}`
    })
    .join(' ')

  const filteredSecurityEvents = securityEvents.filter((event) => {
    const search = eventSearch.trim().toLowerCase()

    const matchesSearch =
      !search ||
      String(event.event_type || '').toLowerCase().includes(search) ||
      String(event.username || '').toLowerCase().includes(search) ||
      String(event.source_ip || '').toLowerCase().includes(search) ||
      String(event.description || '').toLowerCase().includes(search)

    const matchesSeverity =
      eventSeverity === 'all' ||
      String(event.severity || '').toLowerCase() === eventSeverity

    const matchesType =
      eventType === 'all' ||
      String(event.event_type || '').toLowerCase() === eventType

    return matchesSearch && matchesSeverity && matchesType
  })

  const eventTypes = Array.from(
    new Set(
      securityEvents
        .map((event) => event.event_type)
        .filter(Boolean)
    )
  )

  return (
    <div className="app">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">S</div>

          <div>
            <h1>SentinelX</h1>
            <span>Security Operations</span>
          </div>
        </div>

        <nav className="navigation">

          <p className="nav-label">MONITOR</p>

          <button className="nav-item active">
            <span>▦</span>
            Dashboard
          </button>

          <button
            className="nav-item"
            onClick={() =>
              document
                .getElementById('security-events')
                ?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            <span>◉</span>
            Security Events
            <b>{securityEvents.length}</b>
          </button>

          <button className="nav-item">
            <span>⚠</span>
            Incidents
            <b>{incidents.length}</b>
          </button>

          <button
            className="nav-item"
            onClick={() =>
              document
                .getElementById('threat-analytics')
                ?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            <span>▤</span>
            Threat Analytics
          </button>

          <button className="nav-item">
            <span>⌁</span>
            Threat Intelligence
          </button>

          <p className="nav-label">ANALYZE</p>

          {(isAdmin || isAnalyst) && (
            <button
              className="nav-item"
              onClick={() => {
                if (selectedIncident) {
                  analyzeIncident(selectedIncident)
                }
              }}
            >
              <span>◌</span>
              AI Security Copilot
            </button>
          )}

          <button className="nav-item">
            <span>◫</span>
            ML Detection
          </button>

          <button className="nav-item">
            <span>◧</span>
            Reports
          </button>

          <p className="nav-label">SYSTEM</p>

          <button className="nav-item">
            <span>⚙</span>
            Settings
          </button>

        </nav>

        <div className="system-status">
          <div className="status-dot" />

          <div>
            <strong>All systems operational</strong>
            <span>Last sync: 12 sec ago</span>
          </div>
        </div>

      </aside>

      {/* Main Content */}
      <main className="main-content">

        <header className="topbar">

          <div>
            <p className="eyebrow">
              SECURITY OPERATIONS CENTER
            </p>

            <h2>Security Overview</h2>
          </div>

          <div className="topbar-actions">

            <div className="live-status">
              <span />
              LIVE MONITORING
            </div>

            <button className="icon-button">
              ⌕
            </button>

            <button className="icon-button">
              ♧
            </button>

            <div className="profile">

              <div className="avatar">
                AD
              </div>

              <div>
                <strong>{currentUser?.username || 'Security Admin'}</strong>
                <span>
                  {currentUser?.role
                    ? currentUser.role.charAt(0).toUpperCase() +
                      currentUser.role.slice(1)
                    : 'Administrator'}
                </span>
              </div>

            </div>

            <button
              className="icon-button"
              onClick={handleLogout}
              title="Logout"
            >
              ⇥
            </button>

          </div>

        </header>

        {/* Statistics */}
        <section className="stats-grid">

          <div className="stat-card">

            <div className="stat-header">
              <span>Total Events</span>

              <div className="stat-icon blue">
                ◈
              </div>
            </div>

            <strong>
              {dashboardStats.total_events}
            </strong>

            <p className="positive">
              ↑ 12.8%
              <span>vs last 24h</span>
            </p>

          </div>

          <div className="stat-card">

            <div className="stat-header">
              <span>Threats Detected</span>

              <div className="stat-icon orange">
                ⚠
              </div>
            </div>

            <strong>
              {dashboardStats.threats_detected}
            </strong>

            <p className="negative">
              ↑ 8.4%
              <span>vs last 24h</span>
            </p>

          </div>

          <div className="stat-card critical-card">

            <div className="stat-header">
              <span>Critical Threats</span>

              <div className="stat-icon red">
                !
              </div>
            </div>

            <strong>
              {dashboardStats.critical_threats}
            </strong>

            <p className="negative">
              ↑ 3
              <span>since yesterday</span>
            </p>

          </div>

          <div className="stat-card">

            <div className="stat-header">
              <span>Blocked IPs</span>

              <div className="stat-icon purple">
                ⌁
              </div>
            </div>

            <strong>
              {dashboardStats.blocked_ips}
            </strong>

            <p className="positive">
              ↑ 14
              <span>this week</span>
            </p>

          </div>

        </section>

        {/* Main Grid */}
        <section className="dashboard-grid">

          {/* Threat Activity */}
          <div className="panel threat-panel">

            <div className="panel-header">

              <div>
                <h3>Threat Activity</h3>

                <span>
                  Security events detected over the last 24 hours
                </span>
              </div>

              <select defaultValue="24h">
                <option value="24h">
                  Last 24 hours
                </option>

                <option value="7d">
                  Last 7 days
                </option>

                <option value="30d">
                  Last 30 days
                </option>
              </select>

            </div>

            <div className="chart">

              <div className="chart-y">
                <span>120</span>
                <span>90</span>
                <span>60</span>
                <span>30</span>
                <span>0</span>
              </div>

              <div className="chart-area">

                <div className="grid-line" />
                <div className="grid-line" />
                <div className="grid-line" />
                <div className="grid-line" />

                <svg
                  className="chart-svg"
                  viewBox="0 0 800 250"
                  preserveAspectRatio="none"
                >

                  {/* LIVE ACTIVITY LINE */}
                  <polyline
                    points={activityPoints}
                    fill="none"
                    stroke="#4285F4"
                    strokeWidth="4"
                  />

                  {/* BASELINE */}
                  <polyline
                    points="0,225 60,215 120,220 180,190 240,205 300,185 360,195 420,175 480,185 540,155 600,175 660,145 720,165 800,130"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="6 7"
                    opacity="0.35"
                  />

                </svg>

                <div className="chart-x">
                  <span>00:00</span>
                  <span>04:00</span>
                  <span>08:00</span>
                  <span>12:00</span>
                  <span>16:00</span>
                  <span>20:00</span>
                  <span>24:00</span>
                </div>

              </div>

            </div>

            <div className="chart-legend">

              <span>
                <i className="legend-threat" />
                Threats
              </span>

              <span>
                <i className="legend-events" />
                Baseline
              </span>

            </div>

          </div>

          {/* Threat Severity */}
          <div className="panel severity-panel">

            <div className="panel-header">

              <div>
                <h3>Threat Severity</h3>
                <span>Current distribution</span>
              </div>

            </div>

            <div className="severity-content">

              <div className="donut">

                <div>

                  <strong>
                    {dashboardStats.threats_detected}
                  </strong>

                  <span>
                    Threats
                  </span>

                </div>

              </div>

              <div className="severity-list">

                <div>
                  <span>
                    <i className="critical-dot" />
                    Critical
                  </span>

                  <strong>
                    {dashboardStats.critical_count}
                  </strong>
                </div>

                <div>
                  <span>
                    <i className="high-dot" />
                    High
                  </span>

                  <strong>
                    {dashboardStats.high_count}
                  </strong>
                </div>

                <div>
                  <span>
                    <i className="medium-dot" />
                    Medium
                  </span>

                  <strong>
                    {dashboardStats.medium_count}
                  </strong>
                </div>

                <div>
                  <span>
                    <i className="low-dot" />
                    Low
                  </span>

                  <strong>
                    {dashboardStats.low_count}
                  </strong>
                </div>

              </div>

            </div>

          </div>

        </section>

        {/* Bottom Grid */}
        <section className="bottom-grid">

          {/* Recent Incidents */}
          <div className="panel incidents-panel">

            <div className="panel-header">

              <div>
                <h3>Recent Incidents</h3>

                <span>
                  Latest security incidents requiring attention
                </span>
              </div>

              <button className="view-all">
                View all →
              </button>

            </div>

            <div className="incident-list">

              {incidents.length === 0 ? (

                <div className="incident">

                  <div className="incident-info">

                    <strong>
                      No incidents detected
                    </strong>

                    <span>
                      All monitored activity is currently normal.
                    </span>

                  </div>

                </div>

              ) : (

                incidents.map((incident) => (

                  <div
                    className="incident"
                    key={incident.incident_number}
                    onClick={() => setSelectedIncident(incident)}
                    style={{ cursor: 'pointer' }}
                  >

                    <div
                      className={`incident-severity ${incident.severity}`}
                    >
                      {incident.severity.toUpperCase()}
                    </div>

                    <div className="incident-info">

                      <strong>
                        {incident.threat_type.replaceAll('_', ' ')}
                      </strong>

                      <span>
                        {incident.username ||
                          incident.source_ip ||
                          'Unknown source'}

                        {' · '}

                        {new Date(
                          incident.created_at
                        ).toLocaleString()}
                      </span>

                    </div>

                    <div
                      className={`risk-score ${incident.severity}-score`}
                    >
                      {incident.risk_score}
                    </div>

                  </div>

                ))

              )}

            </div>

          </div>

          {/* AI Security Copilot */}
          <div className="panel ai-panel">

            <div className="ai-heading">

              <div className="ai-icon">
                ✦
              </div>

              <div>
                <h3>AI Security Copilot</h3>

                <span>
                  Intelligent threat analysis
                </span>
              </div>

              <span className="ai-online">
                ONLINE
              </span>

            </div>

            {selectedIncident ? (

              <>

                {/* Selected Incident */}
                <div className="ai-message">

                  <p>
                    <strong>
                      ⚠ {selectedIncident.severity?.toUpperCase()} threat detected.
                    </strong>
                  </p>

                  <p>
                    Incident{' '}
                    <strong>
                      #{selectedIncident.incident_number}
                    </strong>
                    {' '}has a{' '}
                    <strong>
                      {selectedIncident.risk_score}/100 risk score
                    </strong>.
                  </p>

                  <p>
                    Threat:{' '}
                    <strong>
                      {selectedIncident.threat_type?.replaceAll(
                        '_',
                        ' '
                      )}
                    </strong>
                  </p>

                  <p>
                    Source:{' '}
                    <strong>
                      {selectedIncident.source_ip ||
                        'Unknown'}
                    </strong>
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      marginTop: '14px',
                      padding: '12px 14px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                    }}
                  >
                    <div>
                      <strong style={{ display: 'block' }}>
                        Incident Status
                      </strong>
                      <span style={{ fontSize: '12px', opacity: 0.65 }}>
                        Manage the incident lifecycle
                      </span>
                    </div>

                    {(isAdmin || isAnalyst) ? (
                      <select
                        value={selectedIncident.status || 'open'}
                        onChange={(event) =>
                          updateIncidentStatus(
                            selectedIncident,
                            event.target.value
                          )
                        }
                        disabled={statusUpdating}
                        style={{
                          minWidth: '150px',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.12)',
                          background: '#0b1220',
                          color: 'inherit',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                          cursor: statusUpdating ? 'wait' : 'pointer',
                        }}
                      >
                        <option value="open">Open</option>
                        <option value="investigating">Investigating</option>
                        <option value="contained">Contained</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    ) : (
                      <span style={{ minWidth: '150px', padding: '9px 12px', textAlign: 'center', opacity: 0.7 }}>
                        {selectedIncident.status || 'open'}
                      </span>
                    )}
                  </div>

                  {statusError && (
                    <p style={{ marginTop: '10px' }}>
                      <strong>⚠ {statusError}</strong>
                    </p>
                  )}

                  {aiLoading && (
                    <p>
                      <strong>
                        ✦ AI Security Copilot is analyzing this incident...
                      </strong>
                    </p>
                  )}

                  {aiError && (
                    <p>
                      <strong>
                        ⚠ {aiError}
                      </strong>
                    </p>
                  )}

                  {aiAnalysis && (
                    <div
                      style={{
                        marginTop: '16px',
                        whiteSpace: 'pre-wrap',
                        lineHeight: '1.6',
                        maxHeight: '300px',
                        overflowY: 'auto',
                      }}
                    >
                      {aiAnalysis}
                    </div>
                  )}

                </div>

                {(isAdmin || isAnalyst) ? (
                  <button
                    className="investigate-button"
                    onClick={() => analyzeIncident(selectedIncident)}
                    disabled={aiLoading}
                  >
                    {aiLoading ? 'Analyzing...' : '✦ Analyze with AI →'}
                  </button>
                ) : (
                  <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', fontSize: '12px', opacity: 0.65, textAlign: 'center' }}>
                    Read-only access — AI analysis requires Analyst or Admin role.
                  </div>
                )}

              </>

            ) : (

              <div className="ai-message">

                <p>
                  <strong>
                    AI Security Copilot is ready.
                  </strong>
                </p>

                <p>
                  Select a security incident to begin AI-powered
                  threat analysis.
                </p>

              </div>

            )}

          </div>

        </section>

        {/* Threat Analytics */}
        <section
          id="threat-analytics"
          className="panel"
          style={{ marginTop: '24px' }}
        >
          <div className="panel-header">
            <div>
              <h3>Threat Analytics</h3>
              <span>Security posture and threat distribution from SentinelX detection data</span>
            </div>
            <strong style={{ fontSize: '13px', opacity: 0.7 }}>
              LIVE DATA
            </strong>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: '12px',
              marginBottom: '18px',
            }}
          >
            {[
              ['Security Events', dashboardStats.total_events, 'Total events processed'],
              ['Threats Detected', dashboardStats.threats_detected, 'Detected by security engine'],
              ['High Risk', dashboardStats.high_count, 'High severity threats'],
              ['Critical', dashboardStats.critical_count, 'Critical severity threats'],
            ].map(([label, value, description]) => (
              <div
                key={String(label)}
                style={{
                  padding: '16px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <span style={{ fontSize: '11px', opacity: 0.55 }}>
                  {String(label).toUpperCase()}
                </span>
                <strong
                  style={{
                    display: 'block',
                    fontSize: '26px',
                    marginTop: '7px',
                  }}
                >
                  {value}
                </strong>
                <span style={{ fontSize: '11px', opacity: 0.55 }}>
                  {String(description)}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.4fr) minmax(260px, 0.8fr)',
              gap: '18px',
            }}
          >
            <div
              style={{
                padding: '18px',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
              }}
            >
              <div style={{ marginBottom: '16px' }}>
                <strong>Severity Distribution</strong>
                <span
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    opacity: 0.55,
                    marginTop: '4px',
                  }}
                >
                  Current security event severity breakdown
                </span>
              </div>

              {[
                ['Critical', dashboardStats.critical_count, 'critical'],
                ['High', dashboardStats.high_count, 'high'],
                ['Medium', dashboardStats.medium_count, 'medium'],
                ['Low', dashboardStats.low_count, 'low'],
              ].map(([label, value, severity]) => {
                const total =
                  dashboardStats.critical_count +
                  dashboardStats.high_count +
                  dashboardStats.medium_count +
                  dashboardStats.low_count

                const percentage =
                  total > 0
                    ? Math.round((Number(value) / total) * 100)
                    : 0

                return (
                  <div key={String(label)} style={{ marginBottom: '14px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                        fontSize: '13px',
                      }}
                    >
                      <span style={{ textTransform: 'capitalize' }}>
                        {String(label)}
                      </span>
                      <strong>
                        {value} <span style={{ opacity: 0.5 }}>({percentage}%)</span>
                      </strong>
                    </div>

                    <div
                      style={{
                        height: '8px',
                        borderRadius: '99px',
                        background: 'rgba(255,255,255,0.07)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        className={`analytics-bar ${severity}`}
                        style={{
                          width: `${percentage}%`,
                          height: '100%',
                          borderRadius: '99px',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div
              style={{
                padding: '18px',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
              }}
            >
              <strong>Detection Summary</strong>

              <div style={{ marginTop: '18px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '11px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span>Detection Rate</span>
                  <strong>
                    {dashboardStats.total_events > 0
                      ? Math.round(
                          (dashboardStats.threats_detected /
                            dashboardStats.total_events) *
                            100
                        )
                      : 0}
                    %
                  </strong>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '11px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span>Blocked IPs</span>
                  <strong>{dashboardStats.blocked_ips}</strong>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '11px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span>High + Critical</span>
                  <strong>
                    {dashboardStats.high_count + dashboardStats.critical_count}
                  </strong>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '11px 0',
                  }}
                >
                  <span>Normal / Low Events</span>
                  <strong>{dashboardStats.low_count}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Events */}
        <section
          id="security-events"
          className="panel"
          style={{ marginTop: '24px', scrollMarginTop: '24px' }}
        >
          <div className="panel-header">
            <div>
              <h3>Security Events</h3>
              <span>Live security events received and processed by SentinelX</span>
            </div>
            <strong style={{ fontSize: '13px', opacity: 0.7 }}>
              {filteredSecurityEvents.length} of {securityEvents.length} events
            </strong>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(220px, 1fr) 160px 180px',
              gap: '10px',
              marginBottom: '16px',
            }}
          >
            <input
              value={eventSearch}
              onChange={(event) => setEventSearch(event.target.value)}
              placeholder="Search IP, username, event..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.10)',
                background: '#0b1220',
                color: 'inherit',
              }}
            />

            <select
              value={eventSeverity}
              onChange={(event) => setEventSeverity(event.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.10)',
                background: '#0b1220',
                color: 'inherit',
              }}
            >
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={eventType}
              onChange={(event) => setEventType(event.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.10)',
                background: '#0b1220',
                color: 'inherit',
              }}
            >
              <option value="all">All Event Types</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {String(type).replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {filteredSecurityEvents.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', opacity: 0.65 }}>
              No security events match the selected filters.
            </div>
          ) : (
            <div
              style={{
                overflowX: 'auto',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '10px',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
                <thead>
                  <tr>
                    {['Time', 'Event', 'Username', 'Source IP', 'Risk', 'Severity', 'Status'].map(
                      (heading) => (
                        <th
                          key={heading}
                          style={{
                            textAlign: 'left',
                            padding: '12px 14px',
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            opacity: 0.55,
                            borderBottom: '1px solid rgba(255,255,255,0.07)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {filteredSecurityEvents.map((event) => {
                    const severity = String(event.severity || 'low').toLowerCase()

                    return (
                      <tr
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        style={{
                          cursor: 'pointer',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                        }}
                      >
                        <td style={{ padding: '12px 14px', fontSize: '12px' }}>
                          {new Date(event.timestamp).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {String(event.event_type || 'unknown').replaceAll('_', ' ')}
                        </td>
                        <td style={{ padding: '12px 14px' }}>{event.username || '—'}</td>
                        <td style={{ padding: '12px 14px' }}>{event.source_ip || '—'}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 700 }}>
                          {event.risk_score ?? 0}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className={`incident-severity ${severity}`} style={{ display: 'inline-block' }}>
                            {severity.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {String(event.status || 'new').toUpperCase()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {selectedEvent && (
            <div
              style={{
                marginTop: '16px',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <strong>Event Details</strong>
                  <div style={{ fontSize: '12px', opacity: 0.55 }}>{selectedEvent.id}</div>
                </div>
                <button className="view-all" onClick={() => setSelectedEvent(null)}>
                  Close
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '12px',
                }}
              >
                {[
                  ['Event Type', String(selectedEvent.event_type || 'unknown').replaceAll('_', ' ')],
                  ['Username', selectedEvent.username || '—'],
                  ['Source IP', selectedEvent.source_ip || '—'],
                  ['Device', selectedEvent.device || '—'],
                  ['Location', selectedEvent.location || '—'],
                  ['Risk Score', `${selectedEvent.risk_score ?? 0}/100`],
                  ['Severity', String(selectedEvent.severity || 'low').toUpperCase()],
                  ['Status', String(selectedEvent.status || 'new').toUpperCase()],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span style={{ fontSize: '11px', opacity: 0.55 }}>{label.toUpperCase()}</span>
                    <strong style={{ display: 'block', marginTop: '4px' }}>{value}</strong>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '14px' }}>
                <span style={{ fontSize: '11px', opacity: 0.55 }}>DESCRIPTION</span>
                <p style={{ marginTop: '5px', lineHeight: 1.5 }}>
                  {selectedEvent.description || 'No description available.'}
                </p>
              </div>
            </div>
          )}
        </section>

        <footer>
          SentinelX Security Platform
          <span>•</span>
          Engine status: Operational
          <span>•</span>
          v1.0.0
        </footer>

      </main>

    </div>
  )
}

export default App