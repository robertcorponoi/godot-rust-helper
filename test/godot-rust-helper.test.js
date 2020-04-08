'use strict'

const chai = require('chai');
const fs = require('fs-extra');
const shelljs = require('shelljs');

after(() => {
  fs.removeSync('test/test-environment');
  fs.removeSync('test/godot-test-project/rust-modules');
});

describe('Creating a new environment', () => {
  afterEach(() => {
    fs.removeSync('test/test-environment');
  });

  it('should not create an environment because the Godot project provided does not have a project.godot file', () => {
    shelljs.exec(`node bin/godot-rust-helper.js new test/test-environment src`);

    chai.expect(fs.pathExistsSync('test/test-environment')).to.be.false;
  });

  it('should create a new environment with a config file containing the default targets', () => {
    shelljs.exec(`node bin/godot-rust-helper.js new test/test-environment test/godot-test-project`);

    const config = fs.readJsonSync('test/test-environment/godot-rust-helper.json');

    const expected = {
      godotProjectDir: 'C:\\Users\\Bob\\Documents\\Projects\\godot-rust-helper\\test\\godot-test-project',
      targets: ['windows'],
      modules: []
    };

    chai.expect(config).to.deep.equal(expected);
  });

  it('should create a new environment with a config file containing the provided targets', () => {
    shelljs.exec(`node bin/godot-rust-helper.js new test/test-environment test/godot-test-project windows,linux,osx`);

    const config = fs.readJsonSync('test/test-environment/godot-rust-helper.json');

    const expected = {
      godotProjectDir: 'C:\\Users\\Bob\\Documents\\Projects\\godot-rust-helper\\test\\godot-test-project',
      targets: ['windows', 'linux', 'osx'],
      modules: []
    };

    chai.expect(config).to.deep.equal(expected);
  });
});

describe('Creating modules', () => {
  before(() => {
    shelljs.exec(`node bin/godot-rust-helper.js new test/test-environment test/godot-test-project`);
  });

  afterEach(() => {
    fs.removeSync('test/test-environment/hello');
    fs.removeSync('test/godot-test-project/rust-modules/hello');
    fs.removeSync('test/godot-test-project/rust-modules/world');

    const config = fs.readJsonSync('test/test-environment/godot-rust-helper.json');
    config.modules = [];

    fs.outputJsonSync('test/test-environment/godot-rust-helper.json', config);
  });

  it('should create a module and add an entry for it in the config file', () => {
    shelljs.exec(`(cd test/test-environment && node ../../bin/godot-rust-helper.js create hello)`);

    const config = fs.readJsonSync('test/test-environment/godot-rust-helper.json');

    chai.expect(config.modules).to.deep.equal(['hello']);
  }).timeout(5000);

  it('should create a module and create a gdnlib file for it in the Godot project', () => {
    shelljs.exec(`(cd test/test-environment && node ../../bin/godot-rust-helper.js create hello)`);

    const gdnlibFileExists = fs.pathExistsSync('test/godot-test-project/rust-modules/hello/hello.gdnlib');

    chai.expect(gdnlibFileExists).to.be.true;
  }).timeout(5000);

  it('should create multiple modules', () => {
    shelljs.exec(`(cd test/test-environment && node ../../bin/godot-rust-helper.js create hello)`);
    shelljs.exec(`(cd test/test-environment && node ../../bin/godot-rust-helper.js create world)`);

    const config = fs.readJsonSync('test/test-environment/godot-rust-helper.json');

    const gdnlibFileExists1 = fs.pathExistsSync('test/godot-test-project/rust-modules/hello/hello.gdnlib');
    const gdnlibFileExists2 = fs.pathExistsSync('test/godot-test-project/rust-modules/world/world.gdnlib');

    chai.expect(config.modules).to.deep.equal(['hello', 'world']);
    chai.expect(gdnlibFileExists1).to.be.true;
    chai.expect(gdnlibFileExists2).to.be.true;
  }).timeout(50000);
});

describe('Removing modules', () => {
  before(() => {
    fs.removeSync('test/test-environment');
    fs.removeSync('test/godot-test-project/rust-modules');

    shelljs.exec(`node bin/godot-rust-helper.js new test/test-environment test/godot-test-project`);
  });

  it('should remove all traces of a created module', () => {
    shelljs.exec(`(cd test/test-environment && node ../../bin/godot-rust-helper.js create hello)`);
    shelljs.exec(`(cd test/test-environment && node ../../bin/godot-rust-helper.js destroy hello)`);

    const config = fs.readJsonSync('test/test-environment/godot-rust-helper.json');

    const moduleExists = fs.pathExistsSync('test/test-environment/hello');
    const gdnlibFileExists = fs.pathExistsSync('test/godot-test-project/rust-modules/hello');

    chai.expect(config.modules).to.deep.equal([]);
    chai.expect(moduleExists).to.be.false;
    chai.expect(gdnlibFileExists).to.be.false;
  }).timeout(5000);
});

describe('Importing modules', function () {
  this.timeout(300000);
  
  before(function () {
    fs.removeSync('test/test-environment');
    fs.removeSync('test/godot-test-project/rust-modules');

    shelljs.exec(`node bin/godot-rust-helper.js new test/test-environment test/godot-test-project`);
    shelljs.exec(`node bin/godot-rust-helper.js new test/test-environment-2 test/godot-test-project`);
  });

  after(function () {
    fs.removeSync('test/test-environment-2');
    fs.removeSync('test/test-environment/hello');
    fs.removeSync('test/godot-test-project/rust-modules');

    const config = fs.readJsonSync('test/test-environment/godot-rust-helper.json');
    config.modules = [];

    fs.outputJsonSync('test/test-environment/godot-rust-helper.json', config);
  });

  it('should import a module from another environment', function () {
    shelljs.exec(`(cd test/test-environment && node ../../bin/godot-rust-helper.js create hello)`);
    shelljs.exec(`(cd test/test-environment-2 && node ../../bin/godot-rust-helper.js create temp)`);

    shelljs.exec(`(cd test/test-environment && node ../../bin/godot-rust-helper.js import ../test-environment-2/temp)`);

    const tempModuleExistsInEnvironment = fs.pathExistsSync('test/test-environment/temp');
    const tempModuleExistsInGodot = fs.pathExistsSync('test/godot-test-project/rust-modules/temp/temp.gdnlib');

    chai.expect(tempModuleExistsInEnvironment).to.be.true;
    chai.expect(tempModuleExistsInGodot).to.be.true;
  });
});

describe('Building modules', function () {
  this.timeout(300000);

  before(function () {
    fs.removeSync('test/test-environment');
    fs.removeSync('test/godot-test-project/rust-modules');

    shelljs.exec(`node bin/godot-rust-helper.js new test/test-environment test/godot-test-project`);
  });

  it('should build the module and copy the dll into the Godot project module dir', function () {
    shelljs.exec(`(cd test/test-environment && node ../../bin/godot-rust-helper.js create hello)`);
    shelljs.exec(`(cd test/test-environment/hello && node ../../../bin/godot-rust-helper.js build)`);

    const dllFileExists = fs.pathExistsSync('test/godot-test-project/rust-modules/hello/hello.dll');

    chai.expect(dllFileExists).to.be.true;
  });
});