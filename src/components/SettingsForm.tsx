import React from 'react'

export type Settings = {
  zip: string
  school: 'Shafi' | 'Hanafi'
  month: number
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
}

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

export default function SettingsForm({ settings, onChange, onGenerate }: { settings: Settings; onChange: (s: Settings) => void; onGenerate?: () => void }) {
  const update = (patch: Partial<Settings>) => onChange({ ...settings, ...patch })

  return (
    <form className="settings" onSubmit={(e) => e.preventDefault()}>
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
        Month
        <select value={settings.month} onChange={(e) => update({ month: Number(e.target.value) })}>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
      </label>


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
          Time (HH:MM)
          <input value={settings.fajrStatic} onChange={(e) => update({ fajrStatic: e.target.value })} />
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
          Time (HH:MM)
          <input value={settings.zoharStatic} onChange={(e) => update({ zoharStatic: e.target.value })} />
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
          Time (HH:MM)
          <input value={settings.asrStatic} onChange={(e) => update({ asrStatic: e.target.value })} />
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
          Time (HH:MM)
          <input value={settings.ishaStatic} onChange={(e) => update({ ishaStatic: e.target.value })} />
        </label>
      </fieldset>

      <label>
        Include Sunrise
        <input type="checkbox" checked={settings.includeSunrise} onChange={(e) => update({ includeSunrise: e.target.checked })} />
      </label>

      <div style={{ marginTop: 12 }}>
        <button type="button" onClick={() => onGenerate && onGenerate()}>
          Generate Table
        </button>
      </div>
    </form>
  )
}

