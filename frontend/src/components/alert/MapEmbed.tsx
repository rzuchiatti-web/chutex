import React from 'react';
import { Platform } from 'react-native';

export default function MapEmbed({ lat, lng, ivLat, ivLng, benName, ivName }: any) {
  if (Platform.OS !== 'web' || !lat) return null;
  const markers = ivLat && ivLng
    ? `L.marker([${lat},${lng}],{icon:L.divIcon({className:'',html:'<div style="background:#EF4444;color:#FFF;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;border:2px solid #FFF;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${(benName||'B').charAt(0)}</div>'})}).addTo(map);L.marker([${ivLat},${ivLng}],{icon:L.divIcon({className:'',html:'<div style="background:#7C3AED;color:#FFF;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;border:2px solid #FFF;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${(ivName||'I').charAt(0)}</div>'})}).addTo(map);L.polyline([[${ivLat},${ivLng}],[${lat},${lng}]],{color:'#7C3AED',weight:3,dashArray:'8,8'}).addTo(map);map.fitBounds([[${lat},${lng}],[${ivLat},${ivLng}]],{padding:[30,30]});`
    : `L.marker([${lat},${lng}],{icon:L.divIcon({className:'',html:'<div style="background:#EF4444;color:#FFF;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;border:2px solid #FFF;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${(benName||'B').charAt(0)}</div>'})}).addTo(map);map.setView([${lat},${lng}],14);`;
  const html = `<!DOCTYPE html><html><head><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script><style>body{margin:0}#map{width:100%;height:100%}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false});L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:''}).addTo(map);${markers}<\/script></body></html>`;
  return <div style={{ height: 180, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' } as any}><iframe srcDoc={html} style={{ width: '100%', height: '100%', border: 'none' } as any} /></div>;
}
