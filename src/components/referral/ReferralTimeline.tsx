import type { BookingDto } from '../../types';
import type { ReferralActionEvent, ReferralActionNote } from '../../utils/referralActions';

interface TimelineEvent {
  title: string;
  detail: string;
  date: string;
  tone: 'blue' | 'yellow' | 'green';
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toneClass(tone: TimelineEvent['tone']) {
  if (tone === 'green') return 'bg-[#1A9E5F]';
  if (tone === 'yellow') return 'bg-[#D4860A]';
  return 'bg-[#185FA5]';
}

function buildTimelineEvents(booking: BookingDto, note?: ReferralActionNote, actionEvents: ReferralActionEvent[] = []): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      title: 'Remiss skickad',
      detail: 'Avdelningen skickade remissen till behandlingsenheten.',
      date: booking.createdAt,
      tone: 'blue',
    },
  ];

  const notesToShow = actionEvents.length > 0 ? actionEvents : note ? [note] : [];

  notesToShow.forEach((item) => {
    events.push({
      title: item.title,
      detail: item.comment,
      date: item.createdAt,
      tone: item.type === 'completion' ? 'yellow' : item.type === 'prioritize' ? 'green' : 'blue',
    });
  });

  if (note?.respondedAt && note.responseComment) {
    events.push({
      title: 'Komplettering skickad',
      detail: note.responseComment,
      date: note.respondedAt,
      tone: 'green',
    });
  }

  if (booking.status === 'Confirmed') {
    events.push({
      title: 'Tid bekräftad',
      detail: `Behandlingstid: ${formatDateTime(booking.date)}.`,
      date: note?.confirmedDateTime ?? booking.date,
      tone: 'green',
    });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export default function ReferralTimeline({
  booking,
  note,
  events: actionEvents,
}: {
  booking: BookingDto;
  note?: ReferralActionNote;
  events?: ReferralActionEvent[];
}) {
  const events = buildTimelineEvents(booking, note, actionEvents);

  return (
    <details className="mt-4 rounded-xl border border-[#DDE3EC] bg-white px-4 py-3">
      <summary className="cursor-pointer text-sm font-bold text-[#185FA5]">
        Historik ({events.length})
      </summary>
      <div className="mt-3 space-y-3">
        {events.map((event, index) => (
          <div key={`${event.title}-${event.date}-${index}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={`mt-1 h-3 w-3 rounded-full ${toneClass(event.tone)}`} />
              {index < events.length - 1 && <span className="mt-1 h-full w-px flex-1 bg-[#DDE3EC]" />}
            </div>
            <div className="pb-2">
              <div className="text-sm font-bold text-[#1A2332]">{event.title}</div>
              <div className="mt-0.5 text-sm text-[#4B5770]">{event.detail}</div>
              <div className="mt-0.5 text-xs text-[#8494AA]">{formatDateTime(event.date)}</div>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
