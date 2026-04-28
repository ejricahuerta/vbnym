let loadPromise: Promise<void> | null = null;

function placesReady(): boolean {
  return Boolean(
    typeof window !== "undefined" && window.google?.maps?.places
  );
}

/**
 * Loads the Maps JavaScript API with the Places library (singleton per page).
 */
export function loadGoogleMapsPlaces(apiKey: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (placesReady()) {
    return Promise.resolve();
  }
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const finish = () => {
      if (placesReady()) resolve();
      else {
        loadPromise = null;
        reject(new Error("Google Maps Places library unavailable"));
      }
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-google-maps-places="1"]'
    );
    if (existing) {
      if (placesReady()) {
        resolve();
        return;
      }
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener(
        "error",
        () => {
          loadPromise = null;
          reject(new Error("Google Maps script failed"));
        },
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.dataset.googleMapsPlaces = "1";
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.onload = finish;
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Google Maps script failed to load"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
