import { theme } from './data';

export interface RadioStation {
  id: string;
  name: string;
  tagline: string;
  color: string;
  cover: string;
  trackIds: string[];
}

export interface ListeningRoom {
  id: string;
  name: string;
  host: string;
  listeners: number;
  color: string;
  cover: string;
  trackIds: string[];
  vibe: string;
}

export const RADIO_STATIONS: RadioStation[] = [
  { id: 'r1', name: 'Pulse FM', tagline: 'Electronic after midnight', color: theme.accent, cover: '📡', trackIds: ['t1', 't5', 't10', 't15', 't3'] },
  { id: 'r2', name: 'Wave Coast', tagline: 'Ambient + focus currents', color: theme.green, cover: '🌊', trackIds: ['t9', 't10', 't19', 't20', 't2'] },
  { id: 'r3', name: 'Spark Radio', tagline: 'Morning energy, no ads', color: theme.amber, cover: '☀️', trackIds: ['t13', 't11', 't22', 't14', 't6'] },
  { id: 'r4', name: 'Beat Alley', tagline: 'Indie heat + late R&B', color: theme.pink, cover: '🔥', trackIds: ['t11', 't13', 't5', 't1', 't7', 't14'] },
];

export const LISTENING_ROOMS: ListeningRoom[] = [
  { id: 'rm1', name: 'Cathedral After Hours', host: 'Nova Vale', listeners: 128, color: theme.accent, cover: '🕯️', trackIds: ['t9', 't10', 't19'], vibe: 'spatial · quiet chat' },
  { id: 'rm2', name: 'Night Drive Club', host: 'Kade Mercer', listeners: 86, color: theme.pink, cover: '🛣️', trackIds: ['t1', 't5', 't15'], vibe: 'queue locked · live' },
  { id: 'rm3', name: 'Studio Loft', host: 'Mira Chen', listeners: 41, color: theme.green, cover: '🎛️', trackIds: ['t13', 't11', 't22'], vibe: 'collab queue' },
];
