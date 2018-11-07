const d3 = require('d3');
const fs = require('fs');
const mkdirp = require('mkdirp');
const uniq = require('lodash.uniqby');

mkdirp('./output/months-with-countries');

// remove US
const countries = d3
  .csvParse(fs.readFileSync('./output/countries.csv', 'utf-8'))
  .filter(d => !d.common.includes('United States'));

const renaming = d3.csvParse(
  fs.readFileSync('./input/geographical_renaming.csv', 'utf-8')
);

// rules
// common in other demonym: check that other demonym doesn't exist (eg. Georgia and South Georgian)
// common means other thing https://github.com/the-pudding/nyt-map-data/issues/5

countries.forEach(c => (c.rename = []));
renaming.forEach(r => {
  // merge renamings to countries
  const matchA = countries.find(c => c.common === r.current);
  const matchB = countries.find(c => c.official === r.current);
  if (matchA) matchA.rename.push(r.previous.toLowerCase().trim());
  else if (matchB) matchB.rename.push(r.previous.toLowerCase().trim());
  else console.log('no renaming match', r);
});

countries.forEach((country, index) => {
  // if a denonym is not perfectly unique (eg. Dominican) then we can't use
  const match = countries.find(
    (c, i) => index !== i && country.demonym === c.demonym
  );
  if (match) country.demonym = '';
  country.commonLower = country.common.toLowerCase().trim();
  country.demonymLower = country.demonym.toLowerCase().trim();
});

countries.forEach((country, index) => {
  // setup exclusions to check if it finds a match
  // common in other common
  const cc = countries.filter(
    (c, i) => index !== i && c.commonLower.includes(country.commonLower)
  );
  // common in other dem
  const cd = countries.filter(
    (c, i) => index !== i && c.demonymLower.includes(country.commonLower)
  );
  country.commonExclude = [].concat(
    ...cc.map(c => c.commonLower),
    ...cd.map(c => c.demonymLower)
  );

  // dem in other common
  const dc = country.demonymLower
    ? countries.filter(
        (c, i) => index !== i && c.commonLower.includes(country.demonymLower)
      )
    : [];
  // dem in other dem
  const dd = country.demonymLower
    ? countries.filter(
        (c, i) => index !== i && c.demonymLower.includes(country.demonymLower)
      )
    : [];

  country.demonymExclude = [].concat(
    ...dc.map(c => c.commonLower),
    ...dd.map(c => c.demonymLower)
  );
});

function includes({ h, inc, exc }) {
  const found = inc.find(i => h.includes(i));
  if (!exc.length) return found;
  return found && !exc.find(e => h.includes(e));
}

function checkMatch({ c, h, f }) {
  if (f === 'common')
    return includes({
      h,
      inc: [c.commonLower, ...c.rename],
      exc: c.commonExclude
    });
  else if (f === 'demonym')
    return (
      c.demonymLower &&
      includes({ h, inc: [c.demonymLower], exc: c.demonymExclude })
    );
  return (
    h.includes({
      h,
      inc: [c.commonLower, ...c.rename],
      exc: c.commonExclude
    }) ||
    (c.demonymLower &&
      includes({ h, inc: [c.demonymLower], exc: c.demonymExclude }))
  );
}

function findCountries({ data, year, month }) {
  const filtered = data.filter(d => {
    const exists = countries.find(c =>
      checkMatch({ c, h: d.headline.toLowerCase(), f: 'both' })
    );
    return exists;
  });
  const output = d3.csvFormat(filtered);
  const path = `./output/months-with-countries/${year}-${month}.csv`;
  fs.writeFileSync(path, output);
}

function init() {
  const files = fs
    .readdirSync('./output/months-clean')
    .filter(d => d.includes('.csv'));

  for (f in files) {
    console.log(files[f]);
    const data = d3.csvParse(
      fs.readFileSync(`./output/months-clean/${files[f]}`, 'utf-8')
    );
    const split = files[f].split('-');
    const year = split[0];
    const month = split[1].replace('.csv', '');
    const r = findCountries({ data, year, month });
  }
}

init();
