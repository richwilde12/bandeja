// Fetches free 60-min padel slots from Playtomic for each venue and writes data/availability.json
import { writeFileSync } from 'node:fs';

const VENUES = [
  { id: 'grendon', k: 'grendon', q: 'Play Padel Grendon' },
  { id: 'overstone', k: 'overstone', q: 'Overstone Padel', tid: '3e9492bc-8d9b-4c3d-a169-7ba420ad5e15' },
  { id: 'ncltc', k: 'northampton county', q: 'Northampton County Lawn Tennis Club' },
  { id: 'power', k: 'padel power', q: 'Padel Power' },
  { id: 'social', k: 'social house', q: 'Padel Social House' },
  { id: 'marvel', k: 'marvel', q: 'Marvel Padel' },
  { id: 'brampton', k: 'brampton', q: 'Brampton Heath' },
  { id: 'top', k: 'top padel', q: 'TOP Padel' },
  { id: 'uni', k: 'padel people', q: 'Padel People Northampton University' },
];

const DAYS = 14;

// Pull token from environment variable (GitHub Action Secret) or fallback string
const AUTH_TOKEN = process.env.PLAYTOMIC_TOKEN || '
/api/clubs/availability?tenant_id=6f0344f0-7631-411b-a4fe-e1231cc15554&date=2026-10-26&sport_id=PADEL';

const H = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Authorization': AUTH_TOKEN.startsWith('Bearer ') ? AUTH_TOKEN : `Bearer ${AUTH_TOKEN}`
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

const get = async u => {
  const r = await fetch(u, { headers: H });
  if (!r.ok) throw new Error(`${r.status} ${u}`);
  return r.json();
};

const fmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});

const local = d => {
  const p = Object.fromEntries(fmt.formatToParts(d).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, t: `${p.hour === '24' ? '00' : p.hour}:${p.minute}` };
};

const out = { updated: new Date().toISOString(), venues: {} };

for (const v of VENUES) {
  try {
    let tid = v.tid;
    if (!tid) {
      const ts = await get(`https://api.playtomic.io/v1/tenants?tenant_name=${encodeURIComponent(v.q)}&sport_id=PADEL&size=10`);
      const hit = ts.find(t => (t.tenant_name || '').toLowerCase().includes(v.k));
      if (!hit) throw new Error('venue not found on Playtomic');
      tid = hit.tenant_id;
    }
    const days = {};
    for (let i = 0; i < DAYS; i++) {
      const d = new Date(Date.now() + i * 864e5).toISOString().slice(0, 10);
      const j = await get(`https://api.playtomic.io/v1/availability?user_id=me&tenant_id=${tid}&sport_id=PADEL&local_start_min=${d}T00:00:00&local_start_max=${d}T23:59:59`);
      for (const res of j) {
        for (const s of res.slots || []) {
          if (s.duration !== 60) continue;
          const l = local(new Date(`${res.start_date}T${s.start_time}Z`));
          const list = (days[l.date] ??= []);
          let e = list.find(x => x.t === l.t);
          if (!e) list.push(e = { t: l.t, n: 0, p: 1e9 });
          e.n++;
          e.p = Math.min(e.p, parseFloat(s.price));
        }
      }
      await sleep(250);
    }
    for (const k in days) days[k].sort((a, b) => a.t.localeCompare(b.t));
    out.venues[v.id] = { ok: true, days };
    console.log(v.id, 'ok', Object.keys(days).length, 'days');
  } catch (e) {
    out.venues[v.id] = { ok: false, error: String(e.message || e) };
    console.log(v.id, 'FAILED', e.message || e);
  }
}

writeFileSync('data/availability.json', JSON.stringify(out));
