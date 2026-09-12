import type { Point, DataFreshness, WeatherSignal } from "../types.ts";
import {cached,getJson,record,list,num} from "./http.ts";
export function parseWeather(data:unknown):WeatherSignal[] {
  const h=record(record(data).hourly);
  if (!Array.isArray(h.time)) throw new Error("Invalid hourly forecast");
  return list(h.time).flatMap((time,i)=>{
    const values=[time,...["precipitation_probability","rain","snowfall","temperature_2m","weather_code","wind_speed_10m"].map(k=>list(h[k])[i])].map(num);
    if(values.some(v=>v===null)) return [];
    const [epoch,prob,rain,snow,temp,code,wind]=values as number[];
    if(prob<0||prob>100||rain<0||snow<0||wind<0||!Number.isFinite(new Date(epoch*1000).getTime())) return [];
    return [{at:new Date(epoch*1000).toISOString(),precipitationProbability:prob,rainMm:rain,snowCm:snow,temperatureC:temp,weatherCode:code,windKph:wind}];
  });
}
export async function fetchWeather(point:Point):Promise<{weather:WeatherSignal[];freshness:DataFreshness}> {
  const lat=point.lat.toFixed(2),lng=point.lng.toFixed(2);
  try { const result=await cached(`weather:${lat}:${lng}`,15*60_000,async()=>{
    const data=await getJson(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,precipitation_probability,rain,snowfall,weather_code,wind_speed_10m&timeformat=unixtime&forecast_days=3&timezone=UTC`);
    const parsed=parseWeather(data);if(!parsed.length)throw new Error("Empty weather");return parsed;
  });return {weather:result.value,freshness:{source:"Hourly weather",fetchedAt:result.fetchedAt,status:result.stale?"STALE":"LIVE",detail:"Open-Meteo hourly forecast; weather effects are model assumptions."}}; }
  catch {return {weather:[],freshness:{source:"Hourly weather",fetchedAt:null,status:"UNAVAILABLE",detail:"No weather contribution; forecast unavailable."}};}
}
