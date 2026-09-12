import snapshot from "../schedule-data.json" with { type: "json" };
import { distanceKm } from "../geo.ts";
import type {Point,ScheduledDeparture,DataFreshness} from "../types.ts";
export const scheduleStops = snapshot.stops;
export function serviceActive(serviceId:string, date:string) {
  const exception=snapshot.exceptions.find(e=>e.service_id===serviceId&&e.date===date);
  if(exception)return exception.exception_type==="1";
  const cal=snapshot.calendar.find(c=>c.service_id===serviceId);
  const day=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][new Date(`${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}T12:00:00Z`).getUTCDay()];
  return !!cal&&date>=cal.start_date&&date<=cal.end_date&&(cal as Record<string,string>)[day]==="1";
}
export function serviceDayEpoch(date:string) {
  const noon=Date.parse(`${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}T12:00:00Z`);
  const hour=Number(new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",hour:"numeric",hourCycle:"h23"}).format(new Date(noon)));
  // GTFS service day = local noon minus 12 hours, including DST transitions.
  return noon+(12-hour)*3600_000-12*3600_000;
}
export function fetchSchedule(location:Point,at:string):{departures:ScheduledDeparture[];freshness:DataFreshness;nearbyStopIds:Set<string>;routeIds:Set<string>} {
  const near=new Set(scheduleStops.filter(s=>distanceKm(s,location)<=0.8).map(s=>s.id));
  const local=new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(at));
  const dates=[-1,0,1].map(n=>new Date(Date.parse(`${local}T12:00:00Z`)+n*86400_000).toISOString().slice(0,10).replaceAll("-",""));
  const departures:ScheduledDeparture[]=[];
  const routeIds=new Set<string>();
  const covered=dates.some(date=>snapshot.calendar.some(c=>date>=c.start_date&&date<=c.end_date));
  const active=new Map(dates.map(date=>[date,new Set(snapshot.calendar.filter(c=>serviceActive(c.service_id,date)).map(c=>c.service_id))]));
  for(const row of snapshot.departures) {
    const [stop,route,direction,service,seconds]=row;
    if(!near.has(String(stop)))continue;
    routeIds.add(String(route));
    for(const date of dates) {
      if(!active.get(date)?.has(String(service)))continue;
      const epoch=serviceDayEpoch(date)+Number(seconds)*1000;
      if(epoch<Date.parse(at)||epoch>Date.parse(at)+6*3600_000)continue;
      departures.push({at:new Date(epoch).toISOString(),stopId:String(stop),routeId:String(route),directionId:String(direction)});
    }
  }
  const unique=[...new Map(departures.map(d=>[`${d.at}:${d.stopId}:${d.routeId}:${d.directionId}`,d])).values()];
  return {departures:unique,freshness:{source:"Scheduled service",fetchedAt:snapshot.fetchedAt,status:covered&&near.size?"FALLBACK":"UNAVAILABLE",detail:covered&&near.size?`PRT GTFS snapshot: ${near.size} nearby sampled stops. Calendar/exceptions applied; not live service.`:"Outside snapshot dates or sampled stop coverage; service frequency unknown."},nearbyStopIds:near,routeIds};
}
