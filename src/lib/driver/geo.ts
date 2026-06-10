/* ============================================================
   MW Transport Service — Fahrer-Portal: Geolocation
   ------------------------------------------------------------
   Erfasst beim Stempeln den Standort (Standgeld-/Wartezeit-Nachweis).
   Liefert echte GPS-Koordinaten, fällt bei Verweigerung/Timeout auf
   einen Demo-Standort (Großraum Düsseldorf) zurück, damit der Flow im
   Browser ohne Permission immer funktioniert.
   ============================================================ */

export interface GeoFix {
  lat: number;
  lng: number;
  source: "gps" | "demo";
}

const GEO_BASE: [number, number] = [51.2277, 6.7735]; // Düsseldorf

function demoFix(): GeoFix {
  return {
    lat: +(GEO_BASE[0] + (Math.random() - 0.5) * 0.08).toFixed(4),
    lng: +(GEO_BASE[1] + (Math.random() - 0.5) * 0.08).toFixed(4),
    source: "demo",
  };
}

export function captureGeo(): Promise<GeoFix> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(demoFix());
      return;
    }
    let done = false;
    const t = setTimeout(() => {
      if (!done) {
        done = true;
        resolve(demoFix());
      }
    }, 3500);
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (done) return;
          done = true;
          clearTimeout(t);
          resolve({
            lat: +pos.coords.latitude.toFixed(4),
            lng: +pos.coords.longitude.toFixed(4),
            source: "gps",
          });
        },
        () => {
          if (done) return;
          done = true;
          clearTimeout(t);
          resolve(demoFix());
        },
        { enableHighAccuracy: true, timeout: 3000, maximumAge: 60000 },
      );
    } catch {
      if (!done) {
        done = true;
        resolve(demoFix());
      }
    }
  });
}
