import React, { useEffect, useState } from 'react'
import SettingsForm, { Settings } from './components/SettingsForm'
import MonthlySchedule from './pages/MonthlySchedule'

const STORAGE_KEY = 'prayer_settings_v1'

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    
    // Apply defaults for missing fields
    const defaults = {
      organizationName: '',
      zip: '10001',
      school: 'Shafi',
      calendar: 'Gregorian',
      month: new Date().getMonth() + 1,
      jumuahCount: 1,
      jumuahTimes: ['1:00 PM'],
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
    
    return parsed ? { ...defaults, ...parsed } : defaults
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const [generateSignal, setGenerateSignal] = useState<number | undefined>(undefined)
  const [logo, setLogo] = useState<string | null>(null)

  return (
    <div className="container">
      <header>
        <h1>Monthly Prayer Time Generator</h1>
        <div style={{ 
          backgroundColor: '#f0f7ff', 
          border: '1px solid #b3d9ff', 
          borderRadius: '6px', 
          padding: '16px', 
          marginTop: '16px',
          fontSize: '14px',
          lineHeight: '1.6'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '10px', fontSize: '16px' }}>How to Use:</h3>
          <ol style={{ marginBottom: 0, paddingLeft: '20px' }}>
            <li><strong>Configure Settings:</strong> Enter your ZIP code, select calculation method, choose calendar type (Gregorian or Hijri), and set your preferred month.</li>
            <li><strong>Set Iqama Times:</strong> Choose between static (fixed) or dynamic (offset from prayer time) modes for each prayer. Configure Jumu'ah prayer times separately.</li>
            <li><strong>Generate Table:</strong> Click "Generate Table" to view the monthly prayer schedule.</li>
            <li><strong>Adjust Times:</strong> Type custom Iqama times in any cell. Changes apply to that date and all following dates in the month.</li>
            <li><strong>Export:</strong> Download your schedule as Excel or PDF format for printing or sharing.</li>
          </ol>
        </div>
      </header>
      <main>
        <aside>
          <SettingsForm
            settings={settings}
            onChange={setSettings}
            onGenerate={() => setGenerateSignal((s) => (s ?? 0) + 1)}
            logo={logo}
            onLogoChange={setLogo}
          />
        </aside>
        <section>
          <MonthlySchedule settings={settings} generateSignal={generateSignal} logo={logo} />
        </section>
      </main>
    </div>
  )
}
