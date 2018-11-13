const d3 = require('d3');
const fs = require('fs');

// custom dem assignment when duplicates
const customDem = {
  French: 'France',
  Dutch: 'Netherlands',
  Congolese: 'DR Congo',
  Dominican: 'Dominican Republic',
  Indian: 'India',
  Norwegian: 'Norway'
};

const customOther = {
  'DR Congo': ['congo'],
  'United Kingdom': ['u.k.'],
  Russia: ['u.s.s.r.', 'soviet']
};

const customExclude = {
  Jersey: ['new jersey']
};

const customAdd = [
  {
    common: 'Czechoslovakia',
    demonym: 'Czechoslovakian'
  },
  {
    common: 'Yugoslavia',
    demonym: 'Yugoslavian'
  },
  {
    common: 'Tibet',
    demonym: 'Tibetan'
  },
  {
    common: 'Prussia',
    demonym: 'Prussian'
  }
];

// rules
// common in other demonym: check that other demonym doesn't exist (eg. Georgia and South Georgian)
// common means other thing https://github.com/the-pudding/nyt-map-data/issues/5

const renaming = d3.csvParse(
  fs.readFileSync('./input/geographical_renaming.csv', 'utf-8')
);

module.exports = function prepareCountries(countries) {
  countries = countries.concat(customAdd);
  countries.forEach(c => {
    // adjust demonym to use if duplicate
    let dem = c.demonym;
    const customD = customDem[c.demonym];
    if (customD) {
      dem = customD === c.common ? dem : '';
    }
    c.demonymLower = dem.toLowerCase().trim();
    c.commonLower = c.common.toLowerCase().trim();
    c.custom = customOther[c.common] ? [...customOther[c.common]] : [];
  });

  renaming.forEach(r => {
    // merge renamings to countries
    const matchA = countries.find(c => c.common === r.current);
    const matchB = countries.find(c => c.official === r.current);
    if (matchA) matchA.custom.push(r.previous.toLowerCase().trim());
    else if (matchB) matchB.custom.push(r.previous.toLowerCase().trim());
    else console.log('no renaming match', r);
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

    const exclude = customExclude[country.common] || [];
    country.commonExclude = [].concat(
      ...cc.map(c => c.commonLower),
      ...cd.map(c => c.demonymLower),
      ...exclude
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
  return countries;
};
