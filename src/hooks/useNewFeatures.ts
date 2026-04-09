/**
 * Hook para detectar y gestionar novedades/features
 * Automáticamente detecta cambios en FEATURES_CHANGELOG y notifica al usuario
 */

import { useState, useEffect } from "react";
import { FEATURES_CHANGELOG } from "@/lib/narrativas";

export interface Feature {
  id: string;
  name: string;
  date: string;
  description: string;
  type: "feature" | "fix" | "improvement" | "page";
  icon?: string;
  status: "new" | "updated";
}

export interface FeaturesData {
  lastSeen: string;
  features: Feature[];
}

const STORAGE_KEY = "app_last_features_check";

export function useNewFeatures() {
  const [newFeatures, setNewFeatures] = useState<Feature[]>([]);
  const [hasNews, setHasNews] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function checkFeatures() {
      try {
        const data: FeaturesData = FEATURES_CHANGELOG;

        // Obtener última fecha que vio el usuario
        const lastSeen = localStorage.getItem(STORAGE_KEY) || "1970-01-01";

        // Filtrar features nuevas desde última vez que vio
        const newItems = data.features.filter(
          (feature) => new Date(feature.date) > new Date(lastSeen)
        );

        if (newItems.length > 0) {
          setNewFeatures(newItems);
          setHasNews(true);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading features:", err);
        setLoading(false);
      }
    }

    checkFeatures();
  }, []);

  const markAsRead = () => {
    const now = new Date().toISOString().split("T")[0];
    localStorage.setItem(STORAGE_KEY, now);
    setHasNews(false);
  };

  return { newFeatures, hasNews, loading, markAsRead };
}
