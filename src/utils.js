'use strict'

const fs = require('fs-extra');
const { resolve } = require('path');

module.exports = {
  /**
   * Finds the nearest specified file.
   * 
   * @param {string} currentDir The current directory that we are in.
   * @param {string} fileToFind The file to find.
   * 
   * @returns {string} Returns the path of the file passed to be found.
   */
  findFile(currentDir, fileToFind) {
    let exists = false;
    let dirToCheck = currentDir;

    let iterations = 0;

    while (!exists && iterations <= 10) {
      exists = fs.pathExistsSync(resolve(dirToCheck, fileToFind));

      if (!exists) {
        iterations++;
        dirToCheck = resolve(dirToCheck, '..');
      }
    }

    return dirToCheck;
  },

  /**
   * Splits a module name on capitals, joins it back together with an underscore, then converts it to lowercase.
   * 
   * @param {string} modName The module name to format.
   * 
   * @returns {string} Returns the formatted module name.
   */
  formatModName(modName) {
    const modNameSplitOnCapitals = modName.split(/(?=[A-Z])/);
    return modNameSplitOnCapitals.join('_').toLowerCase();
  }
}
