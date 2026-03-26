export const API = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export const BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';

export const DAYS_FR = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
export const DAYS_SHORT = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
export const MONTHS_FR = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'];

export const toLocalDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

export const MEAL_IMGS: Record<string, string> = {
  petit_dejeuner: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/ccd32d626e54c78fac3e5a12346ad156c67fb52d47febfdedc24d0f29e171ac6.png',
  dejeuner: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/528ae850a1d0143524ec5cc75d58c126e9cec798303da7ceb8ac4a1ca68374d8.png',
  collation: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/95af5f12498ba3ce4c96135afbe07e314012e9ff8da9410d9e9ac56376d9cb02.png',
  gouter: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/95af5f12498ba3ce4c96135afbe07e314012e9ff8da9410d9e9ac56376d9cb02.png',
  diner: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/3b64345e4d34dc8d5bacd6f55747323e3202d76c19e319a024b7214ca02e9877.png',
};

export const INP: any = { width: '100%', padding: '14px 16px', borderRadius: 14, background: '#F4F4F5', border: '1px solid #E5E7EB', color: '#111', fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
export const LBL: any = { fontSize: 10, fontWeight: 700, color: '#6B7280', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: 0.8 };
export const SEL: any = { ...INP, appearance: 'none', WebkitAppearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23374151' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' };

export const apiFetch = async (url: string, opts: any = {}, token: string) => {
  const r = await fetch(`${API}${url}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers } });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || r.statusText);
  return r.json();
};

export const uploadImage = async (file: File, token: string) => {
  const fd = new FormData(); fd.append('file', file);
  const r = await fetch(`${API}/api/pro/upload-image`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
  if (!r.ok) throw new Error('Upload echoue');
  return (await r.json()).url;
};

export const GBTN = (active: boolean, saving: boolean): any => ({
  padding: '16px', borderRadius: 999, textAlign: 'center', cursor: active && !saving ? 'pointer' : 'default',
  background: active ? '#111' : '#E5E7EB',
  border: 'none',
  color: active ? '#FFF' : '#9CA3AF', fontSize: 15, fontWeight: 800, opacity: saving ? 0.5 : 1,
  transition: 'all 0.2s',
});
