const d3 = require('d3');
const fs = require('fs');
const mkdirp = require('mkdirp');
const uniq = require('lodash.uniqby');

mkdirp('./output');

const data = d3
  .csvParse(fs.readFileSync('./output/analysis--locations.csv', 'utf-8'))
  .map(d => {
    // '1900-01-01T00:00:00Z'
    const [year, month] = d.pub_date.split('-');
    return { ...d, year, month };
  });

function getCountries(str) {
  const all = str.split(' : ').map(d => {
    const s = d.split(' (');
    return s[0];
  });

  return uniq(all);
}

function findWinner(values) {
  const dict = {};
  values.forEach(v => {
    v.countries.forEach(c => {
      if (!dict[c]) dict[c] = 0;
      dict[c] += 1;
    });
  });

  const arr = Object.keys(dict).map(d => ({ name: d, count: dict[d] }));
  arr.sort((a, b) => d3.ascending(a.count, b.count));
  const winner = arr.pop();
  const articles = values
    .filter(v => v.countries.includes(winner.name))
    .map(a => ({ ...a, top: winner.name }));
  return {
    ...winner,
    articles
  };
}

const withCountry = data.map(d => {
  const common = d.common ? getCountries(d.common) : [];
  const demonym = d.demonym ? getCountries(d.demonym) : [];
  const city = d.city ? getCountries(d.city) : [];
  const all = [].concat(...common, ...demonym, ...city);
  const countries = uniq(all);
  return { ...d, countries };
});

const byMonth = d3
  .nest()
  .key(d => `${d.year}-${d.month}`)
  .rollup(findWinner)
  .entries(withCountry);

const flatMonth = [].concat(...byMonth.map(d => d.value.articles));
fs.writeFileSync(`./output/analysis--month.csv`, d3.csvFormat(flatMonth));

const resultMonth = byMonth.map(d => ({
  year: d.value.articles[0].year,
  month: d.value.articles[0].month,
  country: d.value.name,
  count: d.value.count
}));

resultMonth.sort(
  (a, b) => d3.ascending(+a.year, +b.year) || d3.ascending(+a.month, +b.month)
);

fs.writeFileSync(`./output/result--month.csv`, d3.csvFormat(resultMonth));

const byYear = d3
  .nest()
  .key(d => d.year)
  .rollup(findWinner)
  .entries(withCountry);

const flatYear = [].concat(...byYear.map(d => d.value.articles));
fs.writeFileSync(`./output/analysis--year.csv`, d3.csvFormat(flatYear));

const resultYear = byYear.map(d => ({
  year: d.value.articles[0].year,
  country: d.value.name,
  count: d.value.count
}));

resultYear.sort((a, b) => d3.ascending(+a.year, +b.year));

fs.writeFileSync(`./output/result--year.csv`, d3.csvFormat(resultYear));
