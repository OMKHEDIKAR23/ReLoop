
import { useState } from "react";
import {
  ArrowUpRight,
  Camera,
  Map,
  Recycle,
  TrendingUp,
  Trash2,
  Zap,
} from "lucide-react";

import "./index.css";
import ScanWaste from "./pages/ScanWaste";

const categories = [
  { name: "Plastic", amount: "42%", icon: Recycle },
  { name: "E-Waste", amount: "21%", icon: Zap },
  { name: "Paper", amount: "19%", icon: Trash2 },
  { name: "Organic", amount: "18%", icon: Recycle },
];

function App() {
  const [page, setPage] = useState("overview");

  if (page === "scan") {
    return <ScanWaste onBack={() => setPage("overview")} />;
  }

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
            className="nav-item active"
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

          <button className="nav-item">
            <Map size={18} />
            Hotspots
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="impact-card">
            <span>Your impact</span>
            <strong>128 items</strong>
            <small>correctly sorted</small>
          </div>

          <div className="profile">
            <div className="avatar">OM</div>

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
              Understand what gets discarded, where it happens, and what to do
              next.
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

        <section className="hero-grid">
          <div className="scan-card">
            <div className="scan-content">
              <span className="section-label">QUICK ACTION</span>

              <h2>Not sure where it belongs?</h2>

              <p>
                Take a photo of any waste item and ReLoop will suggest the
                right disposal path.
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
              <span>Items reported</span>
              <TrendingUp size={18} />
            </div>

            <strong>1,284</strong>

            <div className="stat-change">
              <span>+18.4%</span>
              <small>this week</small>
            </div>

            <div className="mini-chart">
              <span style={{ height: "35%" }}></span>
              <span style={{ height: "48%" }}></span>
              <span style={{ height: "42%" }}></span>
              <span style={{ height: "65%" }}></span>
              <span style={{ height: "58%" }}></span>
              <span style={{ height: "82%" }}></span>
              <span style={{ height: "94%" }}></span>
            </div>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <span className="section-label">WASTE MIX</span>
                <h3>What's being discarded?</h3>
              </div>

              <button className="text-button">
                View details
              </button>
            </div>

            <div className="category-list">
              {categories.map((category) => {
                const Icon = category.icon;

                return (
                  <div className="category-row" key={category.name}>
                    <div className="category-icon">
                      <Icon size={18} />
                    </div>

                    <div className="category-info">
                      <span>{category.name}</span>

                      <div className="progress">
                        <div
                          className="progress-fill"
                          style={{ width: category.amount }}
                        ></div>
                      </div>
                    </div>

                    <strong>{category.amount}</strong>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel hotspot-panel">
            <div className="panel-header">
              <div>
                <span className="section-label">CAMPUS SIGNAL</span>
                <h3>Waste hotspots</h3>
              </div>

              <Map size={20} />
            </div>

            <div className="map-placeholder">
              <div className="map-grid"></div>

              <div className="hotspot hotspot-a"></div>
              <div className="hotspot hotspot-b"></div>
              <div className="hotspot hotspot-c"></div>

              <div className="map-label label-a">Library</div>
              <div className="map-label label-b">Cafeteria</div>
              <div className="map-label label-c">Hostel</div>
            </div>

            <div className="hotspot-footer">
              <span>
                <i></i>
                7 active hotspots
              </span>

              <button className="text-button">
                Explore map <ArrowUpRight size={15} />
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
              <strong>E-waste reports increased 31%</strong> near the
              engineering block this week. A dedicated collection point could
              reduce incorrect disposal.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;