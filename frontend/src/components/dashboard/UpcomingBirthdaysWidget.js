import React from 'react';
import { Cake, Check, MessageCircle, Phone } from 'lucide-react';

const normalizeToE164 = (raw) => {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (raw.trim().startsWith('+')) return '+' + digits;
  if (digits.length === 10 && digits.startsWith('876')) return '+1' + digits;
  if (digits.length === 7) return '+1876' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  if (digits.length === 10) return '+1' + digits;
  return '+' + digits;
};

const buildBirthdayMessage = (firstName, daysUntil, businessName = 'TECHZONE') => {
  const name = (firstName || 'there').trim();
  if (daysUntil === 0) {
    return `Happy Birthday, ${name}! 🎉 Everyone at ${businessName} is wishing you a fantastic day. Drop by anytime — we've got a little something for you.`;
  }
  if (daysUntil === 1) {
    return `Hi ${name}, just a little note from ${businessName} — hope you have a wonderful birthday tomorrow! 🎂`;
  }
  return `Hi ${name}, the ${businessName} team spotted your birthday coming up in ${daysUntil} days and we wanted to wish you an early happy birthday! 🎉`;
};

export const UpcomingBirthdaysWidget = ({ upcomingBirthdays, businessName }) => {
  if (!upcomingBirthdays || upcomingBirthdays.length === 0) return null;

  const openWhatsApp = (c) => {
    const phone = normalizeToE164(c.phone).replace(/\D/g, '');
    if (!phone) return;
    const text = encodeURIComponent(buildBirthdayMessage(c.name, c.days_until, businessName));
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const openSMS = (c) => {
    const phone = normalizeToE164(c.phone);
    if (!phone) return;
    const body = encodeURIComponent(buildBirthdayMessage(c.name, c.days_until, businessName));
    window.open(`sms:${phone}?&body=${body}`, '_blank');
  };

  return (
    <div
      className="card"
      data-testid="upcoming-birthdays-card"
      style={{ marginBottom: '24px', border: '1px solid #fbcfe8' }}
    >
      <div
        className="card-header"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#fdf2f8',
          borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit',
          flexWrap: 'wrap', gap: '8px',
        }}
      >
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: '#9d174d' }}>
          <Cake size={20} color="#ec4899" />
          Upcoming Birthdays
          <span
            data-testid="upcoming-birthdays-count"
            style={{
              padding: '2px 10px', background: '#ec4899', color: '#fff',
              borderRadius: '999px', fontSize: '12px', fontWeight: 700,
            }}
          >{upcomingBirthdays.length}</span>
        </h2>
        <span style={{ fontSize: '12px', color: '#9d174d' }}>
          Next 7 days • auto-coupon sends on the day • reach out personally for bonus delight
        </span>
      </div>
      <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fff', borderBottom: '1px solid #fbcfe8' }}>
              {['Customer', 'Contact', 'Birthday', 'When', 'Total Spent', 'Coupon', 'Reach Out'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#9d174d', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {upcomingBirthdays.map((c) => {
              const whenLabel =
                c.days_until === 0 ? 'Today 🎉' :
                c.days_until === 1 ? 'Tomorrow' :
                `In ${c.days_until} days`;
              const whenColor = c.days_until === 0 ? '#be185d' : c.days_until <= 2 ? '#db2777' : '#6b7280';
              return (
                <tr
                  key={c.customer_id}
                  data-testid={`upcoming-birthday-row-${c.customer_id}`}
                  style={{ borderBottom: '1px solid #fce7f3' }}
                >
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#111827' }}>{c.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                    {c.phone || '—'}
                    {c.email ? <div style={{ fontSize: '11px' }}>{c.email}</div> : null}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151', fontFamily: 'monospace' }}>{c.birthday}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: whenColor }}>
                    {whenLabel}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151', textAlign: 'right' }}>
                    ${c.total_spent.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {c.coupon_already_sent ? (
                      <span
                        data-testid={`upcoming-birthday-sent-${c.customer_id}`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '2px 8px', fontSize: '11px', fontWeight: 600,
                          borderRadius: '4px', background: '#d1fae5', color: '#065f46',
                        }}
                      >
                        <Check size={11} /> Sent
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: '2px 8px', fontSize: '11px', fontWeight: 600,
                          borderRadius: '4px', background: '#fce7f3', color: '#9d174d',
                        }}
                      >
                        Pending
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        data-testid={`upcoming-birthday-whatsapp-${c.customer_id}`}
                        onClick={() => openWhatsApp(c)}
                        disabled={!c.phone}
                        title={c.phone ? 'Open WhatsApp with a pre-filled birthday note' : 'No phone number on file'}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '4px 8px', background: '#22c55e', color: '#fff',
                          border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                          cursor: c.phone ? 'pointer' : 'not-allowed', opacity: c.phone ? 1 : 0.4,
                        }}
                      >
                        <MessageCircle size={11} /> WhatsApp
                      </button>
                      <button
                        type="button"
                        data-testid={`upcoming-birthday-sms-${c.customer_id}`}
                        onClick={() => openSMS(c)}
                        disabled={!c.phone}
                        title={c.phone ? 'Open SMS with a pre-filled birthday note' : 'No phone number on file'}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '4px 8px', background: '#3b82f6', color: '#fff',
                          border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                          cursor: c.phone ? 'pointer' : 'not-allowed', opacity: c.phone ? 1 : 0.4,
                        }}
                      >
                        <Phone size={11} /> SMS
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UpcomingBirthdaysWidget;
