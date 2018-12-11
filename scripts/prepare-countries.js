const d3 = require('d3');
const fs = require('fs');

// custom dem assignment when duplicates
const specialDem = {
  French: 'France',
  Dutch: 'Netherlands',
  Congolese: 'DR Congo',
  Dominican: 'Dominican Republic',
  Indian: 'India',
  Norwegian: 'Norway'
};

// extra dem
const customDemonym = {
  China: ['chinamen', 'chinaman', 'sino'],
  Croatia: ['croat'],
  Denmark: ['dane'],
  France: ['franco'],
  'United Kingdom': ['brit', 'welsh', 'scotish', 'anglo'],
  Greece: ['greco'],
  Spain: ['catalan'],
  Iran: ['persian'],
  Italy: ['italo'],
  Japan: ['nipponese', 'jap'],
  Laos: ['lao'],
  'New Zealand': ['maori'],
  Russia: ['russo', 'bolshevik'],
  Turkey: ['anatolian', 'turk'],
  Yugoslavia: ['jugoslav'],
  Romania: ['rumanian'],
  Czechoslovakia: ['czech']
};

const customCommon = {
  'DR Congo': ['congo'],
  'United Kingdom': [
    'u.k.',
    'england',
    'wales',
    'scotland',
    'briton',
    'britain'
  ],
  Germany: ['weimar', 'deutschland'],
  Russia: ['u.s.s.r.', 'soviet'],
  Spain: ['basque', 'catalonia'],
  'Indo-China': ['indochina'],
  Iran: ['persia'],
  Japan: ['nippon'],
  Libya: ['benghazi'],
  Netherlands: ['holland'],
  Palestine: ['gaza'],
  Sudan: ['darfur'],
  Turkey: ['anatolia'],
  Romania: ['rumania'],
  Yugoslavia: ['jugoslavia'],
  'South Africa': ['boer'],
  Vietnam: ['saigon']
};

const customExclude = {
  Jersey: ['new jersey']
};

const customAdd = [
  {
    common: 'Czechoslovakia',
    demonym: 'Czechoslovak'
  },
  {
    common: 'Yugoslavia',
    demonym: 'Yugoslav'
  },
  {
    common: 'Tibet',
    demonym: 'Tibetan'
  },
  {
    common: 'Prussia',
    demonym: 'Prussian'
  },
  {
    common: 'Austria-Hungary',
    demonym: 'Austro'
  },
  {
    common: 'Indo-China',
    demonym: 'Indo-Chinese'
  }
];

const renaming = d3.csvParse(
  fs.readFileSync('./input/geographical_renaming.csv', 'utf-8')
);

module.exports = function prepareCountries({ countries, cities }) {
  countries = countries.concat(customAdd);
  countries.forEach(c => {
    // adjust demonym to use if duplicate
    let dem = c.demonym;
    const specialD = specialDem[c.demonym];
    if (specialD) {
      dem = specialD === c.common ? dem : '';
    }
    c.demonymLower = dem.toLowerCase().trim();
    c.commonLower = c.common.toLowerCase().trim();
    c.customCommon = customCommon[c.common] ? [...customCommon[c.common]] : [];
    c.customDemonym = customDemonym[c.common]
      ? [...customDemonym[c.common]]
      : [];
  });

  renaming.forEach(r => {
    // merge renamings to countries
    const matchA = countries.find(c => c.common === r.current);
    const matchB = countries.find(c => c.official === r.current);
    if (matchA) matchA.customCommon.push(r.previous.toLowerCase().trim());
    else if (matchB) matchB.customCommon.push(r.previous.toLowerCase().trim());
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

    country.capitalLower = country.capital
      ? country.capital.toLowerCase()
      : null;

    // add cities to country
    country.cities = cities
      .filter(c => c.country.toLowerCase() === country.commonLower)
      .map(c => c.city.toLowerCase())
      .filter(c => c !== country.capitalLower);

    if (country.capitalLower) country.cities.push(country.capitalLower);
  });
  return countries;
};
