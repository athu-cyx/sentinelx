import './App.css'
import { useEffect, useState } from 'react'

function App() {
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

  useEffect(() => {
    async function loadDashboardStats() {
      try {
        const response = await fetch(
          'http://127.0.0.1:8000/api/dashboard/stats'
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
          'http://127.0.0.1:8000/api/incidents/'
        )

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()

        console.log('SentinelX Incidents:', data)

        setIncidents(data.incidents)
      } catch (error) {
        console.error('Failed to fetch incidents:', error)
      }
    }

    async function loadActivity() {
      try {
        const response = await fetch(
          'http://127.0.0.1:8000/api/dashboard/activity'
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

    loadDashboardStats()
    loadIncidents()
    loadActivity()
  }, [])

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

          <button className="nav-item">
            <span>◉</span>
            Security Events
          </button>

          <button className="nav-item">
            <span>⚠</span>
            Incidents
            <b>{incidents.length}</b>
          </button>

          <button className="nav-item">
            <span>⌁</span>
            Threat Intelligence
          </button>

          <p className="nav-label">ANALYZE</p>

          <button className="nav-item">
            <span>◌</span>
            AI Security Copilot
          </button>

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
                <strong>Security Admin</strong>
                <span>Administrator</span>
              </div>

            </div>

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

            {/* IMPORTANT: Chart wrapper */}
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

            <div className="ai-message">

              <p>
                <strong>
                  ⚠ High-priority activity detected.
                </strong>
              </p>

              <p>
                Incident <strong>#INC-1048</strong> has a
                <strong> 94/100 risk score</strong>.
              </p>

              <p>
                The activity indicates a possible account compromise
                based on abnormal login time, location and
                authentication failures.
              </p>

            </div>

            <button className="investigate-button">
              Investigate Incident →
            </button>

          </div>

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