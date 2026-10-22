import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter, RefreshCw, ShieldCheck } from 'lucide-react';
import { getAuditLogs, type AuditLogDto } from '../api/audit';

const entityOptions = ['', 'Booking', 'Patient', 'Referral', 'Document', 'Notification', 'User', 'Role'];

function actionLabel(action: string) {
  if (action === 'Viewed') return 'Öppnad';
  if (action === 'Added') return 'Skapad';
  if (action === 'Modified') return 'Ändrad';
  if (action === 'Deleted') return 'Raderad';
  return action;
}

function entityLabel(entityName: string) {
  if (entityName === 'Booking') return 'Bokning';
  if (entityName === 'Patient') return 'Patient';
  if (entityName === 'Referral') return 'Remiss';
  if (entityName === 'Document') return 'Dokument';
  if (entityName === 'Notification') return 'Notis';
  if (entityName === 'User') return 'Användare';
  if (entityName === 'Role') return 'Roll';
  return entityName;
}

function parseChangedFields(log: AuditLogDto) {
  if (!log.changedFields) return [];

  try {
    const parsed = JSON.parse(log.changedFields) as Record<string, unknown>;
    return Object.keys(parsed).filter((key) => !['PasswordHash', 'SocialSecurityNumber'].includes(key));
  } catch {
    return [];
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('sv-SE', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function AuditLogPage() {
  const [entityName, setEntityName] = useState('');
  const [entityId, setEntityId] = useState('');
  const [limit, setLimit] = useState(100);

  const query = useQuery({
    queryKey: ['audit-logs', entityName, entityId, limit],
    queryFn: () => getAuditLogs({
      entityName: entityName || undefined,
      entityId: entityId.trim() || undefined,
      limit,
    }),
  });

  const logs = useMemo(() => query.data ?? [], [query.data]);
  const actionCounts = useMemo(() => {
    return logs.reduce<Record<string, number>>((acc, log) => {
      acc[log.action] = (acc[log.action] ?? 0) + 1;
      return acc;
    }, {});
  }, [logs]);

  return (
    <main className="min-h-screen bg-[#F4F0EA] p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#EAF1F8] px-3 py-1 text-xs font-bold text-[#185FA5]">
            <ShieldCheck size={14} aria-hidden="true" />
            Admin
          </div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Auditlogg</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#5F6F86]">
            Granskningsvy för åtkomst och ändringar. Patientnamn och personnummer visas inte här.
          </p>
        </div>

        <button
          type="button"
          onClick={() => query.refetch()}
          className="inline-flex items-center gap-2 rounded-lg border border-[#D8E0EA] bg-white px-4 py-2 text-sm font-bold text-[#29374F] shadow-sm hover:bg-[#F8FAFC]"
        >
          <RefreshCw size={16} aria-hidden="true" />
          Uppdatera
        </button>
      </div>

      <section className="mb-5 grid gap-3 rounded-lg border border-[#E3D8CB] bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_160px]">
        <label className="text-sm font-semibold text-[#29374F]">
          Typ
          <select
            value={entityName}
            onChange={(event) => setEntityName(event.target.value)}
            className="mt-1 w-full rounded-lg border border-[#D8E0EA] bg-white px-3 py-2 text-sm text-[#29374F]"
          >
            {entityOptions.map((option) => (
              <option key={option || 'all'} value={option}>
                {option ? entityLabel(option) : 'Alla'}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold text-[#29374F]">
          ID
          <input
            value={entityId}
            onChange={(event) => setEntityId(event.target.value)}
            placeholder="t.ex. 42"
            className="mt-1 w-full rounded-lg border border-[#D8E0EA] bg-white px-3 py-2 text-sm text-[#29374F]"
          />
        </label>

        <label className="text-sm font-semibold text-[#29374F]">
          Antal
          <select
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
            className="mt-1 w-full rounded-lg border border-[#D8E0EA] bg-white px-3 py-2 text-sm text-[#29374F]"
          >
            {[50, 100, 250, 500].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </section>

      <section className="mb-5 grid gap-3 md:grid-cols-4">
        {['Viewed', 'Added', 'Modified', 'Deleted'].map((action) => (
          <div key={action} className="rounded-lg border border-[#E3D8CB] bg-white p-4 shadow-sm">
            <div className="text-xs font-bold uppercase text-[#8494AA]">{actionLabel(action)}</div>
            <div className="mt-1 text-2xl font-bold text-[#1A2332]">{actionCounts[action] ?? 0}</div>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-lg border border-[#E3D8CB] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#E8E1D8] px-4 py-3 text-sm font-bold text-[#29374F]">
          <Filter size={16} aria-hidden="true" />
          Händelser
        </div>

        {query.isLoading ? (
          <p className="p-5 text-sm text-[#5F6F86]">Laddar auditlogg...</p>
        ) : query.isError ? (
          <p className="p-5 text-sm text-[#9F3A38]">Auditloggen kunde inte hämtas.</p>
        ) : logs.length === 0 ? (
          <p className="p-5 text-sm text-[#5F6F86]">Inga händelser matchar filtret.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F8FAFC] text-xs uppercase text-[#68738A]">
                <tr>
                  <th className="px-4 py-3">Tid</th>
                  <th className="px-4 py-3">Åtgärd</th>
                  <th className="px-4 py-3">Objekt</th>
                  <th className="px-4 py-3">Användare</th>
                  <th className="px-4 py-3">Vårdenhet</th>
                  <th className="px-4 py-3">Orsak</th>
                  <th className="px-4 py-3">Fält</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F6]">
                {logs.map((log) => {
                  const changedFields = parseChangedFields(log);
                  return (
                    <tr key={log.auditLogId} className="align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-[#29374F]">{formatDate(log.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-[#EAF1F8] px-2 py-1 text-xs font-bold text-[#185FA5]">
                          {actionLabel(log.action)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#29374F]">
                        <div className="font-bold">{entityLabel(log.entityName)}</div>
                        <div className="text-xs text-[#8494AA]">ID {log.entityId}</div>
                      </td>
                      <td className="px-4 py-3 text-[#29374F]">
                        <div className="font-semibold">{log.userName ?? 'system'}</div>
                        <div className="text-xs text-[#8494AA]">{log.role ?? 'okänd roll'}</div>
                      </td>
                      <td className="px-4 py-3 text-[#29374F]">{log.careUnitId ?? '-'}</td>
                      <td className="max-w-xs px-4 py-3 text-[#29374F]">{log.reason ?? '-'}</td>
                      <td className="max-w-xs px-4 py-3 text-[#5F6F86]">
                        {changedFields.length ? changedFields.join(', ') : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
