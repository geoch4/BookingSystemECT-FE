import React, { useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, updateUser, deleteUser } from '../api/users';
import { getRoles, createRole, updateRole, deleteRole } from '../api/roles';
import { register } from '../api/auth';
import type { UserDto, RoleDto, CreateUserDto, UpdateUserDto } from '../types';
import { TREATMENT_TYPE_LABELS } from '../types';
import ConfirmDialog from '../components/common/ConfirmDialog';
import BackendErrorState from '../components/common/BackendErrorState';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import {
  getAppRole,
  getPermissionsForAppRole,
  getPermissionsForRole,
  roleDisplayName,
  type AppRole,
  type Permission,
} from '../utils/permissions';

type Tab = 'treatments' | 'users' | 'roles';

const APP_ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  unknown: 'Rollen saknar systembehörighet.',
  department: 'Avdelningspersonal kan skapa remisser, följa egna patienter och hantera patientåtgärder.',
  'treatment-unit': 'Behandlingsenheten kan se dagens lista, remisskö och bekräfta tider.',
  'medical-responsible': 'Medicinskt ansvarig kan prioritera remisser och fatta kliniska beslut.',
  admin: 'Administratör kan hantera system, roller, användare och spårbarhet.',
};

const APP_ROLE_LABELS: Record<AppRole, string> = {
  unknown: 'Ingen behörighet',
  department: 'Avdelning',
  'treatment-unit': 'Behandlingsenhet',
  'medical-responsible': 'Medicinskt ansvarig',
  admin: 'Administratör',
};

const PERMISSION_LABELS: Record<Permission, string> = {
  viewDepartmentPortal: 'Avdelningsportal',
  viewTreatmentPortal: 'Behandlingsportal',
  viewDailyList: 'Dagens lista',
  viewReferralQueue: 'Remisskö',
  viewCalendar: 'Kalender',
  viewDocuments: 'Styrdokument',
  viewStatistics: 'Statistik',
  createReferral: 'Skapa remiss',
  viewOwnPatients: 'Mina patienter',
  viewConfirmedTimes: 'Bekräftade tider',
  setDepartmentPriority: 'Avd-prio',
  recordPatientAction: 'Patientåtgärd',
  requestCompletion: 'Begär komplettering',
  prioritizeReferral: 'Prioritera',
  confirmElvisBooking: 'Bekräfta tid',
  manageClinicalDecision: 'Kliniskt beslut',
  manageUsers: 'Användare',
  manageSettings: 'Inställningar',
  viewAuditLog: 'Loggar',
};

function RoleMeaning({ roleName }: { roleName?: string }) {
  const appRole = getAppRole(roleName);
  return (
    <div>
      <span className="rounded-full border border-[#C9D6E6] bg-[#EFF6FF] px-2 py-1 text-xs font-bold text-[#185FA5]">
        {roleDisplayName(roleName)}
      </span>
      <div className="mt-1 text-xs text-[#8494AA]">{appRole === 'unknown' ? 'Rollen saknar systembehörighet.' : APP_ROLE_DESCRIPTIONS[appRole]}</div>
    </div>
  );
}

function PermissionChips({ roleName, limit = 5 }: { roleName?: string; limit?: number }) {
  const permissions = getPermissionsForRole(roleName);
  return <PermissionChipList permissions={permissions} limit={limit} />;
}

function PermissionChipList({ permissions, limit = 5 }: { permissions: Permission[]; limit?: number }) {
  const visible = permissions.slice(0, limit);
  const hidden = permissions.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((permission) => (
        <span key={permission} className="rounded-full border border-[#DDE3EC] bg-white px-2 py-0.5 text-xs font-semibold text-[#4B5770]">
          {PERMISSION_LABELS[permission]}
        </span>
      ))}
      {hidden > 0 && (
        <span className="rounded-full border border-[#DDE3EC] bg-[#F8FAFC] px-2 py-0.5 text-xs font-semibold text-[#64748B]">
          +{hidden}
        </span>
      )}
    </div>
  );
}

// ─── Shared modal primitives ──────────────────────────────────────────────────

