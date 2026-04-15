import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { apiFetch, isLocalBackend } from "@/lib/backend";

type PresenceHeartbeatStatus = "active" | "away";

const AWAY_AFTER_MS = 90_000;
const HEARTBEAT_INTERVAL_MS = 30_000;

export function useGlobalPresenceHeartbeat(userId: string | null | undefined) {
  useEffect(() => {
    if (!userId) return;

    if (isLocalBackend()) {
      let lastActivityAt = Date.now();
      let currentStatus: PresenceHeartbeatStatus = "active";

      const sendHeartbeat = async (status: PresenceHeartbeatStatus) => {
        await apiFetch("/presence/heartbeat", {
          method: "POST",
          body: JSON.stringify({ status }),
        }).catch(() => {
          // Silencioso para no interrumpir UX.
        });
      };

      const setActive = () => {
        lastActivityAt = Date.now();
        if (currentStatus !== "active") {
          currentStatus = "active";
          void sendHeartbeat("active");
        }
      };

      const onVisibility = () => {
        if (document.hidden) {
          if (currentStatus !== "away") {
            currentStatus = "away";
            void sendHeartbeat("away");
          }
          return;
        }
        setActive();
      };

      const onActivity = () => setActive();

      void sendHeartbeat("active");

      const interval = window.setInterval(() => {
        const idleFor = Date.now() - lastActivityAt;
        const nextStatus: PresenceHeartbeatStatus =
          document.hidden || idleFor > AWAY_AFTER_MS ? "away" : "active";

        if (nextStatus !== currentStatus) {
          currentStatus = nextStatus;
        }

        void sendHeartbeat(currentStatus);
      }, HEARTBEAT_INTERVAL_MS);

      window.addEventListener("mousemove", onActivity);
      window.addEventListener("keydown", onActivity);
      window.addEventListener("click", onActivity);
      window.addEventListener("scroll", onActivity, { passive: true });
      window.addEventListener("touchstart", onActivity, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);

      return () => {
        window.clearInterval(interval);
        window.removeEventListener("mousemove", onActivity);
        window.removeEventListener("keydown", onActivity);
        window.removeEventListener("click", onActivity);
        window.removeEventListener("scroll", onActivity);
        window.removeEventListener("touchstart", onActivity);
        document.removeEventListener("visibilitychange", onVisibility);
      };
    }

    let lastActivityAt = Date.now();
    let currentStatus: PresenceHeartbeatStatus = "active";

    const channel = supabase.channel("presence:comuni7", {
      config: { presence: { key: userId } },
    });

    const trackPresence = async (status: PresenceHeartbeatStatus) => {
      currentStatus = status;
      await channel
        .track({
          user_id: userId,
          status,
          last_seen_at: new Date().toISOString(),
        })
        .catch(() => {
          // Silencioso para no afectar UX.
        });
    };

    const setActive = () => {
      lastActivityAt = Date.now();
      if (currentStatus !== "active") {
        void trackPresence("active");
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (currentStatus !== "away") {
          void trackPresence("away");
        }
        return;
      }
      setActive();
    };

    const onActivity = () => setActive();

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        void trackPresence("active");
      }
    });

    const interval = window.setInterval(() => {
      const idleFor = Date.now() - lastActivityAt;
      const nextStatus: PresenceHeartbeatStatus =
        document.hidden || idleFor > AWAY_AFTER_MS ? "away" : "active";

      void trackPresence(nextStatus);
    }, HEARTBEAT_INTERVAL_MS);

    window.addEventListener("mousemove", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("click", onActivity);
    window.addEventListener("scroll", onActivity, { passive: true });
    window.addEventListener("touchstart", onActivity, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("click", onActivity);
      window.removeEventListener("scroll", onActivity);
      window.removeEventListener("touchstart", onActivity);
      document.removeEventListener("visibilitychange", onVisibility);
      supabase.removeChannel(channel);
    };
  }, [userId]);
}