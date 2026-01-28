// Copyright 2026 Mohakem Khan
// Licensed under the Apache License, Version 2.0

export type IqamaOption =
  | { mode: 'static'; time: string }
  | { mode: 'dynamic'; offsetMinutes: number }

function toDateISO(dateStr: string, timeStr: string) {
  // dateStr: Aladhan usually provides "DD-MM-YYYY"; we convert to MM-DD-YYYY; normalize to YYYY-MM-DD
  const normalize = (d: string) => {
    const mmddyyyy = /^\d{2}-\d{2}-\d{4}$/.test(d)
    if (mmddyyyy) {
      const [mm, dd, yyyy] = d.split('-')
      return `${yyyy}-${mm}-${dd}`
    }
    return d
  }

  const isoDate = normalize(dateStr)

  // timeStr examples: "05:00 (EDT)", "5:00 PM", "05:00"
  const ampmMatch = /([AP]M)/i.test(timeStr)
  if (ampmMatch) {
    const m = timeStr.match(/(\d{1,2}):(\d{2})\s*([AP]M)/i)
    if (m) {
      let hh = Number(m[1])
      const mm = Number(m[2])
      const isPM = /pm/i.test(m[3])
      if (isPM && hh < 12) hh += 12
      if (!isPM && hh === 12) hh = 0
      const d = new Date(`${isoDate}T00:00:00`)
      d.setHours(hh, mm, 0, 0)
      return d
    }
    // fallback to Date parsing
    return new Date(`${isoDate} ${timeStr.split('(')[0].trim()}`)
  }

  const raw = timeStr.split(' ')[0]
  return new Date(`${isoDate}T${raw}:00`)
}

export function parseTiming(dateStr: string, timeStr: string) {
  return toDateISO(dateStr, timeStr)
}

export function computeIqama(dateStr: string, startTime: string, opt: IqamaOption) {
  const start = toDateISO(dateStr, startTime)
  if (opt.mode === 'static') {
    // interpret static time as local time on same date
    // Parse the static time which may be in 12-hour AM/PM format
    return toDateISO(dateStr, opt.time)
  }
  const d = new Date(start)
  d.setMinutes(d.getMinutes() + opt.offsetMinutes)
  return d
}

export function formatTime(d?: Date, hour12: boolean = true) {
  if (!d) return ''
  const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  if (!hour12) {
    // Remove AM/PM suffix but keep 12-hour format
    return timeStr.replace(/\s*(AM|PM|am|pm)$/i, '').trim()
  }
  return timeStr
}
