const d3 = require('d3');
const fs = require('fs');
const request = require('request');

function makeRequest() {
  const id = '15B-jHFFcu3Ubf_jtUI_Cqw8LtNqZfJKL_k-DZYbNrJ4';
  return new Promise(resolve => {
    const base = 'https://docs.google.com/spreadsheets/u/1/d';
    const url = `${base}/${id}/export?format=csv&id=${id}&gid=0`;
    request(url, (error, response, body) => {
      const data = d3.csvParse(body);
      resolve(data.map(d => d.web_url));
    });
  });
}

const analysis = d3.csvParse(
  fs.readFileSync('./output/analysis--month.csv', 'utf-8')
);

const result = d3
  .csvParse(fs.readFileSync('./output/result--month.csv', 'utf-8'))
  .map(d => ({
    ...d,
    count: +d.count
  }));

function process(blacklist) {
  console.log(blacklist);
  const nested = d3
    .nest()
    .key(d => `${d.year}-${d.month}`)
    .rollup(values => {
      const { year, month } = values[0];
      const { country } = result.find(
        d => d.year === year && d.month === month
      );
      const first = country.split(':')[0];
      const f = values.filter(
        v => !blacklist.includes(v.web_url) && v.top === first
      );
      const r = Math.floor(Math.random() * f.length);
      return f[r];
    })
    .entries(analysis)
    .map(d => d.value)
    .map(d => ({
      web_url: d.web_url,
      headline: d.headline,
      top: d.top,
      common: d.common,
      demonym: d.demonym,
      city: d.city,
      month: d.month,
      year: d.year,
      count: d.count
    }));

  const output = d3.csvFormat(nested);

  fs.writeFileSync('./output/headlines.csv', output);
}

makeRequest().then(process);
