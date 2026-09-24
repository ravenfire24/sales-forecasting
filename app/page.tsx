'use client'

import { useMemo, useState } from 'react'

type Row = { date: string; sales: number }
type Forecast = { date: string; value: number }

function movingAverageForecast(rows: Row[], horizon: number, window = 7): Forecast[] {
  const values = rows.map(r => r.sales)
  const result: Forecast[] = []
  const work = [...values]
  const lastDate = new Date(rows[rows.length - 1].date)
  for (let i = 1; i <= horizon; i++) {
    const slice = work.slice(Math.max(0, work.length - window))
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length
    const recent = work.slice(Math.max(0, work.length - Math.min(14, work.length)))
    const x = recent.map((_, idx) => idx)
    const y = recent
    const xBar = x.reduce((a, b) => a + b, 0) / x.length
    const yBar = y.reduce((a, b) => a + b, 0) / y.length
    const denom = x.reduce((s, xi) => s + (xi - xBar) ** 2, 0) || 1
    const slope = x.reduce((s, xi, idx) => s + (xi - xBar) * (y[idx] - yBar), 0) / denom
    const next = Math.max(0, avg * 0.75 + (yBar + slope * x.length) * 0.25)
    work.push(next)
    const date = new Date(lastDate)
    date.setDate(date.getDate() + i)
    result.push({ date: date.toISOString().slice(0, 10), value: Math.round(next) })
  }
  return result
}

function parseCSV(text: string): Row[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) throw new Error('CSV needs a header row and at least one data row.')
  const headers = lines[0].split(',').map(s => s.trim().toLowerCase().replace(/["']/g, ''))
  const dateIndex = headers.findIndex(h => ['date', 'order date', 'order_date', 'ds'].includes(h))
  const salesIndex = headers.findIndex(h => ['sales', 'revenue', 'amount', 'total sales', 'quantity'].includes(h))
  if (dateIndex < 0 || salesIndex < 0) {
    throw new Error('Could not find date and sales columns. Rename columns to Date and Sales, or use Order Date and Sales.')
  }

  return lines.slice(1).map(line => {
    const cols = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''))
    return {
      date: cols[dateIndex],
      sales: Number(String(cols[salesIndex]).replace(/[$,]/g, '')),
    }
  }).filter(r => r.date && Number.isFinite(r.sales)).sort((a, b) => a.date.localeCompare(b.date))
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function Home() {
  const [rows, setRows] = useState<Row[]>([])
  const [horizon, setHorizon] = useState(30)
  const [error, setError] = useState('')

  const forecast = useMemo(() => rows.length ? movingAverageForecast(rows, horizon) : [], [rows, horizon])
  const total = rows.reduce((s, r) => s + r.sales, 0)
  const avg = rows.length ? total / rows.length : 0
  const forecastTotal = forecast.reduce((s, r) => s + r.value, 0)
  const growth = avg && forecast.length ? ((forecast[forecast.length - 1].value / avg) - 1) * 100 : 0
  const all = [
    ...rows.slice(-30).map(r => ({ date: r.date, value: r.sales, actual: true })),
    ...forecast.map(r => ({ date: r.date, value: r.value, actual: false })),
  ]
  const max = Math.max(...all.map(x => x.value), 1)

  function upload(file: File) {
    setError('')
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = parseCSV(String(reader.result))
        if (parsed.length < 7) throw new Error('Please upload at least 7 valid rows.')
        setRows(parsed)
      } catch (e) {
        setRows([])
        setError(e instanceof Error ? e.message : 'Invalid CSV.')
      }
    }
    reader.readAsText(file)
  }

  return <main>
    <nav className="nav"><div className="brand"><span className="logo">S</span> SalesCast</div></nav>

    <section className="hero">
      <div>
        <div className="eyebrow">SALES INTELLIGENCE</div>
        <h1>Turn your sales data<br /><em>into a forecast.</em></h1>
        <p>Upload your historical sales CSV to explore performance and generate a forward-looking forecast.</p>
      </div>
      <label className="upload">
        <input type="file" accept=".csv,text/csv" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
        <span>＋ Upload CSV</span>
        <small>Your CSV · Date + Sales columns</small>
      </label>
    </section>

    {error && <div className="error">{error}</div>}

    {!rows.length ? <section className="empty card">
      <div className="emptyIcon">↑</div>
      <h2>Upload your sales data to get started</h2>
      <p>Nothing is loaded by default. Choose a CSV containing a date column and a sales or revenue column.</p>
      <div className="format">Accepted date columns: <b>Date</b>, <b>Order Date</b>, <b>order_date</b>, or <b>ds</b><br />Accepted sales columns: <b>Sales</b>, <b>Revenue</b>, <b>Amount</b>, or <b>Total Sales</b></div>
    </section> : <>
      <section className="controls">
        <div><span>Forecast horizon</span><div className="seg">{[7, 30, 60, 90].map(n => <button key={n} className={horizon === n ? 'active' : ''} onClick={() => setHorizon(n)}>{n} days</button>)}</div></div>
        <div className="source">Uploaded dataset · {rows.length.toLocaleString()} rows</div>
      </section>

      <section className="grid">
        <div className="card metric"><span>Total historical sales</span><strong>{fmt(total)}</strong><small>{rows.length} observations</small></div>
        <div className="card metric"><span>Average daily sales</span><strong>{fmt(avg)}</strong><small>Historical mean</small></div>
        <div className="card metric"><span>Forecast revenue</span><strong>{fmt(forecastTotal)}</strong><small>Next {horizon} days</small></div>
        <div className="card metric"><span>End-period change</span><strong className={growth >= 0 ? 'positive' : 'negative'}>{growth >= 0 ? '+' : ''}{growth.toFixed(1)}%</strong><small>vs. historical average</small></div>
      </section>

      <section className="card chartCard">
        <div className="cardHead"><div><span className="label">FORECAST</span><h2>Historical sales & projected revenue</h2></div><div className="legend"><span className="dot actual" />Actual <span className="dot forecast" />Forecast</div></div>
        <div className="chart"><div className="ylabels"><span>{fmt(max)}</span><span>{fmt(max * .5)}</span><span>$0</span></div><div className="bars">{all.map((p, i) => <div className="barWrap" key={p.date + i}><div className={'bar ' + (p.actual ? 'actualBar' : 'forecastBar')} style={{ height: `${Math.max(2, p.value / max * 100)}%` }} title={`${p.date}: ${fmt(p.value)}`} /></div>)}</div></div>
        <div className="xlabels"><span>{all[0]?.date}</span><span>{all[Math.floor(all.length / 2)]?.date}</span><span>{all[all.length - 1]?.date}</span></div>
      </section>

      <section className="lower">
        <div className="card tableCard"><div className="cardHead"><div><span className="label">NEXT PERIOD</span><h2>Forecast detail</h2></div></div><div className="table"><div className="tr th"><span>Date</span><span>Projected sales</span></div>{forecast.slice(0, 8).map(r => <div className="tr" key={r.date}><span>{r.date}</span><strong>{fmt(r.value)}</strong></div>)}</div></div>
        <div className="card about"><span className="label">MODEL NOTES</span><h2>How the forecast works</h2><p>This portfolio demo uses a transparent moving-average baseline blended with a short-term trend estimate. It runs entirely in the browser after you upload your data.</p><div className="steps"><span>01</span><div><b>Aggregate</b><small>Use historical daily sales</small></div><span>02</span><div><b>Estimate</b><small>7-day moving average + trend</small></div><span>03</span><div><b>Project</b><small>Iterate forward for your horizon</small></div></div></div>
      </section>
    </>}

    
  </main>
}
