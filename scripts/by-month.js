const d3 = require('d3');
const fs = require('fs');
const suffix = 'page-one';
// const suffix = 'clean'

const data = d3
  .csvParse(fs.readFileSync(`./output/analysis--${suffix}.csv`, 'utf-8'))
  // .filter(d => !['Oman', 'United States', 'Jersey'].includes(d.country))
  .map(d => ({
    ...d,
    count: +d.count
  }));

const nested = d3
  .nest()
  .key(d => `${d.year}-${d.month}`)
  .key(d => d.country)
  .rollup(values => ({
    country: values[0].country,
    year: values[0].year,
    month: values[0].month,
    count: d3.sum(values, v => v.count)
  }))
  .entries(data);

const max = nested.map(n => {
  const c = n.values.map(v => v.value);
  c.sort((a, b) => d3.ascending(a.count, b.count));
  return c.pop();
});

const output = d3.csvFormat(max);
fs.writeFileSync(`./output/result-by-month--${suffix}.csv`, output);
