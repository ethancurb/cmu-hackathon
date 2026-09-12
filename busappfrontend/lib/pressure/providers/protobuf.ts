// Minimal bounded protobuf wire reader for the official GTFS-RT schema fields used here.
// Unknown fields are skipped. Not a passenger-count decoder. Schema: google/transit gtfs-realtime.proto.
type Field = { number:number; value:bigint|Uint8Array|number };
export function fields(bytes:Uint8Array):Field[] {
  const output:Field[]=[];let offset=0;
  const varint=()=>{let value=BigInt(0);for(let i=0;i<10;i++){if(offset>=bytes.length)throw new Error("Truncated protobuf");const byte=bytes[offset++];value|=BigInt(byte&127)<<BigInt(i*7);if(!(byte&128))return value;}throw new Error("Invalid varint");};
  while(offset<bytes.length){
    const tag=Number(varint()),number=tag>>>3,wire=tag&7;if(!number)throw new Error("Invalid field tag");
    let value:Field["value"];
    if(wire===0)value=varint();
    else if(wire===2){const length=Number(varint());if(length<0||offset+length>bytes.length)throw new Error("Invalid field length");value=bytes.slice(offset,offset+length);offset+=length;}
    else if(wire===5){if(offset+4>bytes.length)throw new Error("Truncated float");value=new DataView(bytes.buffer,bytes.byteOffset+offset,4).getFloat32(0,true);offset+=4;}
    else if(wire===1){if(offset+8>bytes.length)throw new Error("Truncated fixed64");offset+=8;continue;}
    else throw new Error("Unsupported protobuf wire type");
    output.push({number,value});
  }return output;
}
const raw=(fs:Field[],n:number)=>fs.find(f=>f.number===n)?.value;
const messages=(fs:Field[],n:number)=>fs.filter(f=>f.number===n&&f.value instanceof Uint8Array).map(f=>fields(f.value as Uint8Array));
const child=(fs:Field[],n:number)=>messages(fs,n)[0]??[];
const text=(fs:Field[],n:number)=>{const v=raw(fs,n);return v instanceof Uint8Array?new TextDecoder().decode(v):"";};
const number=(fs:Field[],n:number)=>{const v=raw(fs,n);return typeof v==="bigint"?Number(v):typeof v==="number"?v:null;};
const signed=(fs:Field[],n:number)=>{const v=raw(fs,n);return typeof v==="bigint"?Number(BigInt.asIntN(32,v)):null;};
export type DecodedFeed = {
  timestamp:number; trips:{routeId:string;tripId:string;stopId:string;delay:number|null;time:number|null}[];
  vehicles:{id:string;routeId:string;lat:number;lng:number;timestamp:number|null}[];
  alerts:{label:string;routes:string[];stops:string[];effect:number|null;periods:{start:number|null;end:number|null}[]}[];
};
export function decodeFeed(bytes:Uint8Array):DecodedFeed {
  const root=fields(bytes),header=child(root,1),timestamp=number(header,3);
  if(!text(header,1)||timestamp===null||number(header,2)===1)throw new Error("Unsupported or untimestamped GTFS feed");
  const result:DecodedFeed={timestamp,trips:[],vehicles:[],alerts:[]};
  for(const entity of messages(root,2)){
    if(number(entity,2)===1)continue;
    const trip=child(entity,3),descriptor=child(trip,1);
    for(const stop of messages(trip,2)){
      if(number(stop,5)===1||number(stop,5)===2)continue;
      const timing=child(stop,2).length?child(stop,2):child(stop,3);
      result.trips.push({routeId:text(descriptor,5),tripId:text(descriptor,1),stopId:text(stop,4),delay:signed(timing,1)??signed(trip,5),time:number(timing,2)});
    }
    const vehicle=child(entity,4),position=child(vehicle,2),lat=number(position,1),lng=number(position,2);
    if(lat!==null&&lng!==null&&Math.abs(lat)<=90&&Math.abs(lng)<=180)result.vehicles.push({id:text(child(vehicle,8),1),routeId:text(child(vehicle,1),5),lat,lng,timestamp:number(vehicle,5)});
    const alert=child(entity,5);
    if(alert.length){const selectors=messages(alert,5);const translations=messages(child(alert,10),1);const label=text(translations.find(t=>text(t,2)==="en")??translations[0]??[],1);
      result.alerts.push({label,routes:selectors.map(s=>text(s,2)).filter(Boolean),stops:selectors.map(s=>text(s,5)).filter(Boolean),effect:number(alert,7),periods:messages(alert,1).map(p=>({start:number(p,1),end:number(p,2)}))});}
  }return result;
}
