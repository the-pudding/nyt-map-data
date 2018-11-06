const d3 = require('d3');
const fs = require('fs');
const mkdirp = require('mkdirp');

mkdirp('./output');

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

function analyze({ data, year, month }) {
  const result = [];
  countries.forEach(c => {
    const common = data.filter(d => checkMatch({ c, d, f: 'common' })).length;
    const demonym = data.filter(d => checkMatch({ c, d, f: 'demonym' })).length;
    const count = data.filter(d => checkMatch({ c, d, f: 'both' })).length;
    result.push({ country: c.common, year, month, common, demonym, count });
  });

  return result;
}

function init() {
  const files = fs
    .readdirSync('./output/months')
    .filter(d => d.includes('.csv'));

  const result = [];
  for (f in files) {
    console.log(files[f]);
    const data = d3.csvParse(
      fs.readFileSync(`./output/months-with-countries/${files[f]}`, 'utf-8')
    );
    const split = files[f].split('-');
    const year = split[0];
    const month = split[1].replace('.csv', '');
    const r = analyze({ data, year, month });
    result.push(r);
  }
  const output = [].concat(...result);
  const csv = d3.csvFormat(output);
  fs.writeFileSync('./output/analysis.csv', csv);
}

init();
