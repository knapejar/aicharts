import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const API = process.env.AICHARTS_API || 'https://aicharts.vercel.app';

const encode = (config) =>
  Buffer.from(JSON.stringify(config), 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const urlFor = (config) => `${API}/chart?config=${encode(config)}`;

const examples = {
  line: [
    {
      name: 'Simple trend',
      description: 'US smartphone ownership share by year. Linear line, single series, year formatter detects non-comma 2015-2024 labels.',
      config: {
        chart: 'line',
        title: 'US smartphone ownership',
        subtitle: 'Share of adults owning a smartphone',
        source: 'Pew Research, 2024',
        palette: 'clarity',
        x: 'year',
        y: 'share',
        yFormat: 'percent',
        data: [
          { year: 2015, share: 0.68 },
          { year: 2016, share: 0.72 },
          { year: 2017, share: 0.77 },
          { year: 2018, share: 0.81 },
          { year: 2019, share: 0.83 },
          { year: 2020, share: 0.85 },
          { year: 2021, share: 0.87 },
          { year: 2022, share: 0.89 },
          { year: 2023, share: 0.90 },
          { year: 2024, share: 0.91 },
        ],
      },
    },
    {
      name: 'Multi-series comparison with area fill',
      description: 'EV vs ICE vehicle sales 2018-2024. Two lines with distinct styles, curved interpolation, area fill under the crossover trend.',
      config: {
        chart: 'line',
        title: 'EV sales overtaking ICE sales is coming',
        subtitle: 'Global new car sales by powertrain, millions of units',
        source: 'IEA Global EV Outlook',
        palette: 'editorial',
        x: 'year',
        y: ['ev', 'ice'],
        interpolation: 'curved',
        areaFill: true,
        lineWidth: 2.5,
        data: [
          { year: 2018, ev: 2.0, ice: 84.0 },
          { year: 2019, ev: 2.2, ice: 81.5 },
          { year: 2020, ev: 3.2, ice: 72.0 },
          { year: 2021, ev: 6.6, ice: 75.0 },
          { year: 2022, ev: 10.5, ice: 71.0 },
          { year: 2023, ev: 14.0, ice: 67.0 },
          { year: 2024, ev: 17.0, ice: 63.0 },
        ],
      },
    },
    {
      name: 'Dashed forecast line',
      description: 'GDP growth with a projection. Demonstrates per-series lineStyle override (solid historical + dashed forecast).',
      config: {
        chart: 'line',
        title: 'EU GDP growth, historical + IMF forecast',
        subtitle: 'Annual real GDP growth, percent',
        source: 'IMF World Economic Outlook, April 2025',
        palette: 'twilight',
        x: 'year',
        y: ['historical', 'forecast'],
        lineStyle: { historical: 'solid', forecast: 'dashed' },
        showSymbols: 'all',
        yFormat: 'percent',
        data: [
          { year: 2019, historical: 0.017, forecast: null },
          { year: 2020, historical: -0.058, forecast: null },
          { year: 2021, historical: 0.053, forecast: null },
          { year: 2022, historical: 0.035, forecast: null },
          { year: 2023, historical: 0.004, forecast: null },
          { year: 2024, historical: 0.008, forecast: null },
          { year: 2024, historical: null, forecast: 0.008 },
          { year: 2025, historical: null, forecast: 0.012 },
          { year: 2026, historical: null, forecast: 0.017 },
        ],
      },
    },
  ],

  bar: [
    {
      name: 'Horizontal ranking',
      description: 'Top 8 programming languages by job postings. Auto-horizontal for long labels, descending sort.',
      config: {
        chart: 'bar',
        title: 'Most in-demand programming languages',
        subtitle: 'Share of job postings mentioning the language, 2024',
        source: 'Stack Overflow Developer Survey',
        palette: 'carbon',
        label: 'language',
        value: 'share',
        orientation: 'horizontal',
        sort: 'desc',
        showValueLabels: true,
        yFormat: 'percent',
        data: [
          { language: 'Python', share: 0.485 },
          { language: 'JavaScript', share: 0.462 },
          { language: 'TypeScript', share: 0.391 },
          { language: 'SQL', share: 0.362 },
          { language: 'Java', share: 0.287 },
          { language: 'Go', share: 0.178 },
          { language: 'Rust', share: 0.121 },
          { language: 'C#', share: 0.209 },
        ],
      },
    },
    {
      name: 'Vertical with negatives',
      description: 'Monthly portfolio returns. Vertical bars, negatives rendered below zero line, value labels visible.',
      config: {
        chart: 'bar',
        title: 'Portfolio monthly returns in 2024',
        subtitle: 'Total return, percent',
        source: 'Internal performance report',
        palette: 'diverging-sunset',
        label: 'month',
        value: 'return',
        orientation: 'vertical',
        sort: 'none',
        showValueLabels: true,
        yFormat: 'percent',
        data: [
          { month: 'Jan', return: 0.024 },
          { month: 'Feb', return: 0.018 },
          { month: 'Mar', return: -0.012 },
          { month: 'Apr', return: 0.031 },
          { month: 'May', return: -0.008 },
          { month: 'Jun', return: 0.022 },
          { month: 'Jul', return: 0.017 },
          { month: 'Aug', return: -0.021 },
          { month: 'Sep', return: 0.015 },
          { month: 'Oct', return: 0.029 },
          { month: 'Nov', return: 0.011 },
          { month: 'Dec', return: 0.026 },
        ],
      },
    },
    {
      name: 'Simple category comparison',
      description: 'Thick bars, single category, good for quick dashboards. Clarity default palette.',
      config: {
        chart: 'bar',
        title: 'Website traffic by channel',
        subtitle: 'Sessions in the last 30 days, thousands',
        source: 'Google Analytics',
        palette: 'mono-blue',
        label: 'channel',
        value: 'sessions',
        sort: 'desc',
        barThickness: 'thick',
        showValueLabels: true,
        data: [
          { channel: 'Organic Search', sessions: 412 },
          { channel: 'Direct', sessions: 286 },
          { channel: 'Paid Search', sessions: 198 },
          { channel: 'Social', sessions: 142 },
          { channel: 'Email', sessions: 73 },
          { channel: 'Referral', sessions: 51 },
        ],
      },
    },
  ],

  'grouped-bar': [
    {
      name: 'Quarterly revenue by region',
      description: 'Three regions side-by-side across four quarters. Legend appears automatically for multi-series.',
      config: {
        chart: 'grouped-bar',
        title: 'Revenue by region',
        subtitle: 'Quarterly revenue, USD millions, FY2024',
        source: 'Internal finance',
        palette: 'vibrant',
        x: 'quarter',
        y: ['americas', 'emea', 'apac'],
        showValueLabels: true,
        yFormat: 'currency',
        data: [
          { quarter: 'Q1', americas: 142, emea: 98, apac: 67 },
          { quarter: 'Q2', americas: 156, emea: 112, apac: 74 },
          { quarter: 'Q3', americas: 168, emea: 121, apac: 81 },
          { quarter: 'Q4', americas: 181, emea: 134, apac: 92 },
        ],
      },
    },
    {
      name: 'Before/after A-B comparison',
      description: 'Performance metrics before and after optimization, grouped by page.',
      config: {
        chart: 'grouped-bar',
        title: 'Performance wins from the rewrite',
        subtitle: 'Page load time in milliseconds',
        source: 'WebPageTest lab',
        palette: 'earth',
        x: 'page',
        y: ['before', 'after'],
        showValueLabels: true,
        data: [
          { page: 'Homepage', before: 2840, after: 1120 },
          { page: 'Product', before: 3210, after: 1350 },
          { page: 'Checkout', before: 2680, after: 980 },
          { page: 'Search', before: 1920, after: 760 },
          { page: 'Account', before: 2450, after: 1060 },
        ],
      },
    },
    {
      name: 'Horizontal group with three series',
      description: 'Exam scores across subjects for three students. Horizontal orientation for long category labels.',
      config: {
        chart: 'grouped-bar',
        title: 'Classroom exam results',
        subtitle: 'Final score, percent, spring term',
        palette: 'boardroom',
        x: 'subject',
        y: ['anna', 'ben', 'chloe'],
        orientation: 'horizontal',
        yFormat: 'percent',
        data: [
          { subject: 'Mathematics', anna: 0.92, ben: 0.78, chloe: 0.85 },
          { subject: 'Physics', anna: 0.88, ben: 0.82, chloe: 0.76 },
          { subject: 'Literature', anna: 0.81, ben: 0.94, chloe: 0.89 },
          { subject: 'History', anna: 0.85, ben: 0.90, chloe: 0.93 },
        ],
      },
    },
  ],

  'stacked-bar': [
    {
      name: 'Energy mix per country',
      description: 'Electricity generation share stacked by source. Normalized to 100 percent.',
      config: {
        chart: 'stacked-bar',
        title: 'Electricity mix by country',
        subtitle: 'Share of generation by source, 2023',
        source: 'IEA',
        palette: 'earth',
        x: 'country',
        y: ['coal', 'gas', 'nuclear', 'renewable'],
        normalize: true,
        showValueLabels: false,
        data: [
          { country: 'Germany', coal: 24, gas: 14, nuclear: 0, renewable: 62 },
          { country: 'France', coal: 1, gas: 8, nuclear: 65, renewable: 26 },
          { country: 'Poland', coal: 63, gas: 10, nuclear: 0, renewable: 27 },
          { country: 'Denmark', coal: 9, gas: 4, nuclear: 0, renewable: 87 },
          { country: 'Spain', coal: 3, gas: 18, nuclear: 20, renewable: 59 },
        ],
      },
    },
    {
      name: 'Budget breakdown absolute',
      description: 'Monthly budget stacked by category, absolute values. Total shown at top of each bar.',
      config: {
        chart: 'stacked-bar',
        title: 'Where the money goes',
        subtitle: 'Personal monthly spending, USD, last six months',
        palette: 'mono-blue',
        x: 'month',
        y: ['rent', 'food', 'transport', 'leisure', 'savings'],
        showTotals: true,
        yFormat: 'currency',
        data: [
          { month: 'Jul', rent: 1400, food: 520, transport: 180, leisure: 240, savings: 660 },
          { month: 'Aug', rent: 1400, food: 480, transport: 210, leisure: 310, savings: 600 },
          { month: 'Sep', rent: 1400, food: 510, transport: 195, leisure: 275, savings: 620 },
          { month: 'Oct', rent: 1400, food: 555, transport: 175, leisure: 220, savings: 650 },
          { month: 'Nov', rent: 1400, food: 540, transport: 160, leisure: 265, savings: 635 },
          { month: 'Dec', rent: 1400, food: 610, transport: 170, leisure: 405, savings: 415 },
        ],
      },
    },
    {
      name: 'Horizontal stacked satisfaction',
      description: 'Survey results stacked by response, horizontal layout, perfect for Likert-scale data.',
      config: {
        chart: 'stacked-bar',
        title: 'Customer satisfaction by product line',
        subtitle: 'Share of responses on a 5-point scale',
        source: 'Annual customer survey, n=4,215',
        palette: 'diverging-sunset',
        x: 'product',
        y: ['very-dissatisfied', 'dissatisfied', 'neutral', 'satisfied', 'very-satisfied'],
        orientation: 'horizontal',
        normalize: true,
        data: [
          { product: 'Starter Plan', 'very-dissatisfied': 3, dissatisfied: 6, neutral: 18, satisfied: 48, 'very-satisfied': 25 },
          { product: 'Pro Plan', 'very-dissatisfied': 2, dissatisfied: 4, neutral: 12, satisfied: 44, 'very-satisfied': 38 },
          { product: 'Enterprise', 'very-dissatisfied': 1, dissatisfied: 3, neutral: 8, satisfied: 40, 'very-satisfied': 48 },
          { product: 'Mobile App', 'very-dissatisfied': 5, dissatisfied: 9, neutral: 22, satisfied: 41, 'very-satisfied': 23 },
        ],
      },
    },
  ],

  'bar-split': [
    {
      name: 'Small multiples by channel',
      description: 'Marketing channel performance displayed as independent small-multiple bar charts.',
      config: {
        chart: 'bar-split',
        title: 'Channel performance small-multiples',
        subtitle: 'Quarterly spend and conversions by channel, 2024',
        palette: 'vibrant',
        x: 'quarter',
        y: ['spend', 'conversions', 'revenue'],
        sharedScale: false,
        data: [
          { quarter: 'Q1', spend: 48000, conversions: 1240, revenue: 185000 },
          { quarter: 'Q2', spend: 52000, conversions: 1420, revenue: 212000 },
          { quarter: 'Q3', spend: 61000, conversions: 1590, revenue: 248000 },
          { quarter: 'Q4', spend: 72000, conversions: 1810, revenue: 291000 },
        ],
      },
    },
    {
      name: 'KPI grid by team',
      description: 'Three KPIs per team, shown in grid so you can eyeball all dimensions at once.',
      config: {
        chart: 'bar-split',
        title: 'Team KPIs at a glance',
        subtitle: 'Monthly averages, Q4 2024',
        palette: 'carbon',
        x: 'team',
        y: ['velocity', 'bugs', 'uptime'],
        columns: 3,
        sharedScale: false,
        data: [
          { team: 'Platform', velocity: 34, bugs: 6, uptime: 99.92 },
          { team: 'Web', velocity: 42, bugs: 11, uptime: 99.81 },
          { team: 'Mobile', velocity: 28, bugs: 9, uptime: 99.88 },
          { team: 'Data', velocity: 22, bugs: 4, uptime: 99.95 },
        ],
      },
    },
    {
      name: 'Shared-scale comparison',
      description: 'Same scale across panels to make magnitude comparable; useful when values share units.',
      config: {
        chart: 'bar-split',
        title: 'Daily active users by app',
        subtitle: 'DAU in millions, latest week',
        palette: 'mono-blue',
        x: 'day',
        y: ['appAlpha', 'appBeta', 'appGamma', 'appDelta'],
        sharedScale: true,
        columns: 2,
        data: [
          { day: 'Mon', appAlpha: 12.4, appBeta: 8.9, appGamma: 15.1, appDelta: 4.2 },
          { day: 'Tue', appAlpha: 13.1, appBeta: 9.3, appGamma: 15.8, appDelta: 4.5 },
          { day: 'Wed', appAlpha: 12.8, appBeta: 9.0, appGamma: 16.0, appDelta: 4.4 },
          { day: 'Thu', appAlpha: 13.6, appBeta: 9.6, appGamma: 16.3, appDelta: 4.7 },
          { day: 'Fri', appAlpha: 14.2, appBeta: 9.8, appGamma: 16.9, appDelta: 5.0 },
          { day: 'Sat', appAlpha: 11.9, appBeta: 8.4, appGamma: 14.8, appDelta: 3.9 },
          { day: 'Sun', appAlpha: 11.5, appBeta: 8.1, appGamma: 14.2, appDelta: 3.7 },
        ],
      },
    },
  ],

  'stacked-area': [
    {
      name: 'Market share over time',
      description: 'Browser market share stacked by year. Curved interpolation for smooth trend reading.',
      config: {
        chart: 'stacked-area',
        title: 'Desktop browser market share',
        subtitle: 'Share of active users, percent',
        source: 'StatCounter',
        palette: 'editorial',
        x: 'year',
        y: ['chrome', 'safari', 'edge', 'firefox', 'other'],
        normalize: true,
        interpolation: 'curved',
        data: [
          { year: 2019, chrome: 66, safari: 10, edge: 4, firefox: 10, other: 10 },
          { year: 2020, chrome: 68, safari: 9, edge: 7, firefox: 8, other: 8 },
          { year: 2021, chrome: 66, safari: 10, edge: 9, firefox: 8, other: 7 },
          { year: 2022, chrome: 64, safari: 11, edge: 11, firefox: 7, other: 7 },
          { year: 2023, chrome: 62, safari: 13, edge: 13, firefox: 6, other: 6 },
          { year: 2024, chrome: 61, safari: 14, edge: 14, firefox: 5, other: 6 },
        ],
      },
    },
    {
      name: 'Server load stacked by service',
      description: 'Minute-by-minute CPU usage across services; absolute scale shows total load.',
      config: {
        chart: 'stacked-area',
        title: 'Service CPU usage over the last hour',
        subtitle: 'Percent of total cluster capacity',
        palette: 'twilight',
        x: 'minute',
        y: ['api', 'worker', 'cron', 'indexer'],
        opacity: 0.9,
        data: [
          { minute: 0, api: 22, worker: 15, cron: 4, indexer: 8 },
          { minute: 10, api: 28, worker: 18, cron: 3, indexer: 12 },
          { minute: 20, api: 35, worker: 22, cron: 6, indexer: 14 },
          { minute: 30, api: 42, worker: 28, cron: 12, indexer: 18 },
          { minute: 40, api: 38, worker: 24, cron: 5, indexer: 22 },
          { minute: 50, api: 30, worker: 20, cron: 4, indexer: 16 },
          { minute: 60, api: 26, worker: 17, cron: 3, indexer: 10 },
        ],
      },
    },
    {
      name: 'CO2 emissions breakdown',
      description: 'Emissions by sector stacked over decades. Single palette with sequential ramp.',
      config: {
        chart: 'stacked-area',
        title: 'Global CO2 emissions by sector',
        subtitle: 'Gigatonnes CO2 equivalent',
        source: 'Our World in Data',
        palette: 'carbon',
        x: 'year',
        y: ['energy', 'industry', 'transport', 'buildings', 'agriculture'],
        interpolation: 'curved',
        data: [
          { year: 1990, energy: 12.1, industry: 3.2, transport: 4.6, buildings: 2.8, agriculture: 5.1 },
          { year: 2000, energy: 14.5, industry: 3.9, transport: 5.8, buildings: 2.9, agriculture: 5.4 },
          { year: 2010, energy: 17.8, industry: 5.1, transport: 7.0, buildings: 3.2, agriculture: 5.8 },
          { year: 2020, energy: 17.3, industry: 5.6, transport: 7.2, buildings: 3.0, agriculture: 6.1 },
        ],
      },
    },
  ],

  combo: [
    {
      name: 'Revenue bars + margin line',
      description: 'Classic finance combo: bars for revenue, a line for margin overlaid on a secondary axis.',
      config: {
        chart: 'combo',
        title: 'Revenue and margin',
        subtitle: 'Quarterly revenue (USD m) and gross margin (percent)',
        source: 'Internal financials',
        palette: 'boardroom',
        x: 'quarter',
        bars: 'revenue',
        lines: 'margin',
        interpolation: 'curved',
        data: [
          { quarter: 'Q1 23', revenue: 112, margin: 0.41 },
          { quarter: 'Q2 23', revenue: 128, margin: 0.43 },
          { quarter: 'Q3 23', revenue: 141, margin: 0.44 },
          { quarter: 'Q4 23', revenue: 158, margin: 0.46 },
          { quarter: 'Q1 24', revenue: 165, margin: 0.47 },
          { quarter: 'Q2 24', revenue: 180, margin: 0.48 },
          { quarter: 'Q3 24', revenue: 201, margin: 0.49 },
          { quarter: 'Q4 24', revenue: 223, margin: 0.51 },
        ],
      },
    },
    {
      name: 'Budget vs actual with variance line',
      description: 'Two bar series compared side-by-side, a line on top showing the running variance.',
      config: {
        chart: 'combo',
        title: 'Budget vs actual spend',
        subtitle: 'Monthly marketing spend, USD thousand, with variance line',
        palette: 'diverging-sunset',
        x: 'month',
        bars: ['budget', 'actual'],
        lines: 'variance',
        interpolation: 'linear',
        data: [
          { month: 'Jul', budget: 50, actual: 48, variance: -2 },
          { month: 'Aug', budget: 50, actual: 54, variance: 4 },
          { month: 'Sep', budget: 55, actual: 51, variance: -4 },
          { month: 'Oct', budget: 60, actual: 63, variance: 3 },
          { month: 'Nov', budget: 65, actual: 71, variance: 6 },
          { month: 'Dec', budget: 75, actual: 80, variance: 5 },
        ],
      },
    },
    {
      name: 'Weather dashboard',
      description: 'Precipitation bars with temperature line — a textbook use of the dual-metric combo.',
      config: {
        chart: 'combo',
        title: 'Rain and temperature',
        subtitle: 'Prague weekly averages, spring 2024',
        palette: 'clarity',
        x: 'week',
        bars: 'precip',
        lines: 'temp',
        lineStyle: 'solid',
        data: [
          { week: 'W12', precip: 18, temp: 7.4 },
          { week: 'W13', precip: 24, temp: 9.1 },
          { week: 'W14', precip: 12, temp: 11.2 },
          { week: 'W15', precip: 31, temp: 12.8 },
          { week: 'W16', precip: 8, temp: 14.6 },
          { week: 'W17', precip: 19, temp: 16.1 },
          { week: 'W18', precip: 5, temp: 18.3 },
        ],
      },
    },
  ],

  'line-split': [
    {
      name: 'Small multiples by product',
      description: 'Sales trend per product shown as independent line panels, perfect for long lists.',
      config: {
        chart: 'line-split',
        title: 'Weekly sales by SKU',
        subtitle: 'Units sold, last 8 weeks',
        palette: 'vibrant',
        x: 'week',
        y: ['skuA', 'skuB', 'skuC', 'skuD'],
        interpolation: 'curved',
        sharedScale: false,
        data: [
          { week: 'W1', skuA: 420, skuB: 120, skuC: 78, skuD: 240 },
          { week: 'W2', skuA: 445, skuB: 128, skuC: 82, skuD: 231 },
          { week: 'W3', skuA: 468, skuB: 134, skuC: 91, skuD: 244 },
          { week: 'W4', skuA: 482, skuB: 141, skuC: 97, skuD: 252 },
          { week: 'W5', skuA: 501, skuB: 149, skuC: 103, skuD: 261 },
          { week: 'W6', skuA: 524, skuB: 156, skuC: 112, skuD: 270 },
          { week: 'W7', skuA: 541, skuB: 163, skuC: 120, skuD: 282 },
          { week: 'W8', skuA: 562, skuB: 171, skuC: 129, skuD: 294 },
        ],
      },
    },
    {
      name: 'Shared-scale comparison across countries',
      description: 'Birth rate trend per country on the same y-axis so magnitudes are directly comparable.',
      config: {
        chart: 'line-split',
        title: 'Birth rates, last decade',
        subtitle: 'Births per 1,000 people, 2014-2024',
        source: 'World Bank',
        palette: 'editorial',
        x: 'year',
        y: ['czechia', 'germany', 'japan', 'nigeria'],
        sharedScale: true,
        columns: 2,
        data: [
          { year: 2014, czechia: 10.4, germany: 8.8, japan: 8.0, nigeria: 38.8 },
          { year: 2016, czechia: 10.2, germany: 9.6, japan: 7.8, nigeria: 38.1 },
          { year: 2018, czechia: 10.7, germany: 9.5, japan: 7.4, nigeria: 37.4 },
          { year: 2020, czechia: 10.3, germany: 9.3, japan: 6.8, nigeria: 36.6 },
          { year: 2022, czechia: 8.6, germany: 8.8, japan: 6.3, nigeria: 35.5 },
          { year: 2024, czechia: 7.9, germany: 8.5, japan: 6.1, nigeria: 34.6 },
        ],
      },
    },
    {
      name: 'Metrics dashboard in a 3-column grid',
      description: 'Compact dashboard view: three different metrics shown as independent trend panels.',
      config: {
        chart: 'line-split',
        title: 'Website KPIs',
        subtitle: 'Trailing 7-day rolling averages',
        palette: 'mono-blue',
        x: 'day',
        y: ['visitors', 'signups', 'conversion'],
        columns: 3,
        interpolation: 'linear',
        data: [
          { day: 'Mon', visitors: 4120, signups: 142, conversion: 0.034 },
          { day: 'Tue', visitors: 4310, signups: 156, conversion: 0.036 },
          { day: 'Wed', visitors: 4260, signups: 148, conversion: 0.035 },
          { day: 'Thu', visitors: 4480, signups: 168, conversion: 0.037 },
          { day: 'Fri', visitors: 4620, signups: 179, conversion: 0.039 },
          { day: 'Sat', visitors: 3890, signups: 124, conversion: 0.032 },
          { day: 'Sun', visitors: 3720, signups: 118, conversion: 0.032 },
        ],
      },
    },
  ],

  pie: [
    {
      name: 'Budget shares',
      description: 'Five-slice pie showing budget allocation. Labels placed outside the ring for readability.',
      config: {
        chart: 'pie',
        title: 'Monthly budget allocation',
        subtitle: 'Where 100 percent of take-home pay goes',
        palette: 'earth',
        label: 'category',
        value: 'amount',
        labelPlacement: 'outside',
        data: [
          { category: 'Rent', amount: 1400 },
          { category: 'Food', amount: 540 },
          { category: 'Transport', amount: 180 },
          { category: 'Leisure', amount: 300 },
          { category: 'Savings', amount: 580 },
        ],
      },
    },
    {
      name: 'Election result with Other grouping',
      description: 'Nine-party result; anything under the 4 percent threshold is automatically merged into "Other".',
      config: {
        chart: 'pie',
        title: '2024 parliamentary election result',
        subtitle: 'Share of valid votes',
        source: 'Official election results',
        palette: 'diverging-sunset',
        label: 'party',
        value: 'share',
        sort: 'desc',
        data: [
          { party: 'Party A', share: 29.8 },
          { party: 'Party B', share: 22.1 },
          { party: 'Party C', share: 14.4 },
          { party: 'Party D', share: 10.3 },
          { party: 'Party E', share: 7.2 },
          { party: 'Party F', share: 5.9 },
          { party: 'Party G', share: 4.1 },
          { party: 'Party H', share: 3.2 },
          { party: 'Party I', share: 3.0 },
        ],
      },
    },
    {
      name: 'Simple 3-slice mix',
      description: 'Minimal pie with labels inside the slices; ideal for hero charts in reports.',
      config: {
        chart: 'pie',
        title: 'Product mix',
        subtitle: 'Revenue share by product line, FY2024',
        palette: 'boardroom',
        label: 'product',
        value: 'revenue',
        labelPlacement: 'inside',
        data: [
          { product: 'Subscriptions', revenue: 68 },
          { product: 'Services', revenue: 22 },
          { product: 'Hardware', revenue: 10 },
        ],
      },
    },
  ],

  donut: [
    {
      name: 'Market share with KPI in center',
      description: 'Donut with total market size shown as the center value — KPI hero in a single visual.',
      config: {
        chart: 'donut',
        title: 'Cloud provider market share',
        subtitle: 'Share of global IaaS spend, 2024',
        source: 'Gartner',
        palette: 'twilight',
        label: 'provider',
        value: 'share',
        innerRadius: 'medium',
        centerValue: 'sum',
        centerLabel: 'Total share',
        data: [
          { provider: 'AWS', share: 31 },
          { provider: 'Azure', share: 25 },
          { provider: 'GCP', share: 11 },
          { provider: 'Alibaba', share: 8 },
          { provider: 'Other', share: 25 },
        ],
      },
    },
    {
      name: 'Thin ring with label outside',
      description: 'Slim donut ideal when screen real estate is tight; labels sit outside the ring.',
      config: {
        chart: 'donut',
        title: 'Traffic sources',
        subtitle: 'Share of sessions, last 30 days',
        palette: 'mono-blue',
        label: 'source',
        value: 'sessions',
        innerRadius: 'thin',
        labelPlacement: 'outside',
        data: [
          { source: 'Organic', sessions: 412 },
          { source: 'Direct', sessions: 286 },
          { source: 'Paid', sessions: 198 },
          { source: 'Social', sessions: 142 },
          { source: 'Email', sessions: 73 },
        ],
      },
    },
    {
      name: 'Thick ring with max highlight',
      description: 'Thick ring with the maximum value called out in the center, great for a one-at-a-glance KPI.',
      config: {
        chart: 'donut',
        title: 'Cohort retention',
        subtitle: 'Week-4 retention by acquisition channel',
        palette: 'vibrant',
        label: 'channel',
        value: 'retention',
        innerRadius: 'thick',
        centerValue: 'max',
        centerLabel: 'Best channel',
        data: [
          { channel: 'Organic', retention: 0.42 },
          { channel: 'Referral', retention: 0.58 },
          { channel: 'Paid', retention: 0.28 },
          { channel: 'Social', retention: 0.22 },
          { channel: 'Email', retention: 0.49 },
        ],
      },
    },
  ],

  geo: [
    {
      name: 'World choropleth',
      description: 'Global map shaded by internet penetration rate using ISO-3 country codes.',
      config: {
        chart: 'geo',
        title: 'Internet users per country',
        subtitle: 'Share of population online, 2023',
        source: 'ITU',
        palette: 'clarity',
        basemap: 'world',
        code: 'code',
        value: 'share',
        scale: 'linear',
        data: [
          { code: 'USA', share: 0.92 },
          { code: 'CAN', share: 0.94 },
          { code: 'BRA', share: 0.85 },
          { code: 'GBR', share: 0.96 },
          { code: 'DEU', share: 0.94 },
          { code: 'FRA', share: 0.93 },
          { code: 'RUS', share: 0.85 },
          { code: 'CHN', share: 0.75 },
          { code: 'IND', share: 0.46 },
          { code: 'JPN', share: 0.93 },
          { code: 'AUS', share: 0.91 },
          { code: 'NGA', share: 0.55 },
          { code: 'ZAF', share: 0.72 },
          { code: 'EGY', share: 0.72 },
          { code: 'MEX', share: 0.77 },
        ],
      },
    },
    {
      name: 'Europe-only map',
      description: 'Europe-focused choropleth using the europe basemap for better real-estate usage.',
      config: {
        chart: 'geo',
        title: 'Renewable electricity share',
        subtitle: 'Share of electricity generated from renewables, EU, 2024',
        source: 'Ember Climate',
        palette: 'earth',
        basemap: 'europe',
        code: 'code',
        value: 'share',
        scale: 'stepped',
        steps: 5,
        data: [
          { code: 'NOR', share: 98 },
          { code: 'ISL', share: 100 },
          { code: 'SWE', share: 66 },
          { code: 'FIN', share: 52 },
          { code: 'DNK', share: 87 },
          { code: 'DEU', share: 62 },
          { code: 'POL', share: 27 },
          { code: 'CZE', share: 16 },
          { code: 'FRA', share: 26 },
          { code: 'ESP', share: 59 },
          { code: 'ITA', share: 43 },
          { code: 'GBR', share: 51 },
          { code: 'IRL', share: 40 },
          { code: 'PRT', share: 68 },
          { code: 'NLD', share: 47 },
        ],
      },
    },
    {
      name: 'USA states unemployment',
      description: 'US states choropleth using ISO-style state codes. Demonstrates the usa-states basemap.',
      config: {
        chart: 'geo',
        title: 'US state unemployment',
        subtitle: 'Unemployment rate, percent, March 2025',
        source: 'BLS',
        palette: 'diverging-sunset',
        basemap: 'usa-states',
        code: 'code',
        value: 'rate',
        scale: 'linear',
        data: [
          { code: 'CA', rate: 5.4 },
          { code: 'TX', rate: 4.1 },
          { code: 'NY', rate: 4.3 },
          { code: 'FL', rate: 3.2 },
          { code: 'IL', rate: 4.8 },
          { code: 'PA', rate: 3.9 },
          { code: 'OH', rate: 4.2 },
          { code: 'GA', rate: 3.5 },
          { code: 'NC', rate: 3.8 },
          { code: 'MI', rate: 4.7 },
          { code: 'NV', rate: 5.8 },
          { code: 'AZ', rate: 4.4 },
          { code: 'WA', rate: 4.6 },
          { code: 'ND', rate: 2.1 },
          { code: 'VT', rate: 2.3 },
        ],
      },
    },
  ],
};

const labelFor = (key) =>
  ({
    line: 'Line chart',
    bar: 'Bar chart (vertical + horizontal)',
    'grouped-bar': 'Grouped bar chart',
    'stacked-bar': 'Stacked bar chart',
    'bar-split': 'Bar split (small multiples)',
    'stacked-area': 'Stacked area chart',
    combo: 'Combo chart (bars + line)',
    'line-split': 'Line split (small multiples)',
    pie: 'Pie chart',
    donut: 'Donut chart',
    geo: 'Geo chart (choropleth)',
  })[key] ?? key;

const lines = [];
lines.push('# Try aicharts from ChatGPT');
lines.push('');
lines.push(`Every example below produces a real chart from the live API at **${API}/chart**.`);
lines.push('Paste the prompt into any chat assistant with URL-fetching ability (ChatGPT 4o/5 with browsing, Claude, Gemini, Copilot) — it will follow the link, download the PNG, and show it inline. You can also open the URL directly in a browser or `curl`.');
lines.push('');
lines.push('**API surface**');
lines.push('```');
lines.push(`GET  ${API}/chart?config=<base64url JSON>`);
lines.push(`POST ${API}/chart           (body: JSON config)`);
lines.push('');
lines.push('Optional query parameters:');
lines.push('  format=svg        return SVG instead of PNG');
lines.push('```');
lines.push('');
lines.push('**Table of contents**');
for (const key of Object.keys(examples)) lines.push(`- [${labelFor(key)}](#${key})`);
lines.push('');
lines.push('---');
lines.push('');

for (const [key, cases] of Object.entries(examples)) {
  lines.push(`## ${labelFor(key)} {#${key}}`);
  lines.push('');
  for (let i = 0; i < cases.length; i++) {
    const ex = cases[i];
    const url = urlFor(ex.config);
    lines.push(`### ${i + 1}. ${ex.name}`);
    lines.push('');
    lines.push(ex.description);
    lines.push('');
    lines.push('**ChatGPT prompt** (copy-paste):');
    lines.push('');
    lines.push('> Please fetch this URL and show me the PNG image inline:');
    lines.push('> ');
    lines.push(`> \`${url}\``);
    lines.push('');
    lines.push('<details><summary>Raw JSON config (for POST)</summary>');
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify(ex.config, null, 2));
    lines.push('```');
    lines.push('');
    lines.push('```bash');
    lines.push(`curl -X POST ${API}/chart \\`);
    lines.push(`  -H 'Content-Type: application/json' \\`);
    lines.push(`  -d '${JSON.stringify(ex.config)}' \\`);
    lines.push(`  --output ${key}-${i + 1}.png`);
    lines.push('```');
    lines.push('');
    lines.push('</details>');
    lines.push('');
  }
  lines.push('---');
  lines.push('');
}

lines.push('## Tips for agents and humans');
lines.push('');
lines.push('- The API is stateless. Every request carries the full chart config.');
lines.push('- Base64url is used in the `config` query parameter (RFC 4648 §5). Pad-stripping is allowed.');
lines.push('- PNG output is capped at 1,900 px on the longest edge so responses stay under the Anthropic multi-image request limit.');
lines.push(`- The same service also speaks MCP at \`${API}/mcp\` for agents that prefer tool-calling over HTTP fetch.`);
lines.push('- 10 built-in palettes, 11 chart types, 11 basemaps. See the repo README for the full capability matrix.');
lines.push('');

const outPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'CHATGPT-EXAMPLES.md');
writeFileSync(outPath, lines.join('\n'), 'utf-8');
console.log(`wrote ${outPath} (${lines.length} lines)`);
