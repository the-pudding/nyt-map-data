const d3 = require('d3');
const fs = require('fs');
const mkdirp = require('mkdirp');
const uniq = require('lodash.uniqby');

mkdirp('./output/months-clean');

function zeroPad(str) {
  return d3.format('02')(str);
}

function clean({ data, year, month }) {
  const filtered = data.filter(d => {
    const notArticle = d.document_type !== 'article';
    if (notArticle) return false;

    const noTitle = d.headline.includes(' -- No Title');
    if (noTitle) return false;

    return true;
  });

  const unique = uniq(filtered, d => d.web_url);
  const output = d3.csvFormat(unique);
  const path = `./output/months-clean/${year}-${zeroPad(month)}.csv`;
  fs.writeFileSync(path, output);
}

function init() {
  const files = fs
    .readdirSync('./output/months')
    .filter(d => d.includes('.csv'));

  for (f in files) {
    console.log(files[f]);
    const data = d3.csvParse(
      fs.readFileSync(`./output/months/${files[f]}`, 'utf-8')
    );
    const split = files[f].split('-');
    const year = split[0];
    const month = split[1].replace('.csv', '');
    clean({ data, year, month });
  }
}

init();
