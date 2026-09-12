import type { DataFreshness, EventSignal } from "../types.ts";
import { cached, getJson, record as r, list, str, num } from "./http.ts";

const venuePoints = { pnc:{lat:40.446904,lng:-80.005753}, ppg:{lat:40.4395,lng:-79.9893}, acrisure:{lat:40.4468,lng:-80.0158} };
function event(id:string,name:string,venue:string,start:string,category:EventSignal["category"],source:string): EventSignal | null {
  if (!id || !name || !Number.isFinite(Date.parse(start))) return null;
  const point = /PNC Park/i.test(venue) ? venuePoints.pnc : /PPG Paints/i.test(venue) ? venuePoints.ppg : /Acrisure|Heinz Field/i.test(venue) ? venuePoints.acrisure : null;
  if (!point) return null;
  const duration = category === "FOOTBALL" ? 210 : category === "BASEBALL" ? 180 : 150;
  return {...point,id,name,venue,startTime:new Date(start).toISOString(),endTime:new Date(Date.parse(start)+duration*60_000).toISOString(),endEstimated:true,category,magnitude:category === "HOCKEY" || category === "CONCERT" ? "LARGE" : "MAJOR",source,confidence:"MEDIUM"};
}
export function parseMlb(data:unknown) {
  if (!Array.isArray(r(data).dates)) throw new Error("Invalid MLB schedule");
  return list(r(data).dates).flatMap(d=>list(r(d).games)).flatMap(g=>{
    const game=r(g), status=r(game.status);
    if (num(r(r(r(game.teams).home).team).id)!==134 || /cancel|postpon|suspend|final|completed/i.test(str(status.detailedState))) return [];
    const e=event(`mlb-${game.gamePk}`,`Pirates vs ${str(r(r(r(game.teams).away).team).name)}`,str(r(game.venue).name),str(game.gameDate),"BASEBALL","MLB schedule"); return e?[e]:[];
  });
}
export function parseNhl(data:unknown) {
  if (!Array.isArray(r(data).games)) throw new Error("Invalid NHL schedule");
  return list(r(data).games).flatMap(g=>{
    const game=r(g);
    if (str(r(game.homeTeam).abbrev)!=="PIT" || game.neutralSite === true || ["OFF","FINAL"].includes(str(game.gameState)) || ["CNCL","PPD","TBD"].includes(str(game.gameScheduleState))) return [];
    const e=event(`nhl-${game.id}`,`Penguins vs ${str(r(game.awayTeam).abbrev)}`,str(r(game.venue).default),str(game.startTimeUTC),"HOCKEY","NHL schedule");return e?[e]:[];
  });
}
export function parseNfl(data:unknown) {
  if (!Array.isArray(r(data).events)) throw new Error("Invalid football schedule");
  return list(r(data).events).flatMap(g=>{
    const game=r(g), competition=r(list(game.competitions)[0]);
    const home=list(competition.competitors).find(c=>r(c).homeAway === "home");
    if (str(r(r(home).team).abbreviation)!=="PIT" || competition.timeValid===false || r(r(competition.status).type).completed===true || /postpon|cancel/i.test(str(r(r(competition.status).type).description))) return [];
    const e=event(`nfl-${game.id}`,str(game.name),str(r(competition.venue).fullName),str(game.date),"FOOTBALL","ESPN schedule");return e?[e]:[];
  });
}
export function parseTicketmaster(data:unknown) {
  if (!r(data).page && !r(data)._embedded) throw new Error("Invalid Ticketmaster response");
  return list(r(r(data)._embedded).events).flatMap(g=>{
    const item=r(g), dates=r(item.dates), venue=r(list(r(item._embedded).venues)[0]);
    if (str(r(dates.status).code)!=="onsale" && str(r(dates.status).code)!=="offsale") return [];
    // Sports are supplied by sports adapters; exclude duplicates.
    if (!list(item.classifications).some(c=>str(r(r(c).segment).name)==="Music")) return [];
    const e=event(`tm-${item.id}`,str(item.name),str(venue.name),str(r(dates.start).dateTime),"CONCERT","Ticketmaster");return e?[e]:[];
  });
}
export async function fetchEvents(at:string):Promise<{events:EventSignal[];freshness:DataFreshness[]}> {
  const date=at.slice(0,10), year=Number(date.slice(0,4)), month=Number(date.slice(5,7));
  const season=month>=7?year:year-1;
  const end=new Date(Date.parse(at)+7*86400_000).toISOString().slice(0,10);
  const providers=[
    {name:"MLB schedule",url:`https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=134&startDate=${date}&endDate=${end}`,parse:parseMlb},
    {name:"NHL schedule",url:`https://api-web.nhle.com/v1/club-schedule-season/PIT/${season}${season+1}`,parse:parseNhl},
    {name:"ESPN schedule",url:`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/pit/schedule?season=${month>=3?year:year-1}`,parse:parseNfl},
  ];
  const key=process.env.TICKETMASTER_API_KEY;
  if (key) providers.push({name:"Ticketmaster",url:`https://app.ticketmaster.com/discovery/v2/events.json?apikey=${encodeURIComponent(key)}&city=Pittsburgh&countryCode=US&size=100&startDateTime=${date}T00:00:00Z&endDateTime=${end}T23:59:59Z`,parse:parseTicketmaster});
  const results=await Promise.all(providers.map(async p=>{
    try { const result=await cached(`${p.name}:${date}`,30*60_000,async()=>p.parse(await getJson(p.url)));return {events:result.value,freshness:{source:p.name,fetchedAt:result.fetchedAt,status:result.stale?"STALE":"LIVE",detail:"Published starts; event ends are duration assumptions. Home games / supported venues only."} as DataFreshness}; }
    catch {return {events:[],freshness:{source:p.name,fetchedAt:null,status:"UNAVAILABLE",detail:"Could not retrieve schedule; this is not evidence of no events."} as DataFreshness};}
  }));
  if (!key) results.push({events:[],freshness:{source:"Ticketmaster",fetchedAt:null,status:"UNAVAILABLE",detail:"Concert coverage requires optional TICKETMASTER_API_KEY. Sports feeds remain available."}});
  const unique=[...new Map(results.flatMap(x=>x.events).map(e=>[e.id,e])).values()];
  return {events:unique.filter(e=>Date.parse(e.endTime)>=Date.parse(at)-2*3600_000 && Date.parse(e.startTime)<=Date.parse(at)+7*86400_000),freshness:results.map(x=>x.freshness)};
}
