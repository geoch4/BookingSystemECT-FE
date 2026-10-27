import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight, Search } from 'lucide-react';
import type { ReferralCase } from '../../utils/referralCases';
import type { ReferralActionEvent, ReferralActionNote } from '../../utils/referralActions';
import { maskPersonnummer } from '../../utils/personnummer';
import { rtmsSessionPlanLabel } from '../../utils/rtmsTreatmentPlan';
import ReferralTimeline from './ReferralTimeline';
import './ReferralWorkspace.css';

type DetailTab = 'overview' | 'documents' | 'logistics' | 'history';
const tabs: { id: DetailTab; label: string }[] = [
  { id: 'overview', label: 'Översikt' },
  { id: 'documents', label: 'Underlag' },
  { id: 'logistics', label: 'Logistik' },
  { id: 'history', label: 'Historik' },
];

function Facts({ items }: { items: [string, ReactNode][] }) {
  return <dl className="referral-workspace__facts">{items.map(([label, value]) => (
    <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
  ))}</dl>;
}

function dateTime(value: string) {
  return new Date(value).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' });
}

export interface ReferralWorkspaceProps {
  referrals: ReferralCase[];
  notes: Record<string, ReferralActionNote>;
  events: Record<string, ReferralActionEvent[]>;
  canRequestCompletion: boolean;
  canBookOrPrioritize: boolean;
  prioritizeLabel: string;
  onRequestCompletion: (referral: ReferralCase) => void;
  onPrioritize: (referral: ReferralCase) => void;
}

