import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Camera,
  Map,
  Recycle,
  TrendingUp,
  Trash2,
  Zap,
  RefreshCw,
} from "lucide-react";

import "./index.css";
import ScanWaste from "./pages/ScanWaste";
import Hotspots from "./pages/Hotspots";

const API_URL = "http://127.0.0.1:8000/api/waste/history";

const categoryIcons = {
  plastic: Recycle,
  "e-waste": Zap,
  battery: Zap,
  paper: Trash2,
  cardboard: Trash2,
  "biological waste": Recycle,
  "general waste": Trash2,
  metal: Recycle,
  clothes: Recycle,
  shoes: Recycle,
  "brown glass": Recycle,
  "green glass": Recycle,
  "white glass": Recycle,
};

function App() {
  const [page, setPage] = useState("overview");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadHistory() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`Could not load scan history (${response.status}).`);
      }

      const data = await response.json();
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (err) {
      setError(
        err.message || "Could not connect to the ReLoop backend."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  if (page === "scan") {
    return (
      <ScanWaste
        onBack={() => {
          setPage("overview");
          loadHistory();
        }}
      />
    );
  }

  if (page === "hotspots") {
    return <Hotspots onBack={() => setPage("overview")} />;
  }

  const categoryCounts = events.reduce((counts, event) => {
    const category = event.category || "Unknown";
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {});

  const categories = Object.entries(categoryCounts).sort(
    (a, b) => b[1] - a[1]
  );

  const totalScans = events.length;
  const maxCount = Math.max(1, ...categories.map(([, count]) => count));

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Recycle size={21} strokeWidth={2.4} />
          </div>
          <span>ReLoop</span>
        </div>

        <nav>
          <button
            className={`nav-item ${page === "overview" ? "active" : ""}`}
            onClick={() => setPage("overview")}
          >
            <TrendingUp size={18} />
            Overview
          </button>

          <button
            className="nav-item"
            onClick={() => setPage("scan")}
          >
            <Camera size={18} />
            Scan Waste
          </button>

          <button
            className="nav-item"
            onClick={() => setPage("hotspots")}
          >
            <Map size={18} />
            Waste Insights
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="impact-card">
            <span>Recorded scans</span>
            <strong>{loading ? "..." : totalScans}</strong>
            <small>saved scan events</small>
          </div>

          <div className="profile">
            <div className="avatar">RL</div>
            <div>
              <strong>Workspace</strong>
              <span>Campus</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">WASTE INTELLIGENCE</p>
            <h1>Give waste its next destination.</h1>
            <p className="subtitle">
              Understand what gets discarded, explore scan patterns, and
              discover better disposal decisions.
            </p>
          </div>

          <button className="scan-button" onClick={() => setPage("scan")}>
            <Camera size={18} />
            Scan waste
          </button>
        </header>

        {error && (
          <div
            className="panel"
            role="alert"
            style={{ marginBottom: "20px" }}
          >
            <p>{error}</p>
            <button className="text-button" onClick={loadHistory}>
              <RefreshCw size={15} />
              Retry
            </button>
          </div>
        )}

        <section className="hero-grid">
          <div className="scan-card">
            <div className="scan-content">
              <span className="section-label">QUICK ACTION</span>
              <h2>Not sure where it belongs?</h2>
              <p>
                Upload a photo of a waste item and ReLoop will identify a
                likely category and suggest a disposal action.
              </p>

              <button
                className="primary-button"
                onClick={() => setPage("scan")}
              >
                <Camera size={18} />
                Identify waste
                <ArrowUpRight size={17} />
              </button>
            </div>

            <div className="scan-visual">
              <div className="visual-ring ring-one"></div>
              <div className="visual-ring ring-two"></div>
              <Recycle size={54} strokeWidth={1.5} />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Items scanned</span>
              <TrendingUp size={18} />
            </div>

            <strong>{loading ? "..." : totalScans.toLocaleString()}</strong>

            <div className="stat-change">
              <span>{categories.length}</span>
              <small>categories detected</small>
            </div>

            <div
              style={{
                marginTop: "20px",
                fontSize: "13px",
                color: "var(--text-secondary, #777)",
              }}
            >
              Based on recorded scan history
            </div>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <span className="section-label">RECORDED WASTE MIX</span>
                <h3>What's being scanned?</h3>
              </div>

              <button className="text-button" onClick={() => setPage("hotspots")}>
                View details
              </button>
            </div>

            {loading ? (
              <p>Loading scan data...</p>
            ) : categories.length === 0 ? (
              <div style={{ padding: "18px 0" }}>
                <p>No scan data yet.</p>
                <p>
                  Scan your first waste item to start building a real dataset.
                </p>
              </div>
            ) : (
              <div className="category-list">
                {categories.slice(0, 6).map(([name, count]) => {
                  const Icon =
                    categoryIcons[name.toLowerCase()] || Recycle;

                  const percentage = Math.round(
                    (count / totalScans) * 100
                  );

                  return (
                    <div className="category-row" key={name}>
                      <div className="category-icon">
                        <Icon size={18} />
                      </div>

                      <div className="category-info">
                        <span>{name}</span>
                        <div className="progress">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${(count / maxCount) * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      <strong>{percentage}%</strong>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="panel hotspot-panel">
            <div className="panel-header">
              <div>
                <span className="section-label">CAMPUS SIGNAL</span>
                <h3>Waste insights</h3>
              </div>
              <Map size={20} />
            </div>

            <div
              className="map-placeholder"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                padding: "24px",
                textAlign: "center",
              }}
            >
              <Recycle size={36} />
              <strong>
                {totalScans === 0
                  ? "Your data starts here"
                  : `${totalScans} recorded scan${totalScans === 1 ? "" : "s"}`}
              </strong>
              <span>
                Explore the categories appearing in your recorded scans.
              </span>
              <button
                className="primary-button"
                onClick={() => setPage("hotspots")}
              >
                Explore insights
                <ArrowUpRight size={16} />
              </button>
            </div>

            <div className="hotspot-footer">
              <span>
                <i></i>
                Scan-history analytics
              </span>

              <button
                className="text-button"
                onClick={() => setPage("hotspots")}
              >
                Explore <ArrowUpRight size={15} />
              </button>
            </div>
          </div>
        </section>

        <section className="insight">
          <div className="insight-icon">
            <TrendingUp size={20} />
          </div>

          <div>
            <span className="section-label">RELOOP INSIGHT</span>
            <p>
              {categories.length === 0 ? (
                <>
                  <strong>Start with a real observation.</strong> Scan waste
                  items to discover which categories appear in your dataset.
                </>
              ) : (
                <>
                  <strong>
                    Most frequently detected: {categories[0][0]}.
                  </strong>{" "}
                  It represents{" "}
                  {Math.round((categories[0][1] / totalScans) * 100)}% of
                  recorded scans. This describes scanned items, not all waste
                  generated on campus.
                </>
              )}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;