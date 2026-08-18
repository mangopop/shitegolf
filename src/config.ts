/**
 * Image slots. Each is a filename under public/photos/ (e.g. 'crest.png').
 * Set to the real file when the photo exists; null renders a styled placeholder.
 */
export const images = {
  /** The goat-and-clubs family crest - hero, nav and footer mark. */
  crest: 'crest.gif' as string | null,
  /** The Ruthven Cup Tankard - trophies section. */
  tankard: 'cup.png' as string | null,
  /** The Phallus Trophy - trophies section. */
  phallus: 'phallus.png' as string | null,
  /** Photo strip of the family cloth; replaces the CSS tartan bands when set. */
  cloth: 'cloth.jpg' as string | null,
  /** Pin flag - emblem for the longest drive side competition. */
  longestDrive: 'longestdrive.jpeg' as string | null,
  /** Ball marker - emblem for the closest to the pin side competition. */
  closestToPin: 'marker.png' as string | null,
};

export const motto = 'Deid schaw';
export const established = 2019;



