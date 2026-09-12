"""Extract a small, reproducible PRT service snapshot for the four supported areas.
Uses only Python stdlib. Scheduled times, not predictions. Run manually, not per request.
"""
import csv, io, json, math, urllib.request, zipfile
from datetime import datetime, timezone
from pathlib import Path

URL = 'https://www.rideprt.org/developerresources/GTFS.zip'
with urllib.request.urlopen(URL, timeout=25) as r:
    archive = zipfile.ZipFile(io.BytesIO(r.read()))
def rows(name):
    return csv.DictReader(io.TextIOWrapper(archive.open(name), encoding='utf-8-sig'))
stops = {r['stop_id']: r for r in rows('stops.txt')}
trips = {r['trip_id']: r for r in rows('trips.txt')}
centers = [(40.4443,-79.9428),(40.4469,-80.0057),(40.4395,-79.9893),(40.4468,-80.0158)]
def distance(r, p):
    return math.hypot((float(r['stop_lat'])-p[0])*111,(float(r['stop_lon'])-p[1])*85)
near = {sid for sid,s in stops.items() if any(distance(s,p)<0.8 for p in centers)}
times = [r for r in rows('stop_times.txt') if r['stop_id'] in near and r['trip_id'] in trips]
# Closest stop on each route/direction per area; don't count every downstream stop as another bus.
best = {}
for r in times:
    t = trips[r['trip_id']]
    for i,p in enumerate(centers):
        d = distance(stops[r['stop_id']],p)
        key = (i,t['route_id'],t.get('direction_id',''))
        if d < 0.8 and (key not in best or d < best[key][0]): best[key] = (d,r['stop_id'])
selected = {v[1] for v in best.values()}
departures=[]
for r in times:
    if r['stop_id'] not in selected: continue
    t=trips[r['trip_id']]
    if not r['departure_time']: continue
    h,m,s=map(int,r['departure_time'].split(':'))
    departures.append([r['stop_id'],t['route_id'],t.get('direction_id',''),t['service_id'],h*3600+m*60+s,r['trip_id']])
output={'source':URL,'fetchedAt':datetime.now(timezone.utc).isoformat(),'stops':[{'id':sid,'name':stops[sid]['stop_name'],'lat':float(stops[sid]['stop_lat']),'lng':float(stops[sid]['stop_lon'])} for sid in sorted(selected)],'calendar':list(rows('calendar.txt')),'exceptions':list(rows('calendar_dates.txt')),'departures':departures}
path=Path(__file__).resolve().parents[1]/'lib/pressure/schedule-data.json'
path.write_text(json.dumps(output,separators=(',',':')),encoding='utf-8')
print(json.dumps({'stops':len(selected),'departures':len(departures),'bytes':path.stat().st_size,'calendar':output['calendar'][:2]}))
