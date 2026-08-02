// Maps each physical library shelf to a printed AR.js 3x3 barcode marker (values 0-63).
// Print each marker (public/ar/markers/marker-<id>.png, or the print sheet at
// public/ar/markers/print-sheet.html) at MARKER_PHYSICAL_SIZE_METERS and stick it to the
// labeled shelf so the AR camera view can recognize it and compute a real distance/position
// from the live video feed.
//
// IMPORTANT: the marker image only contains the black-bordered pattern itself. ARToolKit's
// detector requires a plain white "quiet zone" margin around it — verified empirically that
// detection fails 100% of the time with no margin, and succeeds reliably once the white
// border on each side is at least ~30% of the marker's own width. The print sheet already
// bakes this margin in; if printing marker-<id>.png directly, leave a comparable white
// border around it yourself.

export const MARKER_PHYSICAL_SIZE_METERS = 0.08; // 8cm x 8cm printed marker (excluding the white quiet-zone margin)

// One entry per shelf that actually exists in the catalogue (see SHELF_IDS in
// src/data/mockData.ts). This map had drifted out of step in both directions:
// it listed twelve shelves the library does not have (A-3..A-5, B-5, B-6,
// C-3..C-5, D-3..D-5, E-3) while omitting B-1, which holds four books — so
// getMarkerForShelf('B-1') returned undefined and ArView refused to start
// marker navigation for any of them.
//
// Marker numbers are printed physical artifacts, so every shelf that already
// had one keeps it; only B-1 is new, taking value 2 (freed by A-3). Print
// marker-2.png and stick it on B-1; no existing sticker needs replacing.
export const SHELF_MARKERS: Record<string, number> = {
  'A-1': 0,
  'A-2': 1,
  'B-1': 2,
  'B-2': 5,
  'B-3': 6,
  'B-4': 7,
  'C-1': 10,
  'C-2': 11,
  'D-1': 15,
  'D-2': 16,
  'E-1': 20,
  'E-2': 21,
};

export function getMarkerForShelf(shelf: string | undefined): number | undefined {
  if (!shelf) return undefined;
  return SHELF_MARKERS[shelf];
}
