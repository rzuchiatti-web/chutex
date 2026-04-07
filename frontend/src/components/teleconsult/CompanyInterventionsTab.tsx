import { Icon } from '../WebIcon';
import FullScreenLoader from '../FullScreenLoader';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { apiFetch } from '../../services/api';
import { getCleanLabel, BG_VIOLET, BG_GREEN } from './teleconsultStyles';

export function CompanyInterventionsTab({ token }: { token: string }) {
  const router = useRouter();
  const [interventions, setInterventions] = useState<any[]>([]);
  const [intervenants, setIntervenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ivTab, setIvTab] = useState<'active' | 'done'>('active');
  const [selectedIv, setSelectedIv] = useState<any>(null);
  const [ivDetail, setIvDetail] = useState<any>(null);
  const [showIntervenantPopup, setShowIntervenantPopup] = useState(false);
  const [showAllIntervenants, setShowAllIntervenants] = useState(false);
  const [search, setSearch] = useState('');
  const [searchIv, setSearchIv] = useState('');

  const selectIv = useCallback(async (iv: any) => {
    setSelectedIv(iv);
    setIvDetail(null);
    try { const d = await apiFetch(`/api/interventions/${iv.id}/detail`, {}, token); setIvDetail(d); } catch {}
  }, [token]);

  const fetchData = useCallback(async () => {
    try {
      const [ivs, ivants] = await Promise.all([
        apiFetch('/api/company/interventions', {}, token),
        apiFetch('/api/company/intervenants', {}, token),
      ]);
      setInterventions(Array.isArray(ivs) ? ivs : []);
      setIntervenants(Array.isArray(ivants) ? ivants : []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);
  useEffect(() => { fetchData(); const t = setInterval(fetchData, 10000); return () => clearInterval(t); }, [fetchData]);

  if (loading) return <FullScreenLoader />;

  const activeIvs = interventions.filter((iv: any) => ['pending_acceptance', 'in_progress', 'en_route', 'dispatched'].includes(iv.status));
  const doneIvs = interventions.filter((iv: any) => iv.status === 'completed');
  const displayedIvs = ivTab === 'active' ? activeIvs : doneIvs;
  const BG_VIOLET_IV = BG_VIOLET;
  const BG_GREEN_IV = BG_GREEN;
  const BG_HEADER = BG_VIOLET;

  /* ─── ALL INTERVENANTS: full-screen list (early return) ─── */
  if (showAllIntervenants && Platform.OS === 'web') {
    const filtered = search.trim() ? intervenants.filter((iv: any) => iv.name?.toLowerCase().includes(search.toLowerCase())) : intervenants;
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <div style={{ position: 'absolute', inset: 0 } as any}><img src={BG_HEADER} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } as any} /><div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' } as any} /></div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '70px 16px 0', zIndex: 5 } as any}>
          <div onClick={() => { setShowAllIntervenants(false); setSearch(''); }} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>Tous les intervenants ({intervenants.length})</div>
        </div>
        <div style={{ position: 'relative', zIndex: 5, padding: '12px 20px 0' } as any}><div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' } as any}><i className="ri-search-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} /><input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Rechercher un intervenant..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#FFF', fontSize: 14, fontFamily: 'inherit' } as any} /></div></div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '12px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
          {filtered.map((iv: any) => (
            <div key={iv.id} onClick={() => router.push({ pathname: '/company-intervenant-detail', params: { intervenantId: iv.id } })} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8, cursor: 'pointer' } as any}>
              <div style={{ width: 44, height: 44, borderRadius: 999, background: 'linear-gradient(135deg, #7C5CFF, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{iv.name?.charAt(0)}</span></div>
              <div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{iv.name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{iv.profession || 'Intervenant Care'} · {iv.agency_name || ''}</div></div>
              <div style={{ textAlign: 'right' } as any}><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{iv.total_interventions || 0} missions</div>{iv.active_interventions > 0 && <div style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B' }}>{iv.active_interventions} actives</div>}</div>
              <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)' }} />
            </div>
          ))}
          {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px' } as any}><i className="ri-group-line" style={{ fontSize: 36, color: 'rgba(255,255,255,0.15)' }} /><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', marginTop: 10 }}>{search ? 'Aucun résultat' : 'Aucun intervenant'}</div></div>}
        </div>
      </div>
    );
  }

  /* ─── DETAIL PAGE ─── */
  if (selectedIv && Platform.OS === 'web') {
    const isDone = ['completed', 'resolved'].includes(selectedIv.status);
    const b = selectedIv.beneficiary_info || {};
    const isCare = !!selectedIv.structure_name;
    const benRows = [
      b.date_of_birth && { icon: 'ri-calendar-line', label: 'Date de naissance', value: b.date_of_birth },
      b.gender && { icon: 'ri-user-line', label: 'Genre', value: b.gender },
      b.blood_type && { icon: 'ri-drop-line', label: 'Groupe sanguin', value: b.blood_type, color: '#EF4444' },
      (b.height_cm || b.weight_kg) && { icon: 'ri-ruler-line', label: 'Morphologie', value: [b.height_cm && `${b.height_cm} cm`, b.weight_kg && `${b.weight_kg} kg`].filter(Boolean).join(' - ') },
      b.medical_conditions && { icon: 'ri-heart-pulse-line', label: 'Pathologies', value: b.medical_conditions, color: '#F59E0B', highlight: true },
      b.allergies && { icon: 'ri-alarm-warning-line', label: 'Allergies', value: b.allergies, color: '#EF4444', highlight: true },
      b.doctor_name && { icon: 'ri-stethoscope-line', label: 'Médecin traitant', value: b.doctor_name + (b.doctor_phone ? ` — ${b.doctor_phone}` : ''), phone: b.doctor_phone },
      b.emergency_contact_name && { icon: 'ri-shield-user-line', label: 'Contact d\'urgence', value: b.emergency_contact_name + (b.emergency_contact_phone ? ` — ${b.emergency_contact_phone}` : ''), phone: b.emergency_contact_phone },
      b.address && { icon: 'ri-map-pin-line', label: 'Adresse', value: b.address },
    ].filter(Boolean);
    const ivDur = selectedIv.accepted_at && (selectedIv.completed_at || (isDone ? selectedIv.resolved_at : null)) ? Math.round((new Date(selectedIv.completed_at || selectedIv.resolved_at).getTime() - new Date(selectedIv.accepted_at).getTime()) / 60000) : null;
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={isDone ? BG_GREEN_IV : BG_VIOLET_IV} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '70px 16px 0', zIndex: 5 } as any}>
          <div onClick={() => setSelectedIv(null)} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' } as any}><span style={{ width: 8, height: 8, borderRadius: '50%', background: isDone ? '#10B981' : '#F59E0B' } as any} /><span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>{isDone ? 'Terminee' : 'En cours'}</span></div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>
          <div style={{ textAlign: 'center', marginBottom: 16 } as any}><div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>{getCleanLabel(selectedIv.alert_type, selectedIv.alert_message)}</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{new Date(selectedIv.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div></div>
          {/* BENEFICIAIRE */}
          <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 } as any}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Fiche bénéficiaire</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}><div style={{ width: 44, height: 44, borderRadius: 999, background: 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{(b.name || selectedIv.beneficiary_name || '?').charAt(0)}</span></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 16, fontWeight: 700, color: '#FFF' }}>{b.name || selectedIv.beneficiary_name}</div>{b.phone && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{b.phone}</div>}{b.email && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{b.email}</div>}</div></div>
            {benRows.map((item: any, i: number) => (<div key={i}><div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' } as any} />{item.highlight ? (<div style={{ padding: '10px 12px', borderRadius: 12, background: `${item.color}12`, border: `1px solid ${item.color}25` } as any}><div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}><i className={item.icon} style={{ fontSize: 14, color: item.color }} /><div style={{ fontSize: 9, fontWeight: 600, color: item.color, textTransform: 'uppercase' }}>{item.label}</div></div><div style={{ fontSize: 13, color: '#FFF', marginTop: 4, lineHeight: 1.4 }}>{item.value}</div></div>) : (<div onClick={() => item.phone && (window.location.href = `tel:${item.phone}`)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: item.phone ? 'pointer' : 'default' } as any}><i className={item.icon} style={{ fontSize: 14, color: item.color || 'rgba(255,255,255,0.35)', marginTop: 2, flexShrink: 0 }} /><div style={{ flex: 1 } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</div><div style={{ fontSize: 13, color: '#FFF' }}>{item.value}</div></div>{item.phone && <i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981', marginTop: 2 }} />}</div>)}</div>))}
            {b.phone && (<><div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' } as any} /><div onClick={() => window.location.href = `tel:${b.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer' } as any}><i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981' }} /><span style={{ fontSize: 13, fontWeight: 600, color: '#10B981' }}>Appeler {(b.name || selectedIv.beneficiary_name)?.split(' ')[0]}</span></div></>)}
          </div>
          {/* INTERVENANT */}
          {selectedIv.assigned_name && (() => {
            const p = ivDetail?.intervenant || {};
            const ivPhone = p.phone || '';
            const ivProfession = p.profession || '';
            const ivStructure = p.structure_name || selectedIv.intervenant_structure || selectedIv.structure_name || '';
            return (<div onClick={() => setShowIntervenantPopup(true)} style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10, cursor: 'pointer' } as any}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } as any}><div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase' }}>Fiche intervenant</div><div style={{ display: 'flex', gap: 6 } as any}>{isCare && <div style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(124,92,255,0.2)', border: '1px solid rgba(124,92,255,0.3)' } as any}><span style={{ fontSize: 10, fontWeight: 700, color: '#A78BFA' }}>Care</span></div>}<i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} /></div></div><div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}><div style={{ width: 44, height: 44, borderRadius: 999, background: isCare ? 'linear-gradient(135deg, #7C5CFF, #A78BFA)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{selectedIv.assigned_name.charAt(0)}</span></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 16, fontWeight: 700, color: '#FFF' }}>{selectedIv.assigned_name}</div>{ivProfession && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{ivProfession}</div>}{ivStructure && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{ivStructure}</div>}<div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{isDone ? 'Terminee' : 'En cours'}{selectedIv.distance_km ? ` · ${selectedIv.distance_km} km` : ''}{ivDur ? ` · ${ivDur >= 60 ? `${Math.floor(ivDur/60)}h${ivDur%60>0?String(ivDur%60).padStart(2,'0'):''}` : `${ivDur} min`}` : ''}</div></div></div></div>);
          })()}
          {/* SLIDE BUTTON */}
          {!isDone && selectedIv.id && (
            <div style={{ width: '100%', height: 52, borderRadius: 999, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', marginBottom: 10, touchAction: 'none' } as any}
              onMouseDown={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 48; const startX = e.clientX; const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); router.push({ pathname: '/intervention-map', params: { interventionId: selectedIv.id } }); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); }}
              onTouchStart={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 48; const startX = e.touches[0].clientX; const onMove = (ev: any) => { ev.preventDefault(); const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); router.push({ pathname: '/intervention-map', params: { interventionId: selectedIv.id } }); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); }; bar.addEventListener('touchmove', onMove, { passive: false }); bar.addEventListener('touchend', onUp); }}>
              <div data-thumb style={{ position: 'absolute', top: 3, left: 3, width: 46, height: 46, borderRadius: 999, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', willChange: 'transform', touchAction: 'none' } as any}><i className="ri-heart-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: 700, pointerEvents: 'none', paddingLeft: 32 } as any}>Suivre l'intervention</div>
            </div>
          )}
          {/* RAPPORT */}
          {selectedIv.report && (<div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 } as any}><div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Rapport d'intervention</div>{[selectedIv.report.description && { label: 'Description', value: selectedIv.report.description }, selectedIv.report.actions_taken && { label: 'Actions realisees', value: selectedIv.report.actions_taken }, selectedIv.report.patient_condition && { label: 'Etat du patient', value: selectedIv.report.patient_condition === 'stable' ? 'Stable' : selectedIv.report.patient_condition }, selectedIv.report.follow_up_notes && { label: 'Suivi necessaire', value: selectedIv.report.follow_up_notes, warn: true }].filter(Boolean).map((e: any, i: number, arr: any[]) => (<div key={i}>{e.warn ? (<div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', margin: '6px 0' } as any}><div style={{ fontSize: 9, fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', marginBottom: 2 }}>{e.label}</div><div style={{ fontSize: 12, color: '#FFF', lineHeight: 1.4 }}>{e.value}</div></div>) : (<div style={{ padding: '10px 0' } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{e.label}</div><div style={{ fontSize: 13, color: '#FFF', lineHeight: 1.5 }}>{e.value}</div></div>)}{i < arr.length - 1 && !e.warn && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' } as any} />}</div>))}{selectedIv.report.completed_by && <><div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' } as any} /><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Redige par {selectedIv.report.completed_by}</div></>}</div>)}
          {/* TIMELINE */}
          {selectedIv.timeline && selectedIv.timeline.length > 0 && (<div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 } as any}><div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Chronologie</div>{selectedIv.timeline.map((t: any, ti: number) => (<div key={ti}>{ti > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' } as any} />}<div style={{ display: 'flex', gap: 10 } as any}><div style={{ width: 8, height: 8, borderRadius: 4, background: ti === selectedIv.timeline.length - 1 ? '#10B981' : 'rgba(255,255,255,0.25)', marginTop: 5, flexShrink: 0 } as any} /><div><div style={{ fontSize: 12, color: '#FFF', fontWeight: 600 }}>{t.note}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{new Date(t.time).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div></div></div></div>))}</div>)}
        </div>
        {/* POPUP INTERVENANT */}
        {showIntervenantPopup && selectedIv.assigned_name && (() => {
          const p = ivDetail?.intervenant || {};
          const pPhone = p.phone || '';
          const pEmail = p.email || '';
          const pProfession = p.profession || '';
          const pStructure = p.structure_name || selectedIv.intervenant_structure || selectedIv.structure_name || '';
          const pAddress = p.address || '';
          return <div onClick={() => setShowIntervenantPopup(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}><div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '70px 28px 120px', boxSizing: 'border-box' } as any}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 } as any}><span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>Fiche intervenant</span><div onClick={() => setShowIntervenantPopup(false)} style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 16, color: '#FFF' }} /></div></div><div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 } as any}><div style={{ width: 56, height: 56, borderRadius: 999, background: isCare ? 'linear-gradient(135deg, #7C5CFF, #A78BFA)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 24, fontWeight: 800, color: '#FFF' }}>{selectedIv.assigned_name.charAt(0)}</span></div><div><div style={{ fontSize: 20, fontWeight: 800, color: '#FFF' }}>{selectedIv.assigned_name}</div>{pProfession && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{pProfession}</div>}</div></div>{[pPhone && { icon: 'ri-phone-line', label: 'Telephone', value: pPhone, phone: true }, pEmail && { icon: 'ri-mail-line', label: 'Email', value: pEmail }, pProfession && { icon: 'ri-stethoscope-line', label: 'Profession', value: pProfession }, pStructure && { icon: 'ri-building-line', label: 'Structure', value: pStructure }, pAddress && { icon: 'ri-map-pin-line', label: 'Adresse', value: pAddress }, selectedIv.distance_km && { icon: 'ri-route-line', label: 'Distance', value: `${selectedIv.distance_km} km` }, selectedIv.accepted_at && { icon: 'ri-time-line', label: 'Accepte a', value: new Date(selectedIv.accepted_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) }, selectedIv.completed_at && { icon: 'ri-check-double-line', label: 'Termine a', value: new Date(selectedIv.completed_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) }, { icon: 'ri-pulse-line', label: 'Statut', value: isDone ? 'Terminee' : selectedIv.status === 'in_progress' ? 'En cours' : selectedIv.status }].filter(Boolean).map((item: any, i: number) => (<div key={i}>{i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' } as any} />}<div onClick={() => item.phone && (window.location.href = `tel:${item.value}`)} style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: item.phone ? 'pointer' : 'default', padding: '4px 0' } as any}><div style={{ width: 34, height: 34, borderRadius: 10, background: item.phone ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.08)', border: `1px solid ${item.phone ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className={item.icon} style={{ fontSize: 15, color: item.phone ? '#10B981' : 'rgba(255,255,255,0.5)' }} /></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{item.label}</div><div style={{ fontSize: 14, color: '#FFF', fontWeight: item.phone ? 700 : 500 }}>{item.value}</div></div></div></div>))}</div></div>;
        })()}
      </div>
    );
  }

  /* ─── LIST: main view (web) ─── */
  if (Platform.OS === 'web') {
    const filteredIvs = searchIv.trim() ? displayedIvs.filter((iv: any) => iv.beneficiary_name?.toLowerCase().includes(searchIv.toLowerCase()) || iv.assigned_name?.toLowerCase().includes(searchIv.toLowerCase())) : displayedIvs;
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <div style={{ position: 'absolute', inset: 0 } as any}><img src={BG_HEADER} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} /><div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} /></div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '24px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>
          <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(124,92,255,0.15)', border: '1px solid rgba(124,92,255,0.25)', marginBottom: 12 } as any}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#A78BFA' } as any} /><span style={{ fontSize: 13, fontWeight: 600, color: '#A78BFA' }}>Actif</span></div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 16 }}>Intervention Care</div>
            <div style={{ display: 'inline-flex', borderRadius: 999, padding: 4, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', marginBottom: 14 } as any}>
              <div onClick={() => setIvTab('active')} style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: ivTab === 'active' ? '#FFF' : 'transparent', color: ivTab === 'active' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700 } as any}>En cours ({activeIvs.length})</div>
              <div onClick={() => setIvTab('done')} style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: ivTab === 'done' ? '#FFF' : 'transparent', color: ivTab === 'done' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700 } as any}>Cloturees ({doneIvs.length})</div>
            </div>
            <div><div onClick={() => setShowAllIntervenants(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' } as any}>
              <div style={{ display: 'flex' } as any}>{intervenants.slice(0, 3).map((iv2: any, i: number) => (<div key={i} style={{ width: 22, height: 22, borderRadius: 999, background: 'linear-gradient(135deg, #7C5CFF, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i > 0 ? -6 : 0, border: '2px solid rgba(0,0,0,0.3)' } as any}><span style={{ fontSize: 9, fontWeight: 800, color: '#FFF' }}>{iv2.name?.charAt(0)}</span></div>))}</div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Voir les {intervenants.length} intervenants</span>
            </div></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', marginBottom: 12, transition: 'all 0.3s ease' } as any}><i className="ri-search-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} /><input value={searchIv} onChange={(e: any) => setSearchIv(e.target.value)} placeholder="Rechercher..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#FFF', fontSize: 14, fontFamily: 'inherit' } as any} /></div>
          {filteredIvs.map((iv: any) => { const isActive = ['pending_acceptance','in_progress','en_route','dispatched'].includes(iv.status); const hasAssigned = !!iv.assigned_to; return (
            <div key={iv.id} style={{ borderRadius: 20, padding: '18px 16px', marginBottom: 12, minHeight: 100, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any}>
              <div onClick={() => selectIv(iv)} style={{ cursor: 'pointer' } as any}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 } as any}>
                  <div><div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{iv.beneficiary_name}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>Le {new Date(iv.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: isActive ? 'rgba(124,92,255,0.25)' : 'rgba(16,185,129,0.15)', flexShrink: 0 } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: isActive ? '#A78BFA' : '#10B981' } as any} /><span style={{ fontSize: 10, fontWeight: 600, color: '#FFF' }}>{isActive ? 'En cours' : 'Terminee'}</span></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isActive ? 12 : 0 } as any}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>{getCleanLabel(iv.alert_type, iv.alert_message)}</div>
                  {iv.distance_km && <div style={{ padding: '4px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' } as any}><span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{iv.distance_km} Km</span></div>}
                </div>
              </div>
              {isActive && hasAssigned && (
                <div style={{ width: '100%', height: 48, borderRadius: 999, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', touchAction: 'none' } as any}
                  onMouseDown={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 44; const startX = e.clientX; const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); router.push({ pathname: '/intervention-map', params: { interventionId: iv.id } }); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); }}
                  onTouchStart={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 44; const startX = e.touches[0].clientX; const onMove = (ev: any) => { ev.preventDefault(); const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); router.push({ pathname: '/intervention-map', params: { interventionId: iv.id } }); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); }; bar.addEventListener('touchmove', onMove, { passive: false }); bar.addEventListener('touchend', onUp); }}>
                  <div data-thumb style={{ position: 'absolute', top: 3, left: 3, width: 42, height: 42, borderRadius: 999, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', willChange: 'transform', touchAction: 'none' } as any}><i className="ri-heart-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700, pointerEvents: 'none', paddingLeft: 30 } as any}>Suivre l'intervention</div>
                </div>
              )}
            </div>
          ); })}
          {filteredIvs.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px' } as any}><i className="ri-map-pin-range-line" style={{ fontSize: 36, color: 'rgba(255,255,255,0.15)' }} /><div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>{searchIv ? 'Aucun résultat' : `Aucune intervention ${ivTab === 'active' ? 'en cours' : 'terminee'}`}</div></div>}
        </div>
      </div>
    );
  }

  /* ─── NATIVE FALLBACK ─── */
  const stColor = (st: string) => ({ pending_acceptance: '#FF9800', in_progress: '#2196F3', en_route: '#009688', completed: '#4CAF50', dispatched: '#FF5722' }[st] || '#888');
  const stLabel = (st: string) => ({ pending_acceptance: 'En attente', in_progress: 'En cours', en_route: 'En route', completed: 'Terminee', dispatched: 'Dispatchee' }[st] || st);
  const pendingIvs = interventions.filter((iv: any) => ['pending_acceptance', 'dispatched'].includes(iv.status));
  const completedIvs = interventions.filter((iv: any) => iv.status === 'completed');
  const filteredIntervenants = search.trim() ? intervenants.filter((iv: any) => iv.name?.toLowerCase().includes(search.toLowerCase())) : intervenants;
  const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};
  const [tab, setTab] = useState<'interventions'|'intervenants'>('interventions');

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827', letterSpacing: -0.5 }}>Interventions</Text>
        <Text style={{ fontSize: 12, color: '#6B7280' }}>{interventions.length} interventions · {intervenants.length} intervenants</Text>
      </View>
      <View style={{ flexDirection: 'row', marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 4, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', ...glass }}>
        <TouchableOpacity style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, tab === 'interventions' && { backgroundColor: Colors.primary }]} onPress={() => setTab('interventions')}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: tab === 'interventions' ? '#FFF' : '#888' }}>Missions ({interventions.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, tab === 'intervenants' && { backgroundColor: Colors.primary }]} onPress={() => setTab('intervenants')}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: tab === 'intervenants' ? '#FFF' : '#888' }}>Intervenants ({intervenants.length})</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#111827" />}>
        {tab === 'interventions' && displayedIvs.map((iv: any) => (
          <TouchableOpacity key={iv.id} activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/company-intervention-detail', params: { interventionId: iv.id } })}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: stColor(iv.status) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <View style={{ width: 44, height: 44, borderRadius: 24, backgroundColor: stColor(iv.status) + '15', justifyContent: 'center', alignItems: 'center' }}>
                  <Icon name={iv.status === 'completed' ? 'checkmark-circle' : iv.status === 'pending_acceptance' ? 'time' : 'navigate'} size={22} color={stColor(iv.status)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>{iv.beneficiary_name}</Text>
                  <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{iv.alert_message || 'Intervention'}</Text>
                </View>
                <Icon name="chevron-forward" size={16} color="#888" />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.04)' }}>
                <Icon name="person" size={12} color="#9C27B0" />
                <Text style={{ fontSize: 11, color: '#9C27B0', fontWeight: '600', flex: 1 }}>{iv.intervenant_name || iv.assigned_name || 'En attente d\'acceptation'}</Text>
                <View style={{ backgroundColor: stColor(iv.status) + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: stColor(iv.status) }}>{stLabel(iv.status).toUpperCase()}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {tab === 'interventions' && displayedIvs.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Icon name="navigate-outline" size={40} color="#CCC" />
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#6B7280', marginTop: 12 }}>Aucune intervention</Text>
          </View>
        )}
        {tab === 'intervenants' && filteredIntervenants.map((iv: any) => (
          <TouchableOpacity key={iv.id} activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/company-intervenant-detail', params: { intervenantId: iv.id } })}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 24, backgroundColor: '#9C27B0', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF' }}>{iv.name?.charAt(0)?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>{iv.name}</Text>
                <Text style={{ fontSize: 11, color: '#6B7280' }}>{iv.profession || 'Intervenant Care'} · {iv.agency_name}</Text>
              </View>
              <Text style={{ fontSize: 11, color: '#6B7280' }}>{iv.total_interventions} missions</Text>
              <Icon name="chevron-forward" size={16} color="#888" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
