import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Activity,
  RefreshCw,
  Recycle,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

const HISTORY_URL = "http://127.0.0.1:8000/api/waste/history";

function Hotspots({ onBack }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadHistory() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(HISTORY_URL);

      if (!response.ok) {
        throw new Error(`Unable to load scan history (${response.status}).`);
      }

      const data = await response.json();
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (err) {
      setError(err.message || "Could not connect to the ReLoop backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const categoryCounts = events.reduce((counts, event) => {
    const category = event.category || "Unknown";
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {});

  const categories = Object.entries(categoryCounts).sort(
    (a, b) => b[1] - a[1]
  );

  const maxCount = Math.max(1, ...categories.map(([, count]) => count));

  return (
    <main className="main">
      <button className="text-button" onClick={onBack}>
        <ArrowLeft size={16} />
        Back to overview
      </button>

      <header className="topbar" style={{ marginTop: "24px" }}>
        <div>
          <p className="eyebrow">CAMPUS WASTE INTELLIGENCE</p>
          <h1>Understand your waste signals.</h1>
          <p className="subtitle">
            Explore recorded scans and discover which waste categories appear
            most often.
          </p>
        </div>

        <button className="scan-button" onClick={loadHistory} disabled={loading}>
          <RefreshCw size={17} />
          {loading ? "Refreshing..." : "Refresh data"}
        </button>
      </header>

      {error && (
        <div className="panel" role="alert" style={{ marginBottom: "20px" }}>
          <AlertCircle size={18} />
          <p>{error}</p>
        </div>
      )}

      <section className="hero-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span>Total recorded scans</span>
            <Activity size={19} />
          </div>
          <strong>{loading ? "—" : events.length}</strong>
          <div className="stat-change">
            <small>Saved scan events</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Categories detected</span>
            <Recycle size={19} />
          </div>
          <strong>{loading ? "—" : categories.length}</strong>
          <div className="stat-change">
            <small>Across recorded scans</small>
          </div>
        </div>
      </section>

      <section className="content-grid" style={{ marginTop: "24px" }}>
        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="section-label">RECORDED DATA</span>
              <h3>Waste category breakdown</h3>
            </div>
            <TrendingUp size={20} />
          </div>

          {loading ? (
            <p>Loading recorded scans...</p>
          ) : categories.length === 0 ? (
            <p>
              No scans recorded yet. Scan a waste item to start building your
              waste dataset.
            </p>
          ) : (
            <div className="category-list">
              {categories.map(([category, count]) => (
                <div className="category-row" key={category}>
                  <div className="category-icon">
                    <Recycle size={18} />
                  </div>

                  <div className="category-info">
                    <span>{category}</span>
                    <div className="progress">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${(count / maxCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="section-label">LATEST ACTIVITY</span>
              <h3>Recent scans</h3>
            </div>
            <Activity size={20} />
          </div>

          {loading ? (
            <p>Loading activity...</p>
          ) : events.length === 0 ? (
            <p>Your scan activity will appear here.</p>
          ) : (
            <div className="category-list">
              {events.slice(0, 8).map((event) => (
                <div
                  className="category-row"
                  key={event.event_id}
                  style={{ alignItems: "flex-start" }}
                >
                  <div className="category-icon">
                    <Recycle size={17} />
                  </div>

                  <div className="category-info">
                    <span>{event.category}</span>
                    <small style={{ display: "block", marginTop: "5px" }}>
                      {event.timestamp
                        ? new Date(event.timestamp).toLocaleString()
                        : "Time unavailable"}
                    </small>
                  </div>

                  <strong style={{ fontSize: "13px" }}>
                    {Number(event.confidence).toFixed(1)}%
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="insight" style={{ marginTop: "24px" }}>
        <div className="insight-icon">
          <TrendingUp size={20} />
        </div>

        <div>
          <span className="section-label">DATA NOTE</span>
          <p>
            These insights use recorded image-classification results. They
            represent scanned items, not necessarily all waste generated on
            campus. Location-based hotspots will require actual location data.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Hotspots;