// Encode original filenames once: the Windows optimizer's internal request must
// receive an escaped URL, not a path containing literal spaces.
const localImage = (fileName: string) => `/images/${encodeURIComponent(fileName)}`;

export const images = {
  hero: localImage("cafe-crema.png"),
  drinks: localImage("drinks-collection.png"),
  machine: localImage("ChatGPT Image 17. Sept. 2026, 17_05_28.png"),
  interior: localImage("ChatGPT Image 17. Sept. 2026, 17_04_57.png"),
  city: localImage("ChatGPT Image 17. Sept. 2026, 17_02_42.png"),
  cups: localImage("ChatGPT Image 17. Sept. 2026, 17_03_10.png"),
  syrups: localImage("ChatGPT Image 17. Sept. 2026, 17_04_38.png"),
  biscuits: localImage("ChatGPT Image 17. Sept. 2026, 17_04_47.png"),
};
