/**
 * Sports Data Service
 * Priority order:
 *  1. football-data.org  (free, register at https://www.football-data.org/client/register)
 *  2. API-Football/RapidAPI (free 100/day, https://rapidapi.com/api-sports/api/api-football)
 *  3. The Odds API (free 500/month, https://the-odds-api.com)
 *  4. Built-in rotating demo data (no key needed — always works)
 */

const axios = require('axios');
const { pool } = require('../config/database');

const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_KEY || '';
const RAPIDAPI_KEY       = process.env.RAPIDAPI_KEY || '';
const ODDS_API_KEY       = process.env.ODDS_API_KEY || '';

// ── football-data.org league IDs ─────────────────────────────────────────────
const FD_LEAGUES = [
  { id: 'PL',  name: 'Premier League',    country: 'England',  cat: 'Football' },
  { id: 'PD',  name: 'La Liga',           country: 'Spain',    cat: 'Football' },
  { id: 'BL1', name: 'Bundesliga',        country: 'Germany',  cat: 'Football' },
  { id: 'SA',  name: 'Serie A',           country: 'Italy',    cat: 'Football' },
  { id: 'FL1', name: 'Ligue 1',           country: 'France',   cat: 'Football' },
  { id: 'CL',  name: 'Champions League',  country: 'Europe',   cat: 'Football' },
  { id: 'EC',  name: 'Euros',             country: 'Europe',   cat: 'Football' },
  { id: 'WC',  name: 'World Cup',         country: 'World',    cat: 'Football' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const mapFDStatus = (s) => {
  if (['SCHEDULED','TIMED'].includes(s)) return 'upcoming';
  if (['IN_PLAY','PAUSED','HALFTIME'].includes(s)) return 'live';
  if (['FINISHED','AWARDED'].includes(s)) return 'completed';
  if (['POSTPONED','SUSPENDED','CANCELLED'].includes(s)) return 'cancelled';
  return 'upcoming';
};

const upsertEvent = async (data) => {
  // Compute double chance odds if we have all three
  let odds_1x = null, odds_x2 = null, odds_12 = null;
  if (data.odds_a && data.odds_b && data.odds_draw) {
    const a = parseFloat(data.odds_a), b = parseFloat(data.odds_b), d = parseFloat(data.odds_draw);
    odds_1x = parseFloat((1 / (1/a + 1/d)).toFixed(2));
    odds_x2 = parseFloat((1 / (1/d + 1/b)).toFixed(2));
    odds_12 = parseFloat((1 / (1/a + 1/b)).toFixed(2));
  }

  await pool.query(
    `INSERT INTO events
       (external_id, title, category, league, league_logo,
        team_a, team_b, team_a_logo, team_b_logo,
        odds_a, odds_b, odds_draw, odds_1x, odds_x2, odds_12,
        score_a, score_b, elapsed,
        start_time, end_time, status, venue)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
       status=VALUES(status), score_a=VALUES(score_a), score_b=VALUES(score_b),
       elapsed=VALUES(elapsed), odds_a=VALUES(odds_a), odds_b=VALUES(odds_b),
       odds_draw=VALUES(odds_draw), odds_1x=VALUES(odds_1x), odds_x2=VALUES(odds_x2),
       odds_12=VALUES(odds_12), updated_at=NOW()`,
    [
      data.external_id, data.title, data.category, data.league, data.league_logo || null,
      data.team_a, data.team_b, data.team_a_logo || null, data.team_b_logo || null,
      data.odds_a, data.odds_b, data.odds_draw || null, odds_1x, odds_x2, odds_12,
      data.score_a ?? null, data.score_b ?? null, data.elapsed || null,
      data.start_time, data.end_time, data.status, data.venue || null,
    ]
  );
};

// ── 1. football-data.org ──────────────────────────────────────────────────────
const syncFromFootballData = async () => {
  console.log('🔄 Syncing from football-data.org...');
  let synced = 0;

  for (const league of FD_LEAGUES) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

      const res = await axios.get(
        `https://api.football-data.org/v4/competitions/${league.id}/matches`,
        {
          headers: { 'X-Auth-Token': FOOTBALL_DATA_KEY },
          params: { dateFrom: today, dateTo: tomorrow, status: 'SCHEDULED,IN_PLAY,PAUSED,HALFTIME,FINISHED' },
          timeout: 8000,
        }
      );

      const matches = res.data.matches || [];
      for (const m of matches) {
        const startTime = new Date(m.utcDate);
        const endTime   = new Date(startTime.getTime() + 2 * 3600000);
        const status    = mapFDStatus(m.status);
        const elapsed   = m.minute || null;

        // Generate realistic odds based on home/away advantage
        const odds_a    = parseFloat((1.5 + Math.random() * 2).toFixed(2));
        const odds_b    = parseFloat((1.5 + Math.random() * 2.5).toFixed(2));
        const odds_draw = parseFloat((2.8 + Math.random() * 1.2).toFixed(2));

        await upsertEvent({
          external_id:  `fd-${m.id}`,
          title:        `${m.homeTeam.name} vs ${m.awayTeam.name}`,
          category:     league.cat,
          league:       `${league.name} (${league.country})`,
          league_logo:  null,
          team_a:       m.homeTeam.name,
          team_b:       m.awayTeam.name,
          team_a_logo:  m.homeTeam.crest || null,
          team_b_logo:  m.awayTeam.crest || null,
          odds_a, odds_b, odds_draw,
          score_a:      m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? null,
          score_b:      m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? null,
          elapsed,
          start_time:   startTime,
          end_time:     endTime,
          status,
          venue:        m.venue || null,
        });
        synced++;
      }
      // Respect rate limit (10 calls/min)
      await new Promise(r => setTimeout(r, 700));
    } catch (err) {
      if (err.response?.status === 429) {
        console.log('⏳ Rate limited, waiting 60s...');
        await new Promise(r => setTimeout(r, 60000));
      } else {
        console.error(`  League ${league.id} error:`, err.message);
      }
    }
  }
  console.log(`✅ football-data.org: synced ${synced} matches`);
  return synced;
};

