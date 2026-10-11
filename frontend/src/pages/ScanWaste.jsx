import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  AlertCircle,
  BatteryCharging,
  Camera,
  CheckCircle2,
  Clock3,
  ImagePlus,
  Leaf,
  LoaderCircle,
  MapPin,
  Recycle,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
  Zap,
} from "lucide-react";

/*
 * API requests use the same origin by default.
 *
 * For deployment, configure VITE_API_URL to the backend's base URL.
 * Example: VITE_API_URL=https://your-backend.example.com
 */
const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, "")}/api/waste/analyze`
  : "/api/waste/analyze";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function normalizeConfidence(rawValue) {
  if (
    rawValue === undefined ||
    rawValue === null ||
    rawValue === ""
  ) {
    return null;
  }

  const value = Number(rawValue);

  if (!Number.isFinite(value)) {
    return null;
  }

  /*
   * Accommodate either 0.94 or 94 as the confidence value.
   * The current ReLoop backend normally returns percentages.
   */
  const percentage =
    value >= 0 && value <= 1 ? value * 100 : value;

  return Math.max(0, Math.min(100, percentage));
}

function getCategoryIcon(category) {
  const value = String(category || "").toLowerCase();

  if (value.includes("battery")) {
    return BatteryCharging;
  }

  if (
    value.includes("electronic") ||
    value.includes("e-waste") ||
    value.includes("e waste")
  ) {
    return Zap;
  }

  if (
    value.includes("organic") ||
    value.includes("biological")
  ) {
    return Leaf;
  }

  if (
    value.includes("paper") ||
    value.includes("cardboard")
  ) {
    return ImagePlus;
  }

  if (
    value.includes("plastic") ||
    value.includes("glass") ||
    value.includes("metal") ||
    value.includes("recycl")
  ) {
    return Recycle;
  }

  return Search;
}

function ScanWaste({ onBack, onViewCollection }) {
  const inputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState(null);
  const [recovery, setRecovery] = useState(null);
  const [error, setError] = useState("");

  /*
   * Release image preview URLs when a new image replaces the old one
   * or when this component unmounts.
   */
  useEffect(() => {
    return () => {
      if (image) {
        URL.revokeObjectURL(image);
      }
    };
  }, [image]);

  function processFile(file) {
    if (!file) {
      return;
    }

    setError("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(
        "Please choose a JPG, PNG, or WEBP image."
      );
      return;
    }

    if (file.size === 0) {
      setError(
        "The selected image is empty. Please choose another image."
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(
        "This image exceeds 10 MB. Choose a smaller image and try again."
      );
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setImage(previewUrl);
    setSelectedFile(file);
    setResult(null);
    setRecovery(null);
  }

  function handleImageSelection(event) {
    const file = event.target.files?.[0];

    processFile(file);

    /*
     * Reset the input so choosing the same file again
     * still triggers its change event.
     */
    event.target.value = "";
  }

  function openFilePicker() {
    if (analyzing) {
      return;
    }

    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  }

  function handleDragOver(event) {
    event.preventDefault();

    if (!analyzing) {
      setDragging(true);
    }
  }

  function handleDragLeave(event) {
    event.preventDefault();

    /*
     * Ignore transitions between children of the drop zone.
     */
    if (
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }

    setDragging(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);

    if (analyzing) {
      return;
    }

    const file = event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    processFile(file);
  }

  async function analyzeWaste() {
    if (!selectedFile) {
      setError("Please choose an image first.");
      return;
    }

    setAnalyzing(true);
    setError("");
    setResult(null);
    setRecovery(null);

    try {
      const formData = new FormData();

      formData.append("file", selectedFile);

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let message = "";

        try {
          const errorData = await response.json();

          if (typeof errorData.detail === "string") {
            message = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            message = errorData.detail
              .map((item) => item.msg)
              .filter(Boolean)
              .join(" ");
          }
        } catch {
          // Use the fallback message below.
        }

        if (response.status >= 500) {
          throw new Error(
            message ||
              "The ReLoop server encountered an error. Please try again."
          );
        }

        throw new Error(
          message ||
            `Image analysis failed (${response.status}). Please try another image.`
        );
      }

      const data = await response.json();

      if (!data.result || !data.result.category) {
        throw new Error(
          "The server returned an incomplete result."
        );
      }

      setResult(data.result);
      setRecovery(data.recovery || null);
    } catch (err) {
      console.error("Waste analysis failed:", err);

      setError(
        err instanceof TypeError
          ? "Cannot connect to the ReLoop backend. Check that the server is running and the API URL is correct."
          : err.message ||
              "Something went wrong while analyzing the image."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  function reset() {
    /*
     * The useEffect cleanup releases the previous preview URL.
     */
    setImage(null);
    setSelectedFile(null);
    setResult(null);
    setRecovery(null);
    setError("");
    setDragging(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  const confidence = normalizeConfidence(
    result?.confidence
  );

  const category = String(result?.category || "");

  const normalizedCategory = category.toLowerCase();

  const isUncertain =
    normalizedCategory === "uncertain" ||
    normalizedCategory === "unknown";

  const confidenceIsLow =
    confidence !== null && confidence < 60;

  const confidenceNeedsReview =
    confidenceIsLow || isUncertain;

  const CategoryIcon = getCategoryIcon(category);

  return (
    <main className="sw-page">
      {/* PAGE HEADER */}
      <header className="sw-header">
        <button
          type="button"
          className="sw-back"
          onClick={onBack}
        >
          <ArrowLeft size={17} />
          <span>Dashboard</span>
        </button>

        <div className="sw-brand">
          <div className="sw-brand-mark">
            <Recycle size={22} strokeWidth={2.4} />
          </div>

          <span>ReLoop</span>
        </div>

        <div className="sw-header-label">
          <span className="sw-header-dot" />
          WASTE INTELLIGENCE
        </div>
      </header>

      <div className="sw-container">
        {/* HERO */}
        <section className="sw-hero">
          <div className="sw-eyebrow">
            <Sparkles size={15} />
            AI-POWERED WASTE IDENTIFICATION
          </div>

          <h1>
            Every item has
            <br />
            <span>a next destination.</span>
          </h1>

          <p>
            Photograph a waste item, discover its likely category,
            and get practical recovery guidance for your next step.
          </p>

          <div className="sw-hero-points">
            <span>
              <CheckCircle2 size={15} />
              Image classification
            </span>

            <span>
              <Leaf size={15} />
              Recovery guidance
            </span>

            <span>
              <ShieldCheck size={15} />
              Safety-aware advice
            </span>
          </div>
        </section>

        {/* SCANNER WORKSPACE */}
        <section className="sw-workspace">
          {/* IMAGE UPLOAD PANEL */}
          <article className="sw-panel sw-upload-panel">
            <div className="sw-panel-heading">
              <div className="sw-panel-title">
                <span className="sw-step-number">01</span>

                <div>
                  <span className="sw-panel-kicker">
                    IMAGE INPUT
                  </span>

                  <h2>Show us the item.</h2>
                </div>
              </div>

              <div className="sw-panel-status">
                <span />
                {image ? "Image selected" : "Awaiting image"}
              </div>
            </div>

            <input
              ref={inputRef}
              className="sw-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageSelection}
              aria-label="Choose an image of a waste item"
              tabIndex={-1}
            />

            {!image ? (
              <button
                type="button"
                className={`sw-upload-zone ${
                  dragging ? "sw-upload-zone-active" : ""
                }`}
                onClick={openFilePicker}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                aria-label="Upload a waste image or drop one here"
              >
                <div className="sw-upload-art">
                  <div className="sw-upload-art-ring" />

                  <div className="sw-upload-art-icon">
                    <ImagePlus size={29} />
                  </div>

                  <div className="sw-upload-art-badge">
                    <Sparkles size={15} />
                  </div>
                </div>

                <span className="sw-upload-heading">
                  {dragging
                    ? "Drop your image here"
                    : "Drop an image here"}
                </span>

                <span className="sw-upload-description">
                  or click to browse your device
                </span>

                <span className="sw-upload-button-label">
                  <Upload size={15} />
                  Choose image
                </span>

                <span className="sw-file-support">
                  JPG, PNG or WEBP
                  <span />
                  Up to 10 MB
                </span>
              </button>
            ) : (
              <div className="sw-preview-area">
                <div className="sw-preview-toolbar">
                  <div className="sw-preview-file">
                    <div className="sw-preview-file-icon">
                      <ImagePlus size={16} />
                    </div>

                    <div>
                      <strong>Selected image</strong>

                      <span>
                        {selectedFile
                          ? formatFileSize(selectedFile.size)
                          : "Image ready"}
                      </span>
                    </div>
                  </div>

                  <span className="sw-ready-badge">
                    <CheckCircle2 size={13} />
                    Ready
                  </span>
                </div>

                <div className="sw-image-preview">
                  <img
                    src={image}
                    alt="Preview of the selected waste item"
                  />

                  {analyzing && (
                    <div className="sw-image-loading">
                      <div className="sw-image-loading-card">
                        <LoaderCircle
                          className="sw-spin"
                          size={23}
                        />

                        <span>Analyzing image...</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="sw-preview-bottom">
                  <div className="sw-preview-file-name">
                    <Camera size={15} />

                    <span>
                      {selectedFile?.name || "Selected image"}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="sw-change-image"
                    onClick={openFilePicker}
                    disabled={analyzing}
                  >
                    <RotateCcw size={14} />
                    Change
                  </button>
                </div>
              </div>
            )}

            {image && !result && (
              <button
                type="button"
                className="sw-primary-button sw-analyze-button"
                onClick={analyzeWaste}
                disabled={analyzing}
              >
                {analyzing ? (
                  <LoaderCircle
                    className="sw-spin"
                    size={18}
                  />
                ) : (
                  <Sparkles size={18} />
                )}

                {analyzing
                  ? "Analyzing your image..."
                  : "Identify this waste"}

                {!analyzing && (
                  <ArrowUpRight
                    size={17}
                    className="sw-button-trailing"
                  />
                )}
              </button>
            )}

            {analyzing && (
              <div
                className="sw-processing-note"
                role="status"
                aria-live="polite"
              >
                <div className="sw-processing-indicator">
                  <span />
                  <span />
                  <span />
                </div>

                <div>
                  <strong>Working on your result</strong>

                  <p>
                    ReLoop is classifying the image and preparing
                    recovery guidance.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div
                className="sw-error"
                role="alert"
              >
                <div className="sw-error-icon">
                  <AlertCircle size={19} />
                </div>

                <div className="sw-error-copy">
                  <strong>We couldn't finish that step.</strong>

                  <p>{error}</p>
                </div>

                <button
                  type="button"
                  className="sw-dismiss-error"
                  onClick={() => setError("")}
                  aria-label="Dismiss error"
                >
                  <X size={17} />
                </button>
              </div>
            )}

            <div className="sw-upload-footer">
              <ShieldCheck size={16} />

              <span>
                Your image is sent to the ReLoop backend for analysis.
              </span>
            </div>
          </article>

          {/* RESULTS PANEL */}
          <article className="sw-panel sw-result-panel">
            {!result ? (
              <div className="sw-empty-result">
                <div className="sw-result-decoration">
                  <div className="sw-result-orbit sw-orbit-one" />
                  <div className="sw-result-orbit sw-orbit-two" />

                  <div className="sw-empty-result-icon">
                    <Recycle size={34} strokeWidth={1.6} />
                  </div>

                  <div className="sw-result-spark sw-spark-one">
                    <Sparkles size={17} />
                  </div>

                  <div className="sw-result-spark sw-spark-two">
                    <Leaf size={17} />
                  </div>
                </div>

                <span className="sw-panel-kicker">
                  YOUR WASTE REPORT
                </span>

                <h2>Your next step starts here.</h2>

                <p>
                  Upload an image to discover its predicted waste
                  category and get a practical recovery recommendation.
                </p>

                <div className="sw-result-preview-features">
                  <div>
                    <CheckCircle2 size={15} />
                    <span>Predicted category</span>
                  </div>

                  <div>
                    <CheckCircle2 size={15} />
                    <span>Recommended next action</span>
                  </div>

                  <div>
                    <CheckCircle2 size={15} />
                    <span>Handling guidance</span>
                  </div>
                </div>

                <div className="sw-empty-hint">
                  <ArrowLeft size={15} />
                  <span>
                    Start by choosing an image on the left.
                  </span>
                </div>
              </div>
            ) : (
              <div className="sw-result-content">
                {/* RESULT HEADER */}
                <div className="sw-result-heading">
                  <div className="sw-result-heading-copy">
                    <span className="sw-panel-kicker">
                      YOUR WASTE REPORT
                    </span>

                    <h2>Analysis results</h2>

                    <p>
                      Here's what ReLoop identified in your image.
                    </p>
                  </div>

                  <div
                    className={`sw-result-status ${
                      confidenceNeedsReview
                        ? "sw-result-status-caution"
                        : ""
                    }`}
                  >
                    {confidenceNeedsReview ? (
                      <AlertCircle size={15} />
                    ) : (
                      <CheckCircle2 size={15} />
                    )}

                    {confidenceNeedsReview
                      ? "Review prediction"
                      : "Analysis complete"}
                  </div>
                </div>

                {/* AI CAUTION */}
                <div className="sw-ai-disclaimer">
                  <div className="sw-ai-disclaimer-icon">
                    <ShieldCheck size={18} />
                  </div>

                  <p>
                    This is an AI-generated prediction, not a
                    verified identification. Check the item before
                    following category-specific recommendations.
                  </p>
                </div>

                {/* CATEGORY RESULT */}
                <div className="sw-prediction-card">
                  <div className="sw-prediction-top">
                    <span className="sw-panel-kicker">
                      PREDICTED CATEGORY
                    </span>

                    <span className="sw-prediction-icon">
                      <CategoryIcon size={22} />
                    </span>
                  </div>

                  <h3>{category}</h3>

                  {confidence !== null ? (
                    <div className="sw-confidence-section">
                      <div className="sw-confidence-heading">
                        <span>Model confidence</span>

                        <strong
                          className={
                            confidenceIsLow
                              ? "sw-confidence-low"
                              : ""
                          }
                        >
                          {confidence.toFixed(2)}%
                        </strong>
                      </div>

                      <div
                        className="sw-confidence-track"
                        role="progressbar"
                        aria-label="Model confidence"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(confidence)}
                      >
                        <div
                          className={`sw-confidence-fill ${
                            confidenceIsLow
                              ? "sw-confidence-fill-low"
                              : ""
                          }`}
                          style={{
                            width: `${confidence}%`,
                          }}
                        />
                      </div>

                      <span className="sw-confidence-caption">
                        {confidenceIsLow
                          ? "Low confidence — verify the item."
                          : "Model estimate, not a guarantee of accuracy."}
                      </span>
                    </div>
                  ) : (
                    <p className="sw-no-confidence">
                      The model did not provide a confidence score.
                    </p>
                  )}
                </div>

                {confidenceNeedsReview && (
                  <div className="sw-review-note">
                    <AlertCircle size={19} />

                    <p>
                      {isUncertain
                        ? "The model could not confidently identify this item. Try a clearer image with one item centred in the frame."
                        : "The model has limited confidence in this prediction. Verify the item before acting on category-specific advice."}
                    </p>
                  </div>
                )}

                {/* NEXT ACTION */}
                <section className="sw-next-action">
                  <div className="sw-section-icon sw-section-icon-lime">
                    <ArrowRight size={19} />
                  </div>

                  <div className="sw-next-action-copy">
                    <span className="sw-panel-kicker">
                      SUGGESTED NEXT ACTION
                    </span>

                    <p>
                      {result.action ||
                        "Check local waste disposal guidance for this category."}
                    </p>
                  </div>
                </section>

                {/* RECOVERY INTELLIGENCE */}
                {recovery ? (
                  <section className="sw-recovery">
                    <div className="sw-recovery-header">
                      <div className="sw-recovery-brand">
                        <div className="sw-recovery-logo">
                          <Recycle size={20} />
                        </div>

                        <div>
                          <span className="sw-panel-kicker">
                            RELOOP INTELLIGENCE
                          </span>

                          <h3>Recovery recommendation</h3>
                        </div>
                      </div>

                      <span className="sw-recovery-badge">
                        <Leaf size={13} />
                        NEXT STEP
                      </span>
                    </div>

                    <div className="sw-recovery-route">
                      <span>RECOMMENDED RECOVERY ROUTE</span>

                      <p>
                        {recovery.route ||
                          "Check the appropriate local collection service."}
                      </p>
                    </div>

                    {recovery.why && (
                      <div className="sw-recovery-explanation">
                        <span>WHY THIS ROUTE?</span>

                        <p>{recovery.why}</p>
                      </div>
                    )}

                    <div className="sw-next-step">
                      <div className="sw-next-step-top">
                        <span className="sw-next-step-number">
                          01
                        </span>

                        <strong>Your next step</strong>
                      </div>

                      <p>
                        {recovery.next_step ||
                          "Confirm local collection requirements before disposing of this item."}
                      </p>
                    </div>

                    {recovery.handling_note && (
                      <div className="sw-handling-note">
                        <AlertCircle size={18} />

                        <p>
                          <strong>Handling guidance</strong>

                          <span>{recovery.handling_note}</span>
                        </p>
                      </div>
                    )}

                    <div className="sw-recovery-disclaimer">
                      <ShieldCheck size={16} />

                      <span>
                        This recommendation provides general recovery
                        guidance. Acceptance by a specific facility
                        has not been confirmed.
                      </span>
                    </div>
                  </section>
                ) : (
                  <section className="sw-recovery-fallback">
                    <div className="sw-recovery-logo">
                      <Recycle size={19} />
                    </div>

                    <div>
                      <strong>Recovery guidance</strong>

                      <p>
                        {result.action ||
                          "Check local disposal guidance before proceeding."}
                      </p>
                    </div>
                  </section>
                )}

                {/* OPTIONAL LOCATION */}
                {result.location && (
                  <div className="sw-location-suggestion">
                    <div className="sw-location-icon">
                      <MapPin size={19} />
                    </div>

                    <div>
                      <span className="sw-panel-kicker">
                        SUGGESTED COLLECTION POINT
                      </span>

                      <strong>{result.location}</strong>
                    </div>
                  </div>
                )}

                {/* FOOTER ACTIONS */}
                <div className="sw-result-footer">
                  <button
                    type="button"
                    className="sw-primary-button sw-collection-button"
                    onClick={() => onViewCollection?.()}
                  >
                    <MapPin size={17} />

                    View collection points

                    <ArrowUpRight
                      size={17}
                      className="sw-button-trailing"
                    />
                  </button>

                  <button
                    type="button"
                    className="sw-secondary-button"
                    onClick={reset}
                  >
                    <RotateCcw size={15} />
                    Analyze another item
                  </button>
                </div>
              </div>
            )}
          </article>
        </section>

        {/* BOTTOM INFORMATION */}
        <section className="sw-bottom-note">
          <div className="sw-bottom-note-icon">
            <ShieldCheck size={20} />
          </div>

          <div>
            <strong>Good decisions start with good information.</strong>

            <p>
              ReLoop classifies images to suggest possible waste
              categories and recovery routes. It cannot confirm
              material composition or facility acceptance from an
              image alone. Follow local collection requirements.
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="sw-footer">
          <div className="sw-footer-brand">
            <div className="sw-footer-mark">
              <Recycle size={17} />
            </div>

            <span>ReLoop</span>
          </div>

          <span>Better decisions. Better destinations.</span>

          <button
            type="button"
            onClick={onBack}
            className="sw-footer-back"
          >
            Overview
            <ArrowUpRight size={14} />
          </button>
        </footer>
      </div>

      {/* SCAN PAGE DESIGN */}
      <style>{`
        .sw-page {
          --sw-forest: #183d2b;
          --sw-green: #368653;
          --sw-lime: #c8f169;
          --sw-ivory: #f7f6ef;
          --sw-border: #e3e8dc;
          --sw-muted: #69776a;

          min-height: 100vh;
          background: var(--sw-ivory);
          color: var(--sw-forest);
          font-family: inherit;
        }

        .sw-page *,
        .sw-page *::before,
        .sw-page *::after {
          box-sizing: border-box;
        }

        .sw-page button,
        .sw-page input {
          font: inherit;
        }

        .sw-page button:focus-visible,
        .sw-page input:focus-visible {
          outline: 3px solid var(--sw-green);
          outline-offset: 3px;
        }

        /* HEADER */

        .sw-header {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 16px;

          min-height: 74px;
          padding: 12px 5%;

          background: var(--sw-forest);
          color: #fff;
          border-bottom: 1px solid rgba(255,255,255,.07);
        }

        .sw-back {
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

          transition: background 180ms ease, color 180ms ease;
        }

        .sw-back:hover {
          background: rgba(255,255,255,.08);
          color: var(--sw-lime);
        }

        .sw-brand {
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

        .sw-brand-mark {
          display: grid;
          place-items: center;

          width: 38px;
          height: 38px;

          border-radius: 12px;
          background: var(--sw-lime);
          color: var(--sw-forest);
        }

        .sw-header-label {
          display: flex;
          justify-self: end;
          align-items: center;
          gap: 8px;

          color: #dce8d9;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }

        .sw-header-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--sw-lime);
        }

        .sw-container {
          width: min(1240px, 91%);
          margin: 0 auto;
        }

        /* HERO */

        .sw-hero {
          padding: 48px 0 31px;
        }

        .sw-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;

          color: #5b7b4e;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.45px;
        }

        .sw-hero h1 {
          margin: 15px 0 11px;

          color: var(--sw-forest);
          font-family: "Manrope", sans-serif;
          font-size: clamp(34px, 4.5vw, 50px);
          font-weight: 800;
          line-height: 1.13;
          letter-spacing: -1.9px;
        }

        .sw-hero h1 span {
          color: var(--sw-green);
        }

        .sw-hero > p {
          max-width: 660px;
          margin: 0;

          color: var(--sw-muted);
          font-size: 13px;
          line-height: 1.9;
        }

        .sw-hero-points {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;

          margin-top: 20px;
        }

        .sw-hero-points span {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          color: #63775c;
          font-size: 10px;
          font-weight: 600;
        }

        .sw-hero-points svg {
          color: var(--sw-green);
        }

        /* MAIN LAYOUT */

        .sw-workspace {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          align-items: stretch;
          gap: 20px;
        }

        .sw-panel {
          min-width: 0;
          padding: 23px;

          border: 1px solid var(--sw-border);
          border-radius: 20px;

          background: #fff;
          box-shadow: 0 3px 12px rgba(24,61,43,.035);
        }

        .sw-panel-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;

          margin-bottom: 21px;
        }

        .sw-panel-title {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .sw-step-number {
          display: grid;
          place-items: center;

          width: 40px;
          height: 40px;
          flex-shrink: 0;

          border: 1px solid #dce8d1;
          border-radius: 12px;

          background: #edf5e5;
          color: #427348;

          font-family: "Manrope", sans-serif;
          font-size: 12px;
          font-weight: 800;
        }

        .sw-panel-kicker {
          display: block;

          color: #718467;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.2px;
          line-height: 1.7;
        }

        .sw-panel-title h2 {
          margin: 4px 0 0;

          color: var(--sw-forest);
          font-family: "Manrope", sans-serif;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -.5px;
          line-height: 1.4;
        }

        .sw-panel-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;

          flex-shrink: 0;
          color: #889485;
          font-size: 9px;
        }

        .sw-panel-status > span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #c8d1c1;
        }

        .sw-file-input {
          display: none;
        }

        /* UPLOAD ZONE */

        .sw-upload-zone {
          position: relative;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          width: 100%;
          min-height: 385px;
          padding: 28px 18px;

          border: 1.5px dashed #aec4a1;
          border-radius: 16px;

          background:
            radial-gradient(
              circle at 50% 20%,
              rgba(200,241,105,.14),
              transparent 42%
            ),
            #f8faf5;

          color: var(--sw-forest);
          text-align: center;
          cursor: pointer;

          transition:
            border-color 180ms ease,
            background 180ms ease,
            box-shadow 180ms ease;
        }

        .sw-upload-zone:hover,
        .sw-upload-zone-active {
          border-color: var(--sw-green);
          background: #f0f6e9;
          box-shadow: inset 0 0 0 1px rgba(54,134,83,.05);
        }

        .sw-upload-zone-active {
          border-width: 2px;
          border-style: solid;
        }

        .sw-upload-art {
          position: relative;

          display: grid;
          place-items: center;

          width: 100px;
          height: 100px;
          margin-bottom: 25px;
        }

        .sw-upload-art-ring {
          position: absolute;
          inset: 0;

          border: 1px solid #d6e5c8;
          border-radius: 32px;

          transform: rotate(12deg);
          transition: transform 250ms ease;
        }

        .sw-upload-zone:hover .sw-upload-art-ring {
          transform: rotate(22deg);
        }

        .sw-upload-art-icon {
          position: relative;
          z-index: 1;

          display: grid;
          place-items: center;

          width: 70px;
          height: 70px;

          border: 1px solid #d9e7ce;
          border-radius: 22px;

          background: #eaf4df;
          color: #38754a;

          box-shadow: 0 8px 20px rgba(43,90,41,.07);
        }

        .sw-upload-art-badge {
          position: absolute;
          top: -1px;
          right: -5px;
          z-index: 2;

          display: grid;
          place-items: center;

          width: 29px;
          height: 29px;

          border: 2px solid #f8faf5;
          border-radius: 10px;

          background: var(--sw-lime);
          color: var(--sw-forest);
        }

        .sw-upload-heading {
          color: var(--sw-forest);
          font-family: "Manrope", sans-serif;
          font-size: 17px;
          font-weight: 800;
          letter-spacing: -.4px;
        }

        .sw-upload-description {
          margin-top: 7px;

          color: #7c8975;
          font-size: 11px;
        }

        .sw-upload-button-label {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          min-height: 40px;
          margin-top: 23px;
          padding: 0 15px;

          border: 1px solid var(--sw-forest);
          border-radius: 10px;

          background: var(--sw-forest);
          color: #fff;

          font-size: 11px;
          font-weight: 700;

          transition:
            background 180ms ease,
            color 180ms ease,
            transform 180ms ease;
        }

        .sw-upload-zone:hover .sw-upload-button-label {
          transform: translateY(-1px);
          background: #28583b;
        }

        .sw-file-support {
          display: flex;
          align-items: center;
          gap: 9px;

          margin-top: 20px;

          color: #879382;
          font-size: 9px;
        }

        .sw-file-support > span {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #aab6a3;
        }

        /* PREVIEW */

        .sw-preview-area {
          min-width: 0;
          overflow: hidden;

          border: 1px solid #e3e9df;
          border-radius: 15px;

          background: #fff;
        }

        .sw-preview-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;

          min-height: 67px;
          padding: 12px 13px;

          border-bottom: 1px solid #e9eee4;
        }

        .sw-preview-file {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .sw-preview-file-icon {
          display: grid;
          place-items: center;

          width: 35px;
          height: 35px;
          flex-shrink: 0;

          border-radius: 10px;
          background: #edf4e6;
          color: #47784b;
        }

        .sw-preview-file strong,
        .sw-preview-file span {
          display: block;
          overflow-wrap: anywhere;
        }

        .sw-preview-file strong {
          color: var(--sw-forest);
          font-size: 10px;
        }

        .sw-preview-file > div:last-child > span {
          margin-top: 4px;
          color: #899486;
          font-size: 9px;
        }

        .sw-ready-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;

          flex-shrink: 0;
          padding: 6px 8px;

          border: 1px solid #dcead4;
          border-radius: 8px;

          background: #f0f7e9;
          color: #4b7946;

          font-size: 9px;
          font-weight: 700;
        }

        .sw-image-preview {
          position: relative;

          height: 310px;
          overflow: hidden;

          background:
            radial-gradient(
              circle at 50% 50%,
              #354034,
              #1b241d
            );
        }

        .sw-image-preview img {
          display: block;

          width: 100%;
          height: 100%;

          object-fit: contain;
        }

        .sw-image-loading {
          position: absolute;
          inset: 0;

          display: grid;
          place-items: center;

          background: rgba(24,61,43,.45);
          backdrop-filter: blur(2px);
        }

        .sw-image-loading-card {
          display: flex;
          align-items: center;
          gap: 10px;

          padding: 13px 16px;

          border: 1px solid rgba(255,255,255,.7);
          border-radius: 12px;

          background: #fff;
          color: var(--sw-forest);

          font-size: 12px;
          font-weight: 700;
        }

        .sw-image-loading-card svg {
          color: var(--sw-green);
        }

        .sw-preview-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;

          min-height: 54px;
          padding: 9px 13px;
        }

        .sw-preview-file-name {
          display: flex;
          align-items: center;
          gap: 7px;

          min-width: 0;

          color: #778473;
          font-size: 9px;
        }

        .sw-preview-file-name svg {
          flex-shrink: 0;
        }

        .sw-preview-file-name span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sw-change-image {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;

          flex-shrink: 0;
          padding: 8px 10px;

          border: 1px solid #e2e8dc;
          border-radius: 8px;

          background: #f8faf5;
          color: #56724d;

          font-size: 10px !important;
          font-weight: 700;
          cursor: pointer;
        }

        .sw-change-image:hover:not(:disabled) {
          background: #edf5e5;
          border-color: #d0e1c3;
        }

        /* BUTTONS */

        .sw-primary-button,
        .sw-secondary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;

          min-height: 45px;
          padding: 0 15px;

          border: 1px solid var(--sw-forest);
          border-radius: 10px;

          background: var(--sw-forest);
          color: #fff;

          font-size: 11px !important;
          font-weight: 700;

          cursor: pointer;

          transition:
            background 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease,
            transform 180ms ease;
        }

        .sw-primary-button:hover:not(:disabled) {
          transform: translateY(-2px);
          border-color: #28583b;
          background: #28583b;
          box-shadow: 0 6px 15px rgba(24,61,43,.13);
        }

        .sw-primary-button:disabled,
        .sw-secondary-button:disabled,
        .sw-change-image:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .sw-analyze-button {
          width: 100%;
          margin-top: 16px;
        }

        .sw-button-trailing {
          margin-left: auto;
        }

        .sw-secondary-button {
          background: #fff;
          color: var(--sw-forest);
          border-color: #dfe6d9;
        }

        .sw-secondary-button:hover {
          background: #f0f5e9;
          border-color: #cadcc0;
        }

        /* STATUS MESSAGES */

        .sw-processing-note {
          display: flex;
          align-items: flex-start;
          gap: 12px;

          margin-top: 15px;
          padding: 14px;

          border: 1px solid #dce8d4;
          border-radius: 12px;

          background: #f1f6eb;
        }

        .sw-processing-note > div:last-child {
          min-width: 0;
        }

        .sw-processing-note strong {
          display: block;
          color: var(--sw-forest);
          font-size: 11px;
        }

        .sw-processing-note p {
          margin: 5px 0 0;
          color: #6c7e66;
          font-size: 10px;
          line-height: 1.7;
        }

        .sw-processing-indicator {
          display: flex;
          gap: 4px;
          flex-shrink: 0;
          margin-top: 4px;
        }

        .sw-processing-indicator span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--sw-green);
          animation: sw-dots 900ms ease-in-out infinite alternate;
        }

        .sw-processing-indicator span:nth-child(2) {
          animation-delay: 180ms;
        }

        .sw-processing-indicator span:nth-child(3) {
          animation-delay: 360ms;
        }

        .sw-error {
          display: flex;
          align-items: flex-start;
          gap: 10px;

          margin-top: 15px;
          padding: 13px;

          border: 1px solid #f0d5cb;
          border-radius: 12px;

          background: #fff6f2;
          color: #994b38;
        }

        .sw-error-icon {
          display: grid;
          place-items: center;

          width: 31px;
          height: 31px;
          flex-shrink: 0;

          border-radius: 9px;
          background: #ffebe4;
        }

        .sw-error-copy {
          flex: 1;
          min-width: 0;
        }

        .sw-error-copy strong {
          display: block;
          font-size: 10px;
        }

        .sw-error-copy p {
          margin: 5px 0 0;

          color: #965c4d;
          font-size: 10px;
          line-height: 1.75;
          overflow-wrap: anywhere;
        }

        .sw-dismiss-error {
          display: grid;
          place-items: center;

          width: 26px;
          height: 26px;
          flex-shrink: 0;

          border: 0;
          border-radius: 7px;

          background: transparent;
          color: inherit;
          cursor: pointer;
        }

        .sw-dismiss-error:hover {
          background: rgba(153,75,56,.08);
        }

        .sw-upload-footer {
          display: flex;
          align-items: flex-start;
          gap: 8px;

          margin-top: 16px;
          padding-top: 14px;

          border-top: 1px solid #edf0e8;

          color: #82907e;
          font-size: 9px;
          line-height: 1.7;
        }

        .sw-upload-footer svg {
          flex-shrink: 0;
          color: #699362;
        }

        /* EMPTY RESULTS */

        .sw-empty-result {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          min-height: 580px;
          padding: 29px 22px;

          text-align: center;
        }

        .sw-result-decoration {
          position: relative;

          display: grid;
          place-items: center;

          width: 155px;
          height: 155px;
          margin-bottom: 25px;
        }

        .sw-result-orbit {
          position: absolute;
          border: 1px solid #e0e9d8;
          border-radius: 50%;
        }

        .sw-orbit-one {
          inset: 0;
        }

        .sw-orbit-two {
          inset: 16px;
        }

        .sw-empty-result-icon {
          position: relative;
          z-index: 1;

          display: grid;
          place-items: center;

          width: 87px;
          height: 87px;

          border: 1px solid #deebd3;
          border-radius: 27px;

          background: #edf5e5;
          color: #4e8151;
        }

        .sw-result-spark {
          position: absolute;
          z-index: 2;

          display: grid;
          place-items: center;

          width: 34px;
          height: 34px;

          border: 2px solid #fff;
          border-radius: 11px;
        }

        .sw-spark-one {
          top: 4px;
          right: 5px;

          background: var(--sw-lime);
          color: var(--sw-forest);
          transform: rotate(8deg);
        }

        .sw-spark-two {
          bottom: 5px;
          left: 4px;

          background: #dbeed1;
          color: #42764a;
          transform: rotate(-7deg);
        }

        .sw-empty-result > h2 {
          max-width: 290px;
          margin: 11px 0 9px;

          color: var(--sw-forest);
          font-family: "Manrope", sans-serif;
          font-size: 23px;
          font-weight: 800;
          letter-spacing: -.8px;
          line-height: 1.35;
        }

        .sw-empty-result > p {
          max-width: 325px;
          margin: 0;

          color: #7c8976;
          font-size: 11px;
          line-height: 1.9;
        }

        .sw-result-preview-features {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;

          margin-top: 24px;
          padding: 17px 19px;

          border: 1px solid #e8ede3;
          border-radius: 13px;

          background: #fbfcf9;
          text-align: left;
        }

        .sw-result-preview-features > div {
          display: flex;
          align-items: center;
          gap: 9px;

          color: #647560;
          font-size: 10px;
        }

        .sw-result-preview-features svg {
          flex-shrink: 0;
          color: var(--sw-green);
        }

        .sw-empty-hint {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;

          margin-top: 27px;

          color: #84917f;
          font-size: 9px;
        }

        /* RESULTS HEADER */

        .sw-result-content {
          min-width: 0;
        }

        .sw-result-heading {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 13px;

          padding-bottom: 18px;
          border-bottom: 1px solid #edf0e8;
        }

        .sw-result-heading h2 {
          margin: 6px 0 5px;

          color: var(--sw-forest);
          font-family: "Manrope", sans-serif;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -.8px;
        }

        .sw-result-heading-copy > p {
          margin: 0;
          color: #7d8878;
          font-size: 10px;
          line-height: 1.7;
        }

        .sw-result-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          padding: 8px 10px;

          border: 1px solid #dcead3;
          border-radius: 9px;

          background: #f0f7e9;
          color: #427746;

          font-size: 9px;
          font-weight: 700;
        }

        .sw-result-status-caution {
          border-color: #f0dfbf;
          background: #fff8e9;
          color: #90671e;
        }

        /* AI DISCLAIMER */

        .sw-ai-disclaimer {
          display: flex;
          align-items: flex-start;
          gap: 10px;

          margin-top: 16px;
          padding: 13px;

          border: 1px solid #e4e9df;
          border-radius: 12px;

          background: #f6f8f3;
        }

        .sw-ai-disclaimer-icon {
          display: grid;
          place-items: center;

          width: 32px;
          height: 32px;
          flex-shrink: 0;

          border: 1px solid #dfe9d6;
          border-radius: 9px;

          background: #eaf2e1;
          color: #4c7950;
        }

        .sw-ai-disclaimer p {
          margin: 1px 0 0;

          color: #6f7c6b;
          font-size: 10px;
          line-height: 1.8;
        }

        /* CATEGORY CARD */

        .sw-prediction-card {
          margin-top: 18px;
          padding: 19px;

          border: 1px solid #dfe9d4;
          border-radius: 15px;

          background:
            radial-gradient(
              circle at 90% 5%,
              rgba(200,241,105,.19),
              transparent 32%
            ),
            linear-gradient(135deg, #f1f7e9, #fbfcf8);
        }

        .sw-prediction-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .sw-prediction-icon {
          display: grid;
          place-items: center;

          width: 38px;
          height: 38px;
          flex-shrink: 0;

          border: 1px solid #d8e6cb;
          border-radius: 12px;

          background: #e4efd9;
          color: #437547;
        }

        .sw-prediction-card > h3 {
          margin: 13px 0 0;

          color: var(--sw-forest);
          font-family: "Manrope", sans-serif;
          font-size: clamp(25px, 3vw, 34px);
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -1.2px;

          overflow-wrap: anywhere;
        }

        .sw-confidence-section {
          margin-top: 20px;
        }

        .sw-confidence-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;

          margin-bottom: 9px;

          color: #758371;
          font-size: 10px;
        }

        .sw-confidence-heading strong {
          color: #397a48;
          font-size: 12px;
          font-weight: 800;
        }

        .sw-confidence-heading .sw-confidence-low {
          color: #9c641e;
        }

        .sw-confidence-track {
          height: 7px;
          overflow: hidden;

          border-radius: 20px;
          background: #dfe8d5;
        }

        .sw-confidence-fill {
          height: 100%;
          border-radius: inherit;

          background: linear-gradient(90deg, #398653, #9ecf66);

          transition: width 400ms ease;
        }

        .sw-confidence-fill-low {
          background: linear-gradient(90deg, #d49330, #ebbe5a);
        }

        .sw-confidence-caption {
          display: block;
          margin-top: 8px;

          color: #83907d;
          font-size: 9px;
          line-height: 1.6;
        }

        .sw-no-confidence {
          margin: 12px 0 0;
          color: #788474;
          font-size: 10px;
          line-height: 1.7;
        }

        .sw-review-note {
          display: flex;
          align-items: flex-start;
          gap: 9px;

          margin-top: 13px;
          padding: 12px;

          border: 1px solid #f0dfc1;
          border-radius: 11px;

          background: #fff8e9;
          color: #8d641f;
        }

        .sw-review-note > svg {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .sw-review-note p {
          margin: 0;

          font-size: 10px;
          line-height: 1.8;
          color: #856c44;
        }

        /* NEXT ACTION */

        .sw-next-action {
          display: flex;
          align-items: flex-start;
          gap: 12px;

          margin-top: 18px;
          padding: 15px;

          border: 1px solid #dfe9d4;
          border-radius: 13px;

          background: #f7faf3;
        }

        .sw-section-icon {
          display: grid;
          place-items: center;

          width: 36px;
          height: 36px;
          flex-shrink: 0;

          border-radius: 11px;
        }

        .sw-section-icon-lime {
          background: var(--sw-lime);
          color: var(--sw-forest);
        }

        .sw-next-action-copy {
          flex: 1;
          min-width: 0;
        }

        .sw-next-action-copy > p {
          margin: 7px 0 0;

          color: #3c5140;
          font-size: 11px;
          line-height: 1.85;
          overflow-wrap: anywhere;
        }

        /* RECOVERY INTELLIGENCE */

        .sw-recovery {
          margin-top: 18px;
          padding: 18px;

          border: 1px solid #dce7d2;
          border-radius: 15px;

          background:
            radial-gradient(
              circle at 100% 0%,
              rgba(200,241,105,.16),
              transparent 34%
            ),
            #fff;
        }

        .sw-recovery-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .sw-recovery-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .sw-recovery-logo {
          display: grid;
          place-items: center;

          width: 38px;
          height: 38px;
          flex-shrink: 0;

          border: 1px solid #d7e7c8;
          border-radius: 12px;

          background: #e8f2dc;
          color: #397748;
        }

        .sw-recovery-brand h3 {
          margin: 4px 0 0;

          color: var(--sw-forest);
          font-family: "Manrope", sans-serif;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: -.35px;
          line-height: 1.5;
        }

        .sw-recovery-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;

          padding: 6px 8px;

          border: 1px solid #e0eacb;
          border-radius: 7px;

          background: #f1f7e5;
          color: #557847;

          font-size: 8px;
          font-weight: 800;
          letter-spacing: .5px;
        }

        .sw-recovery-route {
          margin-top: 20px;
          padding: 15px;

          border: 1px solid #dfebd4;
          border-radius: 12px;

          background: #edf5e5;
        }

        .sw-recovery-route > span,
        .sw-recovery-explanation > span {
          color: #648259;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.1px;
        }

        .sw-recovery-route > p {
          margin: 7px 0 0;

          color: var(--sw-forest);
          font-family: "Manrope", sans-serif;
          font-size: 13px;
          font-weight: 800;
          line-height: 1.7;

          overflow-wrap: anywhere;
        }

        .sw-recovery-explanation {
          margin-top: 17px;
        }

        .sw-recovery-explanation p {
          margin: 7px 0 0;

          color: #687866;
          font-size: 10px;
          line-height: 1.85;
          overflow-wrap: anywhere;
        }

        .sw-next-step {
          margin-top: 17px;
          padding: 14px;

          border: 1px solid #e4e9df;
          border-radius: 12px;

          background: #fbfcf9;
        }

        .sw-next-step-top {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .sw-next-step-number {
          display: grid;
          place-items: center;

          width: 27px;
          height: 27px;
          flex-shrink: 0;

          border-radius: 8px;
          background: var(--sw-lime);
          color: var(--sw-forest);

          font-size: 9px;
          font-weight: 800;
        }

        .sw-next-step-top strong {
          color: var(--sw-forest);
          font-size: 11px;
        }

        .sw-next-step > p {
          margin: 10px 0 0;

          color: #596e54;
          font-size: 10px;
          line-height: 1.9;
          overflow-wrap: anywhere;
        }

        .sw-handling-note {
          display: flex;
          align-items: flex-start;
          gap: 9px;

          margin-top: 15px;
          padding: 12px;

          border: 1px solid #f0e1c7;
          border-radius: 11px;

          background: #fff9ed;
          color: #946b2a;
        }

        .sw-handling-note > svg {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .sw-handling-note p {
          display: flex;
          flex-direction: column;
          gap: 5px;

          margin: 0;

          color: #876c42;
          font-size: 10px;
          line-height: 1.8;
        }

        .sw-handling-note strong {
          color: #85601f;
          font-size: 10px;
        }

        .sw-recovery-disclaimer {
          display: flex;
          align-items: flex-start;
          gap: 8px;

          margin-top: 15px;
          padding-top: 13px;

          border-top: 1px solid #e9eee4;

          color: #80907b;
          font-size: 9px;
          line-height: 1.8;
        }

        .sw-recovery-disclaimer svg {
          flex-shrink: 0;
          margin-top: 1px;
          color: #73936b;
        }

        .sw-recovery-fallback {
          display: flex;
          align-items: flex-start;
          gap: 12px;

          margin-top: 18px;
          padding: 15px;

          border: 1px solid #dfe8d7;
          border-radius: 13px;

          background: #f4f8ef;
        }

        .sw-recovery-fallback > div:last-child {
          min-width: 0;
        }

        .sw-recovery-fallback strong {
          color: var(--sw-forest);
          font-size: 11px;
        }

        .sw-recovery-fallback p {
          margin: 6px 0 0;

          color: #6b7c66;
          font-size: 10px;
          line-height: 1.8;
        }

        /* OPTIONAL LOCATION */

        .sw-location-suggestion {
          display: flex;
          align-items: flex-start;
          gap: 11px;

          margin-top: 16px;
          padding: 14px;

          border: 1px solid #e3e8dd;
          border-radius: 12px;

          background: #fafbf8;
        }

        .sw-location-icon {
          display: grid;
          place-items: center;

          width: 35px;
          height: 35px;
          flex-shrink: 0;

          border-radius: 10px;
          background: #e9f2e0;
          color: #477b4b;
        }

        .sw-location-suggestion > div:last-child {
          min-width: 0;
        }

        .sw-location-suggestion strong {
          display: block;
          margin-top: 5px;

          color: var(--sw-forest);
          font-size: 11px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        /* RESULT ACTIONS */

        .sw-result-footer {
          display: flex;
          flex-direction: column;
          gap: 9px;

          margin-top: 21px;
          padding-top: 17px;

          border-top: 1px solid #e9eee4;
        }

        .sw-collection-button {
          width: 100%;
        }

        .sw-result-footer .sw-secondary-button {
          width: 100%;
        }

        /* BOTTOM REMINDER */

        .sw-bottom-note {
          display: flex;
          align-items: flex-start;
          gap: 12px;

          margin-top: 21px;
          padding: 19px;

          border: 1px solid #dce7d2;
          border-radius: 15px;

          background: #edf4e5;
        }

        .sw-bottom-note-icon {
          display: grid;
          place-items: center;

          width: 38px;
          height: 38px;
          flex-shrink: 0;

          border: 1px solid #d7e5ca;
          border-radius: 11px;

          background: #dfedcf;
          color: #457449;
        }

        .sw-bottom-note strong {
          display: block;

          color: var(--sw-forest);
          font-size: 11px;
        }

        .sw-bottom-note p {
          margin: 6px 0 0;

          color: #65775e;
          font-size: 10px;
          line-height: 1.85;
        }

        /* FOOTER */

        .sw-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 13px;

          margin-top: 31px;
          padding: 19px 0 27px;

          border-top: 1px solid #dfe6d8;

          color: #82907e;
          font-size: 9px;
        }

        .sw-footer-brand {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          color: var(--sw-forest);
          font-family: "Manrope", sans-serif;
          font-size: 12px;
          font-weight: 800;
        }

        .sw-footer-mark {
          display: grid;
          place-items: center;

          width: 29px;
          height: 29px;

          border-radius: 9px;
          background: #e1edce;
          color: #3c784a;
        }

        .sw-footer-back {
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

        .sw-footer-back:hover {
          color: var(--sw-forest);
        }

        /* ANIMATIONS */

        .sw-spin {
          animation: sw-rotate 1s linear infinite;
        }

        @keyframes sw-rotate {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes sw-dots {
          from {
            opacity: .35;
            transform: translateY(0);
          }

          to {
            opacity: 1;
            transform: translateY(-3px);
          }
        }

        /* TABLET */

        @media (max-width: 980px) {
          .sw-workspace {
            grid-template-columns: minmax(0, 1fr);
          }

          .sw-upload-zone {
            min-height: 310px;
          }

          .sw-image-preview {
            height: 340px;
          }

          .sw-empty-result {
            min-height: 390px;
          }
        }

        /* MOBILE */

        @media (max-width: 600px) {
          .sw-header {
            grid-template-columns: 1fr auto;
            gap: 10px;

            min-height: 67px;
            padding: 10px 5%;
          }

          .sw-back {
            gap: 6px;
            padding: 8px 4px;
            font-size: 11px !important;
          }

          .sw-brand {
            justify-self: end;
            font-size: 19px;
          }

          .sw-brand-mark {
            width: 34px;
            height: 34px;
          }

          .sw-header-label {
            display: none;
          }

          .sw-container {
            width: 92%;
          }

          .sw-hero {
            padding: 32px 0 23px;
          }

          .sw-eyebrow {
            font-size: 8px;
            letter-spacing: 1px;
          }

          .sw-hero h1 {
            font-size: clamp(30px, 8vw, 39px);
            letter-spacing: -1.4px;
          }

          .sw-hero > p {
            font-size: 11px;
          }

          .sw-hero-points {
            gap: 10px 13px;
            margin-top: 15px;
          }

          .sw-hero-points span {
            font-size: 9px;
          }

          .sw-workspace {
            gap: 14px;
          }

          .sw-panel {
            padding: 15px;
            border-radius: 17px;
          }

          .sw-panel-heading {
            align-items: flex-start;
            gap: 8px;
            margin-bottom: 16px;
          }

          .sw-panel-title {
            gap: 9px;
          }

          .sw-step-number {
            width: 34px;
            height: 34px;
          }

          .sw-panel-title h2 {
            font-size: 15px;
          }

          .sw-panel-status {
            gap: 5px;
            margin-top: 5px;
            font-size: 8px;
          }

          .sw-upload-zone {
            min-height: 290px;
            padding: 20px 12px;
          }

          .sw-upload-art {
            width: 82px;
            height: 82px;
            margin-bottom: 21px;
          }

          .sw-upload-art-icon {
            width: 60px;
            height: 60px;
            border-radius: 19px;
          }

          .sw-upload-art-ring {
            border-radius: 26px;
          }

          .sw-upload-heading {
            font-size: 15px;
          }

          .sw-upload-description {
            font-size: 10px;
          }

          .sw-upload-button-label {
            margin-top: 20px;
          }

          .sw-file-support {
            font-size: 8px;
          }

          .sw-image-preview {
            height: 270px;
          }

          .sw-preview-toolbar {
            padding: 10px;
          }

          .sw-preview-file-name {
            max-width: 58%;
          }

          .sw-upload-footer {
            font-size: 8px;
          }

          .sw-empty-result {
            min-height: 370px;
            padding: 25px 7px;
          }

          .sw-result-decoration {
            width: 130px;
            height: 130px;
          }

          .sw-empty-result-icon {
            width: 74px;
            height: 74px;
            border-radius: 23px;
          }

          .sw-empty-result > h2 {
            font-size: 21px;
          }

          .sw-result-heading h2 {
            font-size: 22px;
          }

          .sw-prediction-card {
            padding: 15px;
          }

          .sw-prediction-card > h3 {
            font-size: 27px;
          }

          .sw-recovery {
            padding: 14px;
          }

          .sw-recovery-header {
            align-items: flex-start;
          }

          .sw-recovery-brand {
            gap: 8px;
          }

          .sw-recovery-logo {
            width: 34px;
            height: 34px;
          }

          .sw-recovery-brand h3 {
            font-size: 12px;
          }

          .sw-recovery-badge {
            font-size: 7px;
          }

          .sw-bottom-note {
            gap: 10px;
            padding: 15px;
          }

          .sw-bottom-note-icon {
            width: 32px;
            height: 32px;
          }

          .sw-footer {
            align-items: flex-start;
            flex-direction: column;
            gap: 10px;
          }
        }

        @media (max-width: 360px) {
          .sw-panel {
            padding: 12px;
          }

          .sw-panel-status {
            max-width: 80px;
            line-height: 1.5;
          }

          .sw-upload-zone {
            min-height: 270px;
          }

          .sw-file-support {
            gap: 6px;
          }

          .sw-recovery-badge {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .sw-page *,
          .sw-page *::before,
          .sw-page *::after {
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

export default ScanWaste;