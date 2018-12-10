const d3 = require('d3');
const fs = require('fs');
const mkdirp = require('mkdirp');
const prepareCountries = require('./prepare-countries');

const cities50k = d3.csvParse(
  fs.readFileSync(`./input/cities-50k.csv`, 'utf-8')
);

// 500k cities
const worldCityData = d3
  .csvParse(fs.readFileSync(`./input/world-cities.csv`, 'utf-8'))
  .map(d => ({
    city: d.city,
    country: d.country,
    iso2: d.iso2,
    population: +d.population
  }))
  .filter(d => d.population >= 500000);

const usCityData = cities50k.map(d => d.city);

const usStateData = d3
  .nest()
  .key(d => d.state)
  .entries(cities50k)
  .map(d => d.key);

mkdirp('./output');

// remove US
const countries = d3
  .csvParse(fs.readFileSync('./output/countries.csv', 'utf-8'))
  .filter(d => d.demonym !== 'American');

const countryData = prepareCountries({ countries, cities: worldCityData });

function checkFix({ h, word }) {
  const indexStart = h.indexOf(word);
  const indexEnd = indexStart + word.length;
  const charBefore = h.charAt(indexStart - 1);
  const charAfter = h.charAt(indexEnd);
  const hasPrefix = [' ', '-', '"', '('].includes(charBefore);
  const hasSuffix = [
    ' ',
    '-',
    '.',
    ':',
    ';',
    '’',
    "'",
    '"',
    '?',
    ',',
    ')',
    '!',
    's'
  ].includes(charAfter);
  return (indexStart === 0 || hasPrefix) && hasSuffix;
}

function findCountry({ c, h, inc, exc = [] }) {
  // inc = [germany,]
  const found = inc.find(word => {
    const hasWord = h.includes(word);
    if (!hasWord) return false;
    return checkFix({ h, word });
  });

  const output = found ? `${c.commonLower} (${found})` : null;

  // if there is no exclusion, return
  if (!exc.length) return output;
  const hasExclude = exc.find(word => {
    const hasWord = h.includes(word);
    if (!hasWord) return false;
    return checkFix({ h, word });
  });
  return hasExclude ? null : output;
}

function getCityMatch({ c, h }) {
  return findCountry({ c, h, inc: c.cities });
}

function getDemonymMatch({ c, h }) {
  return findCountry({ c, h, inc: [c.demonymLower], exc: c.demonymExclude });
}

function getCommonMatch({ c, h }) {
  return findCountry({
    c,
    h,
    inc: [c.commonLower, ...c.custom],
    exc: c.commonExclude
  });
}

function capitalize(str) {
  const tokens = str.split(' ');
  // proper noun-ify (capitalize words)
  return tokens.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' ');
}

function notUSA(arr) {
  return arr.filter(a => !usStateData.includes(a) && !usCityData.includes(a));
}

function addCountry(d, cb) {
  const { headline } = d;
  const headlineLower = headline.toLowerCase();
  // const headlineCap = capitalize(headlineLower);
  // 1. country (common)
  const common = countryData
    .map(c => getCommonMatch({ c, h: headlineLower }))
    .filter(c => c)
    .join(' : ');
  // 2. dem
  const demonym = countryData
    .map(c => getDemonymMatch({ c, h: headlineLower }))
    .filter(c => c)
    .join(' : ');
  // 3. cities
  const city = countryData
    .map(c => getCityMatch({ c, h: headlineLower }))
    .filter(c => c)
    .join(' : ');

  const match = common || demonym || city;
  const result = match
    ? {
        ...d,
        common,
        demonym,
        city
      }
    : null;
  return result;
}

function saveToDisk(data) {
  const formatted = d3.csvFormat([data]);
  const row = formatted.split('\n')[1];
  fs.appendFileSync('./output/analysis--locations.csv', `\n${row}`);
}

function init() {
  const headlineData = d3.csvParse(
    fs.readFileSync('./output/all-page-one--lite.csv', 'utf-8')
  );

  const header = 'web_url,print_page,pub_date,headline,common,demonym,city';
  fs.writeFileSync('./output/analysis--locations.csv', header);
  headlineData.forEach((h, i) => {
    console.log(`${i + 1} of ${headlineData.length}`);
    const d = addCountry(headlineData[i]);
    if (d) saveToDisk(d);
  });

  // const h = 'THE NEWFOUNDLAND FRENCH Paris Rome FISHERIES; Modus Vivendi with France Has Expired -- Complications Feared.'.toLowerCase();
  // const h = 'Rumors of Greek Upset Are Widespread; England Is Reported Calling Ships to Malta'.toLowerCase();
  // const r = countryData
  //   .map(c => getCommonMatch({ c, h }))
  //   .filter(c => c)
  //   .join(' : ');
  // console.log(r);
}

function variations() {
  const o = countryData.map(d => {
    return {
      country: [d.commonLower].concat(d.custom).join(' | '),
      demonym: d.demonymLower,
      cities: d.cities.join(' | ')
    };
  });

  fs.writeFileSync('./output/variations.csv', d3.csvFormat(o));
}

init();
