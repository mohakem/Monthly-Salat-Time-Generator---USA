import React, { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { getMonthlyByZip } from '../api/aladhan'
import SettingsForm, { Settings } from '../components/SettingsForm'
import PrayerRow from '../components/PrayerRow'
import { computeIqama, formatTime, parseTiming } from '../utils/prayerUtils'

function isValidIqamaTime(date: string, prayerTimeStr: string, iqamaDate: Date): boolean {
  const prayerTime = parseTiming(date, prayerTimeStr)
  return iqamaDate > prayerTime
}

export default function MonthlySchedule({ settings, generateSignal }: { settings: Settings; generateSignal?: number }) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generated, setGenerated] = useState(false)

  const fetchData = () => {
    setLoading(true)
    setError(null)
    const year = new Date().getFullYear()
    getMonthlyByZip(settings.zip, year, settings.month, settings.school)
      .then((d) => setData(d))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }

  const downloadExcel = () => {
    const year = new Date().getFullYear()
    const rows = data.map((d) => {
      const date = d.date.gregorian.date
      const timings = d.timings
      const iqamas = {
        Fajr:
          settings.fajrMode === 'static'
            ? computeIqama(date, timings.Fajr, { mode: 'static', time: settings.fajrStatic })
            : computeIqama(date, timings.Fajr, { mode: 'dynamic', offsetMinutes: settings.fajrOffset }),
        Dhuhr:
          settings.zoharMode === 'static'
            ? computeIqama(date, timings.Dhuhr, { mode: 'static', time: settings.zoharStatic })
            : computeIqama(date, timings.Dhuhr, { mode: 'dynamic', offsetMinutes: settings.zoharOffset }),
        Asr:
          settings.asrMode === 'static'
            ? computeIqama(date, timings.Asr, { mode: 'static', time: settings.asrStatic })
            : computeIqama(date, timings.Asr, { mode: 'dynamic', offsetMinutes: settings.asrOffset }),
        Maghrib: computeIqama(date, timings.Maghrib, { mode: 'dynamic', offsetMinutes: settings.maghribOffset }),
        Isha:
          settings.ishaMode === 'static'
            ? computeIqama(date, timings.Isha, { mode: 'static', time: settings.ishaStatic })
            : computeIqama(date, timings.Isha, { mode: 'dynamic', offsetMinutes: settings.ishaOffset })
      }
      return {
        Date: date,
        Fajr: formatTime(parseTiming(date, timings.Fajr)),
        'Fajr Iqama': formatTime(iqamas.Fajr),
        Sunrise: formatTime(parseTiming(date, timings.Sunrise)),
        Dhuhr: formatTime(parseTiming(date, timings.Dhuhr)),
        'Dhuhr Iqama': formatTime(iqamas.Dhuhr),
        Asr: formatTime(parseTiming(date, timings.Asr)),
        'Asr Iqama': formatTime(iqamas.Asr),
        Maghrib: formatTime(parseTiming(date, timings.Maghrib)),
        'Maghrib Iqama': formatTime(iqamas.Maghrib),
        Isha: formatTime(parseTiming(date, timings.Isha)),
        'Isha Iqama': formatTime(iqamas.Isha)
      }
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Prayer Times')
    XLSX.writeFile(wb, `prayer-times-${settings.month}-${year}.xlsx`)
  }

  useEffect(() => {
    // reset generated state when settings change
    setGenerated(false)
  }, [settings])

  useEffect(() => {
    if (typeof generateSignal === 'number') {
      // user pressed Generate in the form
      setGenerated(true)
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generateSignal])

  if (!generated)
    return (
      <div>
        <p>Configure settings and click Generate Table.</p>
      </div>
    )

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <button
          onClick={() => {
            setGenerated(true)
            fetchData()
          }}
        >
          Refresh
        </button>
        <button onClick={downloadExcel} style={{ marginLeft: 8 }}>
          Download as Excel
        </button>
      </div>

      <table className="schedule">
        <thead>
          <tr>
            <th>Date</th>
            <th>Fajr</th>
            <th>Fajr Iqama</th>
            <th>Sunrise</th>

            <th>Dhuhr</th>
            <th>Dhuhr Iqama</th>

            <th>Asr</th>
            <th>Asr Iqama</th>

            <th>Maghrib</th>
            <th>Maghrib Iqama</th>

            <th>Isha</th>
            <th>Isha Iqama</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => {
            const date = d.date.gregorian.date
            const timings = d.timings
            const iqamas = {
              Fajr:
                settings.fajrMode === 'static'
                  ? computeIqama(date, timings.Fajr, { mode: 'static', time: settings.fajrStatic })
                  : computeIqama(date, timings.Fajr, { mode: 'dynamic', offsetMinutes: settings.fajrOffset }),
              Dhuhr:
                settings.zoharMode === 'static'
                  ? computeIqama(date, timings.Dhuhr, { mode: 'static', time: settings.zoharStatic })
                  : computeIqama(date, timings.Dhuhr, { mode: 'dynamic', offsetMinutes: settings.zoharOffset }),
              Asr:
                settings.asrMode === 'static'
                  ? computeIqama(date, timings.Asr, { mode: 'static', time: settings.asrStatic })
                  : computeIqama(date, timings.Asr, { mode: 'dynamic', offsetMinutes: settings.asrOffset }),
              Maghrib: computeIqama(date, timings.Maghrib, { mode: 'dynamic', offsetMinutes: settings.maghribOffset }),
              Isha:
                settings.ishaMode === 'static'
                  ? computeIqama(date, timings.Isha, { mode: 'static', time: settings.ishaStatic })
                  : computeIqama(date, timings.Isha, { mode: 'dynamic', offsetMinutes: settings.ishaOffset })
            }

            const fajrIqamaText = settings.fajrMode === 'static' && !isValidIqamaTime(date, timings.Fajr, iqamas.Fajr!) ? 'invalid time provided' : formatTime(iqamas.Fajr)
            const dhuhrIqamaText = settings.zoharMode === 'static' && !isValidIqamaTime(date, timings.Dhuhr, iqamas.Dhuhr!) ? 'invalid time provided' : formatTime(iqamas.Dhuhr)
            const asrIqamaText = settings.asrMode === 'static' && !isValidIqamaTime(date, timings.Asr, iqamas.Asr!) ? 'invalid time provided' : formatTime(iqamas.Asr)
            const ishaIqamaText = settings.ishaMode === 'static' && !isValidIqamaTime(date, timings.Isha, iqamas.Isha!) ? 'invalid time provided' : formatTime(iqamas.Isha)

            return (
              <tr key={date}>
                <td>{date}</td>
                <td>{formatTime(parseTiming(date, timings.Fajr))}</td>
                <td>{fajrIqamaText}</td>
                <td>{formatTime(parseTiming(date, timings.Sunrise))}</td>
                <td>{formatTime(parseTiming(date, timings.Dhuhr))}</td>
                <td>{dhuhrIqamaText}</td>
                <td>{formatTime(parseTiming(date, timings.Asr))}</td>
                <td>{asrIqamaText}</td>
                <td>{formatTime(parseTiming(date, timings.Maghrib))}</td>
                <td>{formatTime(iqamas.Maghrib)}</td>
                <td>{formatTime(parseTiming(date, timings.Isha))}</td>
                <td>{ishaIqamaText}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
