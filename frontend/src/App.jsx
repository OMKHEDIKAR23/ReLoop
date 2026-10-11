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
  BookOpen,
  MapPin,
  Leaf,
  ShieldCheck,
} from "lucide-react";

import "./index.css";
import ScanWaste from "./pages/ScanWaste";
import Hotspots from "./pages/Hotspots";
import DisposalGuide from "./DisposalGuide";
import CollectionPoints from "./pages/CollectionPoints";

const API_URL = "/api/waste/history";

const categoryIcons = {
  plastic: Recycle,
  "e waste": Zap,
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

// Categories that may have a dedicated recycling or recovery route.
// Classification alone does NOT prove an item was recycled.
const recoveryCategories = [
  "plastic",
  "paper",
  "cardboard",
  "metal",
  "clothes",
  "shoes",
  "brown glass",
  "green glass",
  "white glass",
  "e waste",
  "battery",
];

const specialHandlingCategories = [
  "battery",
  "e waste",
];

function normalizeCategory(category) {
  return String(category || "Unknown")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

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
        throw new Error(
          `Could not load scan history (${response.status}).`
        );
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

  function goToOverview() {
    setPage("overview");
    loadHistory();
  }

  if (page === "scan") {
    return (
      <ScanWaste
        onBack={goToOverview}
        onViewCollection={() => setPage("collection")}
      />
    );
  }

  if (page === "hotspots") {
    return <Hotspots onBack={goToOverview} />;
  }

  if (page === "disposal") {
    return <DisposalGuide onBack={goToOverview} />;
  }

  if (page === "collection") {
    return <CollectionPoints onBack={goToOverview} />;
  }

  // Calculate statistics from actual backend history.
  const categoryCounts = events.reduce((counts, event) => {
    const category = event.category || "Unknown";

    counts[category] = (counts[category] || 0) + 1;

    return counts;
  }, {});

  const categories = Object.entries(categoryCounts).sort(
    (a, b) => b[1] - a[1]
  );

  const totalScans = events.length;

  const maxCount = Math.max(
    1,
    ...categories.map(([, count]) => count)
  );

  // Count items whose category may have a dedicated recycling route.
  const potentialRecoveryCount = events.filter((event) =>
    recoveryCategories.includes(normalizeCategory(event.category))
  ).length;

  // Count items requiring more careful handling.
  const specialHandlingCount = events.filter((event) =>
    specialHandlingCategories.includes(
      normalizeCategory(event.category)
    )
  ).length;

  const recoveryPercentage =
    totalScans > 0
      ? Math.round((potentialRecoveryCount / totalScans) * 100)
      : 0;

  const specialHandlingPercentage =
    totalScans > 0
      ? Math.round((specialHandlingCount / totalScans) * 100)
      : 0;

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
            className={`nav-item ${
              page === "overview" ? "active" : ""
            }`}
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

          <button
            className="nav-item"
            onClick={() => setPage("disposal")}
          >
            <BookOpen size={18} />
            Disposal Guide
          </button>

          <button
            className="nav-item"
            onClick={() => setPage("collection")}
          >
            <MapPin size={18} />
            Collection Points
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="impact-card">
            <span>Recorded scans</span>

            <strong>
              {loading ? "..." : totalScans}
            </strong>

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
              Understand what gets discarded, explore scan patterns,
              and discover better disposal decisions.
            </p>
          </div>

          <button
            className="scan-button"
            onClick={() => setPage("scan")}
          >
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

            <button
              className="text-button"
              onClick={loadHistory}
            >
              <RefreshCw size={15} />
              Retry
            </button>
          </div>
        )}

        {/* EXISTING DASHBOARD */}
        <section className="hero-grid">
          <div className="scan-card">
            <div className="scan-content">
              <span className="section-label">QUICK ACTION</span>

              <h2>Not sure where it belongs?</h2>

              <p>
                Upload a photo of a waste item and ReLoop will identify
                a likely category and suggest a disposal action.
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

            <strong>
              {loading ? "..." : totalScans.toLocaleString()}
            </strong>

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

        {/* EXISTING WASTE CATEGORY ANALYTICS */}
        <section className="content-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <span className="section-label">
                  RECORDED WASTE MIX
                </span>

                <h3>What's being scanned?</h3>
              </div>

              <button
                className="text-button"
                onClick={() => setPage("hotspots")}
              >
                View details
              </button>
            </div>

            {loading ? (
              <p>Loading scan data...</p>
            ) : categories.length === 0 ? (
              <div style={{ padding: "18px 0" }}>
                <p>No scan data yet.</p>

                <p>
                  Scan your first waste item to start building a
                  real dataset.
                </p>
              </div>
            ) : (
              <div className="category-list">
                {categories.slice(0, 6).map(([name, count]) => {
                  const Icon =
                    categoryIcons[normalizeCategory(name)] || Recycle;

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
                  : `${totalScans} recorded scan${
                      totalScans === 1 ? "" : "s"
                    }`}
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
                Explore
                <ArrowUpRight size={15} />
              </button>
            </div>
          </div>
        </section>

        {/* NEW: ENVIRONMENTAL IMPACT TRACKING */}
        <section
          style={{
            marginTop: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(50, 160, 100, 0.12)",
                color: "#29945b",
              }}
            >
              <Leaf size={23} />
            </div>

            <div>
              <span className="section-label">
                ENVIRONMENTAL IMPACT
              </span>

              <h2 style={{ margin: "4px 0 0", fontSize: "22px" }}>
                Small actions, better decisions.
              </h2>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: "16px",
            }}
          >
            {/* Recorded activity */}
            <div
              className="panel"
              style={{ padding: "22px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span className="section-label">ACTIVITY</span>
                <Camera size={20} />
              </div>

              <strong
                style={{
                  display: "block",
                  fontSize: "34px",
                  marginTop: "14px",
                }}
              >
                {loading ? "..." : totalScans}
              </strong>

              <p style={{ marginBottom: "0" }}>
                Waste scans recorded
              </p>

              <small
                style={{
                  display: "block",
                  marginTop: "10px",
                  color: "var(--text-secondary, #777)",
                }}
              >
                Based on saved scan events.
              </small>
            </div>

            {/* Potential recovery routes */}
            <div
              className="panel"
              style={{ padding: "22px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span className="section-label">RECOVERY OPTIONS</span>
                <Recycle size={20} />
              </div>

              <strong
                style={{
                  display: "block",
                  fontSize: "34px",
                  marginTop: "14px",
                }}
              >
                {loading ? "..." : potentialRecoveryCount}
              </strong>

              <p style={{ marginBottom: "0" }}>
                Items with potential recovery routes
              </p>

              <small
                style={{
                  display: "block",
                  marginTop: "10px",
                  color: "var(--text-secondary, #777)",
                }}
              >
                {loading ? "Loading..." : `${recoveryPercentage}% of recorded scans`}
              </small>
            </div>

            {/* Special handling */}
            <div
              className="panel"
              style={{ padding: "22px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span className="section-label">HANDLE WITH CARE</span>
                <ShieldCheck size={20} />
              </div>

              <strong
                style={{
                  display: "block",
                  fontSize: "34px",
                  marginTop: "14px",
                }}
              >
                {loading ? "..." : specialHandlingCount}
              </strong>

              <p style={{ marginBottom: "0" }}>
                Battery and e-waste scans
              </p>

              <small
                style={{
                  display: "block",
                  marginTop: "10px",
                  color: "var(--text-secondary, #777)",
                }}
              >
                {loading
                  ? "Loading..."
                  : `${specialHandlingPercentage}% of recorded scans`}
              </small>
            </div>
          </div>

          {/* Honest impact disclaimer */}
          <div
            className="panel"
            style={{
              marginTop: "16px",
              padding: "18px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <Leaf
              size={21}
              style={{
                flexShrink: 0,
                color: "#29945b",
                marginTop: "2px",
              }}
            />

            <div>
              <strong>What these numbers mean</strong>

              <p style={{ margin: "8px 0 0" }}>
                ReLoop tracks scanned items and identifies categories
                that may have dedicated recycling or disposal routes.
                These figures represent classification results, not
                confirmed recycling, landfill diversion, or CO₂ savings.
              </p>

              <button
                className="text-button"
                style={{ marginTop: "12px" }}
                onClick={() => setPage("disposal")}
              >
                Explore disposal options
                <ArrowUpRight size={15} />
              </button>
            </div>
          </div>
        </section>

        {/* EXISTING INSIGHT */}
        <section className="insight">
          <div className="insight-icon">
            <TrendingUp size={20} />
          </div>

          <div>
            <span className="section-label">RELOOP INSIGHT</span>

            <p>
              {categories.length === 0 ? (
                <>
                  <strong>Start with a real observation.</strong>{" "}
                  Scan waste items to discover which categories appear
                  in your dataset.
                </>
              ) : (
                <>
                  <strong>
                    Most frequently detected: {categories[0][0]}.
                  </strong>{" "}
                  It represents{" "}
                  {Math.round(
                    (categories[0][1] / totalScans) * 100
                  )}
                  % of recorded scans. This describes scanned items,
                  not all waste generated on campus.
                </>
              )}
            </p>
          </div>
        </section>

        {/* EXISTING DISPOSAL AND COLLECTION SHORTCUTS */}
        <section
          className="panel"
          style={{
            marginTop: "22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <span className="section-label">DISPOSAL HELP</span>

            <h3>Find the right way to dispose of waste.</h3>

            <p>
              Browse disposal instructions or explore collection points
              near you.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              className="primary-button"
              onClick={() => setPage("disposal")}
            >
              <BookOpen size={18} />
              Disposal Guide
            </button>

            <button
              className="primary-button"
              onClick={() => setPage("collection")}
            >
              <MapPin size={18} />
              Find Collection Points
              <ArrowUpRight size={16} />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
