import type { CityThemeLogic } from "./theme.ts";

/**
 * Megastrutture, primo tema (specifica HELLSCAPE_PROCEDURAL_3D_CITIES, §5).
 * I distretti sono varianti dello stesso tema, senza sequenza fissa.
 * Gli effetti delle caselle speciali non sono ancora definiti dal regolamento.
 */
export const MEGASTRUTTURE: CityThemeLogic = Object.freeze({
  id: "megastrutture",
  label: "Megastrutture",
  districts: Object.freeze([
    { id: "fondazioni", label: "Basi di fondazione" },
    { id: "ponti", label: "Ponti sospesi" },
    { id: "abitativo", label: "Fasce abitative-industriali" },
    { id: "motori", label: "Zona dei motori" },
    { id: "sommita", label: "Sommità / area di uscita" },
  ]),
  exitDistrict: "sommita",
  specialKinds: Object.freeze([
    { id: "terminale", label: "Terminale di Bafometto", weight: 1 },
    { id: "evento", label: "Evento industriale", weight: 2 },
  ]),
});
