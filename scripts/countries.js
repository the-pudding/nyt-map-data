const d3 = require('d3');
const fs = require('fs');
const mkdirp = require('mkdirp');

mkdirp('./output');

const countries = JSON.parse(
  fs.readFileSync('./input/countries.json', 'utf-8')
);

const result = countries.map(
  ({ name, cca2, capital, demonym, flag, latlng, region, subregion }) => {
    const { common, official } = name;
    return {
      common,
      official,
      cca2,
      capital: capital.join(','),
      demonym,
      flag,
      latlng: latlng.join(','),
      region,
      subregion: subregion || region
    };
  }
);

fs.writeFileSync('./output/countries.csv', d3.csvFormat(result));
