import {cached} from "./http.ts";
import {decodeFeed,type DecodedFeed} from "./protobuf.ts";
import {distanceKm} from "../geo.ts";
import type {Point,DataFreshness,TransitSignal} from "../types.ts";
export async function fetchTransit(location:Point,nearbyStopIds:Set<string>,routeIds:Set<string>):Promise<{transit:TransitSignal;freshness:DataFreshness[]}> {
  const feeds=await Promise.all(["trips","vehicles","alerts"].map(async kind=>{
    try {const result=await cached(`prt:${kind}`,30_000,async()=>{const response=await fetch(`https://truetime.rideprt.org/gtfsrt-bus/${kind}`,{signal:AbortSignal.timeout(5000),cache:"no-store"});if(!response.ok)throw new Error("PRT unavailable");return decodeFeed(new Uint8Array(await response.arrayBuffer()));});
      const age=Date.now()/1000-result.value.timestamp;
      const fresh=!result.stale&&age>=-60&&age<=300;
      return {kind,data:result.value,fresh,freshness:{source:`PRT ${kind}`,fetchedAt:result.fetchedAt,updatedAt:new Date(result.value.timestamp*1000).toISOString(),status:fresh?"LIVE":"STALE",detail:fresh?"Agency GTFS-Realtime feed; signals scoped to selected area.":"Old feed excluded from pressure contribution."} as DataFreshness};
    }catch{return {kind,data:null,fresh:false,freshness:{source:`PRT ${kind}`,fetchedAt:null,status:"UNAVAILABLE",detail:"Feed unavailable; no contribution assumed."} as DataFreshness};}
  }));
  const data=(kind:string):DecodedFeed|null=>feeds.find(f=>f.kind===kind&&f.fresh)?.data??null;
  const delays=(data("trips")?.trips??[]).filter(t=>nearbyStopIds.has(t.stopId)&&t.delay!==null&&t.time!==null&&t.time>=Date.now()/1000-60&&t.time<=Date.now()/1000+3600).map(t=>Math.max(0,t.delay!)/60);
  const now=Date.now()/1000;
  const alerts=(data("alerts")?.alerts??[]).filter(a=>[1,2,3,4,8,9].includes(a.effect??0)&& (a.stops.some(s=>nearbyStopIds.has(s))||(!a.stops.length&&a.routes.some(r=>routeIds.has(r)))) && (!a.periods.length||a.periods.some(p=>(p.start===null||p.start<=now)&&(p.end===null||p.end>=now)))).map(a=>({label:a.label,effect:a.effect})).filter(a=>a.label);
  const vehicles=data("vehicles")?.vehicles.filter(v=>distanceKm(v,location)<=1.2&&v.timestamp!==null&&now-v.timestamp<=300);
  const valid=feeds.some(f=>f.fresh);
  return {transit:{delayMinutes:delays.length?Math.max(...delays):null,alerts:[...new Map(alerts.map(a=>[a.label,a])).values()].slice(0,3),vehicleCount:vehicles?.length??null,observedAt:valid?new Date().toISOString():null},freshness:[{source:"PRT realtime",fetchedAt:valid?new Date().toISOString():null,status:valid?"LIVE":"UNAVAILABLE",detail:`${vehicles?.length??"Unknown"} nearby vehicles; ${delays.length?"explicit delay fields available":"delay unknown"}. Current evidence fades out over the next hour. Vehicle count is not passenger count.`},...feeds.map(f=>f.freshness)]};
}
