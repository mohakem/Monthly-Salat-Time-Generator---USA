import React from 'react'
import { formatTime, parseTiming } from '../utils/prayerUtils'

export default function PrayerRow({ date, timings, iqamas }: { date: string; timings: any; iqamas: Record<string, Date | undefined> }) {
  const fajrStart = timings.Fajr && parseTiming(date, timings.Fajr)
  const sunriseStart = timings.Sunrise && parseTiming(date, timings.Sunrise)
  const dhuhrStart = timings.Dhuhr && parseTiming(date, timings.Dhuhr)
  const asrStart = timings.Asr && parseTiming(date, timings.Asr)
  const maghribStart = timings.Maghrib && parseTiming(date, timings.Maghrib)
  const ishaStart = timings.Isha && parseTiming(date, timings.Isha)

  return (
    <tr>
      <td>{date}</td>

      <td>{formatTime(fajrStart)}</td>
      <td>{formatTime(iqamas.Fajr)}</td>

      <td>{formatTime(sunriseStart)}</td>

      <td>{formatTime(dhuhrStart)}</td>
      <td>{formatTime(iqamas.Dhuhr)}</td>

      <td>{formatTime(asrStart)}</td>
      <td>{formatTime(iqamas.Asr)}</td>

      <td>{formatTime(maghribStart)}</td>
      <td>{formatTime(iqamas.Maghrib)}</td>

      <td>{formatTime(ishaStart)}</td>
      <td>{formatTime(iqamas.Isha)}</td>
    </tr>
  )
}
