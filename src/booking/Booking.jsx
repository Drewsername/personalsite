const calendarUrl = 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ165vAjEz5rv8PO_dt9PDHPGJ9IDvDIDuZHnz4b7HQxcid6PZetV6vlE3X7I4x9CrULxk2m8wiw?gv=true';

export function Booking() {
  return (
    <main className="booking-page mx-auto max-w-[1100px] px-4 py-6 sm:px-8 sm:py-10">
      <a href="/" className="font-mono text-xs text-muted-foreground hover:text-foreground">← Drew Bermudez</a>
      <header className="mt-8 mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-medium sm:text-4xl">Book 30 minutes</h1>
          <p className="mt-3 text-sm text-muted-foreground">Pick a time that works for you.</p>
        </div>
        <a href={calendarUrl} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">Open in Google Calendar ↗</a>
      </header>
      <iframe src={calendarUrl} title="Book a 30-minute meeting with Drew Bermudez" className="booking-calendar block w-full border-0 bg-white" height="740" />
    </main>
  );
}
