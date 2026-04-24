export function snapshotCases() {
  return [
    {
      name: 'line-basic',
      config: {
        chart: 'line',
        data: [
          { year: 2018, revenue: 12 },
          { year: 2019, revenue: 14 },
          { year: 2020, revenue: 10 },
          { year: 2021, revenue: 18 },
          { year: 2022, revenue: 22 },
          { year: 2023, revenue: 28 },
        ],
        x: 'year',
        y: 'revenue',
        title: 'Revenue growth',
        subtitle: 'Fiscal years, millions USD',
        source: 'Company filings',
      },
    },
  ];
}
