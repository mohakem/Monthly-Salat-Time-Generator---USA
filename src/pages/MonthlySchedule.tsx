import React, { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
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
  // Use Date constructor with year, month (0-indexed), day to avoid timezone issues
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
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

function otherCalendarLabel(calendar: 'Gregorian' | 'Hijri') {
  return calendar === 'Hijri' ? 'Gregorian' : 'Hijri'
}

function getCalendarDate(d: any, cal: 'Gregorian' | 'Hijri') {
  return cal === 'Hijri' ? d.date.hijri.date : d.date.gregorian.date
}

function getFormattedCalendarDate(d: any, cal: 'Gregorian' | 'Hijri'): string {
  if (cal === 'Hijri') {
    const day = getDayNumber(d.date.hijri.date)
    const month = d.date.hijri.month.en.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ʿʾ]/g, '')
    return `${month} ${day}`
  } else {
    const day = getDayNumber(d.date.gregorian.date)
    const month = d.date.gregorian.month.en
    return `${month} ${day}`
  }
}

export default function MonthlySchedule({ settings, generateSignal, logo }: { settings: Settings; generateSignal?: number; logo?: string | null }) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generated, setGenerated] = useState(false)
  const [iqamaOverrides, setIqamaOverrides] = useState<Record<string, Partial<Record<'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha', string>>>>({})
  const [specialNotes, setSpecialNotes] = useState<string>('')

  const updateIqamaOverride = (date: string, prayer: string, value: string) => {
    setIqamaOverrides((prev) => {
      const updated = { ...prev }
      if (value) {
        // Validate that the iqama time is after the prayer time
        const dateIndex = data.findIndex((d) => d.date.gregorian.date === date)
        if (dateIndex >= 0) {
          const dayData = data[dateIndex]
          const prayerTimeStr = dayData.timings[prayer as keyof typeof dayData.timings]
          const prayerTime = parseTiming(date, prayerTimeStr)
          
          // Try to parse the input value
          try {
            const iqamaTime = parseTiming(date, value)
            if (iqamaTime <= prayerTime) {
              alert('Iqama time is provided earlier than prayer start time')
              return prev // Don't update, keep previous state
            }
          } catch (e) {
            // Invalid format, but let it through for now - user might still be typing
            // The existing validation will catch it
          }
        }
        
        // Find the index of this date and apply to all subsequent dates
        for (let i = dateIndex; i < data.length; i++) {
          const currentDate = data[i].date.gregorian.date
          const dayOfWeek = getDayOfWeek(currentDate)
          // Skip Friday Dhuhr (it's handled by Jummah times)
          if (prayer === 'Dhuhr' && dayOfWeek === 'Fri') {
            continue
          }
          updated[currentDate] = { ...updated[currentDate], [prayer]: value }
        }
      } else {
        // Clear override for this date only
        if (updated[date]) {
          const prayers = updated[date] as any
          delete prayers[prayer]
        }
      }
      return updated
    })
  }

  const fetchData = () => {
    setLoading(true)
    setError(null)
    // For Hijri calendar, use approximate Hijri year (Gregorian - 579)
    // For Gregorian calendar, use current Gregorian year
    const gregorianYear = new Date().getFullYear()
    const year = settings.calendar === 'Hijri' ? gregorianYear - 579 : gregorianYear
    getMonthlyByZip(settings.zip, year, settings.month, settings.school, settings.calendar as any)
      .then((d) => setData(d))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }

  const downloadExcel = () => {
    if (data.length === 0) {
      alert('No data to export. Please generate the table first.')
      return
    }
    
    const year = new Date().getFullYear()
    const rows = data.map((d) => {
      const gregDate = d.date.gregorian.date
      const timings = d.timings
      const overrides = iqamaOverrides[gregDate] || {}
      const iqamas = {
        Fajr:
          settings.fajrMode === 'static'
            ? computeIqama(gregDate, timings.Fajr, { mode: 'static', time: settings.fajrStatic })
            : computeIqama(gregDate, timings.Fajr, { mode: 'dynamic', offsetMinutes: settings.fajrOffset }),
        Dhuhr:
          settings.zoharMode === 'static'
            ? computeIqama(gregDate, timings.Dhuhr, { mode: 'static', time: settings.zoharStatic })
            : computeIqama(gregDate, timings.Dhuhr, { mode: 'dynamic', offsetMinutes: settings.zoharOffset }),
        Asr:
          settings.asrMode === 'static'
            ? computeIqama(gregDate, timings.Asr, { mode: 'static', time: settings.asrStatic })
            : computeIqama(gregDate, timings.Asr, { mode: 'dynamic', offsetMinutes: settings.asrOffset }),
        Maghrib: computeIqama(gregDate, timings.Maghrib, { mode: 'dynamic', offsetMinutes: settings.maghribOffset }),
        Isha:
          settings.ishaMode === 'static'
            ? computeIqama(gregDate, timings.Isha, { mode: 'static', time: settings.ishaStatic })
            : computeIqama(gregDate, timings.Isha, { mode: 'dynamic', offsetMinutes: settings.ishaOffset })
      }
      return {
        Date: gregDate,
        Fajr: formatTime(parseTiming(gregDate, timings.Fajr)),
        'Fajr Iqama': overrides.Fajr || formatTime(iqamas.Fajr),
        Sunrise: formatTime(parseTiming(gregDate, timings.Sunrise)),
        Dhuhr: formatTime(parseTiming(gregDate, timings.Dhuhr)),
        'Dhuhr Iqama': overrides.Dhuhr || formatTime(iqamas.Dhuhr),
        Asr: formatTime(parseTiming(gregDate, timings.Asr)),
        'Asr Iqama': overrides.Asr || formatTime(iqamas.Asr),
        Maghrib: formatTime(parseTiming(gregDate, timings.Maghrib)),
        'Maghrib Iqama': overrides.Maghrib || formatTime(iqamas.Maghrib),
        Isha: formatTime(parseTiming(gregDate, timings.Isha)),
        'Isha Iqama': overrides.Isha || formatTime(iqamas.Isha)
      }
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    
    // Center align all cells
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
        if (!ws[cellAddress]) continue
        if (!ws[cellAddress].s) ws[cellAddress].s = {}
        ws[cellAddress].s.alignment = { horizontal: 'center', vertical: 'center' }
      }
    }
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Prayer Times')
    XLSX.writeFile(wb, `prayer-times-${settings.month}-${year}.xlsx`)
  }

  const downloadPDF = () => {
    if (data.length === 0) {
      alert('No data to export. Please generate the table first.')
      return
    }
    
    const year = new Date().getFullYear()
    const doc = new jsPDF('p', 'mm', 'a4')
    
    // Add logo and organization name
    let startY = 10
    const pageWidth = doc.internal.pageSize.getWidth()
    
    if (logo && settings.organizationName) {
      // Both logo and organization name - side by side
      const logoHeight = 15
      const logoWidth = 15
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      
      // Calculate total width needed
      const textWidth = doc.getTextWidth(settings.organizationName)
      const totalWidth = logoWidth + 5 + textWidth // 5mm gap between logo and text
      const startX = (pageWidth - totalWidth) / 2
      
      // Add logo on the left
      doc.addImage(logo, 'PNG', startX, startY, logoWidth, logoHeight)
      
      // Add organization name on the right, vertically centered with logo
      const textY = startY + (logoHeight / 2) + 3 // Adjust vertical alignment
      doc.text(settings.organizationName, startX + logoWidth + 5, textY)
      
      startY += logoHeight + 4
    } else if (logo) {
      // Only logo - centered
      const logoHeight = 15
      const logoWidth = 15
      doc.addImage(logo, 'PNG', (pageWidth - logoWidth) / 2, startY, logoWidth, logoHeight)
      startY += logoHeight + 2
    } else if (settings.organizationName) {
      // Only organization name - centered
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(settings.organizationName, pageWidth / 2, startY, { align: 'center' })
      startY += 6
    }
    
    // Add title
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    const firstDay = data[0]
    const lastDay = data[data.length - 1]
    
    // Sanitize month names to remove special characters
    const monthName = settings.calendar === 'Hijri'
      ? firstDay.date.hijri.month.en.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ʿʾ]/g, '')
      : firstDay.date.gregorian.month.en
    const yearText = settings.calendar === 'Hijri'
      ? firstDay.date.hijri.year
      : firstDay.date.gregorian.year
    const monthYearText = `${monthName} ${yearText}`
    
    // Get alternative calendar range
    const altFirstMonth = settings.calendar === 'Hijri'
      ? firstDay.date.gregorian.month.en.substring(0, 3)
      : firstDay.date.hijri.month.en.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ʿʾ]/g, '')
    const altLastMonth = settings.calendar === 'Hijri'
      ? lastDay.date.gregorian.month.en.substring(0, 3)
      : lastDay.date.hijri.month.en.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ʿʾ]/g, '')
    const altFirstYear = settings.calendar === 'Hijri'
      ? String(firstDay.date.gregorian.year).substring(2)
      : firstDay.date.hijri.year
    const altLastYear = settings.calendar === 'Hijri'
      ? String(lastDay.date.gregorian.year).substring(2)
      : lastDay.date.hijri.year
    
    const altCalendarText = altFirstMonth === altLastMonth && altFirstYear === altLastYear
      ? `${altFirstMonth} '${altFirstYear}`
      : `${altFirstMonth} '${altFirstYear} - ${altLastMonth} '${altLastYear}`
    
    const titleText = `Monthly Prayer Schedule - ${monthYearText} (${altCalendarText})`
    doc.text(titleText, pageWidth / 2, startY, { align: 'center' })
    startY += 2
    
    // Prepare table data with Iqama values
    const rawTableData = data.map((d) => {
      const gregDate = d.date.gregorian.date
      const primaryDate = getCalendarDate(d, settings.calendar as any)
      const otherDate = getFormattedCalendarDate(d, otherCalendarLabel(settings.calendar as any) as any)
      const dayNum = getDayNumber(primaryDate)
      const dayOfWeek = getDayOfWeek(gregDate)
      const timings = d.timings
      const overrides = iqamaOverrides[gregDate] || {}
      
      const iqamas = {
        Fajr:
          settings.fajrMode === 'static'
            ? computeIqama(gregDate, timings.Fajr, { mode: 'static', time: settings.fajrStatic })
            : computeIqama(gregDate, timings.Fajr, { mode: 'dynamic', offsetMinutes: settings.fajrOffset }),
        Dhuhr:
          settings.zoharMode === 'static'
            ? computeIqama(gregDate, timings.Dhuhr, { mode: 'static', time: settings.zoharStatic })
            : computeIqama(gregDate, timings.Dhuhr, { mode: 'dynamic', offsetMinutes: settings.zoharOffset }),
        Asr:
          settings.asrMode === 'static'
            ? computeIqama(gregDate, timings.Asr, { mode: 'static', time: settings.asrStatic })
            : computeIqama(gregDate, timings.Asr, { mode: 'dynamic', offsetMinutes: settings.asrOffset }),
        Maghrib: computeIqama(gregDate, timings.Maghrib, { mode: 'dynamic', offsetMinutes: settings.maghribOffset }),
        Isha:
          settings.ishaMode === 'static'
            ? computeIqama(gregDate, timings.Isha, { mode: 'static', time: settings.ishaStatic })
            : computeIqama(gregDate, timings.Isha, { mode: 'dynamic', offsetMinutes: settings.ishaOffset })
      }
      
      const isFriday = dayOfWeek === 'Fri'
      const jumuahTimes = settings.jumuahTimes || []
      const dhuhrIqamaText = isFriday 
        ? jumuahTimes.join('\n')
        : (overrides.Dhuhr || formatTime(iqamas.Dhuhr))
      
      return {
        dayNum,
        otherDate,
        dayOfWeek,
        fajrTime: formatTime(parseTiming(gregDate, timings.Fajr)),
        fajrIqama: overrides.Fajr || formatTime(iqamas.Fajr),
        sunrise: formatTime(parseTiming(gregDate, timings.Sunrise)),
        dhuhrTime: formatTime(parseTiming(gregDate, timings.Dhuhr)),
        dhuhrIqama: dhuhrIqamaText,
        asrTime: formatTime(parseTiming(gregDate, timings.Asr)),
        asrIqama: overrides.Asr || formatTime(iqamas.Asr),
        maghribTime: formatTime(parseTiming(gregDate, timings.Maghrib)),
        maghribIqama: overrides.Maghrib || formatTime(iqamas.Maghrib),
        ishaTime: formatTime(parseTiming(gregDate, timings.Isha)),
        ishaIqama: overrides.Isha || formatTime(iqamas.Isha),
        isFriday
      }
    })

    // Calculate rowSpans for Iqama columns (indices 4, 7, 9, 11, 13)
    const iqamaColumns = [
      { index: 4, key: 'fajrIqama' },
      { index: 7, key: 'dhuhrIqama' },
      { index: 9, key: 'asrIqama' },
      { index: 11, key: 'maghribIqama' },
      { index: 13, key: 'ishaIqama' }
    ]
    
    const rowSpans: Record<number, Record<number, number>> = {}
    
    iqamaColumns.forEach(({ index, key }) => {
      let i = 0
      while (i < rawTableData.length) {
        const currentValue = rawTableData[i][key as keyof typeof rawTableData[0]]
        let span = 1
        
        // Count consecutive rows with same value
        while (i + span < rawTableData.length && 
               rawTableData[i + span][key as keyof typeof rawTableData[0]] === currentValue) {
          span++
        }
        
        // Store rowSpan if greater than 1
        if (span > 1) {
          if (!rowSpans[i]) rowSpans[i] = {}
          rowSpans[i][index] = span
        }
        
        i += span
      }
    })
    
    // Build final table data with rowSpan information
    const tableData = rawTableData.map((row, rowIndex) => {
      const baseRow = [
        row.dayNum,
        row.otherDate,
        row.dayOfWeek,
        row.fajrTime,
        row.fajrIqama,
        row.sunrise,
        row.dhuhrTime,
        row.dhuhrIqama,
        row.asrTime,
        row.asrIqama,
        row.maghribTime,
        row.maghribIqama,
        row.ishaTime,
        row.ishaIqama
      ]
      
      return baseRow
    })
    
    autoTable(doc, {
      startY: startY + 3,
      head: [[
        'Date',
        otherCalendarLabel(settings.calendar as any),
        'Day',
        'Fajr',
        'Fajr Iqama',
        'Sunrise',
        'Dhuhr',
        'Dhuhr Iqama',
        'Asr',
        'Asr Iqama',
        'Sunset Maghrib',
        'Maghrib Iqama',
        'Isha',
        'Isha Iqama'
      ]],
      body: tableData,
      styles: {
        fontSize: 6.2,
        cellPadding: 0.6,
        overflow: 'linebreak',
        halign: 'center',
        minCellHeight: 5,
        valign: 'middle'
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 6.8,
        minCellHeight: 5,
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 7 },   // Date
        1: { cellWidth: 16 },  // Other calendar
        2: { cellWidth: 9 },   // Day
        3: { cellWidth: 11 },  // Fajr
        4: { cellWidth: 12 },  // Fajr Iqama
        5: { cellWidth: 11 },  // Sunrise
        6: { cellWidth: 11 },  // Dhuhr
        7: { cellWidth: 12 },  // Dhuhr Iqama (wider for multiple Jumu'ah times)
        8: { cellWidth: 11 },  // Asr
        9: { cellWidth: 12 },  // Asr Iqama
        10: { cellWidth: 14 }, // Maghrib (wider for "Sunset/Maghrib")
        11: { cellWidth: 12 }, // Maghrib Iqama
        12: { cellWidth: 11 }, // Isha
        13: { cellWidth: 12 }  // Isha Iqama
      },
      didParseCell: (cellData: any) => {
        // Make Friday rows bold
        if (cellData.section === 'body' && cellData.column.index === 2) {
          const cellText = cellData.cell.text[0]
          if (cellText === 'Fri') {
            Object.values(cellData.row.cells).forEach((cell: any) => {
              cell.styles.fontStyle = 'bold'
            })
          }
        }
        
        // Apply rowSpan for Iqama columns
        if (cellData.section === 'body') {
          const rowIndex = cellData.row.index
          const colIndex = cellData.column.index
          
          if (rowSpans[rowIndex] && rowSpans[rowIndex][colIndex]) {
            cellData.cell.rowSpan = rowSpans[rowIndex][colIndex]
          }
        }
      },
      margin: { top: 8, bottom: 8, left: 20, right: 20 },
      tableWidth: 'wrap',
      pageBreak: 'avoid'
    })
    
    // Add special notes at the bottom if provided
    if (specialNotes) {
      const finalY = (doc as any).lastAutoTable.finalY || startY + 3
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Notes:', 20, finalY + 8)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      const splitNotes = doc.splitTextToSize(specialNotes, pageWidth - 40)
      doc.text(splitNotes, 20, finalY + 14)
    }
    
    doc.save(`prayer-times-${settings.month}-${year}.pdf`)
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
        <button onClick={downloadPDF} style={{ marginLeft: 8 }}>
          Download as PDF
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
          Special Notes (will appear at bottom of PDF):
        </label>
        <textarea
          value={specialNotes}
          onChange={(e) => setSpecialNotes(e.target.value)}
          placeholder="Enter any special notes or announcements..."
          rows={3}
          style={{
            width: '100%',
            padding: '8px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
        />
      </div>

      <table className="schedule">
        <thead>
          {settings.organizationName && (
            <tr>
              <th colSpan={15} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '18px', padding: '8px' }}>
                {settings.organizationName}
              </th>
            </tr>
          )}
          <tr>
            <th colSpan={15} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', padding: '8px' }}>
              {data.length > 0 ? (() => {
                const firstDay = data[0]
                const lastDay = data[data.length - 1]
                
                const monthName = settings.calendar === 'Hijri'
                  ? firstDay.date.hijri.month.en.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ʿʾ]/g, '')
                  : firstDay.date.gregorian.month.en
                const yearText = settings.calendar === 'Hijri'
                  ? firstDay.date.hijri.year
                  : firstDay.date.gregorian.year
                
                // Get alternative calendar range
                const altFirstMonth = settings.calendar === 'Hijri'
                  ? firstDay.date.gregorian.month.en.substring(0, 3)
                  : firstDay.date.hijri.month.en.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ʿʾ]/g, '')
                const altLastMonth = settings.calendar === 'Hijri'
                  ? lastDay.date.gregorian.month.en.substring(0, 3)
                  : lastDay.date.hijri.month.en.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ʿʾ]/g, '')
                const altFirstYear = settings.calendar === 'Hijri'
                  ? String(firstDay.date.gregorian.year).substring(2)
                  : firstDay.date.hijri.year
                const altLastYear = settings.calendar === 'Hijri'
                  ? String(lastDay.date.gregorian.year).substring(2)
                  : lastDay.date.hijri.year
                
                const altCalendarText = altFirstMonth === altLastMonth && altFirstYear === altLastYear
                  ? `${altFirstMonth} '${altFirstYear}`
                  : `${altFirstMonth} '${altFirstYear} - ${altLastMonth} '${altLastYear}`
                
                return `Monthly Prayer Schedule - ${monthName} ${yearText} (${altCalendarText})`
              })() : `Monthly Prayer Schedule - ${getMonthYearDisplay(settings.month, new Date().getFullYear())}`}
            </th>
          </tr>
          <tr>
            <th style={{ textAlign: 'center' }}>Date</th>
            <th style={{ textAlign: 'center' }}>{otherCalendarLabel(settings.calendar as any)}</th>
            <th style={{ textAlign: 'center' }}>Day</th>
            <th style={{ textAlign: 'center' }}>Fajr</th>
            <th style={{ textAlign: 'center' }}>Fajr Iqama</th>
            <th style={{ textAlign: 'center' }}>Sunrise</th>

            <th style={{ textAlign: 'center' }}>Dhuhr</th>
            <th style={{ textAlign: 'center' }}>Dhuhr Iqama</th>

            <th style={{ textAlign: 'center' }}>Asr</th>
            <th style={{ textAlign: 'center' }}>Asr Iqama</th>

            <th style={{ textAlign: 'center' }}>Sunset Maghrib</th>
            <th style={{ textAlign: 'center' }}>Maghrib Iqama</th>

            <th style={{ textAlign: 'center' }}>Isha</th>
            <th style={{ textAlign: 'center' }}>Isha Iqama</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => {
            const gregDate = d.date.gregorian.date
            const primaryDate = getCalendarDate(d, settings.calendar as any)
            const otherDate = getFormattedCalendarDate(d, otherCalendarLabel(settings.calendar as any) as any)

            const dayNum = getDayNumber(primaryDate)      // day-of-month in selected calendar
            const dayOfWeek = getDayOfWeek(gregDate)      // weekday from actual civil date

            const timings = d.timings
            const iqamas = {
              Fajr:
                settings.fajrMode === 'static'
                  ? computeIqama(gregDate, timings.Fajr, { mode: 'static', time: settings.fajrStatic })
                  : computeIqama(gregDate, timings.Fajr, { mode: 'dynamic', offsetMinutes: settings.fajrOffset }),
              Dhuhr:
                settings.zoharMode === 'static'
                  ? computeIqama(gregDate, timings.Dhuhr, { mode: 'static', time: settings.zoharStatic })
                  : computeIqama(gregDate, timings.Dhuhr, { mode: 'dynamic', offsetMinutes: settings.zoharOffset }),
              Asr:
                settings.asrMode === 'static'
                  ? computeIqama(gregDate, timings.Asr, { mode: 'static', time: settings.asrStatic })
                  : computeIqama(gregDate, timings.Asr, { mode: 'dynamic', offsetMinutes: settings.asrOffset }),
              Maghrib: computeIqama(gregDate, timings.Maghrib, { mode: 'dynamic', offsetMinutes: settings.maghribOffset }),
              Isha:
                settings.ishaMode === 'static'
                  ? computeIqama(gregDate, timings.Isha, { mode: 'static', time: settings.ishaStatic })
                  : computeIqama(gregDate, timings.Isha, { mode: 'dynamic', offsetMinutes: settings.ishaOffset })
            }

            const fajrIqamaText = settings.fajrMode === 'static' && !isValidIqamaTime(gregDate, timings.Fajr, iqamas.Fajr!) ? 'Iqama time is provided earlier than prayer start time' : formatTime(iqamas.Fajr)
            const dhuhrIqamaText = settings.zoharMode === 'static' && !isValidIqamaTime(gregDate, timings.Dhuhr, iqamas.Dhuhr!) ? 'Iqama time is provided earlier than prayer start time' : formatTime(iqamas.Dhuhr)
            const asrIqamaText = settings.asrMode === 'static' && !isValidIqamaTime(gregDate, timings.Asr, iqamas.Asr!) ? 'Iqama time is provided earlier than prayer start time' : formatTime(iqamas.Asr)
            const ishaIqamaText = settings.ishaMode === 'static' && !isValidIqamaTime(gregDate, timings.Isha, iqamas.Isha!) ? 'Iqama time is provided earlier than prayer start time' : formatTime(iqamas.Isha)

            const overrides = iqamaOverrides[gregDate] || {}
            const fajrOverride = overrides.Fajr
            const dhuhrOverride = overrides.Dhuhr
            const asrOverride = overrides.Asr
            const maghribOverride = overrides.Maghrib
            const ishaOverride = overrides.Isha
            const isFriday = dayOfWeek === 'Fri'

            return (
              <tr key={gregDate} style={isFriday ? { fontWeight: 'bold' } : {}}>
                <td style={{ textAlign: 'center' }}>{dayNum}</td>
                <td style={{ textAlign: 'center' }}>{otherDate}</td>
                <td style={{ textAlign: 'center' }}>{dayOfWeek}</td>
                <td style={{ textAlign: 'center' }}>{formatTime(parseTiming(gregDate, timings.Fajr))}</td>
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="text"
                    placeholder="HH:MM AM/PM"
                    value={fajrOverride || ''}
                    onChange={(e) => updateIqamaOverride(gregDate, 'Fajr', e.target.value)}
                    title="Enter time in 12-hour AM/PM format (e.g., 5:30 AM)"
                    style={{ width: '100px', padding: '2px' }}
                  />
                  {!fajrOverride && <span style={{ color: '#666' }}>{fajrIqamaText}</span>}
                </td>
                <td style={{ textAlign: 'center' }}>{formatTime(parseTiming(gregDate, timings.Sunrise))}</td>
                <td style={{ textAlign: 'center' }}>{formatTime(parseTiming(gregDate, timings.Dhuhr))}</td>
                <td style={{ textAlign: 'center' }}>
                  {isFriday ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                      {(settings.jumuahTimes || []).map((time, idx) => (
                        <span key={idx}>
                          {time || `Jumu'ah ${idx + 1}`}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="HH:MM AM/PM"
                        value={dhuhrOverride || ''}
                        onChange={(e) => updateIqamaOverride(gregDate, 'Dhuhr', e.target.value)}
                        title="Enter time in 12-hour AM/PM format (e.g., 1:30 PM)"
                        style={{ width: '100px', padding: '2px' }}
                      />
                      {!dhuhrOverride && <span style={{ color: '#666' }}>{dhuhrIqamaText}</span>}
                    </>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>{formatTime(parseTiming(gregDate, timings.Asr))}</td>
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="text"
                    placeholder="HH:MM AM/PM"
                    value={asrOverride || ''}
                    onChange={(e) => updateIqamaOverride(gregDate, 'Asr', e.target.value)}
                    title="Enter time in 12-hour AM/PM format (e.g., 4:00 PM)"
                    style={{ width: '100px', padding: '2px' }}
                  />
                  {!asrOverride && <span style={{ color: '#666' }}>{asrIqamaText}</span>}
                </td>
                <td style={{ textAlign: 'center' }}>{formatTime(parseTiming(gregDate, timings.Maghrib))}</td>
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="text"
                    placeholder="HH:MM AM/PM"
                    value={maghribOverride || ''}
                    onChange={(e) => updateIqamaOverride(gregDate, 'Maghrib', e.target.value)}
                    title="Enter time in 12-hour AM/PM format (e.g., 6:30 PM)"
                    style={{ width: '100px', padding: '2px' }}
                  />
                  {!maghribOverride && <span style={{ color: '#666' }}>{formatTime(iqamas.Maghrib)}</span>}
                </td>
                <td style={{ textAlign: 'center' }}>{formatTime(parseTiming(gregDate, timings.Isha))}</td>
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="text"
                    placeholder="HH:MM AM/PM"
                    value={ishaOverride || ''}
                    onChange={(e) => updateIqamaOverride(gregDate, 'Isha', e.target.value)}
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
