import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BatteryCharging,
  CheckCircle2,
  ExternalLink,
  LocateFixed,
  LoaderCircle,
  MapPin,
  Navigation,
  Recycle,
  RefreshCw,
  Search,
  TriangleAlert,
  Clock3,
  Globe,
  ShieldCheck,
  Leaf,
} from "lucide-react";

const GEOCODING_URL = "https://nominatim.openstreetmap.org/search";

const OVERPASS_ENDPOINTS = [
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

const REQUEST_TIMEOUT_MS = 12000;

const WASTE_FILTERS = [
  "All",
  "Recycling",
  "E-Waste",
  "Batteries",
  "Glass",
  "Paper",
  "Plastic",
];

function getPointTypes(tags = {}) {
  const values = Object.entries(tags)
    .map(([key, value]) => `${key} ${value}`)
    .join(" ")
    .toLowerCase();

  const types = [];

  if (
    tags.amenity === "recycling" ||
    tags.recycling_type ||
    tags.recycling
  ) {
    types.push("Recycling");
  }

  if (/e-waste|electronic|electronics|computer|mobile phone/.test(values)) {
    types.push("E-Waste");
  }

  if (/battery|batteries/.test(values)) {
    types.push("Batteries");
  }

  if (/glass/.test(values)) {
    types.push("Glass");
  }

  if (/paper|cardboard/.test(values)) {
    types.push("Paper");
  }

  if (/plastic/.test(values)) {
    types.push("Plastic");
  }

  if (
    tags.amenity === "waste_disposal" ||
    tags.amenity === "waste_transfer_station"
  ) {
    types.push("Waste Disposal");
  }

  return [...new Set(types)];
}

function getAddress(tags = {}) {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"],
    tags["addr:city"],
    tags["addr:postcode"],
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(", ");
  }

  return tags["addr:full"] || tags.description || "";
}

function getCoordinates(element) {
  if (element.lat != null && element.lon != null) {
    return {
      lat: Number(element.lat),
      lon: Number(element.lon),
    };
  }

  if (element.center?.lat != null && element.center?.lon != null) {
    return {
      lat: Number(element.center.lat),
      lon: Number(element.center.lon),
    };
  }

  return null;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371;

  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return (
    earthRadius *
    2 *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
}

function formatDistance(distance) {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m away`;
  }

  return `${distance.toFixed(1)} km away`;
}

function getGoogleMapsDirections(point) {
  return (
    "https://www.google.com/maps/dir/?api=1&destination=" +
    encodeURIComponent(`${point.lat},${point.lon}`)
  );
}

function getGoogleMapsSearchUrl(query, location) {
  const searchQuery = location
    ? `${query} near ${location.lat}, ${location.lon}`
    : query;

  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(searchQuery)
  );
}

function getMapUrl(lat, lon) {
  const delta = 0.08;

  const bbox = [
    lon - delta,
    lat - delta,
    lon + delta,
    lat + delta,
  ].join("%2C");

  return (
    "https://www.openstreetmap.org/export/embed.html" +
    `?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`
  );
}

function getOpenStreetMapUrl(location) {
  return (
    `https://www.openstreetmap.org/?mlat=${location.lat}` +
    `&mlon=${location.lon}` +
    `#map=14/${location.lat}/${location.lon}`
  );
}

async function geocodeLocation(query) {
  const url = new URL(GEOCODING_URL);

  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "in");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        "The location search service is unavailable. Please try again."
      );
    }

    const results = await response.json();

    if (!results.length) {
      throw new Error(
        "Location not found. Try a city name or a valid Indian PIN code."
      );
    }

    return {
      lat: Number(results[0].lat),
      lon: Number(results[0].lon),
      name: results[0].display_name,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "Location search timed out. Please try again."
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchSingleOverpassEndpoint(endpoint, query) {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: new URLSearchParams({ data: query }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data.elements)) {
      throw new Error("Unexpected map response");
    }

    return data.elements;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchOverpassData(query) {
  const failures = [];

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const elements = await fetchSingleOverpassEndpoint(
        endpoint,
        query
      );

      return elements;
    } catch (error) {
      failures.push({
        endpoint,
        message: error.message || "Request failed",
      });

      console.warn(
        `Collection search failed at ${endpoint}:`,
        error.message || error
      );
    }
  }

  console.error(
    "All collection search endpoints failed:",
    failures
  );

  throw new Error(
    "The live collection search service is temporarily unavailable."
  );
}

