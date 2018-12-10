const d3 = require('d3');
const fs = require('fs');

const words = d3
  .csvParse(fs.readFileSync('./input/most-common-words.csv', 'utf-8'))
  .map(w => w.word);

const data = d3.csvParse(fs.readFileSync('./output/variations.csv', 'utf-8'));

function split(str) {
  return str.split(' | ');
}

const overlap = data
  .map(d => {
    const country = split(d.country);
    const demonym = split(d.demonym);
    const cities = split(d.cities);
    const all = [...country, ...demonym, ...cities].filter(d => d);
    const filtered = all.filter(a => words.includes(a));
    return filtered;
  })
  .filter(d => d.length);

console.log(overlap);
