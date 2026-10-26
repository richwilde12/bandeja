// Fetches free 60-min padel slots and writes data/availability.json
import { writeFileSync } from 'node:fs';

const VENUES = [
  { id: 'grendon', n: 'Play Padel Grendon', url: 'https://playtomic.com/clubs/play-padel-grendon' },
  { id: 'overstone', n: 'Overstone Padel', url: 'https://playtomic.com/clubs/overstone-padel' },
  { id: 'ncltc', n: 'Northampton County LTC', url: 'https://clubspark.lta.org.uk/NorthamptonCountyLawnTennisClub' },
  { id: 'power', n: 'Padel Power', url: 'https://ipadel.co.uk/Court-Info/Padel-Power/3333' },
  { id: 'social', n: 'Padel Social House', url: 'https://www.google.com/search?q=Padel+Social+House+Northampton+book' },
  { id: 'marvel', n: 'Marvel Padel', url: 'https://www.google.com/search?q=Marvel+Padel+Northampton+book' },
  { id: 'brampton', n: 'Brampton Heath Padel', url: 'https://www.google.com/search?q=Brampton+Heath+Golf+and+Padel+book' },
  { id: 'top', n: 'TOP Padel', url: 'https://www.google.com/search?q=TOP+Padel+Northampton+book' },
  { id: 'uni', n: 'Padel People (University)', url: 'https://www.google.com/search?q=Padel+People+Northampton+University+book' }
];

const DAYS = 14;
const H = { 
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-GB,en;q=0.5'
};

const out = { updated: new Date().toISOString(), venues: {} };

for (const v of VENUES) {
  try {
    // If hitting Playtomic or external sites via standard fetch gets blocked,
    // mark gracefully or parse what is accessible.
    const res = await fetch(v.url, { headers: H });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    
    // Placeholder for parsing logic if fetching direct pages/APIs
    out.venues[v.id] = { ok: false, error: 'Parser needs adjustment for direct URL' };
    console.log(v.id, 'checked');
  } catch (e) {
    out.venues[v.id] = { ok: false, error: String(e.message || e) };
    console.log(v.id, 'FAILED', e.message || e);
  }
}

writeFileSync('data/availability.json', JSON.stringify(out, null, 2));
