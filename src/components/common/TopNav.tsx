import { useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, Bell, CalendarDays, Zap } from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  fullMessage: string;
  time: string;
  route: string;
  urgent?: boolean;
}

export interface TopNavProps {
  systemName: string;
  role: string;
  dateLabel: string;
  unreadCount: number;
  notifications: NotificationItem[];
  onNotificationOpen: (route: string) => void;
}

const styles: Record<string, CSSProperties> = {
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    minHeight: 72,
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: '0 24px',
  },
  brand: {
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 8,
    background: 'var(--ect-color)',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    color: 'var(--text-main)',
    fontSize: 17,
    fontWeight: 750,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  actions: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
    minWidth: 0,
  },
  date: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'var(--text-muted)',
    fontSize: 14,
    fontWeight: 650,
    textTransform: 'capitalize',
    whiteSpace: 'nowrap',
  },
  role: {
    minHeight: 32,
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    background: 'var(--ect-bg)',
    color: 'var(--ect-color)',
    padding: '0 12px',
    fontSize: 13,
    fontWeight: 750,
    whiteSpace: 'nowrap',
  },
  bellButton: {
    position: 'relative',
    width: 44,
    height: 44,
    border: '1px solid var(--border)',
    borderRadius: 8,
    background: 'var(--surface)',
    color: 'var(--text-main)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    background: 'var(--akut-color)',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 5px',
  },
  notificationPanel: {
    position: 'absolute',
    top: 52,
    right: 0,
    width: 360,
    maxWidth: 'calc(100vw - 32px)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    background: 'var(--surface)',
    boxShadow: '0 12px 30px rgba(23, 32, 51, 0.16)',
    overflow: 'hidden',
    zIndex: 30,
  },
  panelHeader: {
    padding: '13px 15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--border)',
  },
  panelTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 750,
  },
  panelCount: {
    color: 'var(--text-subtle)',
    fontSize: 12,
    fontWeight: 650,
  },
  notification: {
    width: '100%',
    minHeight: 68,
    border: 0,
    borderBottom: '1px solid var(--border)',
    background: 'var(--surface)',
    padding: '11px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textAlign: 'left',
    cursor: 'pointer',
  },
  notificationDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    flexShrink: 0,
  },
  notificationTitle: {
    color: 'var(--text-main)',
    fontSize: 13,
    fontWeight: 750,
  },
  notificationDetail: {
    marginTop: 2,
    color: 'var(--text-muted)',
    fontSize: 12,
  },
  notificationTime: {
    marginTop: 3,
    color: 'var(--text-subtle)',
    fontSize: 11,
  },
  detailView: {
    padding: 16,
  },
  backButton: {
    minHeight: 32,
    border: 0,
    background: 'transparent',
    color: 'var(--ect-color)',
    padding: 0,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 750,
    cursor: 'pointer',
  },
  detailTitle: {
    margin: '14px 0 5px',
    color: 'var(--text-main)',
    fontSize: 18,
    lineHeight: 1.25,
    fontWeight: 800,
  },
  detailTime: {
    color: 'var(--text-subtle)',
    fontSize: 12,
  },
  fullMessage: {
    margin: '14px 0 18px',
    color: 'var(--text-muted)',
    fontSize: 14,
    lineHeight: 1.55,
  },
  openButton: {
    width: '100%',
    minHeight: 42,
    border: 0,
    borderRadius: 8,
    background: 'var(--ect-color)',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontSize: 13,
    fontWeight: 750,
    cursor: 'pointer',
  },
};

export default function TopNav({
  systemName,
  role,
  dateLabel,
  unreadCount,
  notifications,
  onNotificationOpen,
}: TopNavProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  return (
    <nav style={styles.nav} aria-label="Huvudnavigation">
      <div style={styles.brand}>
        <div style={styles.logo} aria-hidden="true">
          <Zap size={24} strokeWidth={2.5} />
        </div>
        <div style={styles.title}>{systemName}</div>
      </div>

      <div style={styles.actions}>
        <div style={styles.date}>
          <CalendarDays size={17} color="var(--ect-color)" aria-hidden="true" />
          {dateLabel}
        </div>
        <button
          type="button"
          aria-label={`${unreadCount} olästa remisser`}
          aria-expanded={notificationsOpen}
          aria-controls="notification-panel"
          onClick={() => {
            setNotificationsOpen((open) => !open);
            setSelectedNotification(null);
          }}
          style={styles.bellButton}
          onMouseEnter={(event) => {
            event.currentTarget.style.background = 'var(--ect-bg)';
            event.currentTarget.style.borderColor = 'var(--ect-color)';
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = 'var(--surface)';
            event.currentTarget.style.borderColor = 'var(--border)';
          }}
          onFocus={(event) => {
            event.currentTarget.style.outline = '3px solid var(--focus-ring)';
            event.currentTarget.style.outlineOffset = '2px';
          }}
          onBlur={(event) => {
            event.currentTarget.style.outline = 'none';
          }}
        >
          <Bell size={19} aria-hidden="true" />
          {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
        </button>
        {notificationsOpen && (
          <section id="notification-panel" style={styles.notificationPanel} aria-labelledby="notification-heading">
            <div style={styles.panelHeader}>
              <h2 id="notification-heading" style={styles.panelTitle}>Notiser</h2>
              <span style={styles.panelCount}>{unreadCount} olästa</span>
            </div>
            {selectedNotification ? (
              <div style={styles.detailView}>
                <button type="button" style={styles.backButton} onClick={() => setSelectedNotification(null)}>
                  <ArrowLeft size={15} aria-hidden="true" />
                  Tillbaka till notiser
                </button>
                <h3 style={styles.detailTitle}>{selectedNotification.title}</h3>
                <div style={styles.detailTime}>{selectedNotification.time}</div>
                <p style={styles.fullMessage}>{selectedNotification.fullMessage}</p>
                <button
                  type="button"
                  style={styles.openButton}
                  onClick={() => {
                    setNotificationsOpen(false);
                    setSelectedNotification(null);
                    onNotificationOpen(selectedNotification.route);
                  }}
                >
                  Öppna relaterat ärende
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  style={styles.notification}
                  onClick={() => setSelectedNotification(notification)}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background = 'var(--surface-soft)';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = 'var(--surface)';
                  }}
                >
                  <span
                    style={{
                      ...styles.notificationDot,
                      background: notification.urgent ? 'var(--akut-color)' : 'var(--ect-color)',
                    }}
                  />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ ...styles.notificationTitle, display: 'block' }}>{notification.title}</span>
                    <span style={{ ...styles.notificationDetail, display: 'block' }}>{notification.detail}</span>
                    <span style={{ ...styles.notificationTime, display: 'block' }}>{notification.time}</span>
                  </span>
                  <ArrowRight size={16} color="var(--text-subtle)" aria-hidden="true" />
                </button>
              ))
            )}
          </section>
        )}
        <span style={styles.role}>{role}</span>
      </div>
    </nav>
  );
}
