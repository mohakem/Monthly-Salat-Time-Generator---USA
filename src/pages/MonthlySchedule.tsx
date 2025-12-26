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

function getDayOfWeek(dateStr: string): string {
  // dateStr: DD-MM-YYYY
  const [dd, mm, yyyy] = dateStr.split('-')
  const d = new Date(`${yyyy}-${mm}-${dd}`)
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[d.getDay()]
}

function getDayNumber(dateStr: string): string {
  // dateStr: DD-MM-YYYY, extract just DD and remove leading zero
  return String(Number(dateStr.split('-')[0]))
}

function getMonthYearDisplay(month: number, year: number): string {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return `${months[month - 1]} ${year}`
}

export default function MonthlySchedule({ settings, generateSignal }: { settings: Settings; generateSignal?: number }) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generated, setGenerated] = useState(false)
  const [iqamaOverrides, setIqamaOverrides] = useState<Record<string, Partial<Record<'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha', string>>>>({})

  const updateIqamaOverride = (date: string, prayer: string, value: string) => {
    setIqamaOverrides((prev) => {
      const updated = { ...prev }
      if (value) {
        // Find the index of this date and apply to all subsequent dates
        const dateIndex = data.findIndex((d) => d.date.gregorian.date === date)
        for (let i = dateIndex; i < data.length; i++) {
          const currentDate = data[i].date.gregorian.date
          updated[currentDate] = { ...updated[currentDate], [prayer]: value }
        }
      } else {
        // Clear override for this date only
        if (updated[date]) {
          delete updated[date][prayer]
        }
      }
      return updated
    })
  }

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
      const overrides = iqamaOverrides[date] || {}
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
        'Fajr Iqama': overrides.Fajr || formatTime(iqamas.Fajr),
        Sunrise: formatTime(parseTiming(date, timings.Sunrise)),
        Dhuhr: formatTime(parseTiming(date, timings.Dhuhr)),
        'Dhuhr Iqama': overrides.Dhuhr || formatTime(iqamas.Dhuhr),
        Asr: formatTime(parseTiming(date, timings.Asr)),
        'Asr Iqama': overrides.Asr || formatTime(iqamas.Asr),
        Maghrib: formatTime(parseTiming(date, timings.Maghrib)),
        'Maghrib Iqama': overrides.Maghrib || formatTime(iqamas.Maghrib),
        Isha: formatTime(parseTiming(date, timings.Isha)),
        'Isha Iqama': overrides.Isha || formatTime(iqamas.Isha)
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
            <th colSpan={14} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', padding: '8px' }}>
              {getMonthYearDisplay(settings.month, new Date().getFullYear())}
            </th>
          </tr>
          <tr>
            <th>Date</th>
            <th>Day</th>
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
            const dayNum = getDayNumber(date)
            const dayOfWeek = getDayOfWeek(date)
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

            const overrides = iqamaOverrides[date] || {}
            const fajrOverride = overrides.Fajr
            const dhuhrOverride = overrides.Dhuhr
            const asrOverride = overrides.Asr
            const maghribOverride = overrides.Maghrib
            const ishaOverride = overrides.Isha

            return (
              <tr key={date}>
                <td>{dayNum}</td>
                <td>{dayOfWeek}</td>
                <td>{formatTime(parseTiming(date, timings.Fajr))}</td>
                <td>
                  <input
                    type="text"
                    placeholder="HH:MM AM/PM"
                    value={fajrOverride || ''}
                    onChange={(e) => updateIqamaOverride(date, 'Fajr', e.target.value)}
                    title="Enter time in 12-hour AM/PM format (e.g., 5:30 AM)"
                    style={{ width: '100px', padding: '2px' }}
                  />
                  {!fajrOverride && <span style={{ color: '#666' }}>{fajrIqamaText}</span>}
                </td>
                <td>{formatTime(parseTiming(date, timings.Sunrise))}</td>
                <td>{formatTime(parseTiming(date, timings.Dhuhr))}</td>
                <td>
                  <input
                    type="text"
                    placeholder="HH:MM AM/PM"
                    value={dhuhrOverride || ''}
                    onChange={(e) => updateIqamaOverride(date, 'Dhuhr', e.target.value)}
                    title="Enter time in 12-hour AM/PM format (e.g., 1:30 PM)"
                    style={{ width: '100px', padding: '2px' }}
                  />
                  {!dhuhrOverride && <span style={{ color: '#666' }}>{dhuhrIqamaText}</span>}
                </td>
                <td>{formatTime(parseTiming(date, timings.Asr))}</td>
                <td>
                  <input
                    type="text"
                    placeholder="HH:MM AM/PM"
                    value={asrOverride || ''}
                    onChange={(e) => updateIqamaOverride(date, 'Asr', e.target.value)}
                    title="Enter time in 12-hour AM/PM format (e.g., 4:00 PM)"
                    style={{ width: '100px', padding: '2px' }}
                  />
                  {!asrOverride && <span style={{ color: '#666' }}>{asrIqamaText}</span>}
                </td>
                <td>{formatTime(parseTiming(date, timings.Maghrib))}</td>
                <td>
                  <input
                    type="text"
                    placeholder="HH:MM AM/PM"
                    value={maghribOverride || ''}
                    onChange={(e) => updateIqamaOverride(date, 'Maghrib', e.target.value)}
                    title="Enter time in 12-hour AM/PM format (e.g., 6:30 PM)"
                    style={{ width: '100px', padding: '2px' }}
                  />
                  {!maghribOverride && <span style={{ color: '#666' }}>{formatTime(iqamas.Maghrib)}</span>}
                </td>
                <td>{formatTime(parseTiming(date, timings.Isha))}</td>
                <td>
                  <input
                    type="text"
                    placeholder="HH:MM AM/PM"
                    value={ishaOverride || ''}
                    onChange={(e) => updateIqamaOverride(date, 'Isha', e.target.value)}
                    title="Enter time in 12-hour AM/PM format (e.g., 8:30 PM)"
                    style={{ width: '100px', padding: '2px' }}
                  />
                  {!ishaOverride && <span style={{ color: '#666' }}>{ishaIqamaText}</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
