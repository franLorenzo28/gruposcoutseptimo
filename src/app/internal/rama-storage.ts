import type { MiembroRama } from "@/lib/member-auth";

export interface RamaPanelEvent {
  id: string;
  titulo: string;
  fecha: string;
  hora: string;
  lugar: string;
  descripcion: string;
}

export interface RamaPanelContent {
  lema: string;
  reuniones: string[];
  info: string[];
  avisos: string[];
}

export const ramaConfig: Record<
  MiembroRama,
  {
    titulo: string;
    lema: string;
    reuniones: string[];
    info: string[];
  }
> = {
  rover: {
    titulo: "Rover",
    lema: "Servir",
    reuniones: [
      "Lunes 20:00 - 22:00",
      "Sabado salida de servicio (segun agenda)",
    ],
    info: [
      "Coordinacion de acciones solidarias",
      "Preparacion de campamentos de servicio",
    ],
  },
  pioneros: {
    titulo: "Pioneros",
    lema: "Explorar",
    reuniones: ["Martes 19:00 - 21:00", "Sabado actividad al aire libre"],
    info: ["Desafios de liderazgo", "Proyectos comunitarios de unidad"],
  },
  tropa: {
    titulo: "Tropa",
    lema: "Descubrir",
    reuniones: ["Miercoles 18:30 - 20:30", "Domingo encuentro mensual"],
    info: [
      "Trabajo en equipo",
      "Actividades de orientacion y naturaleza",
    ],
  },
  lobatos: {
    titulo: "Lobatos",
    lema: "Siempre mejor",
    reuniones: ["Sabado 15:00 - 17:00", "Fogon mensual con familias"],
    info: ["Juego educativo", "Desarrollo de habilidades y valores"],
  },
};

export function getDefaultRamaContent(rama: MiembroRama): RamaPanelContent {
  const config = ramaConfig[rama];

  return {
    lema: config.lema,
    reuniones: config.reuniones,
    info: config.info,
    avisos: [],
  };
}

function parseStoredJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function readRamaContent(rama: MiembroRama): RamaPanelContent {
  if (typeof window === "undefined") return getDefaultRamaContent(rama);
  return parseStoredJson(
    window.localStorage.getItem(`rama_${rama}_content`),
    getDefaultRamaContent(rama),
  );
}

export function writeRamaContent(rama: MiembroRama, content: RamaPanelContent): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`rama_${rama}_content`, JSON.stringify(content));
}

export function readRamaEvents(rama: MiembroRama): RamaPanelEvent[] {
  if (typeof window === "undefined") return [];
  return parseStoredJson(
    window.localStorage.getItem(`rama_${rama}_eventos`),
    [] as RamaPanelEvent[],
  );
}

export function writeRamaEvents(rama: MiembroRama, events: RamaPanelEvent[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`rama_${rama}_eventos`, JSON.stringify(events));
}

export function sortRamaEvents(events: RamaPanelEvent[]): RamaPanelEvent[] {
  const toTimestamp = (evento: RamaPanelEvent) => {
    const value = new Date(`${evento.fecha}T${evento.hora || "00:00"}:00`).getTime();
    return Number.isFinite(value) ? value : 0;
  };

  return [...events].sort((a, b) => toTimestamp(a) - toTimestamp(b));
}

export function getUpcomingRamaEvents(events: RamaPanelEvent[]): RamaPanelEvent[] {
  const now = Date.now();
  return sortRamaEvents(events).filter((evento) => {
    const value = new Date(`${evento.fecha}T${evento.hora || "00:00"}:00`).getTime();
    return Number.isFinite(value) && value >= now;
  });
}
