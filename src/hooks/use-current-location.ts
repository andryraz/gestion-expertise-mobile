import * as Location from "expo-location";
import { useState } from "react";

interface Coordinates {
  latitude: number;
  longitude: number;
}

export function useCurrentLocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getCurrentLocation(): Promise<Coordinates | null> {
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

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (e) {
      setError("Impossible de récupérer la position");
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { getCurrentLocation, loading, error };
}
