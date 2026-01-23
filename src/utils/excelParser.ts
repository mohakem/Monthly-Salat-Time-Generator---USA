// Copyright 2026 Mohakem Khan
// Licensed under the Apache License, Version 2.0

import * as XLSX from 'xlsx'

export interface ParsedExcelData {
  date: string // MM-DD-YYYY format
  fajr: string
  fajrIqama: string
  sunrise: string
  dhuhr: string
  dhuhrIqama: string
  asr: string
  asrIqama: string
  maghrib: string
  maghribIqama: string
  isha: string
  ishaIqama: string
}

export function parseExcelFile(file: File): Promise<ParsedExcelData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
        
        if (jsonData.length < 2) {
          throw new Error('Excel file is empty or invalid')
        }
        
        // Find the header row (should contain 'Date', 'Fajr', etc.)
        let headerRowIndex = -1
        for (let i = 0; i < Math.min(5, jsonData.length); i++) {
          const row = jsonData[i]
          if (row && row.some(cell => cell && String(cell).toLowerCase().includes('date'))) {
            headerRowIndex = i
            break
          }
        }
        
        if (headerRowIndex === -1) {
          throw new Error('Could not find header row in Excel file')
        }
        
        const headers = jsonData[headerRowIndex].map((h: any) => String(h).toLowerCase().trim())
        
        // Map column indices
        const colMap = {
          date: headers.findIndex(h => h === 'date'),
          fajr: headers.findIndex(h => h === 'fajr'),
          fajrIqama: headers.findIndex(h => h.includes('fajr') && h.includes('iqama')),
          sunrise: headers.findIndex(h => h === 'sunrise'),
          dhuhr: headers.findIndex(h => h === 'dhuhr'),
          dhuhrIqama: headers.findIndex(h => h.includes('dhuhr') && h.includes('iqama')),
          asr: headers.findIndex(h => h === 'asr'),
          asrIqama: headers.findIndex(h => h.includes('asr') && h.includes('iqama')),
          maghrib: headers.findIndex(h => h === 'maghrib'),
          maghribIqama: headers.findIndex(h => h.includes('maghrib') && h.includes('iqama')),
          isha: headers.findIndex(h => h === 'isha'),
          ishaIqama: headers.findIndex(h => h.includes('isha') && h.includes('iqama'))
        }
        
        // Validate that we found all required columns
        const missingColumns = Object.entries(colMap)
          .filter(([_, index]) => index === -1)
          .map(([key, _]) => key)
        
        if (missingColumns.length > 0) {
          throw new Error(`Missing columns in Excel file: ${missingColumns.join(', ')}`)
        }
        
        // Parse data rows
        const parsedData: ParsedExcelData[] = []
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i]
          if (!row || !row[colMap.date]) continue
          
          try {
            parsedData.push({
              date: String(row[colMap.date]).trim(),
              fajr: String(row[colMap.fajr] || '').trim(),
              fajrIqama: String(row[colMap.fajrIqama] || '').trim(),
              sunrise: String(row[colMap.sunrise] || '').trim(),
              dhuhr: String(row[colMap.dhuhr] || '').trim(),
              dhuhrIqama: String(row[colMap.dhuhrIqama] || '').trim(),
              asr: String(row[colMap.asr] || '').trim(),
              asrIqama: String(row[colMap.asrIqama] || '').trim(),
              maghrib: String(row[colMap.maghrib] || '').trim(),
              maghribIqama: String(row[colMap.maghribIqama] || '').trim(),
              isha: String(row[colMap.isha] || '').trim(),
              ishaIqama: String(row[colMap.ishaIqama] || '').trim()
            })
          } catch (err) {
            console.warn(`Skipping invalid row ${i}:`, err)
          }
        }
        
        if (parsedData.length === 0) {
          throw new Error('No valid data rows found in Excel file')
        }
        
        resolve(parsedData)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'))
    }
    
    reader.readAsBinaryString(file)
  })
}
