// Maps each physical library shelf to a printed AR.js 3x3 barcode marker (values 0-63).
// Print each marker at MARKER_PHYSICAL_SIZE_METERS and stick it to the labeled shelf so the
// AR camera view can recognize it and compute a real distance/position from the live video feed.
//
// Generate the matching marker images at:
// https://ar-js-org.github.io/AR.js/three.js/examples/marker-training/examples/generator.html
// (choose "Barcode Markers" and enter the numeric value listed below for each shelf)

export const MARKER_PHYSICAL_SIZE_METERS = 0.12; // 12cm x 12cm printed marker

export const SHELF_MARKERS: Record<string, number> = {
  'A-1': 0,
  'A-2': 1,
  'A-3': 2,
  'A-4': 3,
  'A-5': 4,
  'B-2': 5,
  'B-3': 6,
  'B-4': 7,
  'B-5': 8,
  'B-6': 9,
  'C-1': 10,
  'C-2': 11,
  'C-3': 12,
  'C-4': 13,
  'C-5': 14,
  'D-1': 15,
  'D-2': 16,
  'D-3': 17,
  'D-4': 18,
  'D-5': 19,
  'E-1': 20,
  'E-2': 21,
  'E-3': 22,
};

export function getMarkerForShelf(shelf: string | undefined): number | undefined {
  if (!shelf) return undefined;
  return SHELF_MARKERS[shelf];
}