// ── 2. API-Football (RapidAPI) ────────────────────────────────────────────────
const syncFromRapidAPI = async () => {
  console.log('🔄 Syncing from API-Football (RapidAPI)...');
  const today = new Date().toISOString().split('T')[0];
  const res = await axios.get('https://api-football-v1.p.rapidapi.com/v3/fixtures', {
    headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com' },
    params: { date: today, timezone: 'Africa/Kigali' },
    timeout: 10000,
  });

  const fixtures = res.data.response || [];
  let synced = 0;
  for (const f of fixtures) {
    const startTime = new Date(f.fixture.date);
    const endTime   = new Date(startTime.getTime() + 2 * 3600000);
    const statusMap = { NS:'upcoming', '1H':'live', HT:'live', '2H':'live', FT:'completed', CANC:'cancelled' };
    const status    = statusMap[f.fixture.status.short] || 'upcoming';

    await upsertEvent({
      external_id:  `afl-${f.fixture.id}`,
      title:        `${f.teams.home.name} vs ${f.teams.away.name}`,
      category:     'Football',
      league:       `${f.league.name} (${f.league.country})`,
      league_logo:  f.league.logo,
      team_a:       f.teams.home.name,
      team_b:       f.teams.away.name,
      team_a_logo:  f.teams.home.logo,
      team_b_logo:  f.teams.away.logo,
      odds_a:       parseFloat((1.5 + Math.random() * 2).toFixed(2)),
      odds_b:       parseFloat((1.5 + Math.random() * 2.5).toFixed(2)),
      odds_draw:    parseFloat((2.8 + Math.random() * 1.2).toFixed(2)),
      score_a:      f.goals.home,
      score_b:      f.goals.away,
      elapsed:      f.fixture.status.elapsed,
      start_time:   startTime,
      end_time:     endTime,
      status,
      venue:        f.fixture.venue?.name || null,
    });
    synced++;
  }
  console.log(`✅ RapidAPI: synced ${synced} fixtures`);
  return synced;
};

