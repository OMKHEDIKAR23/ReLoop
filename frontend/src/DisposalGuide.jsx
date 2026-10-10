import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Battery,
  CheckCircle2,
  ChevronRight,
  Clock3,
  GlassWater,
  Leaf,
  MapPin,
  Package,
  Recycle,
  Search,
  ShieldCheck,
  Shirt,
  Sparkles,
  Trash2,
  TriangleAlert,
  X,
  Info,
} from "lucide-react";

const WASTE_CATEGORIES = [
  {
    id: "plastic",
    name: "Plastic",
    icon: Recycle,
    color: "#e2f0d5",
    accent: "#397448",
    label: "PACKAGING",
    description: "Bottles, containers and plastic packaging.",
    steps: [
      "Empty the container and remove any leftover contents.",
      "Check the recycling symbol and local recycling rules.",
      "Use a plastic collection bin or service that accepts the item.",
    ],
    tip: "Not every type of plastic is recyclable everywhere. Check local acceptance rules before placing an item in a recycling bin.",
  },
  {
    id: "paper",
    name: "Paper & Cardboard",
    icon: Package,
    color: "#f4e8cd",
    accent: "#98702e",
    label: "PAPER PRODUCTS",
    description: "Newspapers, paper sheets and cardboard boxes.",
    steps: [
      "Keep paper and cardboard clean and dry.",
      "Flatten cardboard boxes to save storage and collection space.",
      "Place them in a designated paper recycling bin if accepted locally.",
    ],
    tip: "Greasy or food-soiled paper may not be accepted for recycling. Check the requirements of your local collection service.",
  },
  {
    id: "ewaste",
    name: "Batteries & E-Waste",
    icon: Battery,
    color: "#f5dfd8",
    accent: "#a7503f",
    label: "SPECIAL HANDLING",
    description: "Batteries, chargers, cables and electronic devices.",
    steps: [
      "Keep batteries and electronic devices separate from ordinary rubbish.",
      "Never place loose batteries in mixed recycling unless the collection service specifically instructs you to.",
      "Find an appropriate battery or electronic-waste collection service.",
    ],
    tip: "If a battery is swollen, leaking or damaged, avoid handling it unnecessarily. Keep away from heat and seek advice from an appropriate waste professional.",
  },
  {
    id: "glass",
    name: "Glass",
    icon: GlassWater,
    color: "#dceaf5",
    accent: "#3d7397",
    label: "GLASS PRODUCTS",
    description: "Glass bottles, jars and other accepted glass items.",
    steps: [
      "Check whether your local service accepts the particular type of glass.",
      "Empty containers before recycling them.",
      "Use the designated glass collection point or recycling service.",
    ],
    tip: "Drinking glasses, mirrors, window glass and broken glass may require different disposal routes from ordinary glass bottles and jars.",
  },
  {
    id: "organic",
    name: "Organic Waste",
    icon: Leaf,
    color: "#e0edcf",
    accent: "#547c3f",
    label: "ORGANIC MATERIALS",
    description: "Fruit peels, vegetable scraps and suitable food waste.",
    steps: [
      "Separate organic waste from recyclable materials.",
      "Remove packaging and other non-organic items.",
      "Use an appropriate local composting or organic-waste collection service.",
    ],
    tip: "Not every composting service accepts all food scraps. Confirm its accepted materials before adding items.",
  },
  {
    id: "textiles",
    name: "Clothes & Shoes",
    icon: Shirt,
    color: "#eae0f5",
    accent: "#79539e",
    label: "TEXTILES",
    description: "Unwanted clothing, footwear and other textiles.",
    steps: [
      "Check whether the items can be reused or repaired.",
      "Consider donating wearable items through an appropriate service.",
      "Use a designated textile collection service when available.",
    ],
    tip: "Damaged textiles may require a separate collection route. Check whether a service accepts worn-out or unusable clothing.",
  },
  {
    id: "metal",
    name: "Metal",
    icon: Recycle,
    color: "#e3e8ed",
    accent: "#536978",
    label: "METAL PRODUCTS",
    description: "Metal cans and other accepted metal items.",
    steps: [
      "Separate metal items from other waste.",
      "Empty containers and follow the local service's preparation rules.",
      "Use a recycling facility that accepts the particular metal item.",
    ],
    tip: "Metal objects such as cables, appliances and certain containers may require specialised collection rather than a standard household recycling bin.",
  },
  {
    id: "general",
    name: "General Waste",
    icon: Trash2,
    color: "#e8e9e4",
    accent: "#687165",
    label: "RESIDUAL WASTE",
    description: "Items that are not accepted by available reuse or recycling services.",
    steps: [
      "Check whether the item can be reused, repaired or recycled elsewhere.",
      "Make sure it is not hazardous waste, a battery or electronic waste.",
      "Follow your local authority's guidance for residual waste.",
    ],
    tip: "Do not place batteries, electronic waste or hazardous materials in ordinary rubbish. They may need a dedicated disposal route.",
  },
];

const QUICK_SEARCHES = [
  "Plastic",
  "Batteries",
  "Glass",
  "Paper",
];

