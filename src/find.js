'use strict'

const fs = require('fs-extra');
const { resolve } = require('path');

/**
 * Finds the nearest Cargo.toml file.
 * 
 * @param {string} currentDir The current directory that we are in.
 * 
 * @returns {string} Returns the path of the nearest Cargo.toml file.
 */
module.exports = function findNearestCargoToml(currentDir) {
  let exists = false;
  let dirToCheck = currentDir;

  let iterations = 0;

  while (!exists && iterations <= 10) {
    exists = fs.pathExistsSync(resolve(dirToCheck, 'Cargo.toml'));
    
    if (!exists) {
      iterations++;
      dirToCheck = resolve(dirToCheck, '..');
    }
  }

  return dirToCheck;
}
