import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  BatteryCharging,
  CheckCircle2,
  Clock3,
  Leaf,
  LoaderCircle,
  MapPin,
  Package,
  RefreshCw,
  Recycle,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react";

const HISTORY_URL = "/api/waste/history";

function normalizeCategory(category) {
  return String(category || "Unknown")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function getCategory(event) {
  return (
    event?.category ||
    event?.result?.category ||
    event?.prediction?.category ||
    "Unknown"
  );
}

function getConfidence(event) {
  const raw =
    event?.confidence ??
    event?.result?.confidence ??
    event?.prediction?.confidence;

  if (raw === undefined || raw === null || raw === "") {
    return null;
  }

  const value = Number(raw);

  if (!Number.isFinite(value)) {
    return null;
  }

  return Math.max(
    0,
    Math.min(100, value >= 0 && value <= 1 ? value * 100 : value)
  );
}

function getTimestamp(event) {
  return (
    event?.recorded_at ||
    event?.timestamp ||
    event?.created_at ||
    event?.createdAt ||
    null
  );
}

function formatTimestamp(value) {
  if (!value) {
    return "Time unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Time unavailable";
  }

  return date.toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isPriorityCategory(category) {
  const name = normalizeCategory(category);

  return (
    name.includes("battery") ||
    name.includes("e waste") ||
    name.includes("electronic waste") ||
    name.includes("electronics")
  );
}

function getCategoryIcon(category) {
  const name = normalizeCategory(category);

  if (name.includes("battery")) {
    return BatteryCharging;
  }

  if (
    name.includes("e waste") ||
    name.includes("electronic")
  ) {
    return Zap;
  }

  if (
    name.includes("paper") ||
    name.includes("cardboard")
  ) {
    return Package;
  }

  if (name.includes("biological") || name.includes("organic")) {
    return Leaf;
  }

  return Recycle;
}

function StatCard({ label, value, description, icon: Icon, tone }) {
  return (
    <article className={`wi-stat-card wi-tone-${tone}`}>
      <div className="wi-stat-top">
        <span>{label}</span>

        <div className="wi-stat-icon">
          <Icon size={20} />
        </div>
      </div>

      <strong className="wi-stat-value">{value}</strong>

      <p>{description}</p>
    </article>
  );
}

function Hotspots({ onBack }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [lastUpdated, setLastUpdated] = useState(null);

  async function loadHistory() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(HISTORY_URL);

      if (!response.ok) {
        throw new Error(
          `Unable to load scan history (${response.status}).`
        );
      }

      const data = await response.json();

      setEvents(Array.isArray(data.events) ? data.events : []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err.message ||
          "Could not connect to the ReLoop backend."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const analytics = useMemo(() => {
    const counts = events.reduce((result, event) => {
      const category = getCategory(event);

      result[category] = (result[category] || 0) + 1;

      return result;
    }, {});

    const categories = Object.entries(counts).sort(
      (a, b) => b[1] - a[1]
    );

    const priorityEvents = events.filter((event) =>
      isPriorityCategory(getCategory(event))
    );

    return {
      categories,
      total: events.length,
      priorityCount: priorityEvents.length,
      topCategory: categories[0] || null,
      priorityEvents,
      maxCount: Math.max(
        1,
        ...categories.map(([, count]) => count)
      ),
    };
  }, [events]);

  const recentEvents = useMemo(() => {
    const filtered =
      filter === "priority"
        ? analytics.priorityEvents
        : events;

    return filtered.slice(0, 8);
  }, [events, filter, analytics.priorityEvents]);

  return (
    <main className="wi-page">
      {/* Shared ReLoop-style header */}
      <header className="wi-header">
        <button
          className="wi-back"
          type="button"
          onClick={onBack}
        >
          <ArrowLeft size={17} />
          Dashboard
        </button>

        <div className="wi-brand">
          <div className="wi-brand-icon">
            <Recycle size={22} strokeWidth={2.4} />
          </div>

          <span>ReLoop</span>
        </div>

        <div className="wi-header-label">
          <span className="wi-live-dot" />
          WASTE INTELLIGENCE
        </div>
      </header>

      <div className="wi-container">
        {/* Page introduction */}
        <section className="wi-hero">
          <div className="wi-eyebrow">
            <TrendingUp size={15} />
            YOUR WASTE DATA
          </div>

          <h1>
            Find patterns.
            <br />
            <span>Make better decisions.</span>
          </h1>

          <p>
            Explore saved waste classifications, understand which
            categories appear most often, and identify items that may
            need special handling.
          </p>

          <div className="wi-hero-footer">
            <div className="wi-data-indicator">
              <span />
              Based on saved scan history
            </div>

            <button
              className="wi-refresh"
              type="button"
              onClick={loadHistory}
              disabled={loading}
            >
              {loading ? (
                <LoaderCircle className="wi-spin" size={16} />
              ) : (
                <RefreshCw size={16} />
              )}

              {loading ? "Refreshing..." : "Refresh data"}
            </button>
          </div>

          {lastUpdated && (
            <p className="wi-updated">
              Last updated{" "}
              {lastUpdated.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}
        </section>

        {/* Error state */}
        {error && (
          <div className="wi-error" role="alert">
            <AlertCircle size={20} />

            <div>
              <strong>Couldn't load your scan history</strong>
              <p>{error}</p>

              <button
                className="wi-error-retry"
                type="button"
                onClick={loadHistory}
                disabled={loading}
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Statistics */}
        <section className="wi-stats">
          <StatCard
            label="Recorded scans"
            value={loading ? "—" : analytics.total.toLocaleString()}
            description="Saved classification events"
            icon={Activity}
            tone="green"
          />

          <StatCard
            label="Categories detected"
            value={loading ? "—" : analytics.categories.length}
            description="Distinct detected categories"
            icon={Recycle}
            tone="lime"
          />

          <StatCard
            label="Special handling"
            value={loading ? "—" : analytics.priorityCount}
            description="Battery and e-waste classifications"
            icon={ShieldCheck}
            tone="amber"
          />

          <StatCard
            label="Most scanned"
            value={
              loading
                ? "—"
                : analytics.topCategory
                  ? analytics.topCategory[0]
                  : "—"
            }
            description={
              analytics.topCategory && !loading
                ? `${analytics.topCategory[1]} recorded scan${
                    analytics.topCategory[1] === 1 ? "" : "s"
                  }`
                : "Your leading category"
            }
            icon={TrendingUp}
            tone="forest"
          />
        </section>

        {/* Analytics content */}
        <section className="wi-content-grid">
          <article className="wi-panel">
            <div className="wi-panel-heading">
              <div>
                <span className="wi-section-label">
                  CATEGORY ANALYTICS
                </span>

                <h2>What's being scanned?</h2>

                <p>
                  A breakdown of the categories in your saved records.
                </p>
              </div>

              <div className="wi-heading-icon">
                <Recycle size={21} />
              </div>
            </div>

            {loading ? (
              <div className="wi-empty-state">
                <LoaderCircle className="wi-spin" size={23} />
                <p>Loading category data...</p>
              </div>
            ) : analytics.categories.length === 0 ? (
              <div className="wi-empty-state">
                <div className="wi-empty-icon">
                  <Recycle size={26} />
                </div>

                <h3>Your insights start here.</h3>

                <p>
                  Scan your first item to start building real
                  classification statistics.
                </p>
              </div>
            ) : (
              <div className="wi-category-list">
                {analytics.categories.map(([category, count]) => {
                  const Icon = getCategoryIcon(category);

                  const percentage = Math.round(
                    (count / analytics.total) * 100
                  );

                  const relativeWidth =
                    (count / analytics.maxCount) * 100;

                  return (
                    <div
                      className="wi-category"
                      key={category}
                    >
                      <div className="wi-category-top">
                        <div className="wi-category-icon">
                          <Icon size={19} />
                        </div>

                        <div className="wi-category-info">
                          <strong>{category}</strong>

                          <span>
                            {count} scan{count === 1 ? "" : "s"}
                          </span>
                        </div>

                        <strong className="wi-category-percent">
                          {percentage}%
                        </strong>
                      </div>

                      <div
                        className="wi-progress"
                        role="progressbar"
                        aria-label={`${category} relative scan count`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(relativeWidth)}
                      >
                        <div
                          className={`wi-progress-fill ${
                            isPriorityCategory(category)
                              ? "wi-progress-warning"
                              : ""
                          }`}
                          style={{
                            width: `${relativeWidth}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && analytics.total > 0 && (
              <div className="wi-panel-note">
                Percentages show each category's share of recorded
                scans. They do not describe all waste generated in
                your area.
              </div>
            )}
          </article>

          {/* Special handling */}
          <article className="wi-panel">
            <div className="wi-panel-heading">
              <div>
                <span className="wi-section-label">
                  PRIORITY INSIGHT
                </span>

                <h2>Waste needing extra care</h2>

                <p>
                  Review battery and electronic-waste classifications.
                </p>
              </div>

              <div className="wi-heading-icon wi-heading-icon-amber">
                <ShieldCheck size={21} />
              </div>
            </div>

            <div className="wi-priority-card">
              <div className="wi-priority-card-heading">
                <span>RECORDED PRIORITY SCANS</span>
                <Zap size={20} />
              </div>

              <strong>
                {loading ? "—" : analytics.priorityCount}
              </strong>

              <p>
                Battery and e-waste classifications found in the saved
                scan history.
              </p>
            </div>

            <div className="wi-safety-tip">
              <div className="wi-safety-tip-icon">
                <BatteryCharging size={19} />
              </div>

              <div>
                <strong>Batteries</strong>

                <p>
                  Use a suitable battery collection service. Follow
                  its instructions for storing and handing over items.
                </p>
              </div>
            </div>

            <div className="wi-safety-tip">
              <div className="wi-safety-tip-icon wi-safety-tip-blue">
                <Package size={19} />
              </div>

              <div>
                <strong>Electronic waste</strong>

                <p>
                  Check for an appropriate e-waste collection service
                  and confirm which devices it accepts.
                </p>
              </div>
            </div>

            <div className="wi-panel-note">
              These numbers represent image classifications, not
              confirmed incidents of improper disposal.
            </div>
          </article>
        </section>

        {/* Recent activity */}
        <section className="wi-panel wi-activity-panel">
          <div className="wi-activity-heading">
            <div>
              <span className="wi-section-label">
                YOUR RECORDS
              </span>

              <h2>Recent scan activity</h2>

              <p>
                Review classifications recorded by ReLoop.
              </p>
            </div>

            <div className="wi-filter-group">
              <button
                type="button"
                className={
                  filter === "all" ? "wi-filter-active" : ""
                }
                onClick={() => setFilter("all")}
                aria-pressed={filter === "all"}
              >
                All scans
              </button>

              <button
                type="button"
                className={
                  filter === "priority" ? "wi-filter-active" : ""
                }
                onClick={() => setFilter("priority")}
                aria-pressed={filter === "priority"}
              >
                Special handling
              </button>
            </div>
          </div>

          {loading ? (
            <div className="wi-empty-state">
              <LoaderCircle className="wi-spin" size={23} />
              <p>Loading recent activity...</p>
            </div>
          ) : recentEvents.length === 0 ? (
            <div className="wi-empty-state">
              <div className="wi-empty-icon">
                <Clock3 size={25} />
              </div>

              <h3>
                {filter === "priority"
                  ? "No priority scans recorded yet."
                  : "No scans recorded yet."}
              </h3>

              <p>
                {filter === "priority"
                  ? "Battery and e-waste predictions will appear here when detected."
                  : "Your saved classifications will appear here after your first scan."}
              </p>
            </div>
          ) : (
            <div className="wi-activity-list">
              {recentEvents.map((event, index) => {
                const category = getCategory(event);
                const Icon = getCategoryIcon(category);
                const confidence = getConfidence(event);

                const key =
                  event.event_id ||
                  event.id ||
                  `${category}-${getTimestamp(event) || "unknown"}-${index}`;

                const priority = isPriorityCategory(category);

                return (
                  <article className="wi-activity-row" key={key}>
                    <div
                      className={`wi-activity-icon ${
                        priority ? "wi-activity-icon-amber" : ""
                      }`}
                    >
                      <Icon size={19} />
                    </div>

                    <div className="wi-activity-copy">
                      <div className="wi-activity-title">
                        <strong>{category}</strong>

                        {priority && (
                          <span className="wi-priority-badge">
                            SPECIAL HANDLING
                          </span>
                        )}
                      </div>

                      <span className="wi-activity-time">
                        <Clock3 size={12} />
                        {formatTimestamp(getTimestamp(event))}
                      </span>
                    </div>

                    <div className="wi-activity-confidence">
                      <strong>
                        {confidence === null
                          ? "—"
                          : `${confidence.toFixed(1)}%`}
                      </strong>

                      <span>Confidence</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && events.length > 8 && filter === "all" && (
            <p className="wi-showing-note">
              Showing the 8 most recent scans.
            </p>
          )}
        </section>

        {/* Geographic limitations */}
        <section className="wi-location-note">
          <div className="wi-location-icon">
            <MapPin size={21} />
          </div>

          <div>
            <span className="wi-section-label">
              LOCATION INTELLIGENCE
            </span>

            <h2>Where are waste hotspots?</h2>

            <p>
              ReLoop currently analyses recorded image classifications.
              Those records do not establish where an item was found.
              Geographic hotspot analysis needs location-tagged reports
              and enough real observations to identify meaningful
              patterns.
            </p>
          </div>
        </section>

        {/* Data transparency */}
        <section className="wi-data-note">
          <Leaf size={20} />

          <div>
            <strong>Evidence before estimates.</strong>

            <p>
              Scan statistics reflect the saved image classifications
              in ReLoop. They do not prove that an item was recycled,
              diverted from landfill, or responsible for a particular
              environmental saving.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="wi-footer">
          <div className="wi-footer-brand">
            <div className="wi-footer-mark">
              <Recycle size={17} />
            </div>

            <span>ReLoop</span>
          </div>

          <span>Better decisions. Better destinations.</span>

          <button
            type="button"
            onClick={onBack}
            className="wi-footer-back"
          >
            Overview
            <ArrowUpRight size={14} />
          </button>
        </footer>
      </div>

      {/* Page-specific styling */}
      <style>{`
        .wi-page {
          --wi-forest: #183d2b;
          --wi-green: #368653;
          --wi-lime: #c8f169;
          --wi-ivory: #f7f6ef;
          --wi-border: #e3e8dc;
          --wi-muted: #69776a;

          min-height: 100vh;
          background: var(--wi-ivory);
          color: var(--wi-forest);
          font-family: inherit;
        }

        .wi-page *,
        .wi-page *::before,
        .wi-page *::after {
          box-sizing: border-box;
        }

        .wi-page button {
          font: inherit;
        }

        .wi-page button:focus-visible {
          outline: 3px solid var(--wi-green);
          outline-offset: 3px;
        }

        .wi-header {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 16px;

          min-height: 74px;
          padding: 12px 5%;

          background: var(--wi-forest);
          color: #fff;
        }

        .wi-back {
          display: inline-flex;
          align-items: center;
          justify-self: start;
          gap: 9px;

          padding: 9px 10px;

          border: 1px solid transparent;
          border-radius: 9px;

          background: transparent;
          color: #dce8d9;

          font-size: 12px !important;
          font-weight: 600;
          cursor: pointer;
        }

        .wi-back:hover {
          background: rgba(255,255,255,.08);
          color: var(--wi-lime);
        }

        .wi-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;

          color: #fff;
          font-family: "Manrope", sans-serif;
          font-size: 21px;
          font-weight: 800;
          letter-spacing: -.8px;
        }

        .wi-brand-icon {
          display: grid;
          place-items: center;

          width: 38px;
          height: 38px;

          border-radius: 12px;
          background: var(--wi-lime);
          color: var(--wi-forest);
        }

        .wi-header-label {
          display: flex;
          align-items: center;
          justify-self: end;
          gap: 8px;

          color: #dce8d9;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }

        .wi-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--wi-lime);
        }

        .wi-container {
          width: min(1210px, 91%);
          margin: 0 auto;
        }

        .wi-hero {
          padding: 49px 0 30px;
        }

        .wi-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;

          color: #5b7b4e;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.35px;
        }

        .wi-hero h1 {
          margin: 14px 0 12px;

          color: var(--wi-forest);
          font-family: "Manrope", sans-serif;
          font-size: clamp(34px, 4.5vw, 49px);
          font-weight: 800;
          line-height: 1.14;
          letter-spacing: -1.8px;
        }

        .wi-hero h1 span {
          color: var(--wi-green);
        }

        .wi-hero > p {
          max-width: 680px;
          margin: 0;

          color: var(--wi-muted);
          font-size: 12px;
          line-height: 1.9;
        }

        .wi-hero-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 15px;

          margin-top: 22px;
        }

        .wi-data-indicator {
          display: inline-flex;
          align-items: center;
          gap: 8px;

          color: #70816a;
          font-size: 10px;
        }

        .wi-data-indicator > span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--wi-green);
        }

        .wi-refresh {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          min-height: 40px;
          padding: 0 13px;

          border: 1px solid #dfe6d9;
          border-radius: 10px;

          background: #fff;
          color: var(--wi-forest);

          font-size: 11px !important;
          font-weight: 700;
          cursor: pointer;
        }

        .wi-refresh:hover:not(:disabled) {
          border-color: #bdd6b1;
          background: #eef5e7;
        }

        .wi-refresh:disabled {
          opacity: .6;
          cursor: wait;
        }

        .wi-updated {
          margin: 9px 0 0;
          color: #8a9685;
          font-size: 9px;
        }

        .wi-error {
          display: flex;
          align-items: flex-start;
          gap: 12px;

          margin-bottom: 20px;
          padding: 15px;

          border: 1px solid #edcfc5;
          border-radius: 13px;

          background: #fff5f1;
          color: #9a4b38;
        }

        .wi-error > svg {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .wi-error strong {
          font-size: 11px;
        }

        .wi-error p {
          margin: 5px 0 10px;
          font-size: 10px;
          line-height: 1.8;
        }

        .wi-error-retry {
          padding: 7px 10px;
          border: 1px solid #ecc9bd;
          border-radius: 8px;
          background: #fff;
          color: #984833;
          font-size: 10px !important;
          font-weight: 700;
          cursor: pointer;
        }

        .wi-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .wi-stat-card,
        .wi-panel {
          min-width: 0;
          border: 1px solid var(--wi-border);
          border-radius: 17px;
          background: #fff;
          box-shadow: 0 2px 9px rgba(24,61,43,.025);
        }

        .wi-stat-card {
          padding: 19px;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .wi-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 7px 18px rgba(24,61,43,.055);
        }

        .wi-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 9px;

          color: #72806e;
          font-size: 10px;
          font-weight: 600;
        }

        .wi-stat-icon {
          display: grid;
          place-items: center;

          width: 38px;
          height: 38px;
          flex-shrink: 0;

          border-radius: 12px;
          background: #e9f2e1;
          color: #40774a;
        }

        .wi-tone-lime .wi-stat-icon {
          background: #f0f7d9;
          color: #58783d;
        }

        .wi-tone-amber .wi-stat-icon {
          background: #fff0d9;
          color: #9b6b20;
        }

        .wi-tone-forest .wi-stat-icon {
          background: #e7eee7;
          color: var(--wi-forest);
        }

        .wi-stat-value {
          display: block;
          margin-top: 22px;

          color: var(--wi-forest);
          font-family: "Manrope", sans-serif;
          font-size: clamp(24px, 2.8vw, 33px);
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -1px;

          overflow-wrap: anywhere;
        }

        .wi-stat-card > p {
          margin: 8px 0 0;
          color: #899385;
          font-size: 9px;
          line-height: 1.7;
        }

        .wi-content-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-items: start;
          gap: 18px;

          margin-top: 19px;
        }

        .wi-panel {
          padding: 23px;
        }

        .wi-panel-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 13px;
        }

        .wi-section-label {
          display: inline-block;
          color: #6e8562;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.2px;
          line-height: 1.7;
        }

        .wi-panel-heading h2,
        .wi-activity-heading h2,
        .wi-location-note h2 {
          margin: 7px 0 6px;

          color: var(--wi-forest);
          font-family: "Manrope", sans-serif;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -.55px;
          line-height: 1.4;
        }

        .wi-panel-heading p,
        .wi-activity-heading > div:first-child > p {
          margin: 0;
          color: #7d8978;
          font-size: 10px;
          line-height: 1.8;
        }

        .wi-heading-icon {
          display: grid;
          place-items: center;

          width: 41px;
          height: 41px;
          flex-shrink: 0;

          border: 1px solid #dce8d3;
          border-radius: 12px;

          background: #edf5e5;
          color: #427648;
        }

        .wi-heading-icon-amber {
          border-color: #f0e2c8;
          background: #fff4df;
          color: #9a7028;
        }

        .wi-category-list {
          display: flex;
          flex-direction: column;
          gap: 21px;
          margin-top: 25px;
        }

        .wi-category-top {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          margin-bottom: 10px;
        }

        .wi-category-icon {
          display: grid;
          place-items: center;

          width: 36px;
          height: 36px;
          flex-shrink: 0;

          border: 1px solid #e2ebda;
          border-radius: 11px;

          background: #eff5e9;
          color: #527b4e;
        }

        .wi-category-info {
          flex: 1;
          min-width: 0;
        }

        .wi-category-info > strong {
          display: block;
          color: #324735;
          font-size: 11px;
          overflow-wrap: anywhere;
        }

        .wi-category-info > span {
          display: block;
          margin-top: 4px;
          color: #8b9586;
          font-size: 9px;
        }

        .wi-category-percent {
          flex-shrink: 0;
          color: #456d43;
          font-size: 11px;
        }

        .wi-progress {
          height: 6px;
          margin-left: 46px;
          overflow: hidden;
          border-radius: 20px;
          background: #edf1e7;
        }

        .wi-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #368653, #a3d36a);
          transition: width 400ms ease;
        }

        .wi-progress-warning {
          background: linear-gradient(90deg, #c48b36, #e7be67);
        }

        .wi-panel-note {
          margin-top: 23px;
          padding: 12px;

          border: 1px solid #e8ede3;
          border-radius: 10px;

          background: #f8faf5;
          color: #7a8874;

          font-size: 9px;
          line-height: 1.8;
        }

        .wi-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          min-height: 225px;
          padding: 28px 14px;

          text-align: center;
        }

        .wi-empty-icon {
          display: grid;
          place-items: center;
          width: 52px;
          height: 52px;
          border-radius: 15px;
          background: #edf4e6;
          color: #4a7949;
        }

        .wi-empty-state h3 {
          margin: 13px 0 0;
          color: var(--wi-forest);
          font-family: "Manrope", sans-serif;
          font-size: 14px;
          font-weight: 800;
        }

        .wi-empty-state p {
          max-width: 300px;
          margin: 7px 0 0;
          color: #82907d;
          font-size: 10px;
          line-height: 1.8;
        }

        .wi-priority-card {
          margin-top: 22px;
          padding: 20px;

          border: 1px solid #efdfbd;
          border-radius: 14px;

          background:
            radial-gradient(
              circle at 100% 0%,
              rgba(255,218,146,.26),
              transparent 45%
            ),
            #fff9ed;
        }

        .wi-priority-card-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;

          color: #916825;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .wi-priority-card > strong {
          display: block;
          margin-top: 14px;

          color: #825d20;
          font-family: "Manrope", sans-serif;
          font-size: 39px;
          font-weight: 800;
          letter-spacing: -1.4px;
        }

        .wi-priority-card > p {
          margin: 6px 0 0;
          color: #886f48;
          font-size: 10px;
          line-height: 1.8;
        }

        .wi-safety-tip {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          margin-top: 20px;
        }

        .wi-safety-tip-icon {
          display: grid;
          place-items: center;

          width: 37px;
          height: 37px;
          flex-shrink: 0;

          border: 1px solid #efdfc3;
          border-radius: 11px;

          background: #fff4e0;
          color: #9a7028;
        }

        .wi-safety-tip-blue {
          border-color: #dde7f0;
          background: #edf3fa;
          color: #4c739c;
        }

        .wi-safety-tip > div:last-child {
          min-width: 0;
        }

        .wi-safety-tip strong {
          display: block;
          margin-top: 2px;
          color: #344735;
          font-size: 11px;
        }

        .wi-safety-tip p {
          margin: 5px 0 0;
          color: #7a8776;
          font-size: 10px;
          line-height: 1.8;
        }

        .wi-activity-panel {
          margin-top: 19px;
        }

        .wi-activity-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .wi-filter-group {
          display: flex;
          align-items: center;
          gap: 4px;

          padding: 4px;
          border: 1px solid #e6ebe1;
          border-radius: 11px;
          background: #f5f7f1;
        }

        .wi-filter-group button {
          min-height: 33px;
          padding: 0 10px;

          border: 1px solid transparent;
          border-radius: 8px;

          background: transparent;
          color: #7a8775;

          font-size: 9px !important;
          font-weight: 700;
          cursor: pointer;
        }

        .wi-filter-group button:hover {
          color: var(--wi-forest);
        }

        .wi-filter-group button.wi-filter-active {
          border-color: #e2e9dc;
          background: #fff;
          color: var(--wi-forest);
          box-shadow: 0 1px 4px rgba(24,61,43,.05);
        }

        .wi-activity-list {
          margin-top: 21px;
        }

        .wi-activity-row {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;

          padding: 15px 0;
          border-bottom: 1px solid #edf0e8;
        }

        .wi-activity-row:last-child {
          border-bottom: 0;
        }

        .wi-activity-icon {
          display: grid;
          place-items: center;

          width: 41px;
          height: 41px;
          flex-shrink: 0;

          border: 1px solid #e1ead8;
          border-radius: 12px;

          background: #edf5e5;
          color: #47794b;
        }

        .wi-activity-icon-amber {
          border-color: #efdfc0;
          background: #fff3dd;
          color: #986a21;
        }

        .wi-activity-copy {
          flex: 1;
          min-width: 0;
        }

        .wi-activity-title {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 7px;
        }

        .wi-activity-title > strong {
          color: var(--wi-forest);
          font-size: 11px;
          overflow-wrap: anywhere;
        }

        .wi-priority-badge {
          padding: 4px 6px;
          border-radius: 5px;
          background: #fff1d7;
          color: #956b26;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: .4px;
        }

        .wi-activity-time {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 6px;
          color: #899484;
          font-size: 9px;
        }

        .wi-activity-confidence {
          flex-shrink: 0;
          text-align: right;
        }

        .wi-activity-confidence strong {
          display: block;
          color: #3c7143;
          font-size: 11px;
        }

        .wi-activity-confidence span {
          display: block;
          margin-top: 4px;
          color: #929c8c;
          font-size: 8px;
        }

        .wi-showing-note {
          margin: 12px 0 0;
          color: #879383;
          font-size: 9px;
        }

        .wi-location-note {
          display: flex;
          align-items: flex-start;
          gap: 14px;

          margin-top: 19px;
          padding: 21px;

          border: 1px solid #dce7d3;
          border-radius: 16px;

          background:
            linear-gradient(120deg, #edf4e5, #f7f9f2);
        }

        .wi-location-icon {
          display: grid;
          place-items: center;

          width: 42px;
          height: 42px;
          flex-shrink: 0;

          border: 1px solid #d7e5cb;
          border-radius: 12px;

          background: #e2edda;
          color: #47764a;
        }

        .wi-location-note > div:last-child {
          min-width: 0;
        }

        .wi-location-note h2 {
          font-size: 17px;
        }

        .wi-location-note p {
          margin: 8px 0 0;
          color: #6b7c65;
          font-size: 10px;
          line-height: 1.9;
        }

        .wi-data-note {
          display: flex;
          align-items: flex-start;
          gap: 11px;

          margin-top: 13px;
          padding: 17px;

          border: 1px solid #e4e9df;
          border-radius: 13px;

          background: #fff;
        }

        .wi-data-note > svg {
          flex-shrink: 0;
          margin-top: 1px;
          color: #598355;
        }

        .wi-data-note strong {
          display: block;
          color: var(--wi-forest);
          font-size: 10px;
        }

        .wi-data-note p {
          margin: 5px 0 0;
          color: #7b8777;
          font-size: 9px;
          line-height: 1.8;
        }

        .wi-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 13px;

          margin-top: 28px;
          padding: 19px 0 26px;

          border-top: 1px solid #e0e6d9;
          color: #82907e;
          font-size: 9px;
        }

        .wi-footer-brand {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          color: var(--wi-forest);
          font-family: "Manrope", sans-serif;
          font-size: 12px;
          font-weight: 800;
        }

        .wi-footer-mark {
          display: grid;
          place-items: center;

          width: 29px;
          height: 29px;

          border-radius: 9px;
          background: #e1edce;
          color: #3c784a;
        }

        .wi-footer-back {
          display: inline-flex;
          align-items: center;
          gap: 5px;

          padding: 7px 0;
          border: 0;

          background: transparent;
          color: #47764a;

          font-size: 10px !important;
          font-weight: 700;
          cursor: pointer;
        }

        .wi-footer-back:hover {
          color: var(--wi-forest);
        }

        .wi-spin {
          animation: wi-spin 1s linear infinite;
        }

        @keyframes wi-spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1000px) {
          .wi-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .wi-content-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }

        @media (max-width: 600px) {
          .wi-header {
            grid-template-columns: 1fr auto;
            min-height: 67px;
            padding: 10px 5%;
            gap: 10px;
          }

          .wi-back {
            gap: 6px;
            padding: 8px 4px;
            font-size: 11px !important;
          }

          .wi-brand {
            justify-self: end;
            font-size: 19px;
          }

          .wi-brand-icon {
            width: 34px;
            height: 34px;
          }

          .wi-header-label {
            display: none;
          }

          .wi-container {
            width: 92%;
          }

          .wi-hero {
            padding: 32px 0 23px;
          }

          .wi-hero h1 {
            font-size: clamp(30px, 8vw, 39px);
            letter-spacing: -1.4px;
          }

          .wi-hero > p {
            font-size: 11px;
          }

          .wi-hero-footer {
            align-items: flex-start;
          }

          .wi-refresh {
            min-height: 37px;
            font-size: 10px !important;
          }

          .wi-stats {
            gap: 10px;
          }

          .wi-stat-card {
            padding: 14px;
          }

          .wi-stat-top {
            align-items: flex-start;
            font-size: 9px;
          }

          .wi-stat-icon {
            width: 32px;
            height: 32px;
            border-radius: 10px;
          }

          .wi-stat-value {
            margin-top: 16px;
            font-size: 25px;
          }

          .wi-stat-card > p {
            font-size: 8px;
          }

          .wi-panel {
            padding: 17px;
          }

          .wi-panel-heading h2,
          .wi-activity-heading h2 {
            font-size: 17px;
          }

          .wi-activity-heading {
            gap: 15px;
          }

          .wi-filter-group {
            width: 100%;
          }

          .wi-filter-group button {
            flex: 1;
          }

          .wi-activity-row {
            gap: 9px;
          }

          .wi-activity-icon {
            width: 35px;
            height: 35px;
          }

          .wi-priority-badge {
            font-size: 6px;
          }

          .wi-activity-confidence span {
            font-size: 7px;
          }

          .wi-location-note {
            padding: 16px;
            gap: 11px;
          }

          .wi-location-icon {
            width: 35px;
            height: 35px;
          }

          .wi-footer {
            align-items: flex-start;
            flex-direction: column;
            gap: 10px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .wi-page *,
          .wi-page *::before,
          .wi-page *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>
    </main>
  );
}

export default Hotspots;
