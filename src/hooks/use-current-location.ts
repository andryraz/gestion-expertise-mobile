import * as Location from "expo-location";
import { useState } from "react";

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationResult extends Coordinates {
  address: string | null;
}

function isPlusCode(value: string): boolean {
  return /^[23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{2,3}$/i.test(
    value.trim(),
  );
}

function formatNativeAddress(result: Location.LocationGeocodedAddress): string {
  const street = [result.streetNumber, result.street]
    .filter((part) => !!part && part.trim().length > 0)
    .join(" ");
  const nameCandidate =
    result.name && !isPlusCode(result.name) ? result.name : null;

  const parts = [
    street || nameCandidate,
    result.district,
    result.city ?? result.subregion,
  ].filter(
    (part, index, arr) =>
      !!part && part.trim().length > 0 && arr.indexOf(part) === index,
  );

  return parts.join(", ");
}

type NominatimAddress = {
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  city_district?: string;
  village?: string;
  town?: string;
  city?: string;
  county?: string;
};

async function reverseGeocodeNominatim(
  coords: Coordinates,
): Promise<string | null> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}` +
      `&lon=${coords.longitude}&format=jsonv2&zoom=18&addressdetails=1&accept-language=fr`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "BatiExpertApp/1.0 (contact@batiexpert.mg)",
      },
    });
    if (!response.ok) return null;

    const data = await response.json();
    const addr: NominatimAddress = data.address ?? {};

    const neighbourhood =
      addr.neighbourhood || addr.suburb || addr.quarter || addr.city_district;
    const locality = addr.village || addr.town || addr.city || addr.county;

    const parts = [neighbourhood, locality].filter(
      (part, index, arr) => !!part && arr.indexOf(part) === index,
    );

    return parts.length > 0 ? parts.join(", ") : null;
  } catch {
    return null;
  }
}

export function useCurrentLocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getCurrentLocation(): Promise<LocationResult | null> {
    setLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setError("Autorisation de localisation refusée");
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords: Coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      let address = await reverseGeocodeNominatim(coords);

      if (!address) {
        try {
          const results = await Location.reverseGeocodeAsync(coords);
          if (results.length > 0) {
            address = formatNativeAddress(results[0]) || null;
          }
        } catch {
          address = null;
        }
      }

      return { ...coords, address };
    } catch (e) {
      setError("Impossible de récupérer la position");
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { getCurrentLocation, loading, error };
}
