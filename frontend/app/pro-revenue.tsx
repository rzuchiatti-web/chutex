import React, { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const API = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';
const GREEN_BG_IMG = 'https://customer-assets.emergentagent.com/job_6e5f29d8-07a7-4d8a-88cc-8e0eebe2b466/artifacts/jgg2zwgt_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2008_31_33.png';
const INP: any = { width: '100%', padding: '12px 14px', borderRadius: 12, background: '#F4F4F5', border: '1px solid #E5E7EB', color: '#111', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };

export default function ProRevenuePage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [dash, setDash] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [ibanConfig, setIbanConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'history' | 'bank'>('overview');
  const [ibanForm, setIbanForm] = useState({ account_holder: '', iban: '', bic: '' });
  const [ibanSaving, setIbanSaving] = useState(false);
  const [ibanMsg, setIbanMsg] = useState('');

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [d, h, cfg] = await Promise.all([
        apiFetch('/api/pro/payment-dashboard', {}, token).catch(() => null),
        apiFetch('/api/pro/payment-history', {}, token).catch(() => []),
        apiFetch('/api/pro/payment-config', {}, token).catch(() => null),
      ]);
      setDash(d);
      setHistory(Array.isArray(h) ? h : []);
      setIbanConfig(cfg);
      if (cfg) setIbanForm({ account_holder: cfg.account_holder || '', iban: cfg.iban || '', bic: cfg.bic || '' });
    } catch {} finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveIban = async () => {
    if (!ibanForm.iban.trim()) return setIbanMsg('IBAN requis');
    setIbanSaving(true); setIbanMsg('');
    try {
      await apiFetch('/api/pro/payment-config', { method: 'PUT', body: JSON.stringify(ibanForm) }, token);
      setIbanMsg('Compte bancaire mis a jour');
      fetchData();
    } catch (e: any) { setIbanMsg(e.message || 'Erreur'); }
    finally { setIbanSaving(false); }
  };

  const exportCSV = async () => {
    try {
      const res = await fetch(`${API}/api/pro/payment-history/export`, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `revenus_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
      window.URL.revokeObjectURL(url);
    } catch {}
  };

  if (Platform.OS !== 'web') return null;

  // Group history by month
  const byMonth: Record<string, { total: number; items: any[] }> = {};
  history.forEach(p => {
    const d = p.date ? new Date(p.date) : new Date();
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    if (!byMonth[key]) byMonth[key] = { total: 0, items: [] };
    byMonth[key].total += p.amount_ht || 0;
    byMonth[key].items.push({ ...p, _label: label });
  });
  const months = Object.entries(byMonth).sort(([a], [b]) => b.localeCompare(a));

  return (
    <div data-testid="pro-revenue-page" style={{ position: 'absolute', inset: 0, background: '#F5F5F5', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', display: 'flex', flexDirection: 'column' } as any}>
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>

        {/* HEADER */}
        <div style={{ position: 'relative', zIndex: 1, minHeight: 180 } as any}>
          <img src={GREEN_BG_IMG} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
          <div style={{ position: 'relative', zIndex: 2, padding: '28px 20px 32px' } as any}>
            <div data-testid="back-btn" onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)', marginBottom: 16 } as any}>
              <i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' } as any}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, border: '2px solid rgba(16,185,129,0.4)' } as any}>
                <i className="ri-wallet-3-line" style={{ fontSize: 26, color: '#FFF' }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Mes revenus</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{user?.name || 'Coach'}</div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ padding: '20px 16px 120px', marginTop: -16, borderRadius: '24px 24px 0 0', background: '#FFF', position: 'relative', zIndex: 10, minHeight: 'calc(100vh - 220px)' } as any}>

          {loading && <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}><i className="ri-loader-4-line" style={{ fontSize: 28, animation: 'spin 0.8s linear infinite', display: 'block', marginBottom: 8 }} />Chargement...</div>}

          {!loading && (
            <>
              {/* KPI Cards */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 18 } as any}>
                {[
                  { label: 'Ce mois', value: `${dash?.projected_monthly_ht || 0} €`, sub: 'HT', icon: 'ri-calendar-line', color: '#3B82F6' },
                  { label: 'Total gagne', value: `${dash?.total_revenue_ht || 0} €`, sub: 'HT', icon: 'ri-money-euro-circle-line', color: '#10B981' },
                  { label: 'Abonnes', value: `${dash?.active_subscriptions || 0}`, sub: 'actifs', icon: 'ri-group-line', color: '#A78BFA' },
                ].map((kpi, i) => (
                  <div key={i} style={{ flex: 1, padding: '14px 10px', borderRadius: 14, background: '#F4F4F5', textAlign: 'center' } as any}>
                    <i className={kpi.icon} style={{ fontSize: 16, color: kpi.color, display: 'block', marginBottom: 6 }} />
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#111' }}>{kpi.value}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginTop: 2 }}>{kpi.label}</div>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 18, padding: 3, borderRadius: 12, background: '#F4F4F5' } as any}>
                {([
                  { key: 'overview', label: 'Apercu', icon: 'ri-pie-chart-line' },
                  { key: 'history', label: 'Historique', icon: 'ri-history-line' },
                  { key: 'bank', label: 'Compte', icon: 'ri-bank-line' },
                ] as const).map(t => (
                  <div key={t.key} data-testid={`tab-${t.key}`} onClick={() => setTab(t.key)}
                    style={{ flex: 1, padding: '10px 8px', borderRadius: 10, textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                      background: tab === t.key ? '#FFF' : 'transparent',
                      color: tab === t.key ? '#111' : '#9CA3AF',
                      boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.2s',
                    } as any}>
                    <i className={t.icon} style={{ fontSize: 14, display: 'block', marginBottom: 2 }} />{t.label}
                  </div>
                ))}
              </div>

              {/* OVERVIEW TAB */}
              {tab === 'overview' && (
                <>
                  {/* Revenue Chart */}
                  {months.length > 0 && (() => {
                    const chartMonths = [...months].reverse().slice(-6);
                    const maxVal = Math.max(...chartMonths.map(([, d]) => d.total), 1);
                    return (
                      <div data-testid="revenue-chart" style={{ borderRadius: 16, background: '#F4F4F5', padding: '18px 16px', marginBottom: 18 } as any}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 } as any}>
                          <i className="ri-bar-chart-grouped-line" style={{ fontSize: 14, color: '#10B981' }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Evolution des revenus</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '0 4px' } as any}>
                          {chartMonths.map(([key, data], i) => {
                            const ratio = data.total / maxVal;
                            const barPx = Math.max(14, Math.round(ratio * 90));
                            const label = data.items[0]?._label?.split(' ')[0]?.slice(0, 3) || key.split('-')[1];
                            const isLast = i === chartMonths.length - 1;
                            return (
                              <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' } as any}>
                                <span style={{ fontSize: 10, fontWeight: 800, color: isLast ? '#10B981' : '#6B7280', marginBottom: 4 }}>{data.total > 0 ? `${data.total.toFixed(0)}€` : ''}</span>
                                <div style={{ width: '65%', maxWidth: 40, borderRadius: 8, background: isLast ? 'linear-gradient(180deg, #10B981, #059669)' : '#D1D5DB', height: barPx } as any} />
                                <span style={{ fontSize: 9, fontWeight: 600, color: '#9CA3AF', textTransform: 'capitalize', marginTop: 4 }}>{label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  <div style={{ fontSize: 14, fontWeight: 800, color: '#111', marginBottom: 12 }}>Revenus par mois</div>
                  {months.length === 0 && <div style={{ textAlign: 'center', padding: '30px', color: '#9CA3AF', fontSize: 13 }}>Aucun revenu pour le moment</div>}
                  {months.map(([key, data]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: '#F4F4F5', marginBottom: 8 } as any}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: '#10B98112', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                        <i className="ri-calendar-check-line" style={{ fontSize: 18, color: '#10B981' }} />
                      </div>
                      <div style={{ flex: 1 } as any}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>{data.items[0]?._label || key}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{data.items.length} paiement{data.items.length > 1 ? 's' : ''}</div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#10B981' }}>+{data.total.toFixed(0)} €</div>
                    </div>
                  ))}

                  <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 14, background: '#F4F4F5', display: 'flex', alignItems: 'center', gap: 10 } as any}>
                    <i className="ri-information-line" style={{ fontSize: 16, color: '#3B82F6', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.5 }}>Tarif: 45 € HT / beneficiaire / mois. Les virements sont effectues mensuellement sur votre compte bancaire.</span>
                  </div>
                </>
              )}

              {/* HISTORY TAB */}
              {tab === 'history' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } as any}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>Tous les virements</div>
                    <div data-testid="export-csv-btn" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, background: '#F4F4F5', fontSize: 11, fontWeight: 700, color: '#6B7280', cursor: 'pointer' } as any}>
                      <i className="ri-download-2-line" style={{ fontSize: 13 }} /> Exporter CSV
                    </div>
                  </div>
                  {history.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' } as any}><i className="ri-wallet-3-line" style={{ fontSize: 32, display: 'block', marginBottom: 8, opacity: 0.3 }} /><div style={{ fontSize: 13 }}>Aucun virement recu</div></div>}
                  {history.map((p, i) => {
                    const dateStr = p.date ? new Date(p.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
                    return (
                      <div key={p.id || i} data-testid={`payment-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: '#F4F4F5', marginBottom: 6 } as any}>
                        <div style={{ width: 38, height: 38, borderRadius: 12, background: p.status === 'paid' ? '#10B98112' : '#F59E0B12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                          <i className={p.status === 'paid' ? 'ri-check-double-line' : 'ri-time-line'} style={{ fontSize: 16, color: p.status === 'paid' ? '#10B981' : '#F59E0B' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 } as any}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{p.beneficiary_name || 'Paiement'}</div>
                          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{dateStr}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 } as any}>
                          <div style={{ fontSize: 15, fontWeight: 900, color: '#10B981' }}>+{p.amount_ht || 0} €</div>
                          <div style={{ fontSize: 9, color: '#9CA3AF' }}>HT</div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* BANK TAB */}
              {tab === 'bank' && (
                <>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#111', marginBottom: 14 }}>Compte bancaire</div>

                  {/* Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 14, background: ibanConfig?.iban ? '#10B98108' : '#F59E0B08', border: `1px solid ${ibanConfig?.iban ? '#10B98120' : '#F59E0B20'}`, marginBottom: 18 } as any}>
                    <i className={ibanConfig?.iban ? 'ri-checkbox-circle-fill' : 'ri-error-warning-fill'} style={{ fontSize: 18, color: ibanConfig?.iban ? '#10B981' : '#F59E0B' }} />
                    <div style={{ flex: 1 } as any}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{ibanConfig?.iban ? 'Compte configure' : 'Compte non configure'}</div>
                      <div style={{ fontSize: 11, color: '#6B7280' }}>{ibanConfig?.iban ? `IBAN: ${ibanConfig.iban.slice(0, 4)}...${ibanConfig.iban.slice(-4)}` : 'Ajoutez votre IBAN pour recevoir vos virements'}</div>
                    </div>
                  </div>

                  {/* Form */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 } as any}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Titulaire du compte</label>
                      <input data-testid="iban-holder" value={ibanForm.account_holder} onChange={(e: any) => setIbanForm({ ...ibanForm, account_holder: e.target.value })} placeholder="Nom Prenom" style={INP} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>IBAN</label>
                      <input data-testid="iban-number" value={ibanForm.iban} onChange={(e: any) => setIbanForm({ ...ibanForm, iban: e.target.value.toUpperCase() })} placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX" style={INP} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>BIC / SWIFT</label>
                      <input data-testid="iban-bic" value={ibanForm.bic} onChange={(e: any) => setIbanForm({ ...ibanForm, bic: e.target.value.toUpperCase() })} placeholder="BNPAFRPP" style={INP} />
                    </div>
                  </div>

                  {ibanMsg && <div style={{ padding: '10px 14px', borderRadius: 12, background: ibanMsg.includes('jour') ? '#10B98108' : '#EF444408', marginTop: 12, fontSize: 12, fontWeight: 600, color: ibanMsg.includes('jour') ? '#10B981' : '#EF4444', textAlign: 'center' } as any}>{ibanMsg}</div>}

                  <div data-testid="save-iban-btn" onClick={saveIban} style={{ marginTop: 18, padding: '16px', borderRadius: 16, background: '#111', textAlign: 'center', cursor: ibanSaving ? 'wait' : 'pointer', opacity: ibanSaving ? 0.6 : 1 } as any}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>{ibanSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />
    </div>
  );
}
