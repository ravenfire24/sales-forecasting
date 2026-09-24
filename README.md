# SalesCast — Sales Forecasting Dashboard

A resume-ready sales forecasting portfolio project built with Next.js and React.

## What it does
- Uploads a CSV with `Date` + `Sales` columns
- Calculates historical KPIs
- Generates 7/30/60/90-day projections
- Visualizes actual vs forecast values
- Runs forecasting in the browser, so there is no server-side ML dependency

## Kaggle dataset
Recommended source: [Superstore Sales Dataset](https://www.kaggle.com/datasets/himanshuuike/superstore-sales-dataset). It contains 10,000+ retail records with sales, profit, discount, product, date, region, and customer information.

For a production version, export the Kaggle CSV and upload it through the dashboard.

## Run locally
```bash
npm install
npm run dev
```

## Deploy
This app is designed for Vercel and uses the Next.js App Router.
