const d3 = require('d3');
const fs = require('fs');
const mkdirp = require('mkdirp');
const uniq = require('lodash.uniqby');
const intersection = require('lodash.intersection');

mkdirp('./output');

const pageOne = d3
  .csvParse(fs.readFileSync('./output/all-page-one--lite.csv', 'utf-8'))
  .map(d => {
    const [year, month] = d.pub_date.split('-');
    return { year, month };
  });

const baseline = d3
  .nest()
  .key(d => d.year)
  .rollup(v => v.length)
  .entries(pageOne);

const data = d3
  .csvParse(fs.readFileSync('./output/analysis--locations.csv', 'utf-8'))
  .map(d => {
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
  arr.sort((a, b) => d3.descending(a.count, b.count));
  const { count } = arr[0];
  const winners = arr.filter(d => d.count === count);
  const winnerNames = winners.map(d => d.name);

  const articles = winners.map(w => {
    return values
      .filter(v => v.countries.includes(w.name))
      .map(a => ({
        ...a,
        top: w.name,
        count
      }));
  });

  return articles;
}

// add in all countries that were matched
const withCountry = data.map(d => {
  const common = d.common ? getCountries(d.common) : [];
  const demonym = d.demonym ? getCountries(d.demonym) : [];
  const city = d.city ? getCountries(d.city) : [];
  const all = [].concat(...common, ...demonym, ...city);
  const countries = uniq(all);
  return { ...d, countries };
});

// BY MONTH
const byMonth = d3
  .nest()
  .key(d => `${d.year}-${d.month}`)
  .rollup(findWinner)
  .entries(withCountry);

const flatMonth = [].concat(...byMonth.map(d => [].concat(...d.value)));
fs.writeFileSync(`./output/analysis--month.csv`, d3.csvFormat(flatMonth));

const resultMonth = byMonth.map(d => ({
  year: d.value[0][0].year,
  month: d.value[0][0].month,
  country: d.value.map(v => v[0].top),
  count: d.value[0][0].count
}));

resultMonth.sort(
  (a, b) => d3.ascending(+a.year, +b.year) || d3.ascending(+a.month, +b.month)
);

// resolve tiebreak order

const recent = {};
const outputMonth = resultMonth.map((m, i) => {
  let { country } = m;
  if (country.length > 1) {
    // 1. if it is in prev/next
    const prev = i > 0 ? resultMonth[i - 1].country : [];
    const next = i < resultMonth.length - 1 ? resultMonth[i + 1].country : [];
    const prevInt = intersection(country, prev);
    const nextInt = intersection(country, next);
    const bothInt = prevInt.concat(nextInt);
    const counts = country.map(c => ({
      c,
      count: bothInt.filter(b => b === c).length
    }));
    counts.sort((a, b) => d3.descending(a.count, b.count));

    if (counts[0].count !== counts[1].count) {
      country = counts.map(d => d.c);
    } else {
      // 2. if it prev won a tie break, downgrade
      const recentCounts = country.map(c => ({
        c,
        count: recent[c] ? recent[c] : 0
      }));

      recentCounts.sort((a, b) => d3.ascending(a.count, b.count));
      country = recentCounts.map(d => d.c);
    }
    if (!recent[country[0]]) recent[country[0]] = 1;
    else recent[country[0]] += 1;
  }

  return {
    ...m,
    country: country.join(':')
  };
});

fs.writeFileSync(`./output/result--month.csv`, d3.csvFormat(outputMonth));

// // BY YEAR
// const byYear = d3
//   .nest()
//   .key(d => d.year)
//   .rollup(findWinner)
//   .entries(withCountry);

// const flatYear = [].concat(...byYear.map(d => d.value.articles));
// fs.writeFileSync(`./output/analysis--year.csv`, d3.csvFormat(flatYear));

// const resultYear = byYear.map(d => ({
//   year: d.value.articles[0].year,
//   country: d.value.name,
//   count: d.value.count
// }));

// resultYear.sort((a, b) => d3.ascending(+a.year, +b.year));

// fs.writeFileSync(`./output/result--year.csv`, d3.csvFormat(resultYear));

// // BY COUNTRY
// // grab all unique countries
// const countryDict = {};
// withCountry.forEach(d => {
//   d.countries.forEach(c => (countryDict[c] = true));
// });

// // loop thru each country, tally total
// const byCountry = Object.keys(countryDict).map(d => {
//   return d3
//     .nest()
//     .key(v => v.year)
//     .rollup(v => ({
//       country: d,
//       count: v.length,
//       year: v[0].year
//     }))
//     .entries(withCountry.filter(v => v.countries.includes(d)))
//     .map(d => ({
//       ...d.value,
//       baseline: baseline.find(b => b.key === d.value.year).value
//     }));
// });

// const resultCountry = [].concat(...byCountry);
// // byCountry.sort((a, b) => d3.ascending(a.count, b.count));

// fs.writeFileSync(`./output/result--country.csv`, d3.csvFormat(resultCountry));

// console.log(z);
