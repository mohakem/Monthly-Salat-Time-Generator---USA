// Copyright 2026 Mohakem Khan
// Licensed under the Apache License, Version 2.0

export type Coordinates = {
  lat: number
  lon: number
}

export type MonthlyPrayerData = {
  date: any // Aladhan returns a date object with `gregorian` and `hijri` fields
  timings: Record<string, string>
}
