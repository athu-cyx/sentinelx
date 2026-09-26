type DashboardStats = {
  total_events: number;
  threats_detected: number;
  critical_threats: number;
  blocked_ips: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
};

type ActivityItem = {
  time: string;
  count: number;
};

type Incident = {
  incident_number: string;
  threat_type: string;
  username?: string | null;
  source_ip?: string | null;
  severity: string;
  risk_score: number;
  status: string;
  created_at: string;
};

type DashboardProps = {
  dashboardStats: DashboardStats;
  activity: ActivityItem[];
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
};

export default function Dashboard({
  dashboardStats,
  activity,
  incidents,
  onSelectIncident,
}: DashboardProps) {
  const activityPoints = activity
    .map((item, index) => {
      const x =
        (index / Math.max(activity.length - 1, 1)) * 800;

      const maxCount = Math.max(
        ...activity.map((item) => item.count),
        1
      );

      const y =
        220 - (item.count / maxCount) * 190;

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <>
      {/* Statistics */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span>Total Events</span>
            <div className="stat-icon blue">â—ˆ</div>
          </div>

          <strong>{dashboardStats.total_events}</strong>

          <p className="positive">
            â†‘ 12.8%
            <span>vs last 24h</span>
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Threats Detected</span>
            <div className="stat-icon orange">âš </div>
          </div>

          <strong>{dashboardStats.threats_detected}</strong>

          <p className="negative">
            â†‘ 8.4%
            <span>vs last 24h</span>
          </p>
        </div>

        <div className="stat-card critical-card">
          <div className="stat-header">
            <span>Critical Threats</span>
            <div className="stat-icon red">!</div>
          </div>

          <strong>{dashboardStats.critical_threats}</strong>

          <p className="negative">
            â†‘ 3
            <span>since yesterday</span>
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Blocked IPs</span>
            <div className="stat-icon purple">âŒ</div>
          </div>

          <strong>{dashboardStats.blocked_ips}</strong>

          <p className="positive">
            â†‘ 14
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
                <strong>
                  {dashboardStats.threats_detected}
                </strong>

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

      {/* Recent Incidents */}
      <section className="bottom-grid">
        <div className="panel incidents-panel">
          <div className="panel-header">
            <div>
              <h3>Recent Incidents</h3>
              <span>
                Latest security incidents requiring attention
              </span>
            </div>

            <button className="view-all">
              View all â†’
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
                  onClick={() => onSelectIncident(incident)}
                  style={{ cursor: "pointer" }}
                >
                  <div
                    className={`incident-severity ${incident.severity}`}
                  >
                    {incident.severity.toUpperCase()}
                  </div>

                  <div className="incident-info">
                    <strong>
                      {incident.threat_type.replaceAll("_", " ")}
                    </strong>

                    <span>
                      {incident.username ||
                        incident.source_ip ||
                        "Unknown source"}
                      {" Â· "}
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
      </section>
    </>
  );
}