// ── 3. The Odds API ───────────────────────────────────────────────────────────
const syncFromOddsAPI = async () => {
  console.log('🔄 Syncing from The Odds API...');
  const sports = ['soccer_epl','soccer_spain_la_liga','soccer_germany_bundesliga',
                  'soccer_italy_serie_a','soccer_france_ligue_one','soccer_uefa_champs_league',
                  'basketball_nba','tennis_atp_french_open','mma_mixed_martial_arts'];
  let synced = 0;

  for (const sport of sports) {
    try {
      const res = await axios.get(`https://api.the-odds-api.com/v4/sports/${sport}/odds`, {
        params: { apiKey: ODDS_API_KEY, regions: 'eu', markets: 'h2h', oddsFormat: 'decimal' },
        timeout: 8000,
      });

      const catMap = {
        soccer: 'Football', basketball: 'Basketball',
        tennis: 'Tennis', mma: 'MMA',
      };
      const cat = catMap[sport.split('_')[0]] || 'Football';

      for (const game of (res.data || [])) {
        const startTime = new Date(game.commence_time);
        const endTime   = new Date(startTime.getTime() + 2 * 3600000);
        const now       = new Date();
        const status    = startTime > now ? 'upcoming' : startTime < new Date(now - 3 * 3600000) ? 'completed' : 'live';

        const bk = game.bookmakers?.[0]?.markets?.[0]?.outcomes || [];
        const homeOdds = parseFloat(bk.find(o => o.name === game.home_team)?.price || 2.0);
        const awayOdds = parseFloat(bk.find(o => o.name === game.away_team)?.price || 2.0);
        const drawOdds = parseFloat(bk.find(o => o.name === 'Draw')?.price || null);

        await upsertEvent({
          external_id:  `odds-${game.id}`,
          title:        `${game.home_team} vs ${game.away_team}`,
          category:     cat,
          league:       game.sport_title,
          league_logo:  null,
          team_a:       game.home_team,
          team_b:       game.away_team,
          team_a_logo:  null,
          team_b_logo:  null,
          odds_a:       homeOdds,
          odds_b:       awayOdds,
          odds_draw:    drawOdds,
          score_a:      null,
          score_b:      null,
          elapsed:      null,
          start_time:   startTime,
          end_time:     endTime,
          status,
          venue:        null,
        });
        synced++;
      }
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(`  Odds API sport ${sport}:`, err.message);
    }
  }
  console.log(`✅ Odds API: synced ${synced} events`);
  return synced;
};

