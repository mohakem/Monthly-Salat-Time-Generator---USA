// Copyright 2026 Mohakem Khan
// Licensed under the Apache License, Version 2.0

import React from 'react'


export type Settings = {
  organizationName: string
  zip: string
  school: 'Shafi' | 'Hanafi'
  calendar: 'Gregorian' | 'Hijri'
  month: number
  jumuahCount: number
  jumuahTimes: string[]
  fajrMode: 'static' | 'dynamic'
  fajrStatic: string
  fajrOffset: number
  asrMode: 'static' | 'dynamic'
  asrStatic: string
  asrOffset: number
  maghribOffset: number
  ishaMode: 'static' | 'dynamic'
  ishaStatic: string
  ishaOffset: number
  zoharMode: 'static' | 'dynamic'
  zoharStatic: string
  zoharOffset: number
  includeSunrise: boolean
  use12HourFormat: boolean
}

const GREGORIAN_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  "Rabi al-Awwal",
  "Rabi al-Thani",
  'Jumada al-Ula',
  'Jumada al-Akhirah',
  'Rajab',
  'Shaban',
  'Ramadan',
  'Shawwal',
  "Dhu al-Qidah",
  "Dhu al-Hijjah"
]

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

export default function SettingsForm({ settings, onChange, onGenerate, logo, onLogoChange, onFileUpload }: { settings: Settings; onChange: (s: Settings) => void; onGenerate?: () => void; logo?: string | null; onLogoChange?: (logo: string | null) => void; onFileUpload?: (file: File) => void }) {
  const update = (patch: Partial<Settings>) => onChange({ ...settings, ...patch })

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onLogoChange) {
      const reader = new FileReader()
      reader.onload = (event) => {
        onLogoChange(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onFileUpload) {
      onFileUpload(file)
      // Reset the input so the same file can be uploaded again if needed
      e.target.value = ''
    }
  }

  return (
    <form className="settings" onSubmit={(e) => e.preventDefault()}>
      <label>
        Organization Name
        <input value={settings.organizationName} onChange={(e) => update({ organizationName: e.target.value })} placeholder="Enter organization name" />
      </label>

      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="logo-upload" style={{ cursor: 'pointer', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f8f8f8', display: 'inline-block' }}>
          {logo ? 'Change Logo' : 'Upload Logo'}
        </label>
        <input
          id="logo-upload"
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          style={{ display: 'none' }}
        />
        {logo && (
          <button
            onClick={() => onLogoChange?.(null)}
            style={{ marginLeft: 8, padding: '8px 12px', cursor: 'pointer' }}
            title="Remove logo"
            type="button"
          >
            ✕ Remove
          </button>
        )}
      </div>

      <div style={{ 
        marginBottom: '20px', 
        padding: '16px', 
        border: '2px dashed #4CAF50', 
        borderRadius: '8px', 
        backgroundColor: '#f1f8f4',
        textAlign: 'center'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '14px', color: '#2e7d32' }}>
          Upload Previously Downloaded Excel
        </h3>
        <p style={{ fontSize: '12px', color: '#555', marginBottom: '12px' }}>
          Skip the form! Upload an Excel file you previously downloaded to regenerate the table.
        </p>
        <label htmlFor="excel-upload" style={{ 
          cursor: 'pointer', 
          padding: '10px 20px', 
          border: '1px solid #4CAF50', 
          borderRadius: '4px', 
          backgroundColor: '#4CAF50', 
          color: 'white',
          display: 'inline-block',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          📤 Upload Excel File
        </label>
        <input
          id="excel-upload"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleExcelUpload}
          style={{ display: 'none' }}
        />
      </div>

      <label>
        ZIP code
        <input value={settings.zip} onChange={(e) => update({ zip: e.target.value })} />
      </label>

      <label>
        Asr School
        <select value={settings.school} onChange={(e) => update({ school: e.target.value as any })}>
          <option>Shafi</option>
          <option>Hanafi</option>
        </select>
      </label>

      <label>
      Calendar
      <select value={settings.calendar} onChange={(e) => {const cal = e.target.value as 'Gregorian' | 'Hijri'
      // optional: reset month back to 1 when switching calendars
        update({ calendar: cal, month: 1 })}}>  
          <option value="Gregorian">Gregorian</option>
          <option value="Hijri">Hijri</option>
        </select>
      </label>

      <label>
        Month
        <select value={settings.month} onChange={(e) => update({ month: Number(e.target.value) })}>
        {(settings.calendar === 'Hijri' ? HIJRI_MONTHS : GREGORIAN_MONTHS).map((m, i) => (
        <option key={m} value={i + 1}>
        {m}
      </option>
    ))}
        </select>
    </label>

      <fieldset>
        <legend>Jumu'ah (Friday Prayers)</legend>
        <label>
          Number of Jumu'ah Prayers
          <select value={settings.jumuahCount} onChange={(e) => {
            const count = Number(e.target.value)
            const times = Array(count).fill('').map((_, i) => settings.jumuahTimes[i] || '')
            update({ jumuahCount: count, jumuahTimes: times })
          }}>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </label>

        {Array.from({ length: settings.jumuahCount }).map((_, i) => (
          <label key={i}>
            Jumu'ah {i + 1} Start Time
            <input
              type="text"
              placeholder="HH:MM AM/PM"
              value={settings.jumuahTimes[i] || ''}
              onChange={(e) => {
                const newTimes = [...settings.jumuahTimes]
                newTimes[i] = e.target.value
                update({ jumuahTimes: newTimes })
              }}
            />
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Fajr Iqama</legend>
        <label>
          <input type="radio" checked={settings.fajrMode === 'dynamic'} onChange={() => update({ fajrMode: 'dynamic' })} />
          Dynamic (offset)
        </label>
        <label>
          Offset minutes
          <input type="number" value={settings.fajrOffset} onChange={(e) => update({ fajrOffset: Number(e.target.value) })} />
        </label>
        <label>
          <input type="radio" checked={settings.fajrMode === 'static'} onChange={() => update({ fajrMode: 'static' })} />
          Static time
        </label>
        <label>
          Time (HH:MM AM/PM)
          <input
            type="text"
            placeholder="5:00 AM"
            value={settings.fajrStatic}
            onChange={(e) => update({ fajrStatic: e.target.value })}
            pattern="^(0?[1-9]|1[0-2]):[0-5][0-9]\s*(AM|PM|am|pm)$"
            title="Format: H:MM AM/PM (e.g., 5:00 AM)"
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>Zohar (Dhuhr) Iqama</legend>
        <label>
          <input type="radio" checked={settings.zoharMode === 'dynamic'} onChange={() => update({ zoharMode: 'dynamic' })} />
          Dynamic (offset)
        </label>
        <label>
          Offset minutes
          <input type="number" value={settings.zoharOffset} onChange={(e) => update({ zoharOffset: Number(e.target.value) })} />
        </label>
        <label>
          <input type="radio" checked={settings.zoharMode === 'static'} onChange={() => update({ zoharMode: 'static' })} />
          Static time
        </label>
        <label>
          Time (HH:MM AM/PM)
          <input
            type="text"
            placeholder="1:15 PM"
            value={settings.zoharStatic}
            onChange={(e) => update({ zoharStatic: e.target.value })}
            pattern="^(0?[1-9]|1[0-2]):[0-5][0-9]\s*(AM|PM|am|pm)$"
            title="Format: H:MM AM/PM (e.g., 1:15 PM)"
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>Asr Iqama</legend>
        <label>
          <input type="radio" checked={settings.asrMode === 'dynamic'} onChange={() => update({ asrMode: 'dynamic' })} />
          Dynamic (offset)
        </label>
        <label>
          Offset minutes
          <input type="number" value={settings.asrOffset} onChange={(e) => update({ asrOffset: Number(e.target.value) })} />
        </label>
        <label>
          <input type="radio" checked={settings.asrMode === 'static'} onChange={() => update({ asrMode: 'static' })} />
          Static time
        </label>
        <label>
          Time (HH:MM AM/PM)
          <input
            type="text"
            placeholder="3:30 PM"
            value={settings.asrStatic}
            onChange={(e) => update({ asrStatic: e.target.value })}
            pattern="^(0?[1-9]|1[0-2]):[0-5][0-9]\s*(AM|PM|am|pm)$"
            title="Format: H:MM AM/PM (e.g., 3:30 PM)"
          />
        </label>
      </fieldset>

      <fieldset style={{ border: '1px solid #ccc', padding: 8 }}>
        <legend>Maghrib Iqama</legend>
        <label>
          Offset (minutes)
          <input type="number" value={settings.maghribOffset} onChange={(e) => update({ maghribOffset: Number(e.target.value) })} />
        </label>
      </fieldset>

      <fieldset>
        <legend>Isha Iqama</legend>
        <label>
          <input type="radio" checked={settings.ishaMode === 'dynamic'} onChange={() => update({ ishaMode: 'dynamic' })} />
          Dynamic (offset)
        </label>
        <label>
          Offset minutes
          <input type="number" value={settings.ishaOffset} onChange={(e) => update({ ishaOffset: Number(e.target.value) })} />
        </label>
        <label>
          <input type="radio" checked={settings.ishaMode === 'static'} onChange={() => update({ ishaMode: 'static' })} />
          Static time
        </label>
        <label>
          Time (HH:MM AM/PM)
          <input
            type="text"
            placeholder="8:30 PM"
            value={settings.ishaStatic}
            onChange={(e) => update({ ishaStatic: e.target.value })}
            pattern="^(0?[1-9]|1[0-2]):[0-5][0-9]\s*(AM|PM|am|pm)$"
            title="Format: H:MM AM/PM (e.g., 8:30 PM)"
          />
        </label>
      </fieldset>

      <label>
        Include Sunrise
        <input type="checkbox" checked={settings.includeSunrise} onChange={(e) => update({ includeSunrise: e.target.checked })} />
      </label>

      <label>
        Show AM/PM (12-hour format)
        <input type="checkbox" checked={settings.use12HourFormat} onChange={(e) => update({ use12HourFormat: e.target.checked })} />
      </label>

      <div style={{ marginTop: 12 }}>
        <button type="button" onClick={() => onGenerate && onGenerate()}>
          Generate Table
        </button>
      </div>
    </form>
  )
}

