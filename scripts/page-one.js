const d3 = require('d3');
const fs = require('fs');
const mkdirp = require('mkdirp');

mkdirp('./output/months-page-one');

function clean({ data, year, month }) {
  const filtered = data.filter(d => d.print_page === '1');

  const output = d3.csvFormat(filtered);
  const path = `./output/months-page-one/${year}-${month}.csv`;
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
    clean({ data, year, month });
  }
}

init();