// Generic centered modal shell shared by the user and role forms below.
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[#1A2332]">{title}</h2>
          <button onClick={onClose} aria-label="Stäng dialog" className="text-[#8494AA] hover:text-[#1A2332] text-xl leading-none">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Generic error banner shown when a create/update mutation fails.
function ErrorMsg() {
  return (
    <div className="text-sm text-[#C42B2B] bg-[#FDEAEA] px-3 py-2 rounded-lg">
      Något gick fel. Kontrollera uppgifterna och försök igen.
    </div>
  );
}

// Shared cancel/submit button row for the modal forms below.
function ModalButtons({ onClose, isPending, isEdit }: { onClose: () => void; isPending: boolean; isEdit: boolean }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onClose}
        className="flex-1 px-4 py-2 border border-[#DDE3EC] rounded-lg text-sm text-[#4B5770] hover:bg-[#F0F4F8] transition-colors">
        Avbryt
      </button>
      <button type="submit" disabled={isPending}
        className="flex-1 px-4 py-2 bg-[#1A4F8A] text-white rounded-lg text-sm font-medium hover:bg-[#1a3f6f] transition-colors disabled:opacity-60">
        {isPending ? 'Sparar...' : isEdit ? 'Spara ändringar' : 'Skapa'}
      </button>
    </div>
  );
}

