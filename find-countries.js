const d3 = require('d3');
const fs = require('fs');
const mkdirp = require('mkdirp');

mkdirp('./output/months-with-countries');

const countries = d3.csvParse(
  fs.readFileSync('./output/countries.csv', 'utf-8')
);

function checkMatch({ c, d, f }) {
  const common = c.common.toLowerCase();
  const demonym = c.demonym.toLowerCase();
  const hasCommon = d.headline.toLowerCase().includes(common);
  const hasDemonym = d.headline.toLowerCase().includes(demonym);
  if (f === 'common') return common && hasCommon;
  else if (f === 'demonym') return demonym && hasDemonym;
  return (common && hasCommon) || (demonym && hasDemonym);
}

function findCountries({ data, year, month }) {
  const filtered = data.filter(d => {
    const exists = countries.find(c => checkMatch({ c, d, f: 'both' }));
    return exists;
  });
  const output = d3.csvFormat(filtered);
  fs.writeFileSync(
    `./output/months-with-countries/${year}-${month}.csv`,
    output
  );
}

function init() {
  const files = fs
    .readdirSync('./output/months')
    .filter(d => d.includes('.csv'));

  // const result = [];
  for (f in files) {
    console.log(files[f]);
    const data = d3.csvParse(
      fs.readFileSync(`./output/months/${files[f]}`, 'utf-8')
    );
    const split = files[f].split('-');
    const year = split[0];
    const month = split[1].replace('.csv', '');
    const r = findCountries({ data, year, month });
    // result.push(r);
  }
  // const output = [].concat(...result);
  // const csv = d3.csvFormat(output);
  // fs.writeFileSync('./output/anaylsis.csv', csv);
}

init();