async function findCollectionPoints(lat, lon) {
  const radius = 15000;

  const query = `
    [out:json][timeout:20];
    (
      nwr["amenity"="recycling"](around:${radius},${lat},${lon});
      nwr["amenity"="waste_disposal"](around:${radius},${lat},${lon});
      nwr["amenity"="waste_transfer_station"](around:${radius},${lat},${lon});
      nwr["recycling_type"](around:${radius},${lat},${lon});
    );
    out center tags;
  `;

  const elements = await fetchOverpassData(query);
  const uniquePoints = new Map();

  for (const element of elements) {
    const coordinates = getCoordinates(element);

    if (!coordinates) {
      continue;
    }

    const tags = element.tags || {};

    const point = {
      id: `${element.type}-${element.id}`,
      name:
        tags.name ||
        tags.operator ||
        "Unnamed waste collection point",
      lat: coordinates.lat,
      lon: coordinates.lon,
      address: getAddress(tags),
      types: getPointTypes(tags),
      amenity: tags.amenity || "Collection facility",
      operator: tags.operator || "",
      openingHours: tags.opening_hours || "",
      phone: tags.phone || tags["contact:phone"] || "",
      website: tags.website || tags["contact:website"] || "",
    };

    const key = `${point.lat.toFixed(5)},${point.lon.toFixed(5)}`;

    if (!uniquePoints.has(key)) {
      uniquePoints.set(key, point);
    }
  }

  return [...uniquePoints.values()].sort(
    (a, b) =>
      calculateDistance(lat, lon, a.lat, a.lon) -
      calculateDistance(lat, lon, b.lat, b.lon)
  );
}

function FilterIcon({ type }) {
  if (type === "E-Waste" || type === "Batteries") {
    return <BatteryCharging size={14} />;
  }

  if (
    type === "Glass" ||
    type === "Plastic" ||
    type === "Recycling"
  ) {
    return <Recycle size={14} />;
  }

  if (type === "Paper") {
    return <Leaf size={14} />;
  }

  return <Globe size={14} />;
}