function ReferralCard({ referral, note, events, canRequestCompletion, canBookOrPrioritize, prioritizeLabel, onRequestCompletion, onPrioritize }: {
  referral: ReferralCase;
  note?: ReferralActionNote;
  events?: ReferralActionEvent[];
} & Pick<ReferralWorkspaceProps, 'canRequestCompletion' | 'canBookOrPrioritize' | 'prioritizeLabel' | 'onRequestCompletion' | 'onPrioritize'>) {
  const [tab, setTab] = useState<DetailTab>('overview');
  const id = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const completionIsPrimary = canRequestCompletion && referral.missingDocuments.length > 0;
  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    setTab(tabs[next].id);
    tabRefs.current[next]?.focus();
  }

  return <article className="referral-workspace__detail" aria-label={`Remiss för ${referral.patient.fullName}`}>
    <header>
      <div className="referral-workspace__identity">
        <div><h2>{referral.patient.fullName}</h2><p className="referral-workspace__muted">{maskPersonnummer(referral.patient.socialSecurityNumber)}</p></div>
        <span className={referral.priority === 'Red' ? 'referral-workspace__urgent' : 'referral-workspace__priority'}>
          {referral.priority === 'Red' ? 'Akut' : referral.priority === 'Yellow' ? 'Halvakut' : 'Elektiv'}
        </span>
      </div>
      <p className="referral-workspace__context">{referral.treatmentLabel} · {referral.department}</p>
      {referral.riskFlags.length > 0 && <section className="referral-workspace__warnings" aria-label="Viktiga varningar">
        <AlertTriangle size={18} aria-hidden="true" />
        <ul>{referral.riskFlags.map(flag => <li key={flag.label}>{flag.target === 'anesthesia' ? 'Anestesi: ' : ''}{flag.label}</li>)}</ul>
      </section>}
    </header>

    <div className="referral-workspace__tabs" role="tablist" aria-label="Information om remissen">
      {tabs.map((item, index) => <button key={item.id} ref={element => { tabRefs.current[index] = element; }}
        type="button" role="tab" id={`${id}-${item.id}`} aria-controls={`${id}-panel-${item.id}`}
        aria-selected={tab === item.id} tabIndex={tab === item.id ? 0 : -1}
        onClick={() => setTab(item.id)} onKeyDown={event => navigateTabs(event, index)}>{item.label}</button>)}
    </div>

    <div className="referral-workspace__content">
      <section role="tabpanel" id={`${id}-panel-overview`} aria-labelledby={`${id}-overview`} hidden={tab !== 'overview'}>
        <h3>Remissuppgifter</h3>
        <Facts items={[
          ['Behandling', <>{referral.treatmentLabel}{referral.rtmsSessionPlan && <span className="referral-workspace__subvalue">{rtmsSessionPlanLabel(referral.rtmsSessionPlan)}</span>}</>],
          ['Önskad start', referral.requestedStartDate],
          ['Remitterande avdelning', referral.department],
          ['Tilldelad behandlingsenhet', referral.booking.treatmentUnitId || 'Inte tilldelad'],
          ['Skickad', dateTime(referral.submittedAt)],
          ['Ärendestatus', referral.statusLabel],
          ['Avdelningens rangordning', referral.departmentPriority ? `Prioritet ${referral.departmentPriority} inom ${referral.department}` : 'Inte angiven'],
        ]} />
        <p className="referral-workspace__hint">Avdelningens rangordning är separat från den medicinska prioriteringen.</p>
        <h3>Det som återstår</h3>
        <Facts items={[
          ['Underlag', referral.missingDocuments.length ? `${referral.missingDocuments.length} obligatoriska underlag saknas` : 'Inga obligatoriska underlag saknas enligt översikten'],
          ['Transport', referral.logistics.requiresTransport ? 'Behöver planeras' : 'Kontrollera behov med avdelningen'],
        ]} />
        {note && <div className="referral-workspace__latest"><h3>Senaste åtgärd</h3><p>{note.title}</p><p>{note.comment}</p><p className="referral-workspace__muted">{dateTime(note.createdAt)}</p></div>}
        <Link className="referral-workspace__detail-link" to={`/referrals/${referral.id}`}>Öppna separat remissida <ArrowUpRight size={15} aria-hidden="true" /></Link>
      </section>

      <section role="tabpanel" id={`${id}-panel-documents`} aria-labelledby={`${id}-documents`} hidden={tab !== 'documents'}>
        <h3>Samtliga underlag</h3>
        <Facts items={referral.documents.map(document => [document.label,
          <span className={!document.complete && document.required ? 'referral-workspace__missing' : ''}>{document.complete ? 'Klar' : document.required ? 'Saknas' : 'Ej obligatoriskt'}</span>,
        ])} />
        <h3>Risker och kontroller</h3>
        {referral.riskFlags.length ? <ul className="referral-workspace__risk-list">{referral.riskFlags.map(flag => <li key={flag.label}>{flag.target === 'anesthesia' ? 'Anestesi: ' : ''}{flag.label}</li>)}</ul> : <p>Inga särskilda riskflaggor registrerade i översikten.</p>}
      </section>

      <section role="tabpanel" id={`${id}-panel-logistics`} aria-labelledby={`${id}-logistics`} hidden={tab !== 'logistics'}>
        <h3>Enhet och vårdplats</h3>
        <Facts items={[
          ['Tilldelad behandlingsenhet', referral.booking.treatmentUnitId || 'Inte tilldelad'],
          ['Föreslagen enhet', referral.logistics.recommendedUnit.name],
          ['Patientflöde', referral.logistics.patientFlow],
          ['Vårdplats / sjukhus', referral.logistics.sourceSite],
          ['Önskad start', referral.requestedStartDate],
        ]} />
        <h3>Transport och bemanning</h3>
        <p>{referral.logistics.transportLabel || 'Transportbehov behöver kontrolleras med avdelningen.'}</p>
        <Facts items={[
          ['Transportbokning', 'Ingen bokningsstatus registrerad här'],
          ['Medföljande personal', 'Inte registrerat'],
          ['Återtransport', 'Inte registrerad'],
        ]} />
        <p className="referral-workspace__hint">Planeringsunderlag: {referral.logistics.logisticsNote}</p>
        <h3>Kontakt på avdelningen</h3>
        <Facts items={[
          ['Avdelning', referral.department], ['Kontaktperson', referral.contactName], ['Telefon', referral.contactPhone || 'Inte angivet'],
        ]} />
        {(referral.logistics.capacityNote || referral.logistics.overflowOption) && <details className="referral-workspace__additional">
          <summary>Kapacitet och alternativ enhet</summary>
          {referral.logistics.capacityNote && <p>{referral.logistics.capacityNote}</p>}
          {referral.logistics.overflowOption && <p>{referral.logistics.overflowOption}</p>}
        </details>}
      </section>

      <section role="tabpanel" id={`${id}-panel-history`} aria-labelledby={`${id}-history`} hidden={tab !== 'history'}>
        <h3>Händelser och kommentarer</h3>
        {note?.priority && <Facts items={[
          ['Senast dokumenterade prioritet', note.priority === 'Red' ? 'Akut' : note.priority === 'Yellow' ? 'Halvakut' : 'Elektiv'],
        ]} />}
        <ReferralTimeline booking={referral.booking} note={note} events={events} embedded />
      </section>
    </div>

    <footer className="referral-workspace__next" aria-label="Nästa steg och åtgärder">
      <div><h3>Nästa steg</h3><p>{referral.nextStep}</p></div>
      <div className="referral-workspace__actions">
        {canRequestCompletion && <button type="button" className={completionIsPrimary ? 'referral-workspace__primary' : 'referral-workspace__secondary'} onClick={() => onRequestCompletion(referral)}>Begär komplettering</button>}
        {canBookOrPrioritize && <button type="button" className={completionIsPrimary ? 'referral-workspace__secondary' : 'referral-workspace__primary'} onClick={() => onPrioritize(referral)}>{prioritizeLabel}</button>}
        {!canRequestCompletion && !canBookOrPrioritize && <p className="referral-workspace__hint">Din roll kan läsa ärendet men inte fatta beslut här.</p>}
      </div>
    </footer>
  </article>;
}