// ── 4. Demo data (always works, no key needed) ────────────────────────────────
const syncDemoData = async () => {
  console.log('📦 Loading demo match data...');
  const now = new Date();

  // Rotating fixtures — times shift each sync so they stay "fresh"
  const fixtures = [
    // LIVE NOW
    { id:'d-live-1', h:'Manchester United', a:'Arsenal',         league:'Premier League · England',   cat:'Football', hFrom:-0.75, status:'live', el:67, sa:1, sb:0, oa:2.10, ob:3.20, od:3.40, hl:'https://crests.football-data.org/66.png',  al:'https://crests.football-data.org/57.png' },
    { id:'d-live-2', h:'Real Madrid',       a:'Barcelona',       league:'La Liga · Spain',            cat:'Football', hFrom:-1.0,  status:'live', el:82, sa:2, sb:1, oa:2.00, ob:3.50, od:3.20, hl:'https://crests.football-data.org/86.png',  al:'https://crests.football-data.org/81.png' },
    { id:'d-live-3', h:'Bayern Munich',     a:'Dortmund',        league:'Bundesliga · Germany',       cat:'Football', hFrom:-0.5,  status:'live', el:44, sa:1, sb:1, oa:1.75, ob:4.00, od:3.80, hl:'https://crests.football-data.org/5.png',   al:'https://crests.football-data.org/4.png' },
    // TODAY
    { id:'d-today-1', h:'Chelsea',          a:'Liverpool',       league:'Premier League · England',   cat:'Football', hFrom:2,  status:'upcoming', sa:null, sb:null, oa:2.80, ob:2.40, od:3.20, hl:'https://crests.football-data.org/61.png',  al:'https://crests.football-data.org/64.png' },
    { id:'d-today-2', h:'PSG',              a:'Marseille',       league:'Ligue 1 · France',           cat:'Football', hFrom:3,  status:'upcoming', sa:null, sb:null, oa:1.55, ob:5.00, od:4.00, hl:'https://crests.football-data.org/524.png', al:'https://crests.football-data.org/516.png' },
    { id:'d-today-3', h:'Juventus',         a:'AC Milan',        league:'Serie A · Italy',            cat:'Football', hFrom:4,  status:'upcoming', sa:null, sb:null, oa:2.20, ob:3.10, od:3.30, hl:'https://crests.football-data.org/109.png', al:'https://crests.football-data.org/98.png' },
    { id:'d-today-4', h:'Atletico Madrid',  a:'Sevilla',         league:'La Liga · Spain',            cat:'Football', hFrom:5,  status:'upcoming', sa:null, sb:null, oa:1.90, ob:3.80, od:3.50, hl:'https://crests.football-data.org/78.png',  al:'https://crests.football-data.org/559.png' },
    { id:'d-today-5', h:'Inter Milan',      a:'Napoli',          league:'Serie A · Italy',            cat:'Football', hFrom:6,  status:'upcoming', sa:null, sb:null, oa:2.10, ob:3.20, od:3.40, hl:'https://crests.football-data.org/108.png', al:'https://crests.football-data.org/113.png' },
    { id:'d-today-6', h:'Manchester City',  a:'Tottenham',       league:'Premier League · England',   cat:'Football', hFrom:7,  status:'upcoming', sa:null, sb:null, oa:1.60, ob:5.00, od:4.00, hl:'https://crests.football-data.org/65.png',  al:'https://crests.football-data.org/73.png' },
    { id:'d-today-7', h:'Borussia Dortmund',a:'RB Leipzig',      league:'Bundesliga · Germany',       cat:'Football', hFrom:8,  status:'upcoming', sa:null, sb:null, oa:2.30, ob:2.90, od:3.30, hl:'https://crests.football-data.org/4.png',   al:'https://crests.football-data.org/721.png' },
    { id:'d-today-8', h:'Porto',            a:'Benfica',         league:'Primeira Liga · Portugal',   cat:'Football', hFrom:9,  status:'upcoming', sa:null, sb:null, oa:2.00, ob:3.40, od:3.20, hl:null, al:null },
    { id:'d-today-9', h:'Ajax',             a:'PSV Eindhoven',   league:'Eredivisie · Netherlands',   cat:'Football', hFrom:10, status:'upcoming', sa:null, sb:null, oa:1.85, ob:3.70, od:3.50, hl:null, al:null },
    // TOMORROW
    { id:'d-tom-1',  h:'Bayer Leverkusen',  a:'Eintracht Frankfurt', league:'Bundesliga · Germany',   cat:'Football', hFrom:24, status:'upcoming', sa:null, sb:null, oa:1.80, ob:4.00, od:3.60, hl:null, al:null },
    { id:'d-tom-2',  h:'Lazio',             a:'Roma',            league:'Serie A · Italy',            cat:'Football', hFrom:26, status:'upcoming', sa:null, sb:null, oa:2.40, ob:2.80, od:3.10, hl:null, al:null },
    { id:'d-tom-3',  h:'Valencia',          a:'Villarreal',      league:'La Liga · Spain',            cat:'Football', hFrom:27, status:'upcoming', sa:null, sb:null, oa:2.10, ob:3.20, od:3.30, hl:null, al:null },
    { id:'d-tom-4',  h:'Celtic',            a:'Rangers',         league:'Scottish Premiership',       cat:'Football', hFrom:28, status:'upcoming', sa:null, sb:null, oa:1.95, ob:3.60, od:3.40, hl:null, al:null },
    // OTHER SPORTS
    { id:'d-nba-1',  h:'LA Lakers',         a:'Boston Celtics',  league:'NBA · USA',                  cat:'Basketball', hFrom:5,  status:'upcoming', sa:null, sb:null, oa:1.85, ob:1.95, od:null, hl:null, al:null },
    { id:'d-nba-2',  h:'Golden State Warriors', a:'Miami Heat',  league:'NBA · USA',                  cat:'Basketball', hFrom:7,  status:'upcoming', sa:null, sb:null, oa:1.70, ob:2.10, od:null, hl:null, al:null },
    { id:'d-ten-1',  h:'Novak Djokovic',    a:'Carlos Alcaraz',  league:'Wimbledon · Grand Slam',     cat:'Tennis',     hFrom:6,  status:'upcoming', sa:null, sb:null, oa:1.70, ob:2.10, od:null, hl:null, al:null },
    { id:'d-ten-2',  h:'Jannik Sinner',     a:'Rafael Nadal',    league:'Roland Garros · Grand Slam', cat:'Tennis',     hFrom:8,  status:'upcoming', sa:null, sb:null, oa:1.55, ob:2.40, od:null, hl:null, al:null },
    { id:'d-mma-1',  h:'Jon Jones',         a:'Stipe Miocic',    league:'UFC 300 · MMA',              cat:'MMA',        hFrom:30, status:'upcoming', sa:null, sb:null, oa:1.55, ob:2.40, od:null, hl:null, al:null },
    { id:'d-cri-1',  h:'Mumbai Indians',    a:'Chennai Super Kings', league:'IPL · India',            cat:'Cricket',    hFrom:12, status:'upcoming', sa:null, sb:null, oa:1.90, ob:1.90, od:null, hl:null, al:null },
    { id:'d-box-1',  h:'Tyson Fury',        a:'Anthony Joshua',  league:'WBC Heavyweight · Boxing',   cat:'Boxing',     hFrom:48, status:'upcoming', sa:null, sb:null, oa:1.65, ob:2.20, od:null, hl:null, al:null },
    // AFRICA CUP
    { id:'d-afr-1',  h:'Nigeria',           a:'Ghana',           league:'AFCON · Africa',             cat:'Football',   hFrom:14, status:'upcoming', sa:null, sb:null, oa:2.10, ob:3.00, od:3.20, hl:null, al:null },
    { id:'d-afr-2',  h:'Senegal',           a:'Ivory Coast',     league:'AFCON · Africa',             cat:'Football',   hFrom:16, status:'upcoming', sa:null, sb:null, oa:2.30, ob:2.80, od:3.10, hl:null, al:null },
    { id:'d-afr-3',  h:'Morocco',           a:'Egypt',           league:'AFCON · Africa',             cat:'Football',   hFrom:18, status:'upcoming', sa:null, sb:null, oa:2.00, ob:3.20, od:3.30, hl:null, al:null },
    { id:'d-afr-4',  h:'Cameroon',          a:'Algeria',         league:'AFCON · Africa',             cat:'Football',   hFrom:20, status:'upcoming', sa:null, sb:null, oa:2.20, ob:2.90, od:3.20, hl:null, al:null },
    { id:'d-afr-5',  h:'Rwanda',            a:'Tanzania',        league:'CECAFA · East Africa',       cat:'Football',   hFrom:22, status:'upcoming', sa:null, sb:null, oa:2.50, ob:2.60, od:3.00, hl:null, al:null },
    { id:'d-afr-6',  h:'Uganda',            a:'Kenya',           league:'CECAFA · East Africa',       cat:'Football',   hFrom:25, status:'upcoming', sa:null, sb:null, oa:2.30, ob:2.80, od:3.10, hl:null, al:null },
  ];

  let synced = 0;
  for (const f of fixtures) {
    const startTime = new Date(now.getTime() + f.hFrom * 3600000);
    const endTime   = new Date(startTime.getTime() + 2 * 3600000);
    try {
      await upsertEvent({
        external_id:  f.id,
        title:        `${f.h} vs ${f.a}`,
        category:     f.cat,
        league:       f.league,
        league_logo:  null,
        team_a:       f.h,
        team_b:       f.a,
        team_a_logo:  f.hl || null,
        team_b_logo:  f.al || null,
        odds_a:       f.oa,
        odds_b:       f.ob,
        odds_draw:    f.od || null,
        score_a:      f.sa ?? null,
        score_b:      f.sb ?? null,
        elapsed:      f.el || null,
        start_time:   startTime,
        end_time:     endTime,
        status:       f.status,
        venue:        null,
      });
      synced++;
    } catch (err) {
      console.error('Demo upsert error:', err.message);
    }
  }
  console.log(`✅ Demo data: ${synced} fixtures loaded`);
  return synced;
};

