export type Coordinates = {
  lat: number
  lon: number
}

export type MonthlyPrayerData = {
  date: any // Aladhan returns a date object with `gregorian` and `hijri` fields
  timings: Record<string, string>
}
