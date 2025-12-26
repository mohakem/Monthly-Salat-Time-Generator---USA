import React, { useEffect, useState } from 'react'
import SettingsForm, { Settings } from './components/SettingsForm'
import MonthlySchedule from './pages/MonthlySchedule'

const STORAGE_KEY = 'prayer_settings_v1'

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw
      ? JSON.parse(raw)
      : {
          zip: '10001',
          school: 'Shafi',
          month: new Date().getMonth() + 1,
              fajrMode: 'dynamic',
              fajrStatic: '5:00 AM',
              fajrOffset: 10,
          maghribOffset: 10,
          ishaMode: 'dynamic',
          ishaStatic: '8:30 PM',
          ishaOffset: 10,
              asrMode: 'dynamic',
              asrStatic: '3:30 PM',
              asrOffset: 10,
          zoharMode: 'dynamic',
          zoharStatic: '1:15 PM',
          zoharOffset: 10,
          includeSunrise: true
        }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const [generateSignal, setGenerateSignal] = useState<number | undefined>(undefined)

  return (
    <div className="container">
      <header>
        <h1>Monthly Prayer Time Generator</h1>
      </header>
      <main>
        <aside>
          <SettingsForm
            settings={settings}
            onChange={setSettings}
            onGenerate={() => setGenerateSignal((s) => (s ?? 0) + 1)}
          />
        </aside>
        <section>
          <MonthlySchedule settings={settings} generateSignal={generateSignal} />
        </section>
      </main>
    </div>
  )
}