function DisposalGuide({ onBack, initialCategory = "" }) {
  const [search, setSearch] = useState(initialCategory);
  const [selected, setSelected] = useState(null);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return WASTE_CATEGORIES;
    }

    return WASTE_CATEGORIES.filter((item) => {
      const searchableContent = [
        item.name,
        item.description,
        item.label,
        item.tip,
        ...item.steps,
      ]
        .join(" ")
        .toLowerCase();

      return searchableContent.includes(query);
    });
  }, [search]);

  function openCategory(item) {
    setSelected(item);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showAllCategories() {
    setSelected(null);
    setSearch("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const SelectedIcon = selected?.icon;

  return (
    <main className="dg-page">
      {/* TOP NAVIGATION */}
      <header className="dg-header">
        <button
          type="button"
          className="dg-back"
          onClick={onBack}
        >
          <ArrowLeft size={17} />
          <span>Dashboard</span>
        </button>

        <div className="dg-brand">
          <div className="dg-brand-mark">
            <Recycle size={21} strokeWidth={2.4} />
          </div>

          <span>ReLoop</span>
        </div>

        <div className="dg-header-label">
          <span className="dg-live-dot" />
          DISPOSAL INTELLIGENCE
        </div>
      </header>

      {/* PAGE CONTENT */}
      <div className="dg-container">
        {!selected ? (
          <>
            {/* GUIDE HERO */}
            <section className="dg-hero">
              <div className="dg-hero-copy">
                <div className="dg-eyebrow">
                  <Sparkles size={15} />
                  THE RESPONSIBLE DISPOSAL GUIDE
                </div>

                <h1>
                  Waste less.
                  <br />
                  <span>Make better choices.</span>
                </h1>

                <p className="dg-hero-description">
                  Not everything belongs in the same bin. Find practical
                  guidance for common materials and discover the next
                  step for your waste.
                </p>

                <a
                  className="dg-hero-action"
                  href="#dg-materials"
                  onClick={(event) => {
                    event.preventDefault();

                    document
                      .getElementById("dg-materials")
                      ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                  }}
                >
                  Explore disposal guides
                  <ArrowRight size={17} />
                </a>
              </div>

              <div className="dg-hero-visual" aria-hidden="true">
                <div className="dg-orbit dg-orbit-one" />
                <div className="dg-orbit dg-orbit-two" />

                <div className="dg-visual-card">
                  <div className="dg-visual-logo">
                    <Recycle size={43} strokeWidth={1.6} />
                  </div>

                  <span className="dg-visual-kicker">
                    SMALL ACTIONS
                  </span>

                  <strong>
                    Better
                    <br />
                    next steps.
                  </strong>

                  <div className="dg-visual-line" />

                  <span className="dg-visual-caption">
                    Every material has a story.
                  </span>
                </div>

                <div className="dg-floating dg-floating-leaf">
                  <Leaf size={20} />
                </div>

                <div className="dg-floating dg-floating-check">
                  <CheckCircle2 size={21} />
                </div>
              </div>
            </section>

            {/* QUICK STATS */}
            <section className="dg-summary">
              <div className="dg-summary-item">
                <div className="dg-summary-icon">
                  <Package size={19} />
                </div>

                <div>
                  <strong>8 material guides</strong>
                  <span>Common waste categories</span>
                </div>
              </div>

              <div className="dg-summary-divider" />

              <div className="dg-summary-item">
                <div className="dg-summary-icon dg-summary-icon-lime">
                  <CheckCircle2 size={19} />
                </div>

                <div>
                  <strong>Practical next steps</strong>
                  <span>Simple, actionable advice</span>
                </div>
              </div>

              <div className="dg-summary-divider" />

              <div className="dg-summary-item">
                <div className="dg-summary-icon dg-summary-icon-amber">
                  <ShieldCheck size={19} />
                </div>

                <div>
                  <strong>Safety-aware guidance</strong>
                  <span>Special handling reminders</span>
                </div>
              </div>
            </section>

            {/* MATERIALS HEADER */}
            <section
              className="dg-materials-section"
              id="dg-materials"
            >
              <div className="dg-section-heading">
                <div>
                  <div className="dg-eyebrow">
                    <span className="dg-heading-line" />
                    FIND YOUR MATERIAL
                  </div>

                  <h2>What are you disposing of?</h2>

                  <p>
                    Choose a category to see how to prepare it and where
                    it may belong.
                  </p>
                </div>

                <span className="dg-category-count">
                  {filteredCategories.length}{" "}
                  {filteredCategories.length === 1
                    ? "category"
                    : "categories"}
                </span>
              </div>

              {/* SEARCH */}
              <div className="dg-search-wrap">
                <Search size={19} />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search plastic, batteries, glass..."
                  aria-label="Search disposal categories"
                />

                {search && (
                  <button
                    className="dg-clear-search"
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                  >
                    <X size={17} />
                  </button>
                )}
              </div>

              {/* QUICK SEARCH */}
              <div className="dg-quick-searches">
                <span>POPULAR:</span>

                {QUICK_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    className={`dg-quick-chip ${
                      search.toLowerCase() === term.toLowerCase()
                        ? "active"
                        : ""
                    }`}
                    onClick={() => setSearch(term)}
                  >
                    {term}
                  </button>
                ))}
              </div>

              {/* CATEGORY CARDS */}
              {filteredCategories.length > 0 ? (
                <div className="dg-category-grid">
                  {filteredCategories.map((item, index) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="dg-category-card"
                        onClick={() => openCategory(item)}
                        style={{
                          animationDelay: `${index * 35}ms`,
                        }}
                      >
                        <div className="dg-card-top">
                          <div
                            className="dg-category-icon"
                            style={{
                              background: item.color,
                              color: item.accent,
                            }}
                          >
                            <Icon size={25} strokeWidth={1.9} />
                          </div>

                          <span className="dg-card-arrow">
                            <ArrowUpRight size={18} />
                          </span>
                        </div>

                        <span className="dg-card-label">
                          {item.label}
                        </span>

                        <h3>{item.name}</h3>

                        <p>{item.description}</p>

                        <div className="dg-card-footer">
                          <span>
                            <CheckCircle2 size={14} />
                            View practical steps
                          </span>

                          <ChevronRight size={17} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="dg-empty-state">
                  <div className="dg-empty-icon">
                    <Search size={26} />
                  </div>

                  <h3>No matching material found</h3>

                  <p>
                    Try another term, such as plastic, glass, paper,
                    battery, or clothing.
                  </p>

                  <button
                    type="button"
                    className="dg-reset-button"
                    onClick={() => setSearch("")}
                  >
                    Show all categories
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </section>

            {/* IMPORTANT REMINDER */}
            <section className="dg-bottom-note">
              <div className="dg-bottom-note-icon">
                <Info size={21} />
              </div>

              <div>
                <strong>Local rules matter.</strong>

                <p>
                  Recycling availability and accepted materials vary
                  by location. Use this guide as a starting point and
                  confirm the requirements of your local collection
                  service before disposing of an item.
                </p>
              </div>

              <div className="dg-note-decoration">
                <Leaf size={49} strokeWidth={1.2} />
              </div>
            </section>
          </>
        ) : (
          <>
            {/* DETAIL PAGE */}
            <section className="dg-detail-header">
              <button
                type="button"
                className="dg-detail-back"
                onClick={() => setSelected(null)}
              >
                <ArrowLeft size={16} />
                All materials
              </button>

              <div
                className="dg-detail-hero"
                style={{
                  "--dg-detail-accent": selected.accent,
                  "--dg-detail-bg": selected.color,
                }}
              >
                <div className="dg-detail-copy">
                  <div className="dg-eyebrow">
                    <span className="dg-heading-line" />
                    MATERIAL DISPOSAL GUIDE
                  </div>

                  <span className="dg-detail-label">
                    {selected.label}
                  </span>

                  <h1>{selected.name}</h1>

                  <p>{selected.description}</p>
                </div>

                <div className="dg-detail-art">
                  <div className="dg-detail-art-ring" />

                  <div className="dg-detail-art-icon">
                    {SelectedIcon && (
                      <SelectedIcon
                        size={57}
                        strokeWidth={1.5}
                      />
                    )}
                  </div>

                  <div className="dg-detail-art-badge">
                    <CheckCircle2 size={20} />
                  </div>
                </div>
              </div>
            </section>

            <div className="dg-detail-layout">
              {/* MAIN INSTRUCTIONS */}
              <section className="dg-steps-panel">
                <div className="dg-steps-heading">
                  <div className="dg-section-number">01</div>

                  <div>
                    <span className="dg-eyebrow">
                      YOUR NEXT STEPS
                    </span>

                    <h2>What should you do?</h2>

                    <p>
                      Follow these practical steps before disposing
                      of this material.
                    </p>
                  </div>
                </div>

                <div className="dg-steps-list">
                  {selected.steps.map((step, index) => (
                    <div className="dg-step" key={step}>
                      <div className="dg-step-marker">
                        {index + 1}
                      </div>

                      <div className="dg-step-copy">
                        <span>STEP {String(index + 1).padStart(2, "0")}</span>

                        <p>{step}</p>
                      </div>

                      <CheckCircle2
                        className="dg-step-check"
                        size={19}
                      />
                    </div>
                  ))}
                </div>

                <div className="dg-step-complete">
                  <div className="dg-step-complete-icon">
                    <Leaf size={20} />
                  </div>

                  <div>
                    <strong>Make the next step count.</strong>

                    <p>
                      Check local acceptance rules before taking
                      your item to a collection facility.
                    </p>
                  </div>
                </div>
              </section>

              {/* SUPPORTING INFORMATION */}
              <aside className="dg-detail-sidebar">
                <div className="dg-material-summary">
                  <div
                    className="dg-material-summary-icon"
                    style={{
                      background: selected.color,
                      color: selected.accent,
                    }}
                  >
                    {SelectedIcon && (
                      <SelectedIcon size={25} />
                    )}
                  </div>

                  <span className="dg-eyebrow">
                    MATERIAL OVERVIEW
                  </span>

                  <h3>{selected.name}</h3>

                  <p>{selected.description}</p>

                  <div className="dg-summary-divider-line" />

                  <div className="dg-summary-property">
                    <CheckCircle2 size={16} />
                    <span>Preparation guidance included</span>
                  </div>

                  <div className="dg-summary-property">
                    <MapPin size={16} />
                    <span>Check local collection options</span>
                  </div>
                </div>

                <div className="dg-safety-card">
                  <div className="dg-safety-heading">
                    <div className="dg-safety-icon">
                      <TriangleAlert size={19} />
                    </div>

                    <span>IMPORTANT REMINDER</span>
                  </div>

                  <h3>Good to know</h3>

                  <p>{selected.tip}</p>
                </div>

                <div className="dg-location-reminder">
                  <ShieldCheck size={20} />

                  <div>
                    <strong>Confirm before disposal</strong>

                    <p>
                      Local facilities may accept different materials.
                      Confirm the correct route with the service
                      provider.
                    </p>
                  </div>
                </div>
              </aside>
            </div>

            {/* DETAIL PAGE FOOTER */}
            <section className="dg-detail-footer">
              <div>
                <span className="dg-eyebrow">
                  KEEP MAKING BETTER CHOICES
                </span>

                <h3>Have another item?</h3>

                <p>
                  Explore the other materials in the ReLoop guide.
                </p>
              </div>

              <button
                type="button"
                className="dg-explore-button"
                onClick={showAllCategories}
              >
                Explore all materials
                <ArrowRight size={17} />
              </button>
            </section>
          </>
        )}

        {/* FOOTER */}
        <footer className="dg-footer">
          <div className="dg-footer-brand">
            <div className="dg-footer-mark">
              <Recycle size={17} />
            </div>

            <span>ReLoop</span>
          </div>

          <span className="dg-footer-message">
            Small actions. Better destinations.
          </span>

          <button
            type="button"
            className="dg-footer-back"
            onClick={onBack}
          >
            Back to overview
            <ArrowUpRight size={14} />
          </button>
        </footer>
      </div>

      {/* PAGE-SPECIFIC DESIGN */}
      <style>{`
        .dg-page {
          --dg-forest: #183d2b;
          --dg-green: #368653;
          --dg-lime: #c8f169;
          --dg-ivory: #f7f6ef;
          --dg-border: #e3e8dc;
          --dg-muted: #69776a;

          min-height: 100vh;
          background: var(--dg-ivory);
          color: var(--dg-forest);
          font-family: inherit;
        }

        .dg-page *,
        .dg-page *::before,
        .dg-page *::after {
          box-sizing: border-box;
        }

        .dg-page button,
        .dg-page input {
          font: inherit;
        }

        .dg-page button:focus-visible,
        .dg-page a:focus-visible,
        .dg-page input:focus-visible {
          outline: 3px solid var(--dg-green);
          outline-offset: 3px;
        }

        /* TOP NAVIGATION */

        .dg-header {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 16px;

          min-height: 74px;
          padding: 12px 5%;

          border-bottom: 1px solid rgba(255,255,255,.08);
          background: var(--dg-forest);
          color: #fff;
        }

        .dg-back {
          display: inline-flex;
          align-items: center;
          justify-self: start;
          gap: 9px;

          padding: 9px 11px;

          border: 1px solid transparent;
          border-radius: 9px;

          background: transparent;
          color: #dce8d9;

          font-size: 12px !important;
          font-weight: 600;
          cursor: pointer;

          transition:
            background 180ms ease,
            color 180ms ease;
        }

        .dg-back:hover {
          background: rgba(255,255,255,.08);
          color: var(--dg-lime);
        }

        .dg-brand {
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

        .dg-brand-mark {
          display: grid;
          place-items: center;

          width: 38px;
          height: 38px;

          border-radius: 12px;
          background: var(--dg-lime);
          color: var(--dg-forest);
        }

        .dg-header-label {
          display: flex;
          align-items: center;
          justify-self: end;
          gap: 8px;

          color: #d5e4d1;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.3px;
        }

        .dg-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--dg-lime);
        }

        .dg-container {
          width: min(1210px, 90%);
          margin: 0 auto;
        }

        /* HERO */

        .dg-hero {
          position: relative;

          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(260px, .65fr);
          align-items: center;
          gap: 30px;

          min-height: 355px;
          margin-top: 30px;
          padding: 37px 41px;

          overflow: hidden;
          border: 1px solid #d5e3c6;
          border-radius: 24px;

          background:
            radial-gradient(
              circle at 85% 12%,
              rgba(255,255,255,.65),
              transparent 35%
            ),
            linear-gradient(120deg, #e5efda 0%, #dceacb 60%, #d3e7bc 100%);

          box-shadow: 0 7px 25px rgba(24,61,43,.045);
        }

        .dg-hero::after {
          position: absolute;
          right: -100px;
          bottom: -210px;

          width: 450px;
          height: 450px;

          border: 1px solid rgba(59,103,49,.12);
          border-radius: 50%;

          content: "";
          pointer-events: none;
        }

        .dg-hero-copy {
          position: relative;
          z-index: 1;
          min-width: 0;
        }

        .dg-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;

          color: #5e7e50;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.4px;
          line-height: 1.6;
        }

        .dg-hero h1 {
          margin: 18px 0 13px;

          color: var(--dg-forest);
          font-family: "Manrope", sans-serif;
          font-size: clamp(35px, 4.4vw, 51px);
          font-weight: 800;
          line-height: 1.13;
          letter-spacing: -2px;
        }

        .dg-hero h1 span {
          color: var(--dg-green);
        }

        .dg-hero-description {
          max-width: 570px;
          margin: 0;

          color: #576c51;
          font-size: 13px;
          line-height: 1.9;
        }

        .dg-hero-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;

          margin-top: 24px;
          padding: 12px 16px;

          border: 1px solid var(--dg-forest);
          border-radius: 10px;

          background: var(--dg-forest);
          color: #fff;

          font-size: 12px;
          font-weight: 700;
          text-decoration: none;

          transition:
            background 180ms ease,
            color 180ms ease,
            transform 180ms ease;
        }

        .dg-hero-action:hover {
          transform: translateY(-2px);
          background: #2c5a3a;
          color: #fff;
        }

        /* DECORATIVE HERO ART */

        .dg-hero-visual {
          position: relative;

          display: grid;
          place-items: center;

          min-height: 267px;
        }

        .dg-orbit {
          position: absolute;
          border: 1px solid rgba(58,104,45,.18);
          border-radius: 50%;
        }

        .dg-orbit-one {
          width: 253px;
          height: 253px;
        }

        .dg-orbit-two {
          width: 195px;
          height: 195px;
        }

        .dg-visual-card {
          position: relative;
          z-index: 1;

          display: flex;
          flex-direction: column;
          align-items: flex-start;

          width: 182px;
          padding: 23px;

          border: 1px solid rgba(255,255,255,.8);
          border-radius: 20px;

          background: rgba(255,255,255,.79);
          box-shadow: 0 13px 35px rgba(41,75,33,.10);

          transform: rotate(2deg);
          backdrop-filter: blur(8px);
        }

        .dg-visual-logo {
          display: grid;
          place-items: center;

          width: 52px;
          height: 52px;

          margin-bottom: 22px;

          border: 1px solid #d8e6c8;
          border-radius: 16px;

          background: #e6f1d8;
          color: #39754a;
        }

        .dg-visual-kicker {
          color: #6c865d;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.15px;
        }

        .dg-visual-card > strong {
          margin-top: 8px;

          color: var(--dg-forest);
          font-family: "Manrope", sans-serif;
          font-size: 23px;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -.8px;
        }

        .dg-visual-line {
          width: 100%;
          height: 1px;
          margin: 15px 0 11px;

          background: #e3eadc;
        }

        .dg-visual-caption {
          color: #74816d;
          font-size: 9px;
        }

        .dg-floating {
          position: absolute;
          z-index: 2;

          display: grid;
          place-items: center;

          width: 43px;
          height: 43px;

          border: 1px solid rgba(255,255,255,.8);
          border-radius: 14px;

          background: #fff;
          box-shadow: 0 7px 20px rgba(34,65,30,.09);
        }

        .dg-floating-leaf {
          top: 28px;
          right: 20px;

          background: var(--dg-lime);
          color: var(--dg-forest);

          transform: rotate(9deg);
        }

        .dg-floating-check {
          bottom: 27px;
          left: 18px;

          color: #37834e;
          transform: rotate(-7deg);
        }

        /* SUMMARY STRIP */

        .dg-summary {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: center;
          gap: 0;

          margin-top: 19px;
          padding: 20px 23px;

          border: 1px solid var(--dg-border);
          border-radius: 17px;

          background: #fff;
          box-shadow: 0 2px 8px rgba(24,61,43,.025);
        }

        .dg-summary-item {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .dg-summary-icon {
          display: grid;
          place-items: center;

          width: 42px;
          height: 42px;
          flex-shrink: 0;

          border: 1px solid #dfead7;
          border-radius: 12px;

          background: #edf5e5;
          color: #39764a;
        }

        .dg-summary-icon-lime {
          background: #f0f8d9;
          border-color: #e6efc5;
          color: #4b7038;
        }

        .dg-summary-icon-amber {
          background: #fff2dd;
          border-color: #f0e3c6;
          color: #956e25;
        }

        .dg-summary-item strong {
          display: block;

          color: var(--dg-forest);
          font-size: 11px;
          font-weight: 800;
          line-height: 1.5;
        }

        .dg-summary-item span {
          display: block;
          margin-top: 4px;

          color: #818c7d;
          font-size: 10px;
          line-height: 1.5;
        }

        .dg-summary-divider {
          width: 1px;
          height: 38px;
          justify-self: center;
          background: #e9ede4;
        }

        /* SECTION HEADING */

        .dg-materials-section {
          padding-top: 65px;
          scroll-margin-top: 25px;
        }

        .dg-section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 22px;

          margin-bottom: 22px;
        }

        .dg-heading-line {
          width: 22px;
          height: 2px;
          background: var(--dg-green);
        }

        .dg-section-heading h2 {
          margin: 9px 0 7px;

          color: var(--dg-forest);
          font-family: "Manrope", sans-serif;
          font-size: clamp(25px, 3vw, 32px);
          font-weight: 800;
          letter-spacing: -1px;
          line-height: 1.25;
        }

        .dg-section-heading p {
          margin: 0;

          color: var(--dg-muted);
          font-size: 12px;
          line-height: 1.8;
        }

        .dg-category-count {
          flex-shrink: 0;
          margin-bottom: 3px;

          padding: 8px 11px;

          border: 1px solid #e1e8d9;
          border-radius: 9px;

          background: #fff;
          color: #607a55;

          font-size: 10px;
          font-weight: 700;
        }

        /* SEARCH */

        .dg-search-wrap {
          display: flex;
          align-items: center;
          gap: 12px;

          min-height: 54px;
          padding: 0 16px;

          border: 1px solid #e0e6d9;
          border-radius: 13px;

          background: #fff;
          color: #728270;

          box-shadow: 0 3px 12px rgba(24,61,43,.025);

          transition:
            border-color 180ms ease,
            box-shadow 180ms ease;
        }

        .dg-search-wrap:focus-within {
          border-color: #91b187;
          box-shadow: 0 0 0 4px rgba(54,134,83,.075);
        }

        .dg-search-wrap > svg {
          flex-shrink: 0;
        }

        .dg-search-wrap input {
          width: 100%;
          min-width: 0;

          padding: 14px 0;

          border: 0;
          outline: 0;

          background: transparent;
          color: var(--dg-forest);

          font-size: 12px;
        }

        .dg-search-wrap input::placeholder {
          color: #969f93;
        }

        .dg-clear-search {
          display: grid;
          place-items: center;

          width: 31px;
          height: 31px;
          flex-shrink: 0;

          border: 0;
          border-radius: 8px;

          background: #f0f4eb;
          color: #587052;

          cursor: pointer;
        }

        .dg-clear-search:hover {
          background: #e3edd9;
        }

        /* QUICK SEARCH CHIPS */

        .dg-quick-searches {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;

          margin: 13px 0 27px;
        }

        .dg-quick-searches > span {
          margin-right: 2px;

          color: #869181;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .dg-quick-chip {
          padding: 7px 10px;

          border: 1px solid #e1e7da;
          border-radius: 20px;

          background: rgba(255,255,255,.65);
          color: #697965;

          font-size: 10px !important;
          font-weight: 600;
          cursor: pointer;

          transition:
            background 180ms ease,
            color 180ms ease,
            border-color 180ms ease;
        }

        .dg-quick-chip:hover,
        .dg-quick-chip.active {
          border-color: #cadfc0;
          background: #e9f2e1;
          color: #285d37;
        }

        /* CATEGORY GRID */

        .dg-category-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 15px;
        }

        .dg-category-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;

          min-width: 0;
          min-height: 228px;
          padding: 19px;

          border: 1px solid #e2e8dc;
          border-radius: 17px;

          background: #fff;
          color: var(--dg-forest);

          text-align: left;
          cursor: pointer;

          box-shadow: 0 2px 8px rgba(24,61,43,.025);

          animation: dg-enter 300ms both;

          transition:
            border-color 180ms ease,
            box-shadow 180ms ease,
            transform 180ms ease;
        }

        .dg-category-card:hover {
          transform: translateY(-4px);

          border-color: #bdd3b2;
          box-shadow: 0 12px 25px rgba(24,61,43,.075);
        }

        .dg-category-card:active {
          transform: translateY(-1px);
        }

        .dg-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;

          width: 100%;
          margin-bottom: 17px;
        }

        .dg-category-icon {
          display: grid;
          place-items: center;

          width: 48px;
          height: 48px;

          border: 1px solid rgba(24,61,43,.035);
          border-radius: 14px;

          transition: transform 200ms ease;
        }

        .dg-category-card:hover .dg-category-icon {
          transform: rotate(-5deg) scale(1.04);
        }

        .dg-card-arrow {
          display: grid;
          place-items: center;

          width: 31px;
          height: 31px;
          flex-shrink: 0;

          border: 1px solid #e8ede3;
          border-radius: 9px;

          background: #fafbf8;
          color: #71836a;

          transition:
            background 180ms ease,
            color 180ms ease,
            border-color 180ms ease;
        }

        .dg-category-card:hover .dg-card-arrow {
          border-color: var(--dg-forest);
          background: var(--dg-forest);
          color: var(--dg-lime);
        }

        .dg-card-label {
          color: #78896f;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.1px;
        }

        .dg-category-card h3 {
          margin: 7px 0 7px;

          color: var(--dg-forest);
          font-family: "Manrope", sans-serif;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.45;
          letter-spacing: -.3px;

          overflow-wrap: anywhere;
        }

        .dg-category-card > p {
          flex: 1;

          margin: 0;

          color: #788376;
          font-size: 10px;
          line-height: 1.8;
        }

        .dg-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;

          width: 100%;
          margin-top: 18px;
          padding-top: 12px;

          border-top: 1px solid #edf0e9;

          color: #47724a;
        }

        .dg-card-footer span {
          display: flex;
          align-items: center;
          gap: 6px;

          font-size: 9px;
          font-weight: 700;
        }

        .dg-card-footer svg {
          flex-shrink: 0;
        }

        /* EMPTY SEARCH */

        .dg-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;

          padding: 48px 20px;

          border: 1px solid #e2e8dc;
          border-radius: 18px;

          background: #fff;
          text-align: center;
        }

        .dg-empty-icon {
          display: grid;
          place-items: center;

          width: 52px;
          height: 52px;

          border-radius: 15px;
          background: #eaf2e2;
          color: #487449;
        }

        .dg-empty-state h3 {
          margin: 16px 0 0;

          color: var(--dg-forest);
          font-family: "Manrope", sans-serif;
          font-size: 17px;
        }

        .dg-empty-state p {
          max-width: 380px;
          margin: 8px 0 0;

          color: #778374;
          font-size: 12px;
          line-height: 1.8;
        }

        .dg-reset-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;

          margin-top: 18px;
          padding: 11px 14px;

          border: 1px solid var(--dg-forest);
          border-radius: 9px;

          background: var(--dg-forest);
          color: #fff;

          font-size: 11px !important;
          font-weight: 700;
          cursor: pointer;
        }

        .dg-reset-button:hover {
          background: #2c5b3b;
        }

        /* BOTTOM REMINDER */

        .dg-bottom-note {
          position: relative;

          display: flex;
          align-items: flex-start;
          gap: 14px;

          margin-top: 32px;
          padding: 23px;

          overflow: hidden;

          border: 1px solid #dbe6d0;
          border-radius: 16px;

          background: #edf4e5;
        }

        .dg-bottom-note-icon {
          display: grid;
          place-items: center;

          width: 40px;
          height: 40px;
          flex-shrink: 0;

          border: 1px solid #d6e4cb;
          border-radius: 12px;

          background: #e0edcf;
          color: #427148;
        }

        .dg-bottom-note > div:nth-child(2) {
          position: relative;
          z-index: 1;
          max-width: 850px;
        }

        .dg-bottom-note strong {
          display: block;

          color: var(--dg-forest);
          font-size: 12px;
          font-weight: 800;
        }

        .dg-bottom-note p {
          margin: 6px 0 0;

          color: #60735a;
          font-size: 11px;
          line-height: 1.8;
        }

        .dg-note-decoration {
          position: absolute;
          right: 19px;
          bottom: 5px;

          color: #b1cba0;
          opacity: .55;
          transform: rotate(-20deg);
        }

        /* DETAIL HEADER */

        .dg-detail-header {
          padding-top: 32px;
        }

        .dg-detail-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;

          padding: 9px 0;

          border: 0;
          background: transparent;
          color: #5a7651;

          font-size: 11px !important;
          font-weight: 700;
          cursor: pointer;
        }

        .dg-detail-back:hover {
          color: var(--dg-forest);
        }

        .dg-detail-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;

          min-height: 265px;
          margin-top: 20px;
          padding: 36px 40px;

          overflow: hidden;

          border: 1px solid #e1e8d9;
          border-radius: 22px;

          background:
            radial-gradient(
              circle at 88% 20%,
              rgba(255,255,255,.75),
              transparent 35%
            ),
            linear-gradient(
              120deg,
              var(--dg-detail-bg),
              #fff
            );
        }

        .dg-detail-copy {
          flex: 1;
          min-width: 0;
        }

        .dg-detail-label {
          display: inline-block;
          margin-top: 19px;

          color: var(--dg-detail-accent);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.4px;
        }

        .dg-detail-copy h1 {
          margin: 8px 0 9px;

          color: var(--dg-forest);
          font-family: "Manrope", sans-serif;
          font-size: clamp(32px, 4vw, 45px);
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -1.7px;

          overflow-wrap: anywhere;
        }

        .dg-detail-copy > p {
          max-width: 560px;
          margin: 0;

          color: #657360;
          font-size: 12px;
          line-height: 1.8;
        }

        .dg-detail-art {
          position: relative;

          display: grid;
          place-items: center;

          width: 190px;
          min-width: 160px;
          height: 190px;
        }

        .dg-detail-art-ring {
          position: absolute;
          inset: 0;

          border: 1px solid color-mix(
            in srgb,
            var(--dg-detail-accent) 24%,
            transparent
          );
          border-radius: 50%;
        }

        .dg-detail-art-icon {
          position: relative;
          z-index: 1;

          display: grid;
          place-items: center;

          width: 116px;
          height: 116px;

          border: 1px solid rgba(255,255,255,.8);
          border-radius: 33px;

          background: rgba(255,255,255,.72);
          color: var(--dg-detail-accent);

          box-shadow: 0 10px 30px rgba(24,61,43,.08);
        }

        .dg-detail-art-badge {
          position: absolute;
          right: 3px;
          bottom: 17px;
          z-index: 2;

          display: grid;
          place-items: center;

          width: 43px;
          height: 43px;

          border: 3px solid #fff;
          border-radius: 14px;

          background: var(--dg-lime);
          color: var(--dg-forest);
        }

        /* DETAIL LAYOUT */

        .dg-detail-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(265px, .65fr);
          align-items: start;
          gap: 20px;

          margin-top: 23px;
        }

        .dg-steps-panel,
        .dg-material-summary,
        .dg-safety-card,
        .dg-location-reminder {
          min-width: 0;

          border: 1px solid var(--dg-border);
          border-radius: 17px;

          background: #fff;
          box-shadow: 0 2px 9px rgba(24,61,43,.025);
        }

        .dg-steps-panel {
          padding: 28px;
        }

        .dg-steps-heading {
          display: flex;
          align-items: flex-start;
          gap: 13px;
        }

        .dg-section-number {
          display: grid;
          place-items: center;

          width: 42px;
          height: 42px;
          flex-shrink: 0;

          border: 1px solid #dbe7d2;
          border-radius: 12px;

          background: #eaf3e1;
          color: #477749;

          font-family: "Manrope", sans-serif;
          font-size: 13px;
          font-weight: 800;
        }

        .dg-steps-heading h2 {
          margin: 7px 0 5px;

          color: var(--dg-forest);
          font-family: "Manrope", sans-serif;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -.7px;
        }

        .dg-steps-heading p {
          margin: 0;

          color: #788475;
          font-size: 11px;
          line-height: 1.8;
        }

        .dg-steps-list {
          margin-top: 27px;
        }

        .dg-step {
          display: flex;
          align-items: flex-start;
          gap: 13px;

          padding: 19px 0;

          border-bottom: 1px solid #edf0e8;
        }

        .dg-step:first-child {
          border-top: 1px solid #edf0e8;
        }

        .dg-step-marker {
          display: grid;
          place-items: center;

          width: 35px;
          height: 35px;
          flex-shrink: 0;

          border: 1px solid #dce7d4;
          border-radius: 11px;

          background: #f0f5ea;
          color: #487449;

          font-family: "Manrope", sans-serif;
          font-size: 12px;
          font-weight: 800;
        }

        .dg-step-copy {
          flex: 1;
          min-width: 0;
        }

        .dg-step-copy > span {
          color: #83917d;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }

        .dg-step-copy p {
          margin: 5px 0 0;

          color: #344536;
          font-size: 12px;
          line-height: 1.8;
        }

        .dg-step-check {
          flex-shrink: 0;
          margin-top: 6px;
          color: #69a063;
        }

        .dg-step-complete {
          display: flex;
          align-items: flex-start;
          gap: 11px;

          margin-top: 22px;
          padding: 16px;

          border: 1px solid #dce8d2;
          border-radius: 13px;

          background: #f0f6e9;
        }

        .dg-step-complete-icon {
          display: grid;
          place-items: center;

          width: 35px;
          height: 35px;
          flex-shrink: 0;

          border-radius: 10px;
          background: var(--dg-lime);
          color: var(--dg-forest);
        }

        .dg-step-complete strong {
          display: block;
          margin-top: 1px;

          color: var(--dg-forest);
          font-size: 11px;
        }

        .dg-step-complete p {
          margin: 5px 0 0;

          color: #65775e;
          font-size: 10px;
          line-height: 1.8;
        }

        /* DETAIL SIDEBAR */

        .dg-detail-sidebar {
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-width: 0;
        }

        .dg-material-summary {
          padding: 22px;
        }

        .dg-material-summary-icon {
          display: grid;
          place-items: center;

          width: 49px;
          height: 49px;
          margin-bottom: 18px;

          border-radius: 14px;
        }

        .dg-material-summary > h3 {
          margin: 7px 0 7px;

          color: var(--dg-forest);
          font-family: "Manrope", sans-serif;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -.5px;
        }

        .dg-material-summary > p {
          margin: 0;

          color: #788475;
          font-size: 11px;
          line-height: 1.8;
        }

        .dg-summary-divider-line {
          width: 100%;
          height: 1px;
          margin: 18px 0;

          background: #e9eee4;
        }

        .dg-summary-property {
          display: flex;
          align-items: flex-start;
          gap: 9px;

          margin-top: 12px;

          color: #5e7359;
          font-size: 10px;
          line-height: 1.6;
        }

        .dg-summary-property svg {
          flex-shrink: 0;
          color: #5c9658;
        }

        .dg-safety-card {
          padding: 20px;

          border-color: #eedfc0;

          background: #fffaf0;
        }

        .dg-safety-heading {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .dg-safety-icon {
          display: grid;
          place-items: center;

          width: 34px;
          height: 34px;
          flex-shrink: 0;

          border: 1px solid #eedfbd;
          border-radius: 10px;

          background: #fff0d0;
          color: #966e24;
        }

        .dg-safety-heading > span {
          color: #916b2b;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .dg-safety-card h3 {
          margin: 15px 0 8px;

          color: #755527;
          font-family: "Manrope", sans-serif;
          font-size: 16px;
          font-weight: 800;
        }

        .dg-safety-card > p {
          margin: 0;

          color: #806c49;
          font-size: 11px;
          line-height: 1.9;
        }

        .dg-location-reminder {
          display: flex;
          align-items: flex-start;
          gap: 11px;

          padding: 17px;

          background: #edf4e6;
          border-color: #dce8d3;
        }

        .dg-location-reminder > svg {
          flex-shrink: 0;
          color: #4c7b4b;
        }

        .dg-location-reminder strong {
          display: block;

          color: var(--dg-forest);
          font-size: 10px;
        }

        .dg-location-reminder p {
          margin: 6px 0 0;

          color: #6d7e66;
          font-size: 10px;
          line-height: 1.8;
        }

        /* DETAIL FOOTER */

        .dg-detail-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;

          margin-top: 25px;
          padding: 24px;

          border: 1px solid #dbe6d0;
          border-radius: 16px;

          background: #edf4e5;
        }

        .dg-detail-footer h3 {
          margin: 7px 0 5px;

          color: var(--dg-forest);
          font-family: "Manrope", sans-serif;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -.5px;
        }

        .dg-detail-footer p {
          margin: 0;

          color: #6c7b65;
          font-size: 11px;
          line-height: 1.7;
        }

        .dg-explore-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;

          flex-shrink: 0;
          min-height: 42px;
          padding: 0 15px;

          border: 1px solid var(--dg-forest);
          border-radius: 10px;

          background: var(--dg-forest);
          color: #fff;

          font-size: 11px !important;
          font-weight: 700;
          cursor: pointer;

          transition:
            background 180ms ease,
            transform 180ms ease;
        }

        .dg-explore-button:hover {
          transform: translateY(-2px);
          background: #2c5b3b;
        }

        /* GLOBAL FOOTER */

        .dg-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;

          margin-top: 35px;
          padding: 21px 0 28px;

          border-top: 1px solid #e0e6d9;
        }

        .dg-footer-brand {
          display: flex;
          align-items: center;
          gap: 8px;

          color: var(--dg-forest);
          font-family: "Manrope", sans-serif;
          font-size: 13px;
          font-weight: 800;
        }

        .dg-footer-mark {
          display: grid;
          place-items: center;

          width: 29px;
          height: 29px;

          border-radius: 9px;
          background: #e4efd8;
          color: #427648;
        }

        .dg-footer-message {
          color: #83907e;
          font-size: 10px;
        }

        .dg-footer-back {
          display: inline-flex;
          align-items: center;
          gap: 5px;

          padding: 7px 0;

          border: 0;
          background: transparent;
          color: #47724a;

          font-size: 10px !important;
          font-weight: 700;
          cursor: pointer;
        }

        .dg-footer-back:hover {
          color: var(--dg-forest);
        }

        /* ANIMATIONS */

        @keyframes dg-enter {
          from {
            opacity: 0;
            transform: translateY(7px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* TABLET */

        @media (max-width: 1000px) {
          .dg-hero {
            grid-template-columns: minmax(0, 1fr) minmax(220px, .6fr);
            padding: 31px;
          }

          .dg-hero-visual {
            transform: scale(.88);
          }

          .dg-category-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .dg-detail-layout {
            grid-template-columns: minmax(0, 1.1fr) minmax(240px, .9fr);
          }

          .dg-steps-panel {
            padding: 22px;
          }
        }

        @media (max-width: 760px) {
          .dg-category-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .dg-hero {
            grid-template-columns: minmax(0, 1fr);
            min-height: auto;
            padding: 30px;
          }

          .dg-hero-visual {
            display: none;
          }

          .dg-summary {
            grid-template-columns: minmax(0, 1fr);
            gap: 15px;
            padding: 18px;
          }

          .dg-summary-divider {
            width: 100%;
            height: 1px;
          }

          .dg-detail-hero {
            padding: 27px;
          }

          .dg-detail-art {
            width: 135px;
            min-width: 120px;
            height: 135px;
          }

          .dg-detail-art-icon {
            width: 88px;
            height: 88px;
            border-radius: 25px;
          }

          .dg-detail-art-icon svg {
            width: 44px;
            height: 44px;
          }

          .dg-detail-art-badge {
            right: -1px;
            bottom: 5px;
            width: 36px;
            height: 36px;
          }

          .dg-detail-art-ring {
            inset: 1px;
          }

          .dg-detail-layout {
            grid-template-columns: minmax(0, 1fr);
          }

          .dg-detail-sidebar {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .dg-material-summary {
            grid-column: 1 / -1;
          }
        }

        /* MOBILE */

        @media (max-width: 520px) {
          .dg-header {
            grid-template-columns: 1fr auto;
            gap: 10px;
            min-height: 66px;
            padding: 10px 5%;
          }

          .dg-back {
            gap: 6px;
            padding: 8px 4px;
            font-size: 11px !important;
          }

          .dg-brand {
            justify-self: end;
            font-size: 19px;
          }

          .dg-brand-mark {
            width: 34px;
            height: 34px;
          }

          .dg-header-label {
            display: none;
          }

          .dg-container {
            width: 91%;
          }

          .dg-hero {
            gap: 0;
            margin-top: 17px;
            padding: 28px 21px;
            border-radius: 19px;
          }

          .dg-hero h1 {
            margin-top: 15px;
            font-size: clamp(31px, 8.5vw, 39px);
            letter-spacing: -1.6px;
          }

          .dg-hero-description {
            font-size: 11px;
          }

          .dg-hero-action {
            margin-top: 19px;
            font-size: 11px;
          }

          .dg-summary {
            margin-top: 13px;
            padding: 17px;
          }

          .dg-materials-section {
            padding-top: 42px;
          }

          .dg-section-heading {
            align-items: flex-start;
            flex-direction: column;
            gap: 12px;
          }

          .dg-section-heading h2 {
            font-size: 25px;
          }

          .dg-category-count {
            align-self: flex-start;
          }

          .dg-search-wrap {
            min-height: 50px;
            padding: 0 12px;
          }

          .dg-quick-searches {
            gap: 6px;
            margin-bottom: 20px;
          }

          .dg-category-grid {
            gap: 10px;
          }

          .dg-category-card {
            min-height: 207px;
            padding: 13px;
            border-radius: 14px;
          }

          .dg-card-top {
            margin-bottom: 13px;
          }

          .dg-category-icon {
            width: 41px;
            height: 41px;
            border-radius: 12px;
          }

          .dg-category-icon svg {
            width: 21px;
            height: 21px;
          }

          .dg-card-arrow {
            width: 27px;
            height: 27px;
          }

          .dg-card-label {
            font-size: 7px;
            letter-spacing: .8px;
          }

          .dg-category-card h3 {
            font-size: 12px;
          }

          .dg-category-card > p {
            font-size: 10px;
          }

          .dg-card-footer {
            align-items: flex-start;
            margin-top: 13px;
            padding-top: 10px;
          }

          .dg-card-footer span {
            font-size: 8px;
          }

          .dg-card-footer > svg {
            display: none;
          }

          .dg-bottom-note {
            gap: 11px;
            padding: 16px;
          }

          .dg-bottom-note-icon {
            width: 34px;
            height: 34px;
          }

          .dg-note-decoration {
            display: none;
          }

          .dg-detail-header {
            padding-top: 20px;
          }

          .dg-detail-hero {
            gap: 10px;
            margin-top: 15px;
            padding: 24px 19px;
            border-radius: 18px;
          }

          .dg-detail-copy h1 {
            font-size: clamp(27px, 7vw, 35px);
            letter-spacing: -1.2px;
          }

          .dg-detail-copy > p {
            font-size: 11px;
          }

          .dg-detail-art {
            width: 80px;
            min-width: 80px;
            height: 80px;
          }

          .dg-detail-art-ring {
            inset: 0;
          }

          .dg-detail-art-icon {
            width: 58px;
            height: 58px;
            border-radius: 18px;
          }

          .dg-detail-art-icon svg {
            width: 30px;
            height: 30px;
          }

          .dg-detail-art-badge {
            right: -3px;
            bottom: 0;
            width: 28px;
            height: 28px;
            border-width: 2px;
            border-radius: 9px;
          }

          .dg-detail-art-badge svg {
            width: 16px;
            height: 16px;
          }

          .dg-detail-layout {
            gap: 14px;
            margin-top: 15px;
          }

          .dg-steps-panel {
            padding: 18px;
          }

          .dg-steps-heading h2 {
            font-size: 19px;
          }

          .dg-step {
            gap: 10px;
            padding: 16px 0;
          }

          .dg-step-marker {
            width: 31px;
            height: 31px;
          }

          .dg-step-copy p {
            font-size: 11px;
          }

          .dg-step-check {
            width: 17px;
            height: 17px;
          }

          .dg-detail-sidebar {
            grid-template-columns: minmax(0, 1fr);
          }

          .dg-material-summary {
            grid-column: auto;
            padding: 18px;
          }

          .dg-safety-card {
            padding: 17px;
          }

          .dg-detail-footer {
            align-items: flex-start;
            flex-direction: column;
            padding: 20px;
          }

          .dg-explore-button {
            width: 100%;
          }

          .dg-footer {
            align-items: flex-start;
            flex-direction: column;
            gap: 11px;
            margin-top: 24px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .dg-page *,
          .dg-page *::before,
          .dg-page *::after {
            scroll-behavior: auto !important;
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>
    </main>
  );
}

export default DisposalGuide;