export default function ReferralWorkspace(props: ReferralWorkspaceProps) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const query = search.trim().toLocaleLowerCase('sv');
  const visible = props.referrals.filter(referral => `${referral.patient.fullName} ${referral.department}`.toLocaleLowerCase('sv').includes(query));
  const selected = visible.find(referral => referral.id === selectedId) ?? visible[0];

  return <div className="referral-workspace">
    <aside className="referral-workspace__list" aria-label="Patienter i remisskön">
      <div className="referral-workspace__search"><label htmlFor="referral-queue-search">Hitta en patient</label>
        <div><Search size={17} aria-hidden="true" /><input id="referral-queue-search" type="search" placeholder="Namn eller avdelning" value={search} onChange={event => setSearch(event.target.value)} /></div>
      </div>
      <p className="referral-workspace__list-label" aria-live="polite">{visible.length} remisser · akuta först</p>
      <ul>{visible.map(referral => <li key={referral.id}><button type="button" className="referral-workspace__patient" aria-pressed={selected?.id === referral.id} onClick={() => setSelectedId(referral.id)} aria-label={`Visa remiss för ${referral.patient.fullName}`}>
        <span className="referral-workspace__patient-name">{referral.patient.fullName}</span>
        <span className="referral-workspace__muted">{referral.treatmentTrack} · {referral.department}</span>
        <span className="referral-workspace__patient-status">{referral.priority === 'Red' && <span className="referral-workspace__urgent">Akut · </span>}{referral.statusLabel}</span>
      </button></li>)}</ul>
      {!visible.length && <p className="referral-workspace__empty">Inga remisser matchar sökningen eller filtret.</p>}
    </aside>
    {selected ? <ReferralCard key={selected.id} referral={selected} note={props.notes[selected.id]} events={props.events[selected.id]}
      canRequestCompletion={props.canRequestCompletion} canBookOrPrioritize={props.canBookOrPrioritize} prioritizeLabel={props.prioritizeLabel}
      onRequestCompletion={props.onRequestCompletion} onPrioritize={props.onPrioritize} />
      : <section className="referral-workspace__empty" aria-label="Ingen vald remiss">Välj ett annat filter eller ändra sökningen för att hitta en remiss.</section>}
  </div>;
}
