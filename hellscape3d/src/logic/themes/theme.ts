/**
 * Parte logica di un tema cittadino: distretti e caselle speciali.
 * Asset, materiali, regole di assemblaggio e atmosfera appartengono alla
 * parte grafica, introdotta nelle fasi successive.
 */

export interface DistrictDef {
  id: string;
  label: string;
}

export interface SpecialKindDef {
  id: string;
  label: string;
  weight: number;
}

export interface CityThemeLogic {
  id: string;
  label: string;
  districts: readonly DistrictDef[];
  /** Distretto dell'area di uscita; gli altri vengono distribuiti in base al seed. */
  exitDistrict: string;
  specialKinds: readonly SpecialKindDef[];
}