// ── Main sync function — tries APIs in order, falls back to demo ──────────────
const fetchAndSyncFixtures = async () => {
  try {
    if (FOOTBALL_DATA_KEY) {
      await syncFromFootballData();
      return;
    }
    if (RAPIDAPI_KEY) {
      await syncFromRapidAPI();
      return;
    }
    if (ODDS_API_KEY) {
      await syncFromOddsAPI();
      return;
    }
    // No API key — use demo data
    await syncDemoData();
  } catch (err) {
    console.error('Sync error, falling back to demo:', err.message);
    await syncDemoData();
  }
};

// ── Update live scores (only if API key available) ────────────────────────────
const updateLiveScores = async () => {
  if (!FOOTBALL_DATA_KEY && !RAPIDAPI_KEY) {
    // Simulate live score changes for demo matches
    await simulateLiveScores();
    return;
  }
  try {
    if (RAPIDAPI_KEY) {
      const res = await axios.get('https://api-football-v1.p.rapidapi.com/v3/fixtures', {
        headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com' },
        params: { live: 'all' },
        timeout: 8000,
      });
      for (const f of (res.data.response || [])) {
        await pool.query(
          `UPDATE events SET score_a=?, score_b=?, elapsed=?, status=?, updated_at=NOW() WHERE external_id=?`,
          [f.goals.home, f.goals.away, f.fixture.status.elapsed,
           f.fixture.status.short === 'FT' ? 'completed' : 'live', `afl-${f.fixture.id}`]
        );
      }
    }
  } catch (err) {
    console.error('Live score update error:', err.message);
  }
};

// Simulate live score changes for demo data
const simulateLiveScores = async () => {
  try {
    const [liveEvents] = await pool.query(
      "SELECT id, score_a, score_b, elapsed FROM events WHERE status='live' AND external_id LIKE 'd-live-%'"
    );
    for (const ev of liveEvents) {
      const newElapsed = Math.min(90, (ev.elapsed || 0) + 1);
      // Occasionally add a goal (5% chance per minute)
      const goalA = Math.random() < 0.05 ? 1 : 0;
      const goalB = Math.random() < 0.04 ? 1 : 0;
      const newStatus = newElapsed >= 90 ? 'completed' : 'live';
      await pool.query(
        'UPDATE events SET elapsed=?, score_a=score_a+?, score_b=score_b+?, status=?, updated_at=NOW() WHERE id=?',
        [newElapsed, goalA, goalB, newStatus, ev.id]
      );
    }
  } catch (err) {
    console.error('Simulate scores error:', err.message);
  }
};

module.exports = { fetchAndSyncFixtures, updateLiveScores, syncDemoData };
