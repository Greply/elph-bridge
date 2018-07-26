'use strict';

const fs = require('fs');
const del = require('del');
const rollup = require('rollup');
const pkg = require('../package.json');

let promise = Promise.resolve();

// Clean up the output directory
promise = promise.then(() => del(['dist/*']));

// Compile source code into a distributable format with Babel
['es', 'cjs', 'umd', 'iife'].forEach((format) => {
  var moduleName = undefined;
  if (format === 'umd') {
    moduleName = pkg.name;
  } else if (format === 'iife') {
    moduleName = capitalizeFirstLetter(pkg.name);
  }

  promise = promise.then(() => rollup.rollup({
    entry: 'src/index.js',
    external: Object.keys(pkg.dependencies),
  }).then(bundle => bundle.write({
    dest: `dist/${`index.${format}`}.js`,
    format,
    sourceMap: true,
    moduleName: moduleName
  })));
});

// Copy package.json and LICENSE.txt
promise = promise.then(() => {
  delete pkg.private;
  delete pkg.devDependencies;
  delete pkg.scripts;
  delete pkg.eslintConfig;
  delete pkg.babel;
  fs.writeFileSync('dist/package.json', JSON.stringify(pkg, null, '  '), 'utf-8');
  fs.writeFileSync('dist/LICENSE.txt', fs.readFileSync('LICENSE.txt', 'utf-8'), 'utf-8');
  fs.writeFileSync('dist/README.md', fs.readFileSync('README.md', 'utf-8'), 'utf-8');
});

promise.catch(err => console.error(err.stack)); // eslint-disable-line no-console

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}