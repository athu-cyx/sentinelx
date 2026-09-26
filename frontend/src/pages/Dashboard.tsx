import type { Dispatch, SetStateAction } from 'react'

type DashboardProps = {
  dashboardStats: any
  activityPoints: string
  incidents: any[]
  selectedIncident: any | null
  setSelectedIncident: Dispatch<SetStateAction<any | null>>
  isAdmin: boolean
  isAnalyst: boolean
  aiLoading: boolean
  aiError: string
  aiAnalysis: string
  statusUpdating: boolean
  statusError: string
  analyzeIncident: (incident: any) => Promise<void>
  updateIncidentStatus: (incident: any, newStatus: string) => Promise<void>
}

export default function Dashboard({
  dashboardStats,
  activityPoints,
  incidents,
  selectedIncident,
  setSelectedIncident,
  isAdmin,
  isAnalyst,
  aiLoading,
  aiError,
  aiAnalysis,
  statusUpdating,
  statusError,
  analyzeIncident,
  updateIncidentStatus,
}: DashboardProps) {
  return (
    <>
      {/* Statistics */}
      <section className="stats-grid">

        <div className="stat-card">
          <div className="stat-header">
            <span>Total Events</span>
            <div className="stat-icon blue">
              ◈
            </div>
          </div>

          <strong>{dashboardStats.total_events}</strong>

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

          <strong>{dashboardStats.threats_detected}</strong>

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

          <strong>{dashboardStats.critical_threats}</strong>

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

          <strong>{dashboardStats.blocked_ips}</strong>

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
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
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
                <polyline
                  points={activityPoints}
                  fill="none"
                  stroke="#4285F4"
                  strokeWidth="4"
                />

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
                <strong>{dashboardStats.threats_detected}</strong>
                <span>Threats</span>
              </div>
            </div>

            <div className="severity-list">

              <div>
                <span>
                  <i className="critical-dot" />
                  Critical
                </span>
                <strong>{dashboardStats.critical_count}</strong>
              </div>

              <div>
                <span>
                  <i className="high-dot" />
                  High
                </span>
                <strong>{dashboardStats.high_count}</strong>
              </div>

              <div>
                <span>
                  <i className="medium-dot" />
                  Medium
                </span>
                <strong>{dashboardStats.medium_count}</strong>
              </div>

              <div>
                <span>
                  <i className="low-dot" />
                  Low
                </span>
                <strong>{dashboardStats.low_count}</strong>
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
                  <strong>No incidents detected</strong>
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
                    {selectedIncident.source_ip || 'Unknown'}
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

                    <span
                      style={{
                        minWidth: '150px',
                        padding: '9px 12px',
                        textAlign: 'center',
                        opacity: 0.7,
                      }}
                    >
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
                    <strong>⚠ {aiError}</strong>
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
                  {aiLoading
                    ? 'Analyzing...'
                    : '✦ Analyze with AI →'}
                </button>

              ) : (

                <div
                  style={{
                    marginTop: '12px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    fontSize: '12px',
                    opacity: 0.65,
                    textAlign: 'center',
                  }}
                >
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
            <span>
              Security posture and threat distribution from SentinelX detection data
            </span>
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
                <div
                  key={String(label)}
                  style={{ marginBottom: '14px' }}
                >

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
                      {value}{' '}
                      <span style={{ opacity: 0.5 }}>
                        ({percentage}%)
                      </span>
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
                  {dashboardStats.high_count +
                    dashboardStats.critical_count}
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
    </>
  )
}