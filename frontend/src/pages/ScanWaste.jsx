import { useRef, useState, useEffect } from "react";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ImagePlus,
  MapPin,
  RotateCcw,
  Sparkles,
  AlertCircle,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api/waste/analyze";

function ScanWaste({ onBack }) {
  const inputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Clean up temporary image previews when they are replaced or removed.
  useEffect(() => {
    return () => {
      if (image) {
        URL.revokeObjectURL(image);
      }
    };
  }, [image]);

  const handleImage = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Please choose an image smaller than 10 MB.");
      return;
    }

    const imageUrl = URL.createObjectURL(file);

    setImage(imageUrl);
    setSelectedFile(file);
    setResult(null);
    setError("");
  };

  const analyzeWaste = async () => {
    if (!selectedFile) {
      setError("Please choose an image first.");
      return;
    }

    setAnalyzing(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();

      // The backend expects the uploaded file under the field name "file".
      formData.append("file", selectedFile);

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          `Server returned ${response.status}: ${message.slice(0, 200)}`
        );
      }

      const data = await response.json();

      if (!data.result) {
        throw new Error("The server response did not contain a classification.");
      }

      // These values come from the real backend response.
      setResult(data.result);
    } catch (err) {
      console.error("Waste analysis failed:", err);

      setError(
        err instanceof TypeError
          ? "Cannot connect to the ReLoop backend. Make sure the backend server is running."
          : err.message || "Something went wrong while analyzing the image."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setSelectedFile(null);
    setResult(null);
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <main className="scan-page">
      <button className="back-button" onClick={onBack}>
        <ArrowLeft size={17} />
        Back to overview
      </button>

      <div className="scan-page-header">
        <div>
          <span className="section-label">WASTE IDENTIFICATION</span>

          <h1>What happens to this?</h1>

          <p>
            Upload a photo and ReLoop will identify the waste category and
            suggest the best next action.
          </p>
        </div>
      </div>

      <div className="scanner-layout">
        <section className="upload-card">
          {!image ? (
            <button
              type="button"
              className="upload-zone"
              onClick={() => inputRef.current?.click()}
            >
              <div className="upload-icon">
                <ImagePlus size={25} />
              </div>

              <h2>Drop an image here</h2>

              <p>or click to browse from your device</p>

              <span className="upload-note">JPG, PNG or WEBP</span>
            </button>
          ) : (
            <div className="preview-container">
              <img src={image} alt="Waste item preview" />

              <button
                type="button"
                className="change-image"
                onClick={reset}
              >
                <RotateCcw size={15} />
                Choose another
              </button>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImage}
            hidden
          />

          {image && !result && (
            <button
              type="button"
              className="analyze-button"
              onClick={analyzeWaste}
              disabled={analyzing}
            >
              {analyzing ? (
                <>
                  <Sparkles size={18} />
                  Analyzing waste...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Identify waste
                </>
              )}
            </button>
          )}

          {error && (
            <div
              role="alert"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                marginTop: "14px",
                padding: "12px",
                borderRadius: "8px",
                color: "#b42318",
                background: "#fef3f2",
                fontSize: "14px",
              }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
        </section>

        <section className="result-card">
          {!result ? (
            <div className="empty-result">
              <div className="result-placeholder-icon">
                <Camera size={23} />
              </div>

              <h3>Your result will appear here</h3>

              <p>
                ReLoop will identify the item and show you what to do with it.
              </p>
            </div>
          ) : (
            <div className="result-content">
              <div className="result-success">
                <CheckCircle2 size={19} />
                Identification complete
              </div>

              <span className="section-label">DETECTED CATEGORY</span>

              <h2>{result.category}</h2>

              <div className="confidence">
                <span>Model confidence score</span>
                <strong>{result.confidence}%</strong>
              </div>

              <div className="action-box">
                <span className="section-label">NEXT BEST ACTION</span>
                <p>{result.action}</p>
              </div>

              <div className="location-box">
                <MapPin size={19} />

                <div>
                  <span>Recommended collection point</span>
                  <strong>
                    {result.location ||
                      "Check your campus waste collection guide"}
                  </strong>
                </div>
              </div>

              <p
                style={{
                  marginTop: "12px",
                  fontSize: "12px",
                  lineHeight: 1.5,
                  color: "var(--text-secondary, #777)",
                }}
              >
                AI predictions can be incorrect. Check the item and local
                disposal guidance before deciding where to place it. The
                confidence score is not a guarantee of accuracy.
              </p>

              <button
                type="button"
                className="map-button"
                onClick={() =>
                  setError(
                    "Campus collection-point mapping has not been implemented yet."
                  )
                }
              >
                <MapPin size={17} />
                View collection points
              </button>

              <button
                type="button"
                className="change-image"
                onClick={reset}
                style={{ marginTop: "12px" }}
              >
                <RotateCcw size={15} />
                Analyze another image
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default ScanWaste;