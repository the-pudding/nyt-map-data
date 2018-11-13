const d3 = require('d3');
const fs = require('fs');
const mkdirp = require('mkdirp');
const prepareCountries = require('./prepare-countries');
// const readSuffix = 'page-one';
// const writeSuffix = 'page-one';
const readSuffix = 'clean';
// const writeSuffix = 'all';
const writeSuffix = 'weighted-10';

mkdirp('./output');

// remove US
let countries = d3
  .csvParse(fs.readFileSync('./output/countries.csv', 'utf-8'))
  .filter(d => d.demonym !== 'American');

countries = prepareCountries(countries);

function includes({ h, inc, exc }) {
  const found = inc.find(i => {
    const hasWord = h.includes(i);
    if (!hasWord) return false;
    const index = h.indexOf(i);
    const prevChar = h.charAt(index - 1);
    const hasPrefix = ['-', ' ', '"'].includes(prevChar);
    return index === 0 || hasPrefix;
  });
  if (!exc.length) return found;
  return (
    found &&
    !exc.find(e => {
      const hasWord = h.includes(e);
      if (!hasWord) return false;
      const index = h.indexOf(e);
      const prevChar = h.charAt(index - 1);
      const hasPrefix = ['-', ' ', '"'].includes(prevChar);
      return index === 0 || hasPrefix;
    })
  );
}

function checkMatch({ c, h }) {
  const common = includes({
    h,
    inc: [c.commonLower, ...c.custom],
    exc: c.commonExclude
  });
  const demonym =
    c.demonymLower &&
    includes({ h, inc: [c.demonymLower], exc: c.demonymExclude });

  return common || demonym;
}

function analyze({ data, year, month }) {
  const result = [];
  countries.forEach(c => {
    const matches = data.filter(d =>
      checkMatch({ c, h: d.headline.toLowerCase() })
    );
    const count = writeSuffix.includes('weighted')
      ? d3.sum(matches, m => (m.print_page === '1' ? 10 : 1))
      : matches.length;

    result.push({ country: c.common, year, month, count });
  });

  return result;
}

function init() {
  const files = fs
    .readdirSync(`./output/months-${readSuffix}`)
    .filter(d => d.includes('.csv'));
  const result = [];
  for (f in files) {
    console.log(files[f]);
    const data = d3.csvParse(
      fs.readFileSync(`./output/months-${readSuffix}/${files[f]}`, 'utf-8')
    );

    const split = files[f].split('-');
    const year = split[0];
    const month = split[1].replace('.csv', '');
    const r = analyze({ data, year, month });
    result.push(r);
  }
  const output = [].concat(...result);
  const csv = d3.csvFormat(output);
  fs.writeFileSync(`./output/analysis--${writeSuffix}.csv`, csv);
}

init();
