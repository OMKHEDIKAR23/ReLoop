import { useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ImagePlus,
  MapPin,
  RotateCcw,
  Sparkles,
} from "lucide-react";

function ScanWaste({ onBack }) {
  const inputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleImage = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    setImage(imageUrl);
    setResult(null);
  };

  const analyzeWaste = () => {
    if (!image) return;

    setAnalyzing(true);

    setTimeout(() => {
      setAnalyzing(false);

      setResult({
        category: "E-Waste",
        confidence: "94%",
        action:
          "Take this item to an authorized e-waste collection point instead of placing it in regular waste.",
        location: "Engineering Block Collection Point",
      });
    }, 1600);
  };

  const reset = () => {
    setImage(null);
    setResult(null);

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
              className="upload-zone"
              onClick={() => inputRef.current?.click()}
            >
              <div className="upload-icon">
                <ImagePlus size={25} />
              </div>

              <h2>Drop an image here</h2>

              <p>
                or click to browse from your device
              </p>

              <span className="upload-note">
                JPG, PNG or WEBP
              </span>
            </button>
          ) : (
            <div className="preview-container">
              <img src={image} alt="Waste item preview" />

              <button className="change-image" onClick={reset}>
                <RotateCcw size={15} />
                Choose another
              </button>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleImage}
            hidden
          />

          {image && !result && (
            <button
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
                <span>Confidence</span>
                <strong>{result.confidence}</strong>
              </div>

              <div className="action-box">
                <span className="section-label">NEXT BEST ACTION</span>

                <p>{result.action}</p>
              </div>

              <div className="location-box">
                <MapPin size={19} />

                <div>
                  <span>Recommended collection point</span>
                  <strong>{result.location}</strong>
                </div>
              </div>

              <button className="map-button">
                <MapPin size={17} />
                View collection points
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default ScanWaste;