function ExternalMapSearches({ location, search }) {
  const placeText = location?.name || search?.trim() || "India";

  const searches = [
    {
      title: "Recycling centres",
      query: `recycling centres in ${placeText}`,
      icon: <Recycle size={18} />,
    },
    {
      title: "E-waste collection",
      query: `e-waste collection centres in ${placeText}`,
      icon: <BatteryCharging size={18} />,
    },
    {
      title: "Battery recycling",
      query: `battery recycling drop-off points in ${placeText}`,
      icon: <Leaf size={18} />,
    },
  ];

  return (
    <div className="cp-external-searches">
      <p className="cp-external-intro">
        You can still search for nearby facilities using these map
        searches. Results are provided by the external map service,
        not verified by ReLoop.
      </p>

      <div className="cp-external-grid">
        {searches.map((item) => (
          <a
            key={item.title}
            className="cp-external-card"
            href={getGoogleMapsSearchUrl(
              item.query,
              location
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="cp-external-icon">
              {item.icon}
            </span>

            <span className="cp-external-title">
              {item.title}
              <small>Search Google Maps</small>
            </span>

            <ExternalLink size={15} />
          </a>
        ))}
      </div>

      {location && (
        <a
          className="cp-osm-fallback"
          href={getOpenStreetMapUrl(location)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Globe size={15} />
          Open this area on OpenStreetMap
          <ExternalLink size={13} />
        </a>
      )}
    </div>
  );
}

function CollectionPoints({ onBack }) {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState(null);
  const [points, setPoints] = useState([]);
  const [filter, setFilter] = useState("All");
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);

  async function searchAtLocation(target) {
    setLoading(true);
    setError("");
    setSearched(false);
    setServiceUnavailable(false);
    setSelectedPoint(null);
    setLocation(target);
    setPoints([]);

    try {
      const results = await findCollectionPoints(
        target.lat,
        target.lon
      );

      setPoints(results);
      setSearched(true);
    } catch (err) {
      // Keep the selected location and give the user another route.
      // No sample or made-up collection points are displayed.
      console.error("Collection point lookup failed:", err);

      setPoints([]);
      setSearched(true);
      setServiceUnavailable(true);
    } finally {
      setLoading(false);
    }
  }

  function useCurrentLocation() {
    setError("");

    if (!navigator.geolocation) {
      setError(
        "Your browser does not support location detection. Search by city or PIN code instead."
      );
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const target = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          name: "Your current location",
        };

        await searchAtLocation(target);
      },
      (geoError) => {
        setLoading(false);

        if (geoError.code === 1) {
          setError(
            "Location permission was denied. Search by city or PIN code instead."
          );
        } else if (geoError.code === 2) {
          setError(
            "Your location is unavailable. Try searching by city or PIN code."
          );
        } else {
          setError(
            "Location detection timed out. Please try again or search manually."
          );
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  }

  async function handleSearch(event) {
    event.preventDefault();

    const query = search.trim();

    if (!query) {
      setError("Enter a city name or PIN code.");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(false);
    setServiceUnavailable(false);
    setSelectedPoint(null);
    setLocation(null);
    setPoints([]);

    try {
      const target = await geocodeLocation(query);
      await searchAtLocation(target);
    } catch (err) {
      setLoading(false);
      setError(err.message || "Location search failed.");
    }
  }

  const visiblePoints = points.filter((point) => {
    if (filter === "All") {
      return true;
    }

    if (filter === "Recycling") {
      return (
        point.types.includes("Recycling") ||
        point.types.includes("Waste Disposal")
      );
    }

    return point.types.includes(filter);
  });

  const mapLocation = selectedPoint || location;

  return (
    <div className="cp-page">
      <header className="cp-header">
        <button
          className="cp-back"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={18} />
          Dashboard
        </button>

        <div className="cp-brand">
          <div className="cp-brand-icon">
            <Recycle size={22} strokeWidth={2.2} />
          </div>
          <span>ReLoop</span>
        </div>

        <div className="cp-header-label">
          <span className="cp-status-dot" />
          LOCAL DISCOVERY
        </div>
      </header>

      <main className="cp-main">
        <section className="cp-hero">
          <div className="cp-eyebrow">
            <MapPin size={15} />
            DISPOSE RESPONSIBLY
          </div>

          <h1>
            Better waste habits
            <br />
            <span>start nearby.</span>
          </h1>

          <p className="cp-hero-description">
            Discover mapped recycling and waste collection facilities.
            Find a location, explore waste categories, and plan your next
            stop.
          </p>

          <form className="cp-search" onSubmit={handleSearch}>
            <Search size={20} />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Enter a city or Indian PIN code"
              aria-label="Search by city or PIN code"
              autoComplete="off"
              maxLength={120}
            />

            <button
              type="submit"
              disabled={loading || !search.trim()}
            >
              {loading ? (
                <LoaderCircle className="cp-spinning" size={17} />
              ) : (
                <Search size={17} />
              )}

              Search
            </button>
          </form>

          <button
            className="cp-location-button"
            onClick={useCurrentLocation}
            disabled={loading}
            type="button"
          >
            <LocateFixed size={17} />

            {loading
              ? "Finding facilities..."
              : "Use my current location"}

            <ArrowUpRight size={15} />
          </button>

          <div className="cp-hero-footnote">
            <ShieldCheck size={15} />
            Location permission is requested only when you choose to
            use your current location.
          </div>
        </section>

        {error && (
          <div className="cp-error" role="alert">
            <TriangleAlert size={20} />

            <span>{error}</span>

            <button
              onClick={() => setError("")}
              type="button"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        <section className="cp-results-section">
          <div className="cp-results-heading">
            <div>
              <p className="cp-eyebrow">
                <span className="cp-heading-line" />
                EXPLORE YOUR AREA
              </p>

              <h2>
                {location ? "Collection points" : "Find your next stop"}
              </h2>

              <p className="cp-muted">
                {location
                  ? location.name
                  : "Search an area to discover mapped waste facilities."}
              </p>
            </div>

            {location && (
              <button
                className="cp-refresh"
                onClick={() => searchAtLocation(location)}
                disabled={loading}
                type="button"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "cp-spinning" : ""}
                />
                Refresh
              </button>
            )}
          </div>

          <div
            className="cp-filters"
            aria-label="Filter collection points by waste type"
          >
            {WASTE_FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={filter === item}
                className={`cp-filter ${
                  filter === item ? "selected" : ""
                }`}
                onClick={() => setFilter(item)}
              >
                <FilterIcon type={item} />
                {item}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="cp-state" aria-live="polite">
              <div className="cp-state-icon">
                <LoaderCircle className="cp-spinning" size={30} />
              </div>

              <h3>Finding nearby facilities</h3>

              <p>
                Checking live map data. If the service is unavailable,
                ReLoop will offer alternative map searches.
              </p>

              <div className="cp-loading-bar">
                <span />
              </div>
            </div>
          ) : serviceUnavailable ? (
            <div className="cp-fallback-panel">
              <div className="cp-fallback-heading">
                <div className="cp-state-icon cp-warning-icon">
                  <Globe size={28} />
                </div>

                <span className="cp-state-kicker">
                  LIVE MAP DATA UNAVAILABLE
                </span>

                <h3>Let's try another way.</h3>

                <p>
                  ReLoop couldn't retrieve live facility listings
                  this time. Your location was found, but no collection
                  points have been fabricated or marked as verified.
                </p>
              </div>

              <ExternalMapSearches
                location={location}
                search={search}
              />

              <button
                className="cp-secondary-button"
                onClick={() => searchAtLocation(location)}
                type="button"
              >
                <RefreshCw size={16} />
                Retry live search
              </button>
            </div>
          ) : !searched ? (
            <div className="cp-state">
              <div className="cp-state-icon">
                <MapPin size={29} />
              </div>

              <span className="cp-state-kicker">START EXPLORING</span>

              <h3>Your next stop starts here.</h3>

              <p>
                Enter your city or PIN code, or use your current location
                to discover facilities listed on OpenStreetMap.
              </p>

              <button
                className="cp-primary-button"
                onClick={useCurrentLocation}
                type="button"
              >
                <LocateFixed size={17} />
                Find places near me
                <ArrowUpRight size={15} />
              </button>
            </div>
          ) : visiblePoints.length === 0 ? (
            <div className="cp-state cp-empty-state">
              <div className="cp-state-icon cp-empty-icon">
                <Recycle size={30} />
              </div>

              <span className="cp-state-kicker">
                {points.length > 0
                  ? "TRY ANOTHER FILTER"
                  : "NO MATCHING LISTINGS"}
              </span>

              <h3>
                {points.length > 0
                  ? "No results for this category."
                  : "No mapped facilities found nearby."}
              </h3>

              <p>
                {points.length > 0
                  ? "Try another waste category or show all results."
                  : "OpenStreetMap may not contain nearby listings. You can also search other map services."}
              </p>

              {points.length > 0 && (
                <button
                  className="cp-primary-button"
                  onClick={() => setFilter("All")}
                  type="button"
                >
                  <RefreshCw size={16} />
                  Show all results
                </button>
              )}

              {points.length === 0 && (
                <>
                  <ExternalMapSearches
                    location={location}
                    search={search}
                  />

                  <button
                    className="cp-secondary-button"
                    onClick={() => searchAtLocation(location)}
                    type="button"
                  >
                    <RefreshCw size={16} />
                    Search again
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="cp-layout">
              <div className="cp-list">
                <div className="cp-list-heading">
                  <div className="cp-list-count">
                    <CheckCircle2 size={17} />
                    <strong>{visiblePoints.length}</strong>
                    mapped result{visiblePoints.length === 1 ? "" : "s"}
                  </div>

                  <span className="cp-list-sort">Nearest first</span>
                </div>

                {visiblePoints.map((point, index) => {
                  const distance = calculateDistance(
                    location.lat,
                    location.lon,
                    point.lat,
                    point.lon
                  );

                  const selected = selectedPoint?.id === point.id;

                  return (
                    <article
                      key={point.id}
                      className={`cp-point-card ${
                        selected ? "cp-point-selected" : ""
                      }`}
                    >
                      <button
                        className="cp-point-select"
                        onClick={() => setSelectedPoint(point)}
                        type="button"
                        aria-pressed={selected}
                        aria-label={`Select ${point.name}`}
                      >
                        <div className="cp-point-icon">
                          {point.types.includes("E-Waste") ||
                          point.types.includes("Batteries") ? (
                            <BatteryCharging size={21} />
                          ) : (
                            <Recycle size={21} />
                          )}
                        </div>

                        <div className="cp-point-info">
                          <div className="cp-point-title-line">
                            {index === 0 && (
                              <span className="cp-nearest-badge">
                                NEAREST
                              </span>
                            )}
                          </div>

                          <h3>{point.name}</h3>

                          <span className="cp-distance">
                            <MapPin size={13} />
                            {formatDistance(distance)}
                          </span>
                        </div>

                        <div className="cp-point-arrow">
                          <ArrowUpRight size={17} />
                        </div>
                      </button>

                      <div className="cp-point-details">
                        {point.address && (
                          <p className="cp-point-address">
                            {point.address}
                          </p>
                        )}

                        <div className="cp-tags">
                          {(point.types.length
                            ? point.types
                            : ["Type not specified"]
                          ).map((type) => (
                            <span key={type}>{type}</span>
                          ))}
                        </div>

                        {point.openingHours && (
                          <p className="cp-detail-line">
                            <Clock3 size={13} />
                            <span>Listed hours: {point.openingHours}</span>
                          </p>
                        )}

                        {point.phone && (
                          <p className="cp-detail-line">
                            Phone: {point.phone}
                          </p>
                        )}

                        {point.website && (
                          <a
                            className="cp-directions"
                            href={point.website}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Globe size={14} />
                            Facility website
                            <ExternalLink size={12} />
                          </a>
                        )}

                        <div className="cp-point-actions">
                          <a
                            className="cp-directions"
                            href={getGoogleMapsDirections(point)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Navigation size={15} />
                            Get directions
                            <ExternalLink size={12} />
                          </a>

                          <span className="cp-data-status">
                            Map listing · Not independently verified
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="cp-map-column">
                <div className="cp-map">
                  <div className="cp-map-top-label">
                    <span className="cp-map-dot" />
                    OPEN MAP
                  </div>

                  <iframe
                    key={`${mapLocation.lat}-${mapLocation.lon}`}
                    title="OpenStreetMap collection point map"
                    src={getMapUrl(mapLocation.lat, mapLocation.lon)}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />

                  <a
                    className="cp-map-external"
                    href={getOpenStreetMapUrl(mapLocation)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open full map
                    <ExternalLink size={14} />
                  </a>
                </div>

                {selectedPoint && (
                  <div className="cp-selected-card">
                    <div className="cp-selected-heading">
                      <div className="cp-selected-icon">
                        <MapPin size={20} />
                      </div>

                      <div>
                        <span className="cp-selected-kicker">
                          SELECTED LOCATION
                        </span>

                        <h3>{selectedPoint.name}</h3>
                      </div>
                    </div>

                    <p>
                      {selectedPoint.address ||
                        "No address details are available in the map data."}
                    </p>

                    <div className="cp-selected-meta">
                      <span>
                        <ShieldCheck size={14} />
                        OpenStreetMap listing
                      </span>
                    </div>

                    <a
                      className="cp-primary-button cp-directions-button"
                      href={getGoogleMapsDirections(selectedPoint)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Navigation size={17} />
                      Get directions
                      <ArrowUpRight size={16} />
                    </a>
                  </div>
                )}

                <div className="cp-data-note">
                  <div className="cp-note-icon">
                    <TriangleAlert size={18} />
                  </div>

                  <div>
                    <strong>Before you travel</strong>

                    <p>
                      Listings come from OpenStreetMap and may be
                      incomplete or outdated. ReLoop does not
                      independently verify these facilities. Confirm
                      accepted waste types and opening hours before
                      visiting.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <footer className="cp-footer">
          <div className="cp-footer-brand">
            <Recycle size={17} />
            <span>ReLoop</span>
          </div>

          <span className="cp-footer-tagline">
            Responsible disposal starts with discovery.
          </span>

          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
          >
            © OpenStreetMap contributors
          </a>
        </footer>
      </main>

      <style>{`
        .cp-page {
          --cp-forest: #183d2b;
          --cp-green: #368653;
          --cp-lime: #c8f169;
          --cp-ivory: #f7f6ef;
          --cp-muted: #69776a;
          --cp-border: #e4e8dc;

          min-height: 100vh;
          background: var(--cp-ivory);
          color: var(--cp-forest);
          font-family: inherit;
        }

        .cp-page *,
        .cp-page *::before,
        .cp-page *::after {
          box-sizing: border-box;
        }

        .cp-header {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 18px;
          min-height: 76px;
          padding: 12px 5%;
          background: var(--cp-forest);
          color: #fff;
        }

        .cp-back,
        .cp-brand,
        .cp-location-button,
        .cp-refresh {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .cp-back {
          justify-self: start;
          padding: 9px 10px;
          border: 1px solid transparent;
          border-radius: 9px;
          background: transparent;
          color: #e0ecdd;
          font: inherit;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .cp-back:hover {
          background: rgba(255,255,255,.08);
          color: var(--cp-lime);
        }

        .cp-brand {
          justify-content: center;
          color: #fff;
          font-family: "Manrope", sans-serif;
          font-size: 21px;
          font-weight: 800;
          letter-spacing: -.8px;
        }

        .cp-brand-icon {
          display: grid;
          place-items: center;
          width: 39px;
          height: 39px;
          border-radius: 12px;
          background: var(--cp-lime);
          color: var(--cp-forest);
        }

        .cp-header-label {
          display: flex;
          justify-self: end;
          align-items: center;
          gap: 8px;
          color: #dce9d6;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.4px;
        }

        .cp-status-dot,
        .cp-map-dot {
          width: 7px;
          height: 7px;
          flex-shrink: 0;
          border-radius: 50%;
          background: var(--cp-lime);
        }

        .cp-main {
          width: min(1240px, 90%);
          margin: 0 auto;
        }

        .cp-hero {
          max-width: 850px;
          padding: 61px 0 44px;
        }

        .cp-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 13px;
          color: #557b4e;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.55px;
        }

        .cp-hero h1 {
          margin: 0;
          color: var(--cp-forest);
          font-family: "Manrope", sans-serif;
          font-size: clamp(36px, 5vw, 58px);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -2.2px;
        }

        .cp-hero h1 span {
          color: var(--cp-green);
        }

        .cp-hero-description {
          max-width: 625px;
          margin: 17px 0 25px;
          color: var(--cp-muted);
          font-size: 14px;
          line-height: 1.85;
        }

        .cp-search {
          display: flex;
          align-items: center;
          gap: 12px;
          width: min(690px, 100%);
          min-height: 61px;
          padding: 7px 8px 7px 17px;
          border: 1px solid #dfe5d9;
          border-radius: 14px;
          background: #fff;
          color: #758473;
          box-shadow: 0 7px 24px rgba(24,61,43,.045);
        }

        .cp-search:focus-within {
          border-color: #8eb38a;
          box-shadow: 0 0 0 4px rgba(54,134,83,.09);
        }

        .cp-search input {
          flex: 1;
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--cp-forest);
          font: inherit;
          font-size: 13px;
        }

        .cp-search input::placeholder {
          color: #929d8e;
        }

        .cp-search button,
        .cp-primary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 43px;
          padding: 0 16px;
          border: 1px solid var(--cp-forest);
          border-radius: 10px;
          background: var(--cp-forest);
          color: #fff;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
        }

        .cp-search button:hover:not(:disabled),
        .cp-primary-button:hover {
          background: #28583b;
          border-color: #28583b;
          color: #fff;
        }

        .cp-search button:disabled,
        .cp-location-button:disabled,
        .cp-refresh:disabled {
          opacity: .55;
          cursor: wait;
        }

        .cp-location-button {
          margin-top: 14px;
          padding: 9px 0;
          border: 0;
          background: transparent;
          color: #326e42;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .cp-location-button:hover:not(:disabled) {
          color: var(--cp-forest);
        }

        .cp-hero-footnote {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          max-width: 590px;
          margin-top: 18px;
          color: #879182;
          font-size: 11px;
          line-height: 1.6;
        }

        .cp-hero-footnote svg {
          flex-shrink: 0;
          margin-top: 1px;
          color: #6a9360;
        }

        .cp-error {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 24px;
          padding: 16px;
          border: 1px solid #efcfbf;
          border-radius: 13px;
          background: #fff5ef;
          color: #994a37;
        }

        .cp-error > svg {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .cp-error span {
          flex: 1;
          overflow-wrap: anywhere;
          font-size: 12px;
          line-height: 1.8;
        }

        .cp-error button {
          display: grid;
          place-items: center;
          width: 27px;
          height: 27px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: inherit;
          font-size: 21px;
          cursor: pointer;
        }

        .cp-results-section {
          padding: 33px 0 0;
          border-top: 1px solid #e3e8dc;
        }

        .cp-results-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 23px;
        }

        .cp-results-heading .cp-eyebrow {
          margin-bottom: 7px;
        }

        .cp-heading-line {
          width: 23px;
          height: 2px;
          background: var(--cp-green);
        }

        .cp-results-heading h2 {
          margin: 0;
          color: var(--cp-forest);
          font-family: "Manrope", sans-serif;
          font-size: clamp(25px, 3vw, 33px);
          font-weight: 800;
          letter-spacing: -1.1px;
        }

        .cp-muted {
          margin: 8px 0 0;
          color: #788476;
          font-size: 12px;
          line-height: 1.75;
          overflow-wrap: anywhere;
        }

        .cp-refresh {
          justify-content: center;
          flex-shrink: 0;
          padding: 10px 13px;
          border: 1px solid #dfe6d9;
          border-radius: 10px;
          background: #fff;
          color: #426f45;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .cp-refresh:hover:not(:disabled) {
          border-color: #b9d2ac;
          background: #f0f6e9;
        }

        .cp-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 22px;
        }

        .cp-filter {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 36px;
          padding: 8px 12px;
          border: 1px solid #e0e6da;
          border-radius: 30px;
          background: rgba(255,255,255,.8);
          color: #667465;
          font: inherit;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }

        .cp-filter:hover {
          border-color: #c5d7b9;
          background: #fff;
          color: var(--cp-forest);
        }

        .cp-filter.selected {
          border-color: var(--cp-forest);
          background: var(--cp-forest);
          color: #fff;
        }

        .cp-filter.selected svg {
          color: var(--cp-lime);
        }

        .cp-state,
        .cp-fallback-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          padding: 40px 24px;
          border: 1px solid #e3e8dd;
          border-radius: 19px;
          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(200,241,105,.11),
              transparent 42%
            ),
            #fff;
          text-align: center;
        }

        .cp-fallback-panel {
          justify-content: flex-start;
          gap: 18px;
        }

        .cp-fallback-heading {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .cp-state-icon {
          display: grid;
          place-items: center;
          width: 63px;
          height: 63px;
          border: 1px solid #deebd0;
          border-radius: 19px;
          background: #edf5e3;
          color: #39734a;
        }

        .cp-warning-icon {
          background: #fff3d9;
          border-color: #f0e0b9;
          color: #92702d;
        }

        .cp-state h3,
        .cp-fallback-heading h3 {
          margin: 18px 0 0;
          color: var(--cp-forest);
          font-family: "Manrope", sans-serif;
          font-size: 20px;
          letter-spacing: -.5px;
        }

        .cp-state p,
        .cp-fallback-heading p {
          max-width: 490px;
          margin: 10px 0 0;
          color: #7a8677;
          font-size: 12px;
          line-height: 1.85;
        }

        .cp-state-kicker {
          margin-top: 22px;
          color: #628057;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.4px;
        }

        .cp-loading-bar {
          width: min(260px, 80%);
          height: 5px;
          margin-top: 25px;
          overflow: hidden;
          border-radius: 20px;
          background: #e9efe4;
        }

        .cp-loading-bar span {
          display: block;
          width: 40%;
          height: 100%;
          border-radius: inherit;
          background: var(--cp-green);
          animation: cp-progress 1.25s ease-in-out infinite alternate;
        }

        .cp-secondary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 43px;
          padding: 0 16px;
          border: 1px solid #dfe7d8;
          border-radius: 10px;
          background: #fff;
          color: var(--cp-forest);
          font: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .cp-secondary-button:hover {
          background: #eef5e7;
        }

        .cp-external-searches {
          width: 100%;
          max-width: 720px;
          margin-top: 18px;
          text-align: left;
        }

        .cp-external-intro {
          margin: 0 0 12px;
          color: #788476;
          font-size: 11px;
          line-height: 1.8;
        }

        .cp-external-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .cp-external-card {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
          padding: 13px;
          border: 1px solid #e2e8dd;
          border-radius: 12px;
          background: #fff;
          color: var(--cp-forest);
          text-decoration: none;
          transition: border-color 160ms ease, transform 160ms ease;
        }

        .cp-external-card:hover {
          transform: translateY(-2px);
          border-color: #b7cfa9;
        }

        .cp-external-icon {
          display: grid;
          place-items: center;
          width: 35px;
          height: 35px;
          flex-shrink: 0;
          border-radius: 10px;
          background: #edf5e4;
          color: #40764a;
        }

        .cp-external-title {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
          font-size: 10px;
          font-weight: 800;
          line-height: 1.45;
        }

        .cp-external-title small {
          color: #869181;
          font-size: 9px;
          font-weight: 500;
        }

        .cp-osm-fallback {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-top: 13px;
          color: #39734a;
          font-size: 11px;
          font-weight: 700;
          text-decoration: none;
        }

        .cp-osm-fallback:hover {
          text-decoration: underline;
        }

        .cp-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
          align-items: start;
          gap: 22px;
        }

        .cp-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-width: 0;
        }

        .cp-list-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 2px;
        }

        .cp-list-count {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #537c4d;
          font-size: 12px;
        }

        .cp-list-sort {
          color: #929c8e;
          font-size: 10px;
        }

        .cp-point-card {
          min-width: 0;
          padding: 16px;
          border: 1px solid #e2e8dd;
          border-radius: 15px;
          background: #fff;
          box-shadow: 0 2px 7px rgba(24,61,43,.025);
          transition:
            border-color 180ms ease,
            box-shadow 180ms ease,
            transform 180ms ease;
        }

        .cp-point-card:hover {
          transform: translateY(-2px);
          border-color: #cadcc0;
          box-shadow: 0 8px 20px rgba(24,61,43,.06);
        }

        .cp-point-selected {
          border-color: #7ca47b;
          box-shadow: 0 0 0 3px rgba(54,134,83,.085);
        }

        .cp-point-select {
          display: flex;
          align-items: center;
          gap: 11px;
          width: 100%;
          padding: 0;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: var(--cp-forest);
          text-align: left;
          cursor: pointer;
        }

        .cp-point-icon {
          display: grid;
          place-items: center;
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          border: 1px solid #e0ebd6;
          border-radius: 13px;
          background: #edf5e4;
          color: #40764a;
        }

        .cp-point-selected .cp-point-icon {
          background: var(--cp-lime);
          color: var(--cp-forest);
        }

        .cp-point-info {
          flex: 1;
          min-width: 0;
        }

        .cp-point-title-line {
          display: flex;
          gap: 6px;
          margin-bottom: 4px;
        }

        .cp-nearest-badge {
          padding: 3px 6px;
          border-radius: 5px;
          background: #e9f4d9;
          color: #416b35;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: .8px;
        }

        .cp-point-info h3 {
          margin: 0;
          color: #243c2c;
          font-family: "Manrope", sans-serif;
          font-size: 13px;
          line-height: 1.55;
          overflow-wrap: anywhere;
        }

        .cp-distance {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 5px;
          color: #778475;
          font-size: 10px;
        }

        .cp-point-arrow {
          display: grid;
          place-items: center;
          width: 30px;
          height: 30px;
          flex-shrink: 0;
          border: 1px solid #e6ebdf;
          border-radius: 9px;
          background: #fafbf8;
          color: #577650;
        }

        .cp-point-card:hover .cp-point-arrow {
          background: var(--cp-forest);
          color: var(--cp-lime);
        }

        .cp-point-details {
          padding: 12px 0 0 55px;
        }

        .cp-point-address {
          margin: 0 0 10px;
          color: #798477;
          font-size: 11px;
          line-height: 1.75;
          overflow-wrap: anywhere;
        }

        .cp-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 8px 0 12px;
        }

        .cp-tags span {
          padding: 5px 8px;
          border: 1px solid #e7ece2;
          border-radius: 7px;
          background: #f6f8f2;
          color: #5e7058;
          font-size: 9px;
          font-weight: 600;
        }

        .cp-detail-line {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          margin: 8px 0;
          color: #778475;
          font-size: 10px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .cp-detail-line svg {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .cp-point-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 13px;
          padding-top: 11px;
          border-top: 1px solid #edf0e8;
        }

        .cp-directions {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #347246;
          font-size: 11px;
          font-weight: 700;
          text-decoration: none;
        }

        .cp-directions:hover {
          color: #183d2b;
          text-decoration: underline;
        }

        .cp-data-status {
          color: #8b9585;
          font-size: 9px;
        }

        .cp-map-column {
          position: sticky;
          top: 20px;
          min-width: 0;
        }

        .cp-map {
          position: relative;
          height: 390px;
          overflow: hidden;
          border: 1px solid #dce6d5;
          border-radius: 18px;
          background: #e9efe4;
          box-shadow: 0 8px 23px rgba(24,61,43,.055);
        }

        .cp-map iframe {
          display: block;
          width: 100%;
          height: 100%;
          border: 0;
        }

        .cp-map-top-label {
          position: absolute;
          z-index: 1;
          top: 13px;
          left: 13px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 11px;
          border: 1px solid #e4eadf;
          border-radius: 9px;
          background: rgba(255,255,255,.96);
          color: #395c3c;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .cp-map-dot {
          width: 6px;
          height: 6px;
          background: var(--cp-green);
        }

        .cp-map-external {
          position: absolute;
          right: 12px;
          bottom: 12px;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 10px 12px;
          border: 1px solid #e4eadf;
          border-radius: 9px;
          background: #fff;
          color: var(--cp-forest);
          font-size: 11px;
          font-weight: 700;
          text-decoration: none;
        }

        .cp-map-external:hover {
          background: var(--cp-lime);
        }

        .cp-selected-card {
          margin-top: 14px;
          padding: 19px;
          border: 1px solid #dce7d4;
          border-radius: 15px;
          background: linear-gradient(130deg, #f0f6e9, #fff);
        }

        .cp-selected-heading {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cp-selected-icon {
          display: grid;
          place-items: center;
          width: 43px;
          height: 43px;
          flex-shrink: 0;
          border: 1px solid #d7e6cb;
          border-radius: 13px;
          background: #e4f0d8;
          color: #3a7447;
        }

        .cp-selected-kicker {
          color: #66845d;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.1px;
        }

        .cp-selected-heading h3 {
          margin: 5px 0 0;
          color: var(--cp-forest);
          font-family: "Manrope", sans-serif;
          font-size: 14px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .cp-selected-card > p {
          margin: 14px 0;
          color: #738171;
          font-size: 11px;
          line-height: 1.75;
        }

        .cp-selected-meta {
          margin-bottom: 14px;
        }

        .cp-selected-meta span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #698161;
          font-size: 10px;
        }

        .cp-directions-button {
          width: 100%;
          margin-top: 0;
        }

        .cp-data-note {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-top: 14px;
          padding: 16px;
          border: 1px solid #e9e2c9;
          border-radius: 14px;
          background: #fffaf0;
          color: #866c34;
        }

        .cp-note-icon {
          display: grid;
          place-items: center;
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          border: 1px solid #f0e4c4;
          border-radius: 9px;
          background: #fff2d2;
          color: #936d20;
        }

        .cp-data-note strong {
          display: block;
          color: #775c29;
          font-size: 11px;
        }

        .cp-data-note p {
          margin: 6px 0 0;
          color: #887954;
          font-size: 10px;
          line-height: 1.85;
        }

        .cp-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 15px;
          margin-top: 35px;
          padding: 21px 0 28px;
          border-top: 1px solid #e0e6d9;
          color: #7f8b7b;
          font-size: 10px;
        }

        .cp-footer-brand {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: var(--cp-forest);
          font-family: "Manrope", sans-serif;
          font-size: 13px;
          font-weight: 800;
        }

        .cp-footer-brand svg {
          color: var(--cp-green);
        }

        .cp-footer a {
          color: #4c754d;
          text-decoration: none;
        }

        .cp-footer a:hover {
          text-decoration: underline;
        }

        .cp-spinning {
          animation: cp-spin 1s linear infinite;
        }

        @keyframes cp-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes cp-progress {
          from {
            transform: translateX(-35%);
          }

          to {
            transform: translateX(180%);
          }
        }

        @media (max-width: 950px) {
          .cp-layout {
            grid-template-columns: minmax(0, 1fr);
          }

          .cp-map-column {
            position: static;
          }

          .cp-map {
            height: 370px;
          }
        }

        @media (max-width: 600px) {
          .cp-header {
            grid-template-columns: 1fr auto;
            gap: 10px;
            min-height: 69px;
            padding: 11px 5%;
          }

          .cp-back {
            font-size: 11px;
          }

          .cp-brand {
            justify-self: end;
            font-size: 19px;
          }

          .cp-brand-icon {
            width: 35px;
            height: 35px;
          }

          .cp-header-label {
            display: none;
          }

          .cp-main {
            width: 90%;
          }

          .cp-hero {
            padding-top: 39px;
            padding-bottom: 33px;
          }

          .cp-hero h1 {
            font-size: clamp(33px, 9vw, 43px);
            letter-spacing: -1.6px;
          }

          .cp-hero-description {
            font-size: 12px;
          }

          .cp-search {
            gap: 8px;
            min-height: 56px;
            padding-left: 11px;
          }

          .cp-search input {
            font-size: 12px;
          }

          .cp-search button {
            gap: 5px;
            min-height: 40px;
            padding: 0 10px;
            font-size: 11px;
          }

          .cp-search button svg {
            display: none;
          }

          .cp-results-section {
            padding-top: 27px;
          }

          .cp-results-heading {
            align-items: flex-start;
            gap: 12px;
          }

          .cp-results-heading h2 {
            font-size: 25px;
          }

          .cp-refresh {
            padding: 9px;
            font-size: 11px;
          }

          .cp-filters {
            gap: 7px;
          }

          .cp-filter {
            min-height: 34px;
            padding: 7px 10px;
            font-size: 10px;
          }

          .cp-state,
          .cp-fallback-panel {
            min-height: 280px;
            padding: 28px 17px;
          }

          .cp-external-grid {
            grid-template-columns: 1fr;
          }

          .cp-point-card {
            padding: 13px;
          }

          .cp-point-details {
            padding-left: 0;
          }

          .cp-point-actions {
            align-items: flex-start;
          }

          .cp-map {
            height: 295px;
          }

          .cp-footer {
            align-items: flex-start;
            flex-direction: column;
            gap: 10px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cp-page *,
          .cp-page *::before,
          .cp-page *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>
    </div>
  );
}

export default CollectionPoints;