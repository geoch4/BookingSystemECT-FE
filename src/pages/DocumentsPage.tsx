import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDocuments } from '../api/documents';
import BackendErrorState from '../components/common/BackendErrorState';
import Spinner from '../components/common/Spinner';
import type { DocumentDto } from '../types';

// ─── Static document catalogue (from prototype / clinical reality) ─────────────
// These represent the real clinical documents from the prototype.
// When the backend Document model is extended, these can be replaced with API data.

type DocStatus = 'giltig' | 'utgangen' | 'utgarsSnart';
type DocType = 'rutin' | 'checklista' | 'riktlinje' | 'remissvag';

interface ClinicalDocument {
  id: number;
  titel: string;
  typ: DocType;
  verksamhet: string;
  version: string;
  ansvarig: string;
  giltigFran: string;
  giltigTill: string;
  dokumentId: string;
  status: DocStatus;
  beskrivning: string;
  lank: string;
}

const FALLBACK_DOCUMENTS: ClinicalDocument[] = [
  {
    id: 1,
    titel: 'ECT – elektrokonvulsiv behandling',
    typ: 'rutin',
    verksamhet: 'Psykiatri Affektiva',
    version: '8.0',
    ansvarig: 'Max Rindby',
    giltigFran: '2024-09-27',
    giltigTill: '2026-09-27',
    dokumentId: 'SU9806-1988473940-272',
    status: 'giltig',
    beskrivning: 'Rutin för ECT-behandling inkl. indikationer, kontraindikationer, anestesiprotokoll och uppföljning.',
    lank: 'https://mellanarkiv-offentlig.vgregion.se',
  },
  {
    id: 2,
    titel: 'rTMS – remisshantering och prioritering',
    typ: 'rutin',
    verksamhet: 'Psykiatri Affektiva',
    version: '3.2',
    ansvarig: 'Max Rindby',
    giltigFran: '2024-03-01',
    giltigTill: '2026-03-01',
    dokumentId: 'SU9806-1988473940-318',
    status: 'giltig',
    beskrivning: 'Rutin för remisshantering, urvalskriterier och prioriteringsordning vid rTMS-behandling.',
    lank: '#',
  },
  {
    id: 3,
    titel: 'Hälsodeklaration inför ECT – checklista',
    typ: 'checklista',
    verksamhet: 'Psykiatri Affektiva',
    version: '5.1',
    ansvarig: 'Max Rindby',
    giltigFran: '2023-11-01',
    giltigTill: '2025-11-01',
    dokumentId: 'SU9806-1988473940-201',
    status: 'utgangen',
    beskrivning: 'Checklista för hälsodeklaration inkl. fastekrav, läkemedel, allergi och anestesibedömning.',
    lank: '#',
  },
  {
    id: 4,
    titel: 'Akut ECT – vitalindikation och larmrutin',
    typ: 'rutin',
    verksamhet: 'Psykiatri Affektiva',
    version: '2.0',
    ansvarig: 'Max Rindby',
    giltigFran: '2024-01-15',
    giltigTill: '2026-01-15',
    dokumentId: 'SU9806-1988473940-290',
    status: 'giltig',
    beskrivning: 'Rutin för akut ECT vid vitalindikation, inkl. larmkedja, anestesijour och dokumentationskrav.',
    lank: '#',
  },
  {
    id: 5,
    titel: 'Kliniska riktlinjer ECT – Svenska Psykiatriska Föreningen',
    typ: 'riktlinje',
    verksamhet: 'Nationell',
    version: '2017',
    ansvarig: 'SPF',
    giltigFran: '2017-01-01',
    giltigTill: '2027-01-01',
    dokumentId: 'SPF-ECT-2017',
    status: 'giltig',
    beskrivning: 'Nationella kliniska riktlinjer för ECT. Indikatorer, indikationer och kvalitetskrav.',
    lank: 'http://www.svenskpsykiatri.se/wp-content/uploads/2017/02/SPF-kliniska-riktlinjer-om-ECT.pdf',
  },
  {
    id: 6,
    titel: 'Remissvägar till ECT från Psykiatri Affektiva',
    typ: 'remissvag',
    verksamhet: 'Psykiatri Affektiva',
    version: '1.3',
    ansvarig: 'Mathias Alvidius',
    giltigFran: '2024-06-01',
    giltigTill: '2026-06-01',
    dokumentId: 'SU9806-1988473940-355',
    status: 'utgarsSnart',
    beskrivning: 'Beskriver behöriga remittenter, remisskriterier och ansvar vid remittering.',
    lank: '#',
  },
  {
    id: 7,
    titel: 'Thymatron System IV – driftrutin och underhåll',
    typ: 'rutin',
    verksamhet: 'ECT-enheten',
    version: '4.0',
    ansvarig: 'ECT-koordinator',
    giltigFran: '2023-05-01',
    giltigTill: '2025-05-01',
    dokumentId: 'SU9806-1988473940-189',
    status: 'utgangen',
    beskrivning: 'Driftrutin för Thymatron System IV inkl. daglig kontroll, felhantering och servicekontakter.',
    lank: '#',
  },
  {
    id: 8,
    titel: 'Kvalitetsregister ECT – rapporteringsrutin',
    typ: 'rutin',
    verksamhet: 'ECT-enheten',
    version: '2.1',
    ansvarig: 'ECT-koordinator',
    giltigFran: '2024-01-01',
    giltigTill: '2026-01-01',
    dokumentId: 'SU9806-1988473940-412',
    status: 'giltig',
    beskrivning: 'Rutin för rapportering till Nationellt Kvalitetsregister ECT inkl. tidpunkter och ansvarig.',
    lank: 'https://ect.registercentrum.se',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Display config (label + colors) for each document validity status.
const STATUS_CFG: Record<DocStatus, { label: string; bg: string; text: string; dot: string }> = {
  giltig:       { label: 'Giltig',       bg: 'bg-[#E8F7F1]', text: 'text-[#1A9E5F]', dot: 'bg-[#1A9E5F]' },
  utgarsSnart:  { label: 'Utgår snart',  bg: 'bg-[#FEF3DC]', text: 'text-[#D4860A]', dot: 'bg-[#D4860A]' },
  utgangen:     { label: 'Utgången',     bg: 'bg-[#F3F4F6]', text: 'text-[#6B7280]', dot: 'bg-[#6B7280]' },
};

// Display config (label + colors) for each document type.
const TYPE_CFG: Record<DocType, { label: string; bg: string; text: string }> = {
  rutin:      { label: 'Rutin',      bg: 'bg-[#EFF6FF]', text: 'text-[#2563EB]' },
  checklista: { label: 'Checklista', bg: 'bg-[#F5F0FF]', text: 'text-[#7C3AED]' },
  riktlinje:  { label: 'Riktlinje', bg: 'bg-[#E8F7F1]', text: 'text-[#1A9E5F]' },
  remissvag:  { label: 'Remissväg', bg: 'bg-[#FEF3DC]', text: 'text-[#D4860A]' },
};

// Number of whole days between now and the given date (negative if already past).
function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function toDocType(value?: string): DocType {
  const normalized = value?.toLowerCase();
  if (normalized === 'checklista') return 'checklista';
  if (normalized === 'riktlinje') return 'riktlinje';
  if (normalized === 'remissvag' || normalized === 'remissväg') return 'remissvag';
  return 'rutin';
}

function toDocStatus(doc: DocumentDto): DocStatus {
  const validTo = doc.validTo;
  if (!doc.verified) return 'utgangen';
  if (!validTo) return 'giltig';

  const days = daysUntil(validTo);
  if (days < 0) return 'utgangen';
  if (days <= 90) return 'utgarsSnart';
  return 'giltig';
}

function mapApiDocument(doc: DocumentDto): ClinicalDocument {
  return {
    id: doc.documentId,
    titel: doc.title ?? doc.fileName,
    typ: toDocType(doc.documentType),
    verksamhet: doc.businessArea ?? 'Ej angiven',
    version: doc.version ?? '1.0',
    ansvarig: doc.owner ?? `Användare #${doc.uploadedByUserId}`,
    giltigFran: doc.validFrom ?? '',
    giltigTill: doc.validTo ?? '',
    dokumentId: doc.externalDocumentId ?? String(doc.documentId),
    status: toDocStatus(doc),
    beskrivning: doc.description ?? doc.fileName,
    lank: doc.link ?? '#',
  };
}

// ─── Document card ────────────────────────────────────────────────────────────

// A single document's summary card, including its expiry status and external link.
function DocCard({ doc }: { doc: ClinicalDocument }) {
  const statusCfg = STATUS_CFG[doc.status];
  const typeCfg = TYPE_CFG[doc.typ];
  const days = daysUntil(doc.giltigTill);

  return (
    <div className={`bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow ${
      doc.status === 'utgangen' ? 'border-[#DDE3EC] opacity-70' :
      doc.status === 'utgarsSnart' ? 'border-[#D4860A]' : 'border-[#DDE3EC]'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-[#1A2332] leading-snug">{doc.titel}</h3>
        <span className={`flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
          {statusCfg.label}
        </span>
      </div>

      <p className="text-xs text-[#8494AA] mb-3 line-clamp-2">{doc.beskrivning}</p>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeCfg.bg} ${typeCfg.text}`}>
          {typeCfg.label}
        </span>
        <span className="text-xs text-[#8494AA] bg-[#F0F4F8] px-2 py-0.5 rounded-full">
          v{doc.version}
        </span>
        <span className="text-xs text-[#8494AA] bg-[#F0F4F8] px-2 py-0.5 rounded-full">
          {doc.verksamhet}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-[#8494AA]">
        <div>
          <span>Ansvarig: {doc.ansvarig}</span>
          <span className="mx-2">·</span>
          <span>
            {doc.status === 'utgangen'
              ? `Utgick ${doc.giltigTill}`
              : doc.status === 'utgarsSnart'
              ? <span className="text-[#D4860A] font-medium">Utgår om {days} dagar ({doc.giltigTill})</span>
              : `Giltig t.o.m. ${doc.giltigTill}`}
          </span>
        </div>
        {doc.lank !== '#' && (
          <a
            href={doc.lank}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1A4F8A] hover:underline font-medium"
          >
            Öppna →
          </a>
        )}
      </div>

      <div className="mt-2 text-xs text-[#8494AA] font-mono opacity-60">{doc.dokumentId}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ALL_TYPES: Array<DocType | 'all'> = ['all', 'rutin', 'checklista', 'riktlinje', 'remissvag'];

export default function DocumentsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DocStatus | 'all'>('all');
  const documentsQuery = useQuery({ queryKey: ['documents'], queryFn: getDocuments, retry: 1 });
  const apiDocuments = documentsQuery.data?.map(mapApiDocument) ?? [];
  const documents = apiDocuments.length > 0 ? apiDocuments : FALLBACK_DOCUMENTS;
  const usingFallbackDocuments = documentsQuery.isError || apiDocuments.length === 0;

  // Combines the free-text search with the type and status filters.
  const filtered = documents.filter((d) => {
    const matchSearch =
      d.titel.toLowerCase().includes(search.toLowerCase()) ||
      d.beskrivning.toLowerCase().includes(search.toLowerCase()) ||
      d.ansvarig.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || d.typ === typeFilter;
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  // Counts by status for the summary chips, independent of the current filters.
  const giltig = documents.filter((d) => d.status === 'giltig').length;
  const utgarsSnart = documents.filter((d) => d.status === 'utgarsSnart').length;
  const utgangen = documents.filter((d) => d.status === 'utgangen').length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2332]">Styrdokument</h1>
        <p className="text-sm text-[#8494AA] mt-0.5">
          Rutiner, riktlinjer och remissvägar
          {usingFallbackDocuments && (
            <span className="ml-2 rounded-full bg-[#EAF4FC] px-2 py-0.5 text-xs font-semibold text-[#185FA5]">
              Visar katalog
            </span>
          )}
        </p>
      </div>

      {documentsQuery.isError && (
        <div className="mb-4">
          <BackendErrorState
            compact
            title="Dokument-API:t kan inte nås - visar katalog"
            message="Frontend använder den inbyggda dokumentkatalogen tills backend svarar."
            error={documentsQuery.error}
            onRetry={() => { void documentsQuery.refetch(); }}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Sök dokument..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4F8A] w-64"
        />

        <div className="flex gap-1 bg-white border border-[#DDE3EC] rounded-lg p-1">
          {ALL_TYPES.map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                typeFilter === t ? 'bg-[#1A4F8A] text-white' : 'text-[#4B5770] hover:bg-[#F0F4F8]'
              }`}>
              {t === 'all' ? 'Alla typer' : TYPE_CFG[t].label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-white border border-[#DDE3EC] rounded-lg p-1">
          {[
            { label: 'Giltiga', count: giltig, status: 'giltig' as const, color: 'text-[#1A9E5F]', bg: 'bg-[#E8F7F1]', active: 'bg-[#1A9E5F] text-white' },
            { label: 'Utgår snart', count: utgarsSnart, status: 'utgarsSnart' as const, color: 'text-[#D4860A]', bg: 'bg-[#FEF3DC]', active: 'bg-[#D4860A] text-white' },
            { label: 'Utgångna', count: utgangen, status: 'utgangen' as const, color: 'text-[#6B7280]', bg: 'bg-[#F3F4F6]', active: 'bg-[#6B7280] text-white' },
          ].map(({ label, count, status, color, bg, active }) => (
            <button
              key={label}
              type="button"
              onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === status ? active : `${bg} ${color} hover:brightness-95`
              }`}
            >
              {count} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {documentsQuery.isLoading && apiDocuments.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-[#8494AA]">
          <Spinner size={18} />
          Laddar dokument...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-[#8494AA]">
          Inga dokument matchar sökningen.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((doc) => <DocCard key={doc.id} doc={doc} />)}
        </div>
      )}
    </div>
  );
}
