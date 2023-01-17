import { ImmutableObject } from 'seamless-immutable';

export interface Config {
  nApiKey: string;
  tileURL: string;
  coverageURL: string;
  direction: string;
  originLongitude: number;
  originLatitude: number;
  originZoom: number;
  nearmapMinZoom: number;
  nearmapMaxZoom: number;
  opacity: number;
  tilesize: number;
  earthCircumference: number;
  inchesPerMeter: number;
  initialNmapActive: boolean;
}

export interface NearmapCoverage {
  captureDate: string;
}

export type IMConfig = ImmutableObject<Config>;
