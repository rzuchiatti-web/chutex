import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { Card } from '../admin/AdminUI';

interface Doc {
  filename: string;
  title: string;
  size_kb: number;
}

export default function DocumentsTab({ token, mob }: { token: string; mob: boolean }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    apiFetch('/api/admin/documents', {}, token)
      .then((r: any) => setDocs(r.documents || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const exportPDF = async (filename: string) => {
    setExporting(filename);
    try {
      const res = await apiFetch(`/api/admin/documents/${filename}`, {}, token);
      const content = res.content || '';
      const title = res.filename?.replace('.md', '') || 'Document';

      // Convert markdown to simple HTML
      const html = content
        .replace(/^### (.*$)/gm, '<h3 style="font-size:14px;font-weight:700;margin:18px 0 8px;color:#1F2937;">$1</h3>')
        .replace(/^## (.*$)/gm, '<h2 style="font-size:17px;font-weight:800;margin:24px 0 10px;color:#111827;border-bottom:1px solid #E5E7EB;padding-bottom:6px;">$1</h2>')
        .replace(/^# (.*$)/gm, '<h1 style="font-size:22px;font-weight:900;margin:0 0 16px;color:#111827;">$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code style="background:#F3F4F6;padding:2px 6px;border-radius:4px;font-size:12px;">$1</code>')
        .replace(/^\| (.+)/gm, (match: string) => {
          const cells = match.split('|').filter((c: string) => c.trim());
          if (cells.every((c: string) => /^[\s-:]+$/.test(c))) return '';
          const tag = cells.some((c: string) => /^\*\*/.test(c.trim())) ? 'th' : 'td';
          return '<tr>' + cells.map((c: string) => `<${tag} style="border:1px solid #E5E7EB;padding:6px 10px;font-size:11px;">${c.trim()}</${tag}>`).join('') + '</tr>';
        })
        .replace(/```[\s\S]*?```/g, (match: string) => {
          const code = match.replace(/```\w*\n?/g, '').replace(/```/g, '');
          return `<pre style="background:#1F2937;color:#E5E7EB;padding:14px;border-radius:8px;font-size:11px;overflow-x:auto;line-height:1.5;margin:10px 0;">${code}</pre>`;
        })
        .replace(/^- (.*$)/gm, '<li style="font-size:12px;color:#374151;margin:3px 0;margin-left:16px;">$1</li>')
        .replace(/\n{2,}/g, '<br/><br/>')
        .replace(/\n/g, '<br/>');

      const wrapped = `
        <!DOCTYPE html><html><head>
        <meta charset="utf-8"><title>${title}</title>
        <style>
          @page { margin: 20mm; size: A4; }
          body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #374151; line-height: 1.7; max-width: 800px; margin: 0 auto; padding: 20px; }
          table { border-collapse: collapse; width: 100%; margin: 10px 0; }
          th { background: #F9FAFB; font-weight: 700; text-align: left; }
          h1 { color: #7C3AED; }
          strong { color: #111827; }
          @media print { body { padding: 0; } }
        </style></head><body>${html}
        <script>window.onload=function(){window.print();}</script>
        </body></html>`;

      const blob = new Blob([wrapped], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e: any) {
      alert('Erreur export: ' + (e.message || 'Erreur inconnue'));
    } finally {
      setExporting('');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Chargement des documents...</div>;

  const patentDocs = docs.filter(d => d.filename.includes('PATENT'));
  const otherDocs = docs.filter(d => !d.filename.includes('PATENT'));

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ri-file-text-line" style={{ fontSize: 18, color: '#FFF' }} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>Documents techniques</div>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{docs.length} documents disponibles</div>
        </div>
      </div>

      {/* Patent Documents */}
      {patentDocs.length > 0 && (
        <Card title="Brevets Glycemie" icon="ri-award-line">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {patentDocs.map(doc => (
              <div key={doc.filename} data-testid={`doc-${doc.filename}`} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderRadius: 12, background: '#FAFAFA', border: '1px solid #F3F4F6',
                transition: 'all 150ms ease',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: doc.filename.includes('V3') ? '#7C3AED12' : '#F3F4F6',
                  border: doc.filename.includes('V3') ? '1px solid #7C3AED30' : '1px solid #E5E7EB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <i className={doc.filename.includes('V3') ? 'ri-award-fill' : 'ri-file-text-line'} style={{
                    fontSize: 18, color: doc.filename.includes('V3') ? '#7C3AED' : '#9CA3AF',
                  }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{doc.filename} - {doc.size_kb} KB</div>
                </div>
                {doc.filename.includes('V3') && (
                  <span style={{ padding: '3px 8px', borderRadius: 999, background: '#7C3AED', fontSize: 9, fontWeight: 800, color: '#FFF', flexShrink: 0 }}>FINAL</span>
                )}
                <div data-testid={`export-pdf-${doc.filename}`} onClick={() => exportPDF(doc.filename)} style={{
                  padding: '8px 14px', borderRadius: 999, cursor: 'pointer', flexShrink: 0,
                  background: exporting === doc.filename ? '#E5E7EB' : '#7C3AED',
                  color: '#FFF', fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 5,
                  opacity: exporting === doc.filename ? 0.6 : 1,
                  transition: 'all 150ms ease',
                }}>
                  <i className={exporting === doc.filename ? 'ri-loader-4-line' : 'ri-file-download-line'} style={{ fontSize: 13 }} />
                  {mob ? '' : 'Export PDF'}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Other Documents */}
      {otherDocs.length > 0 && (
        <Card title="Autres documents" icon="ri-folder-line">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {otherDocs.map(doc => (
              <div key={doc.filename} data-testid={`doc-${doc.filename}`} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                borderRadius: 10, background: '#FAFAFA', border: '1px solid #F3F4F6',
              }}>
                <i className="ri-file-text-line" style={{ fontSize: 16, color: '#9CA3AF', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF' }}>{doc.size_kb} KB</div>
                </div>
                <div onClick={() => exportPDF(doc.filename)} style={{
                  padding: '6px 12px', borderRadius: 999, cursor: 'pointer', flexShrink: 0,
                  border: '1px solid #E5E7EB', background: '#FFF',
                  color: '#6B7280', fontSize: 10, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <i className="ri-download-line" style={{ fontSize: 12 }} />
                  {mob ? '' : 'PDF'}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
