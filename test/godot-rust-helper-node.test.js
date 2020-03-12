'use strict'

const chai = require('chai');
const path = require('path');
const fs = require('fs-extra');
const shelljs = require('shelljs');

let scriptPath;
let configFilePath;
let environmentPath;
let godotProjectPath;
let godotRustModulesPath;

after(() => {
  environmentPath = path.join(process.cwd(), 'test', 'test-environment');
  godotRustModulesPath = path.join(process.cwd(), 'test', 'godot-test-project', 'rust-modules');

  fs.removeSync(environmentPath);
  fs.removeSync(godotRustModulesPath);
});

describe('Creating a new environment', () => {
  before(() => {
    environmentPath = path.join(process.cwd(), 'test', 'test-environment');
    godotProjectPath = path.join(process.cwd(), 'test', 'godot-test-project');
    godotRustModulesPath = path.join(process.cwd(), 'test', 'godot-test-project', 'rust-modules');
    configFilePath = path.join(process.cwd(), 'test', 'test-environment', 'godot-rust-helper.json');

    scriptPath = path.join(process.cwd(), 'bin', 'godot-rust-helper.js');

    fs.removeSync(environmentPath);
    fs.removeSync(godotRustModulesPath);
  });

  afterEach(() => {
    fs.removeSync(environmentPath);
  });

  it('should not create an environment because the Godot project provided does not have a project.godot file', () => {
    const invalidGodotProjectPath = path.join(process.cwd(), 'src');

    shelljs.exec(`node ${scriptPath} new ${environmentPath} ${invalidGodotProjectPath}`);

    chai.expect(fs.pathExistsSync(environmentPath)).to.be.false;
  });

  it('should create a new environment with a config file containing the default targets', () => {
    shelljs.exec(`node ${scriptPath} new ${environmentPath} ${godotProjectPath}`);

    const config = fs.readJsonSync(configFilePath);

    const expected = {
      godotProjectDir: 'C:\\Users\\Bob\\Documents\\Projects\\godot-rust-helper-node\\test\\godot-test-project',
      targets: ['windows'],
      modules: []
    };

    chai.expect(config).to.deep.equal(expected);
  });

  it('should create a new environment with a config file containing the provided targets', () => {
    shelljs.exec(`node ${scriptPath} new ${environmentPath} ${godotProjectPath} windows,linux,osx`);

    const config = fs.readJsonSync(configFilePath);

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
    environmentPath = path.join(process.cwd(), 'test', 'test-environment');
    godotProjectPath = path.join(process.cwd(), 'test', 'godot-test-project');
    godotRustModulesPath = path.join(process.cwd(), 'test', 'godot-test-project', 'rust-modules');

    fs.removeSync(environmentPath);
    fs.removeSync(godotRustModulesPath);

    shelljs.exec(`node ${scriptPath} new ${environmentPath} ${godotProjectPath}`);

    shelljs.cd(environmentPath);

    scriptPath = path.join(process.cwd(), '..', '..', 'bin', 'godot-rust-helper.js');

    environmentPath = path.join(process.cwd());
    godotProjectPath = path.join(process.cwd(), '..', 'godot-test-project');
    godotRustModulesPath = path.join(process.cwd(), '..', 'godot-test-project', 'rust-modules');
    configFilePath = path.join(process.cwd(), 'godot-rust-helper.json');

    // console.log('Environment Path: ', environmentPath);
    // console.log('Godot Project Path: ', godotProjectPath);
    // console.log('Rust Modules Path: ', godotRustModulesPath);
    // console.log('Config Path: ', configFilePath);
  });

  afterEach(() => {
    const modulePath = path.join(process.cwd(), 'hello');
    const godotMoudlePath = path.join(process.cwd(), '..', 'godot-test-project', 'rust-modules', 'hello');

    fs.removeSync(modulePath);
    fs.removeSync(godotMoudlePath);

    const config = fs.readJsonSync(configFilePath);
    config.modules = [];

    fs.outputJsonSync(configFilePath, config);
  });

  it('should create a module and add an entry for it in the config file', () => {
    shelljs.exec(`node ${scriptPath} create hello`);

    const config = fs.readJsonSync(configFilePath);

    chai.expect(config.modules).to.deep.equal(['hello']);
  }).timeout(5000);

  it('should create a module and create a gdnlib file for it in the Godot project', () => {
    shelljs.exec(`node ${scriptPath} create hello`);

    const gdnLibFilePath = path.resolve(godotRustModulesPath, 'hello', 'hello.gdnlib');

    const gdnlibFileExists = fs.pathExistsSync(gdnLibFilePath);

    chai.expect(gdnlibFileExists).to.be.true;
  }).timeout(5000);

  it('should create multiple modules', () => {
    shelljs.exec(`node ${scriptPath} create hello`);
    shelljs.exec(`node ${scriptPath} create world`);

    const config = fs.readJsonSync(configFilePath);

    const gdnLibFilePath1 = path.join(godotRustModulesPath, 'hello', 'hello.gdnlib');
    const gdnLibFilePath2 = path.join(godotRustModulesPath, 'world', 'world.gdnlib');

    const gdnlibFileExists1 = fs.pathExistsSync(gdnLibFilePath1);
    const gdnlibFileExists2 = fs.pathExistsSync(gdnLibFilePath2);

    chai.expect(config.modules).to.deep.equal(['hello', 'world']);
    chai.expect(gdnlibFileExists1).to.be.true;
    chai.expect(gdnlibFileExists2).to.be.true;
  }).timeout(5000);
});