// Shared tab header: title, item count, and an "add new" button.
function SectionHeader({ title, count, onAdd }: { title: string; count: number; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-lg font-semibold text-[#1A2332]">{title}</h2>
        <p className="text-xs text-[#8494AA] mt-0.5">{count} totalt</p>
      </div>
      <button onClick={onAdd}
        className="bg-[#1A4F8A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a3f6f] transition-colors">
        + Lägg till
      </button>
    </div>
  );
}

// ─── Treatment Types ──────────────────────────────────────────────────────────

// Read-only list of treatment types — these are a fixed backend enum, not editable data.
function TreatmentsTab() {
  const entries = Object.entries(TREATMENT_TYPE_LABELS) as [string, string][];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-[#1A2332]">Behandlingstyper</h2>
          <p className="text-xs text-[#8494AA] mt-0.5">7 typer — definierade som enum i systemet</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-[#DDE3EC]">
        <table className="w-full">
          <thead><tr className="text-left text-xs font-medium text-[#8494AA] uppercase tracking-wider border-b border-[#DDE3EC]">
            <th scope="col" className="px-4 py-3">ID</th><th scope="col" className="px-4 py-3">Namn</th><th scope="col" className="px-4 py-3">Modul</th>
          </tr></thead>
          <tbody>
            {entries.map(([v, label]) => (
              <tr key={v} className="border-b border-[#DDE3EC] last:border-0 hover:bg-[#F8FAFC] transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-[#8494AA]">#{v}</td>
                <td className="px-4 py-3 text-sm font-medium text-[#1A2332]">{label}</td>
                <td className="px-4 py-3">
                  {Number(v) <= 4
                    ? <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB]">ECT</span>
                    : <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#F0FDF4] text-[#16A34A]">rTMS</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Users ────────────────────────────────────────────────────────────────────

function getInitialRoleId(user: UserDto | undefined, roles: RoleDto[]) {
  if (!user) return 0;
  if (user.roleId) return user.roleId;
  return roles.find((role) => role.roleName === user.roleName)?.roleId ?? 0;
}

// Creates or edits a user account. New users go through auth/register; existing users use User API.
function UserModal({ existing, onClose }: { existing?: UserDto; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: roles = [] } = useQuery({ queryKey: ['roles'], queryFn: getRoles });
  const isEdit = !!existing;
  const [form, setForm] = useState<CreateUserDto>({
    fullname: existing?.fullname ?? '',
    email: existing?.email ?? '',
    password: '',
    roleId: getInitialRoleId(existing, roles),
    careUnitId: existing?.careUnitId ?? '',
  });

  const createMutation = useMutation({
    mutationFn: register,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); onClose(); },
  });
  const updateMutation = useMutation({
    mutationFn: (dto: UpdateUserDto) => updateUser(existing!.userId, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); onClose(); },
  });

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    const selectedRoleId = form.roleId || getInitialRoleId(existing, roles);
    if (isEdit) {
      updateMutation.mutate({
        fullname: form.fullname,
        email: form.email,
        roleId: selectedRoleId || undefined,
        careUnitId: form.careUnitId?.trim() || undefined,
        password: form.password.trim() ? form.password : undefined,
      });
      return;
    }

    createMutation.mutate(form);
  }

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isError = createMutation.isError || updateMutation.isError;
  const selectedRoleId = form.roleId || getInitialRoleId(existing, roles);

  return (
    <Modal title={isEdit ? 'Redigera användare' : 'Registrera användare'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#4B5770] mb-1">Namn</label>
          <input type="text" required value={form.fullname}
            onChange={(e) => setForm((f) => ({ ...f, fullname: e.target.value }))}
            className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#4B5770] mb-1">E-post</label>
          <input type="email" required value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#4B5770] mb-1">
            Lösenord {isEdit && <span className="font-normal text-[#8494AA]">(lämna tomt för oförändrat)</span>}
          </label>
          <input type="password" required={!isEdit} minLength={form.password ? 6 : undefined} value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#4B5770] mb-1">Roll</label>
          <select required value={selectedRoleId || ''}
            onChange={(e) => setForm((f) => ({ ...f, roleId: Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]">
            <option value="">Välj roll...</option>
            {roles.map((r) => <option key={r.roleId} value={r.roleId}>{r.roleName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#4B5770] mb-1">Vårdenhet / avdelning</label>
          <input type="text" value={form.careUnitId ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, careUnitId: e.target.value }))}
            placeholder="Ex. Avdelning 361"
            className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]" />
        </div>
        {isError && <ErrorMsg />}
        <ModalButtons onClose={onClose} isPending={isPending} isEdit={isEdit} />
      </form>
    </Modal>
  );
}

// Lists all users with a delete action; new users are created via UserModal.
function UsersTab() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; user?: UserDto }>({ open: false });
  const [confirmDialog, setConfirmDialog] = useState<{ userId: number; name: string } | null>(null);
  const { data: users = [], isLoading, isError, error, refetch } = useQuery({ queryKey: ['users'], queryFn: getUsers });
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  return (
    <div>
      <SectionHeader title="Användare" count={isError ? 0 : users.length} onAdd={() => setModal({ open: true })} />
      {isError && (
        <div className="mb-4">
          <BackendErrorState error={error} onRetry={() => void refetch()} />
        </div>
      )}
      <div className="bg-white rounded-xl border border-[#DDE3EC]">
        {isLoading ? <LoadingRow /> : isError ? null : users.length === 0 ? <EmptyRow text="Inga användare registrerade." /> : (
          <table className="w-full">
            <thead><tr className="text-left text-xs font-medium text-[#8494AA] uppercase tracking-wider border-b border-[#DDE3EC]">
              <th scope="col" className="px-4 py-3">ID</th><th scope="col" className="px-4 py-3">Namn</th>
              <th scope="col" className="px-4 py-3">E-post</th><th scope="col" className="px-4 py-3">Roll</th><th scope="col" className="px-4 py-3">Systemvy</th><th scope="col" className="px-4 py-3">Vårdenhet</th><th scope="col" className="px-4 py-3"><span className="sr-only">Åtgärder</span></th>
            </tr></thead>
            <tbody>
              {users.map((u: UserDto) => (
                <tr key={u.userId} className="border-b border-[#DDE3EC] hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-[#8494AA]">#{u.userId}</td>
                  <td className="px-4 py-3 text-sm font-medium text-[#1A2332]">{u.fullname}</td>
                  <td className="px-4 py-3 text-sm text-[#4B5770]">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#F8FAFC] text-[#4B5770] border border-[#DDE3EC]">
                      {u.roleName ?? '–'}
                    </span>
                  </td>
                  <td className="px-4 py-3 min-w-[220px]">
                    <RoleMeaning roleName={u.roleName} />
                    <div className="mt-2">
                      <PermissionChips roleName={u.roleName} limit={3} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#4B5770]">{u.careUnitId || '–'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setModal({ open: true, user: u })}
                        className="text-xs text-[#1A4F8A] hover:underline">Redigera</button>
                      <button onClick={() => setConfirmDialog({ userId: u.userId, name: u.fullname })}
                        className="text-xs text-[#C42B2B] hover:underline">Radera</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modal.open && <UserModal existing={modal.user} onClose={() => setModal({ open: false })} />}
      {confirmDialog && (
        <ConfirmDialog
          title="Radera användare"
          message={`${confirmDialog.name} tas bort permanent.`}
          confirmLabel="Radera"
          onConfirm={() => { deleteMutation.mutate(confirmDialog.userId); setConfirmDialog(null); }}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}

// ─── Roles ────────────────────────────────────────────────────────────────────

// Creates or renames a role, depending on whether `existing` is passed in.
function RoleModal({ existing, onClose }: { existing?: RoleDto; onClose: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!existing;
  const [roleName, setRoleName] = useState(existing?.roleName ?? '');

  const createMutation = useMutation({
    mutationFn: (dto: { roleName: string }) => createRole(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); onClose(); },
  });
  const updateMutation = useMutation({
    mutationFn: (dto: { roleName: string }) => updateRole(existing!.roleId, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); onClose(); },
  });

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (isEdit) updateMutation.mutate({ roleName });
    else createMutation.mutate({ roleName });
  }

  return (
    <Modal title={isEdit ? 'Redigera roll' : 'Ny roll'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#4B5770] mb-1">Rollnamn</label>
          <input type="text" required value={roleName} onChange={(e) => setRoleName(e.target.value)}
            placeholder="t.ex. Admin, Sjuksköterska"
            className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]" />
        </div>
        {(createMutation.isError || updateMutation.isError) && <ErrorMsg />}
        <ModalButtons onClose={onClose} isPending={createMutation.isPending || updateMutation.isPending} isEdit={isEdit} />
      </form>
    </Modal>
  );
}

// Lists all roles with edit/delete actions; new roles are created via RoleModal.
function RolesTab() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; item?: RoleDto }>({ open: false });
  const [confirmDialog, setConfirmDialog] = useState<{ roleId: number; name: string } | null>(null);
  const { data: roles = [], isLoading, isError, error, refetch } = useQuery({ queryKey: ['roles'], queryFn: getRoles });
  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });

  return (
    <div>
      <SectionHeader title="Roller" count={isError ? 0 : roles.length} onAdd={() => setModal({ open: true })} />
      {isError && (
        <div className="mb-4">
          <BackendErrorState error={error} onRetry={() => void refetch()} />
        </div>
      )}
      <div className="mb-4 rounded-2xl border border-[#DDE3EC] bg-white p-4 shadow-sm">
        <div className="mb-3">
          <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Behörighetsöversikt</div>
          <div className="mt-1 text-sm font-semibold text-[#1A2332]">
            Systemet tolkar rollnamn till en arbetsvy. Kontrollera att rollnamnen matchar rätt ansvar.
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {(['department', 'treatment-unit', 'medical-responsible', 'admin'] as const).map((appRole) => (
            <div key={appRole} className="rounded-xl border border-[#DDE3EC] bg-[#F8FAFC] p-3">
              <div className="text-sm font-bold text-[#1A2332]">{APP_ROLE_LABELS[appRole]}</div>
              <p className="mt-1 text-xs text-[#64748B]">{APP_ROLE_DESCRIPTIONS[appRole]}</p>
              <div className="mt-3">
                <PermissionChipList permissions={getPermissionsForAppRole(appRole)} limit={6} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-[#DDE3EC]">
        {isLoading ? <LoadingRow /> : isError ? null : roles.length === 0 ? <EmptyRow text="Inga roller registrerade." /> : (
          <table className="w-full">
            <thead><tr className="text-left text-xs font-medium text-[#8494AA] uppercase tracking-wider border-b border-[#DDE3EC]">
              <th scope="col" className="px-4 py-3">ID</th><th scope="col" className="px-4 py-3">Namn</th><th scope="col" className="px-4 py-3"><span className="sr-only">Åtgärder</span></th>
            </tr></thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.roleId} className="border-b border-[#DDE3EC] hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-[#8494AA]">#{r.roleId}</td>
                  <td className="px-4 py-3 text-sm font-medium text-[#1A2332]">{r.roleName}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setModal({ open: true, item: r })} className="text-xs text-[#1A4F8A] hover:underline">Redigera</button>
                      <button onClick={() => setConfirmDialog({ roleId: r.roleId, name: r.roleName })}
                        className="text-xs text-[#C42B2B] hover:underline">Radera</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modal.open && <RoleModal existing={modal.item} onClose={() => setModal({ open: false })} />}
      {confirmDialog && (
        <ConfirmDialog
          title="Radera roll"
          message={`Rollen "${confirmDialog.name}" tas bort permanent.`}
          confirmLabel="Radera"
          onConfirm={() => { deleteMutation.mutate(confirmDialog.roleId); setConfirmDialog(null); }}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}

// ─── Tiny shared table helpers ────────────────────────────────────────────────

// Centered spinner shown while a tab's data is loading.
function LoadingRow() {
  return (
    <div className="flex items-center justify-center gap-3 p-8 text-sm text-[#8494AA]">
      <Spinner size={18} /> Laddar...
    </div>
  );
}
// Wraps EmptyState for the tab tables so each tab can pass its own empty-state message.
function EmptyRow({ text }: { text: string }) {
  return <EmptyState title={text} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: 'treatments', label: 'Behandlingstyper' },
  { id: 'users', label: 'Användare' },
  { id: 'roles', label: 'Roller' },
];

export default function AdminPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialTab: Tab = location.pathname.endsWith('/users')
    ? 'users'
    : location.pathname.endsWith('/settings')
      ? 'roles'
      : searchParams.get('tab') === 'users'
        ? 'users'
        : searchParams.get('tab') === 'roles'
          ? 'roles'
          : 'treatments';
  // Which of the three tabs (treatments/users/roles) is currently shown.
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2332]">Administration</h1>
        <p className="text-sm text-[#8494AA] mt-0.5">Hantera behandlingstyper, användare och roller</p>
      </div>

      <div className="flex gap-1 mb-6 bg-white border border-[#DDE3EC] rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-[#1A4F8A] text-white' : 'text-[#4B5770] hover:bg-[#F0F4F8]'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'treatments' && <TreatmentsTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'roles' && <RolesTab />}
    </div>
  );
}
