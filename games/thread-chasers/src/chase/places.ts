/*
 * Chase engine: gazetteer. Every place a pin can stand on, with today's coordinates (lon, lat).
 * `port` places may sit on the shore or a small island (tests accept "near the coast").
 * `today` is the modern country, shown under historical names so players can find them on a modern map.
 */
import type { LonLat } from "./geo";

export interface Place {
  name: string;
  /** Modern country or region, for the place card. */
  today: string;
  at: LonLat;
  port?: boolean;
}

export const PLACES = {
  // East Asia
  luoyang: { name: "Luoyang", today: "China", at: [112.45, 34.62] },
  changan: { name: "Chang'an", today: "Xi'an, China", at: [108.94, 34.34] },
  beijing: { name: "Beijing", today: "China", at: [116.4, 39.9] },
  nanjing: { name: "Nanjing", today: "China", at: [118.8, 32.06] },
  hangzhou: { name: "Hangzhou", today: "China", at: [120.15, 30.27], port: true },
  guangzhou: { name: "Guangzhou", today: "China", at: [113.26, 23.13], port: true },
  quanzhou: { name: "Quanzhou", today: "China", at: [118.59, 24.9], port: true },
  dunhuang: { name: "Dunhuang", today: "China", at: [94.66, 40.14] },
  kaesong: { name: "Kaesong", today: "Korea", at: [126.55, 37.97] },
  kyoto: { name: "Kyoto", today: "Japan", at: [135.77, 35.01] },
  tomioka: { name: "Tomioka", today: "Japan", at: [138.89, 36.25] },
  osaka: { name: "Osaka", today: "Japan", at: [135.5, 34.69], port: true },
  karakorum: { name: "Karakorum", today: "Mongolia", at: [102.83, 47.2] },
  // Central and South Asia
  samarkand: { name: "Samarkand", today: "Uzbekistan", at: [66.97, 39.65] },
  bukhara: { name: "Bukhara", today: "Uzbekistan", at: [64.42, 39.77] },
  kashgar: { name: "Kashgar", today: "China", at: [75.99, 39.47] },
  merv: { name: "Merv", today: "Turkmenistan", at: [61.84, 37.66] },
  bhinmal: { name: "Bhinmal", today: "India", at: [72.27, 25.0] },
  ujjain: { name: "Ujjain", today: "India", at: [75.78, 23.18] },
  delhi: { name: "Delhi", today: "India", at: [77.2, 28.6] },
  calicut: { name: "Calicut", today: "Kozhikode, India", at: [75.78, 11.25], port: true },
  bombay: { name: "Bombay", today: "Mumbai, India", at: [72.88, 19.08], port: true },
  colombo: { name: "Colombo", today: "Sri Lanka", at: [79.86, 6.93], port: true },
  malacca: { name: "Malacca", today: "Melaka, Malaysia", at: [102.25, 2.19], port: true },
  palembang: { name: "Palembang", today: "Indonesia", at: [104.76, -2.99] },
  // Southwest Asia
  baghdad: { name: "Baghdad", today: "Iraq", at: [44.37, 33.31] },
  damascus: { name: "Damascus", today: "Syria", at: [36.3, 33.51] },
  mecca: { name: "Mecca", today: "Saudi Arabia", at: [39.83, 21.42] },
  aden: { name: "Aden", today: "Yemen", at: [45.03, 12.78], port: true },
  hormuz: { name: "Hormuz", today: "Iran", at: [56.45, 27.1], port: true },
  tabriz: { name: "Tabriz", today: "Iran", at: [46.29, 38.08] },
  constantinople: { name: "Constantinople", today: "Istanbul, Turkey", at: [28.98, 41.01], port: true },
  // Africa
  cairo: { name: "Cairo", today: "Egypt", at: [31.24, 30.04] },
  alexandria: { name: "Alexandria", today: "Egypt", at: [29.92, 31.2], port: true },
  koumbi: { name: "Koumbi Saleh", today: "Mauritania", at: [-7.97, 15.77] },
  niani: { name: "Niani", today: "Guinea", at: [-8.4, 11.38] },
  timbuktu: { name: "Timbuktu", today: "Mali", at: [-3.0, 16.77] },
  djenne: { name: "Djenné", today: "Mali", at: [-4.55, 13.9] },
  gao: { name: "Gao", today: "Mali", at: [0.0, 16.27] },
  taghaza: { name: "Taghaza", today: "Mali", at: [-4.98, 23.6] },
  sijilmasa: { name: "Sijilmasa", today: "Morocco", at: [-4.27, 31.28] },
  marrakesh: { name: "Marrakesh", today: "Morocco", at: [-8.0, 31.63] },
  fez: { name: "Fez", today: "Morocco", at: [-5.0, 34.03] },
  tunis: { name: "Tunis", today: "Tunisia", at: [10.18, 36.8], port: true },
  bejaia: { name: "Béjaïa (Bugia)", today: "Algeria", at: [5.08, 36.75], port: true },
  kilwa: { name: "Kilwa", today: "Tanzania", at: [39.51, -8.96], port: true },
  malindi: { name: "Malindi", today: "Kenya", at: [40.12, -3.22], port: true },
  mogadishu: { name: "Mogadishu", today: "Somalia", at: [45.34, 2.05], port: true },
  zanzibar: { name: "Zanzibar", today: "Tanzania", at: [39.2, -6.16], port: true },
  greatzim: { name: "Great Zimbabwe", today: "Zimbabwe", at: [30.93, -20.27] },
  mbanza: { name: "Mbanza Kongo", today: "Angola", at: [14.24, -6.27] },
  elmina: { name: "Elmina", today: "Ghana", at: [-1.35, 5.08], port: true },
  lagos: { name: "Lagos", today: "Nigeria", at: [3.38, 6.52], port: true },
  pretoria: { name: "Pretoria", today: "South Africa", at: [28.19, -25.75] },
  capetown: { name: "Cape Town", today: "South Africa", at: [18.42, -33.92], port: true },
  nairobi: { name: "Nairobi", today: "Kenya", at: [36.82, -1.29] },
  addis: { name: "Addis Ababa", today: "Ethiopia", at: [38.74, 9.03] },
  // Europe
  xativa: { name: "Xàtiva", today: "Spain", at: [-0.52, 38.99] },
  cordoba: { name: "Córdoba", today: "Spain", at: [-4.78, 37.88] },
  toledo: { name: "Toledo", today: "Spain", at: [-4.02, 39.86] },
  seville: { name: "Seville", today: "Spain", at: [-5.98, 37.39] },
  albelda: { name: "Albelda", today: "La Rioja, Spain", at: [-2.48, 42.36] },
  lisbon: { name: "Lisbon", today: "Portugal", at: [-9.14, 38.72], port: true },
  palma: { name: "Palma, Majorca", today: "Spain", at: [2.65, 39.57], port: true },
  mainz: { name: "Mainz", today: "Germany", at: [8.27, 50.0] },
  nuremberg: { name: "Nuremberg", today: "Germany", at: [11.08, 49.45] },
  berlin: { name: "Berlin", today: "Germany", at: [13.4, 52.52] },
  fabriano: { name: "Fabriano", today: "Italy", at: [12.9, 43.34] },
  pisa: { name: "Pisa", today: "Italy", at: [10.4, 43.72] },
  florence: { name: "Florence", today: "Italy", at: [11.25, 43.77] },
  venice: { name: "Venice", today: "Italy", at: [12.33, 45.44], port: true },
  genoa: { name: "Genoa", today: "Italy", at: [8.93, 44.41], port: true },
  rome: { name: "Rome", today: "Italy", at: [12.5, 41.9] },
  messina: { name: "Messina", today: "Sicily, Italy", at: [15.55, 38.19], port: true },
  athens: { name: "Athens", today: "Greece", at: [23.73, 37.98] },
  caffa: { name: "Caffa", today: "Feodosia, Crimea", at: [35.38, 45.03], port: true },
  tana: { name: "Tana", today: "Azov, Russia", at: [39.42, 47.11] },
  sarai: { name: "Sarai", today: "Russia", at: [47.0, 47.6] },
  paris: { name: "Paris", today: "France", at: [2.35, 48.86] },
  versailles: { name: "Versailles", today: "France", at: [2.13, 48.8] },
  lyon: { name: "Lyon", today: "France", at: [4.84, 45.76] },
  geneva: { name: "Geneva", today: "Switzerland", at: [6.14, 46.2] },
  amsterdam: { name: "Amsterdam", today: "Netherlands", at: [4.9, 52.37], port: true },
  london: { name: "London", today: "England, UK", at: [-0.13, 51.51] },
  runnymede: { name: "Runnymede", today: "England, UK", at: [-0.56, 51.44] },
  oxford: { name: "Oxford", today: "England, UK", at: [-1.26, 51.75] },
  glasgow: { name: "Glasgow", today: "Scotland, UK", at: [-4.25, 55.86] },
  edinburgh: { name: "Edinburgh", today: "Scotland, UK", at: [-3.19, 55.95] },
  birmingham: { name: "Birmingham", today: "England, UK", at: [-1.9, 52.48] },
  manchester: { name: "Manchester", today: "England, UK", at: [-2.24, 53.48] },
  liverpool: { name: "Liverpool", today: "England, UK", at: [-2.98, 53.41], port: true },
  leeds: { name: "Leeds", today: "England, UK", at: [-1.55, 53.8] },
  cork: { name: "Cork", today: "Ireland", at: [-8.47, 51.9], port: true },
  dublin: { name: "Dublin", today: "Ireland", at: [-6.26, 53.35], port: true },
  stpetersburg: { name: "St Petersburg", today: "Russia", at: [30.32, 59.94], port: true },
  // Americas
  titicaca: { name: "Lake Titicaca (Andes)", today: "Peru and Bolivia", at: [-70.02, -15.84] },
  cusco: { name: "Cusco", today: "Peru", at: [-71.97, -13.53] },
  lima: { name: "Lima", today: "Peru", at: [-77.04, -12.05], port: true },
  quito: { name: "Quito", today: "Ecuador", at: [-78.47, -0.18] },
  potosi: { name: "Potosí", today: "Bolivia", at: [-65.75, -19.58] },
  tenochtitlan: { name: "Tenochtitlan", today: "Mexico City", at: [-99.13, 19.43] },
  uaxactun: { name: "Uaxactún (Maya)", today: "Guatemala", at: [-89.63, 17.39] },
  chiapa: { name: "Chiapa de Corzo", today: "Mexico", at: [-93.01, 16.71] },
  havana: { name: "Havana", today: "Cuba", at: [-82.38, 23.13], port: true },
  capfrancais: { name: "Cap-Français (Saint-Domingue)", today: "Cap-Haïtien, Haiti", at: [-72.2, 19.76], port: true },
  santodomingo: { name: "Santo Domingo", today: "Dominican Republic", at: [-69.93, 18.49], port: true },
  angostura: { name: "Angostura", today: "Ciudad Bolívar, Venezuela", at: [-63.55, 8.12] },
  caracas: { name: "Caracas", today: "Venezuela", at: [-66.9, 10.5] },
  bogota: { name: "Bogotá", today: "Colombia", at: [-74.07, 4.71] },
  buenosaires: { name: "Buenos Aires", today: "Argentina", at: [-58.38, -34.6], port: true },
  rio: { name: "Rio de Janeiro", today: "Brazil", at: [-43.2, -22.9], port: true },
  plains: { name: "Southern Plains", today: "Oklahoma and Texas, USA", at: [-99.5, 35.5] },
  santafe: { name: "Santa Fe", today: "New Mexico, USA", at: [-105.94, 35.69] },
  natchez: { name: "Mississippi Valley (Natchez)", today: "Mississippi, USA", at: [-91.4, 31.56] },
  neworleans: { name: "New Orleans", today: "Louisiana, USA", at: [-90.07, 29.95], port: true },
  lowell: { name: "Lowell", today: "Massachusetts, USA", at: [-71.32, 42.63] },
  boston: { name: "Boston", today: "Massachusetts, USA", at: [-71.06, 42.36], port: true },
  philadelphia: { name: "Philadelphia", today: "Pennsylvania, USA", at: [-75.16, 39.95] },
  newyork: { name: "New York", today: "New York, USA", at: [-74.0, 40.71], port: true },
  washington: { name: "Washington, D.C.", today: "USA", at: [-77.04, 38.9] },
  stlouis: { name: "St. Louis", today: "Missouri, USA", at: [-90.2, 38.63] },
  quebec: { name: "Quebec", today: "Canada", at: [-71.21, 46.81], port: true },
} satisfies Record<string, Place>;

export type PlaceId = keyof typeof PLACES;

export function place(id: PlaceId): Place {
  return PLACES[id] as Place;
}

export const PLACE_IDS = Object.keys(PLACES) as PlaceId[];
