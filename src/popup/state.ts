import { Transform } from "common/transform";

export interface PopupState {
  apiKey?: string;
  query: string;
  matchingTransforms: Transform[];
  selectedIx: number;
}