describe('Removing modules', () => {
  before(() => {
    const startPath = path.join(process.cwd(), '..', '..');
    shelljs.cd(startPath);

    environmentPath = path.join(process.cwd(), 'test', 'test-environment');
    godotProjectPath = path.join(process.cwd(), 'test', 'godot-test-project');
    godotRustModulesPath = path.join(process.cwd(), 'test', 'godot-test-project', 'rust-modules');

    fs.removeSync(environmentPath);
    fs.removeSync(godotRustModulesPath);

    shelljs.exec(`node ${scriptPath} new ${environmentPath} ${godotProjectPath}`);

    shelljs.cd(environmentPath);

    scriptPath = path.join(process.cwd(), '..', '..', 'bin', 'godot-rust-helper.js');

    environmentPath = path.join(process.cwd());
    godotProjectPath = path.join(process.cwd(), '..', 'godot-test-project');
    godotRustModulesPath = path.join(process.cwd(), '..', 'godot-test-project', 'rust-modules');
    configFilePath = path.join(process.cwd(), 'godot-rust-helper.json');
  });

  it('should remove all traces of a created module', () => {
    shelljs.exec(`node ${scriptPath} create hello`);

    shelljs.exec(`node ${scriptPath} destroy hello`);

    const config = fs.readJsonSync(configFilePath);

    const modulePath = path.join(process.cwd(), 'hello');
    const godotModulePath = path.join(godotRustModulesPath, 'hello')

    const moduleExists = fs.pathExistsSync(modulePath);
    const gdnlibFileExists = fs.pathExistsSync(godotModulePath);

    chai.expect(config.modules).to.deep.equal([]);
    chai.expect(moduleExists).to.be.false;
    chai.expect(gdnlibFileExists).to.be.false;
  }).timeout(5000);
});

describe('Building modules', function () {
  this.timeout(300000);

  before(function () {
    const startPath = path.join(process.cwd(), '..', '..');
    shelljs.cd(startPath);

    environmentPath = path.join(process.cwd(), 'test', 'test-environment');
    godotProjectPath = path.join(process.cwd(), 'test', 'godot-test-project');
    godotRustModulesPath = path.join(process.cwd(), 'test', 'godot-test-project', 'rust-modules');

    fs.removeSync(environmentPath);
    fs.removeSync(godotRustModulesPath);

    shelljs.exec(`node ${scriptPath} new ${environmentPath} ${godotProjectPath}`);

    shelljs.cd(environmentPath);

    scriptPath = path.join(process.cwd(), '..', '..', 'bin', 'godot-rust-helper.js');

    environmentPath = path.join(process.cwd());
    godotProjectPath = path.join(process.cwd(), '..', 'godot-test-project');
    godotRustModulesPath = path.join(process.cwd(), '..', 'godot-test-project', 'rust-modules');
    configFilePath = path.join(process.cwd(), 'godot-rust-helper.json');

    shelljs.exec(`node ${scriptPath} create hello`)

    const modulePath = path.join(process.cwd(), 'hello');
    shelljs.cd(modulePath);
  });

  it('should build the module and copy the dll into the Godot project module dir', function () {
    shelljs.exec(`node ${scriptPath} build`);

    const dllFilePath = path.join(godotRustModulesPath, 'hello', 'hello.dll');

    const dllFileExists = fs.pathExistsSync(dllFilePath);

    chai.expect(dllFileExists).to.be.true;
  });
});