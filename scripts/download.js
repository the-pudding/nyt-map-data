const request = require('request');
const d3 = require('d3');
const fs = require('fs');
const mkdirp = require('mkdirp');
const key = require('./key');
mkdirp('./output/months');

function download({ year, month }) {
  return new Promise((resolve, reject) => {
    const url = `http://api.nytimes.com/svc/archive/v1/${year}/${month}.json?api-key=${key}`;
    request(url, (err, response, body) => {
      if (err || response.statusCode !== 200)
        console.log(err, response.statusCode);
      else {
        const json = JSON.parse(body);
        const clean = json.response.docs.map(d => ({
          web_url: d.web_url,
          print_page: d.print_page,
          news_desk: d.news_desk,
          section_name: d.section_name,
          pub_date: d.pub_date,
          document_type: d.document_type,
          headline: d.headline ? d.headline.main : null
        }));
        const csv = d3.csvFormat(clean);
        fs.writeFileSync(`./output/months/${year}-${month}.csv`, csv);
      }
      setTimeout(resolve, 6000);
    });
  });
}

async function init() {
  const end = 2019;
  const start = 1900;
  const months = 12;

  const queries = [{ year: 2018, month: 12 }];
  await download(queries[0]);

  const queries = d3.range((end - start) * months).map(i => ({
    month: (i % months) + 1,
    year: Math.floor(i / months) + start
  }));

  for (q in queries) {
    try {
      const { year, month } = queries[q];
      console.log({ year, month });
      const stats = fs.statSync(`.output/months/${year}-${month}.csv`);
      if (stats) console.log('file exists');
    } catch (err) {
      await download(queries[q]);
    }
  }
}

init();
