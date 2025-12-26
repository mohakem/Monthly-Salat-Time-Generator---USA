import { Coordinates, MonthlyPrayerData } from '../types'

async function geocodeZip(zip: string): Promise<Coordinates> {
  const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
  if (!res.ok) throw new Error('ZIP not found')
  const j = await res.json()
  const place = j.places && j.places[0]
  return { lat: parseFloat(place.latitude), lon: parseFloat(place.longitude) }
}

export async function getMonthlyByZip(zip: string, year: number, month: number, school: string) {
  const coords = await geocodeZip(zip)
  const url = `https://api.aladhan.com/v1/calendar?latitude=${coords.lat}&longitude=${coords.lon}&method=2&month=${month}&year=${year}&school=${school === 'Hanafi' ? 1 : 0}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Aladhan API error')
  const j = await res.json()
  // Normalize
  const data: MonthlyPrayerData[] = j.data.map((d: any) => ({
    date: d.date,
    timings: d.timings
  }))
  return data
}
