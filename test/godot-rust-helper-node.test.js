'use strict'

const chai = require('chai');
const path = require('path');
const fs = require('fs-extra');
const sinon = require('sinon');
const shelljs = require('shelljs');

let scriptPath = path.join(process.cwd(), 'bin', 'godot-rust-helper.js');

before(() => {
  if (fs.pathExistsSync('test/godot-test-project/rust-modules')) fs.removeSync('test/godot-test-project/rust-modules');

  if (fs.pathExistsSync('test/test-environment')) fs.removeSync('test/test-environment');
});

describe('Creating a new environment', () => {
  before(() => {
    if (fs.pathExistsSync('test/godot-test-project/rust-modules')) fs.removeSync('test/godot-test-project/rust-modules');

    if (fs.pathExistsSync('test/test-environment')) fs.removeSync('test/test-environment');
  });

  afterEach(() => {
    if (fs.pathExistsSync('test/test-environment')) fs.removeSync('test/test-environment');
  });

  it('should not create an environment because the Godot project provided does not have a project.godot file', () => {
    const invalidGodotProjectPath = path.resolve(__dirname, '..', 'src');

    shelljs.exec(`node ${scriptPath} new test/test-environment ${invalidGodotProjectPath}`);

    chai.expect(fs.pathExistsSync('test/test-environment')).to.be.false;
  });

  it('should create a new environment with a config file containing the default targets', () => {
    shelljs.exec(`node ${scriptPath} new test/test-environment test/godot-test-project`);

    const config = fs.readJsonSync('test/test-environment/godot-rust-helper.json');

    const expected = {
      godotProjectDir: 'C:\\Users\\Bob\\Documents\\Projects\\godot-rust-helper-node\\test\\godot-test-project',
      targets: ['windows'],
      modules: []
    };

    chai.expect(config).to.deep.equal(expected);
  });

  it('should create a new environment with a config file containing the provided targets', () => {
    shelljs.exec(`node ${scriptPath} new test/test-environment test/godot-test-project windows,linux,osx`);

    const config = fs.readJsonSync('test/test-environment/godot-rust-helper.json');

    const expected = {
      godotProjectDir: 'C:\\Users\\Bob\\Documents\\Projects\\godot-rust-helper-node\\test\\godot-test-project',
      targets: ['windows', 'linux', 'osx'],
      modules: []
    };

    chai.expect(config).to.deep.equal(expected);
  });
});

describe('Creating modules', () => {
  before(() => {
    if (fs.pathExistsSync('test/godot-test-project/rust-modules')) fs.removeSync('test/godot-test-project/rust-modules');

    if (fs.pathExistsSync('test/test-environment')) fs.removeSync('test/test-environment');

    shelljs.exec(`node ${scriptPath} new test/test-environment test/godot-test-project`);

    shelljs.cd('test/test-environment');

    scriptPath = path.join(process.cwd(), '..', '..', 'bin', 'godot-rust-helper.js');
  });

  afterEach(() => {
    if (fs.pathExistsSync('hello')) fs.removeSync('hello');

    if (fs.pathExistsSync(path.join(process.cwd(), '..', 'godot-test-project', 'rust-modules', 'hello'))) fs.removeSync(path.join(process.cwd(), '..', 'godot-test-project', 'rust-modules', 'hello'));

    const config = fs.readJsonSync('godot-rust-helper.json');
    config.modules = [];

    fs.outputJsonSync('godot-rust-helper.json', config);
  });

  it('should create a module and add an entry for it in the config file', () => {
    shelljs.exec(`node ${scriptPath} create hello`);

    const config = fs.readJsonSync('godot-rust-helper.json');

    chai.expect(config.modules).to.deep.equal(['hello']);
  }).timeout(5000);

  it('should create a module and create a gdnlib file for it in the Godot project', () => {
    shelljs.exec(`node ${scriptPath} create hello`);

    const gdnlibFileExists = fs.pathExistsSync(path.join(process.cwd(), '..', 'godot-test-project', 'rust-modules', 'hello', 'hello.gdnlib'));

    chai.expect(gdnlibFileExists).to.be.true;
  }).timeout(5000);

  it('should create multiple modules', () => {
    shelljs.exec(`node ${scriptPath} create hello`);
    shelljs.exec(`node ${scriptPath} create world`);

    const config = fs.readJsonSync('godot-rust-helper.json');

    const gdnlibFileExists1 = fs.pathExistsSync(path.join(process.cwd(), '..', 'godot-test-project', 'rust-modules', 'hello', 'hello.gdnlib'));
    const gdnlibFileExists2 = fs.pathExistsSync(path.join(process.cwd(), '..', 'godot-test-project', 'rust-modules', 'world', 'world.gdnlib'));

    chai.expect(config.modules).to.deep.equal(['hello', 'world']);
    chai.expect(gdnlibFileExists1).to.be.true;
    chai.expect(gdnlibFileExists2).to.be.true;
  }).timeout(5000);
});

describe('Removing modules', () => {
  before(() => {
    if (fs.pathExistsSync('test/godot-test-project/rust-modules')) fs.removeSync('test/godot-test-project/rust-modules');

    if (fs.pathExistsSync('test/test-environment')) fs.removeSync('test/test-environment');

    shelljs.exec(`node ${scriptPath} new test/test-environment test/godot-test-project`);

    shelljs.cd('test/test-environment');

    scriptPath = path.join(process.cwd(), '..', '..', 'bin', 'godot-rust-helper.js');
  });

  it('should remove all traces of a created module', () => {
    shelljs.exec(`node ${scriptPath} create hello`);

    shelljs.exec(`node ${scriptPath} remove hello`);

    const config = fs.readJsonSync('godot-rust-helper.json');

    const moduleExists = fs.pathExistsSync('hello');
    const gdnlibFileExists = fs.pathExistsSync(path.join(process.cwd(), '..', 'godot-test-project', 'rust-modules', 'hello'));
    
    chai.expect(config.modules).to.deep.equal([]);
    chai.expect(moduleExists).to.be.false;
    chai.expect(gdnlibFileExists).to.be.true;
  }).timeout(5000);
});

// describe('Building modules', () => {
//   before(() => {
//     if (fs.pathExistsSync('test/godot-test-project/rust-modules')) fs.removeSync('test/godot-test-project/rust-modules');

//     if (fs.pathExistsSync('test/test-environment')) fs.removeSync('test/test-environment');

//     shelljs.exec(`node ${scriptPath} create hello`);

//     scriptPath = path.join(process.cwd(), '..', '..', 'bin', 'godot-rust-helper.js');

//     shelljs.cd('hello');
//   });

//   it('should build the module and copy the dll into the Godot project module dir', () => {
//     shelljs.exec(`node ${scriptPath} build`);

//     const dllFileExists = fs.pathExistsSync(path.join(process.cwd(), '..', '..', 'godot-test-project', 'rust-modules', 'hello', 'hello.dll'));

//     chai.expect(dllFileExists).to.be.true;
//   }).timeout(300000);
// });