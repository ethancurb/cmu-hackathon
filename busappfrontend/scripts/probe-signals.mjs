// Read-only, bounded provider feasibility checks. Never logs credentials.
const targets = {
  mlb: 'https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=134&startDate=2026-09-12&endDate=2026-09-19&hydrate=venue(location)',
  nhl: 'https://api-web.nhle.com/v1/club-schedule-season/PIT/20262027',
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/pit/schedule?season=2026',
  weather: 'https://api.open-meteo.com/v1/forecast?latitude=40.4469&longitude=-80.0057&hourly=temperature_2m,precipitation_probability,rain,snowfall,weather_code,wind_speed_10m&timeformat=unixtime&forecast_days=2',
  vehicles: 'https://truetime.rideprt.org/gtfsrt-bus/vehicles',
  trips: 'https://truetime.rideprt.org/gtfsrt-bus/trips',
  alerts: 'https://truetime.rideprt.org/gtfsrt-bus/alerts',
  oldTrips: 'https://truetime.portauthority.org/gtfsrt-bus/trips?debug=',
};
await Promise.all(Object.entries(targets).map(async ([source,url]) => {
  try {
    const r = await fetch(url,{signal:AbortSignal.timeout(12000)});
    const bytes = new Uint8Array(await r.arrayBuffer());
    const type = r.headers.get('content-type');
    let sample = type?.includes('json') ? JSON.parse(new TextDecoder().decode(bytes)) : new TextDecoder().decode(bytes).slice(0,160);
    if(source==='mlb') sample = sample.dates?.map(d=>({date:d.date,games:d.games?.map(g=>({id:g.gamePk,start:g.gameDate,home:g.teams.home.team.name,venue:g.venue,status:g.status.detailedState}))}));
    if(source==='nhl') sample = sample.games?.slice(0,2);
    if(source==='nfl') sample = sample.events?.slice(0,1);
    if(source==='weather') sample = {units:sample.hourly_units,first:sample.hourly?.time?.[0],hours:sample.hourly?.time?.length};
    console.log(JSON.stringify({source,status:r.status,type,cors:r.headers.get('access-control-allow-origin'),bytes:bytes.length,sample}));
  } catch(e) { console.log(JSON.stringify({source,error:e.message})); }
}));
