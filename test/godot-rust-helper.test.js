'use strict'

const chai = require('chai');
const fs = require('fs-extra');
const shelljs = require('shelljs');

afterEach(() => {
  fs.removeSync('test/shoot_the_creeps');
  fs.removeSync('test/godot-test-project/rust-modules');
});

describe('Creating a new environment', () => {
  it('should not create an environment because the Godot project provided does not have a project.godot file', () => {
    shelljs.exec(`node bin/godot-rust-helper.js new test/test-environment src`);

    chai.expect(fs.pathExistsSync('test/test-environment')).to.be.false;
  });

  it('should create a new environment with a config file containing the default targets', () => {
    shelljs.exec(`node bin/godot-rust-helper.js new test/shoot_the_creeps test/godot-test-project`);

    const config = fs.readJsonSync('test/shoot_the_creeps/godot-rust-helper.json');

    const expected = {
      name: 'shoot_the_creeps',
      godotProjectDir: 'C:\\Users\\Bob\\Documents\\Projects\\godot-rust-helper\\test\\godot-test-project',
      targets: ['windows'],
      modules: []
    };

    chai.expect(config).to.deep.equal(expected);
  });

  it('should create a rust-modules folder in the godot project dir and create a gdnlib file for the library', () => {
    shelljs.exec(`node bin/godot-rust-helper.js new test/shoot_the_creeps test/godot-test-project`);

    chai.expect(fs.pathExistsSync('test/godot-test-project/rust-modules/shoot_the_creeps.gdnlib')).to.be.true;
  }).timeout(5000);
});

describe('Creating modules', function () {
  beforeEach(function () {
    this.timeout(30000);
    shelljs.exec(`node bin/godot-rust-helper.js new test/shoot_the_creeps test/godot-test-project`);
  });

  it('should create a module and add an entry for it in the config file', () => {
    shelljs.exec(`(cd test/shoot_the_creeps && node ../../bin/godot-rust-helper.js create Hello)`);

    const config = fs.readJsonSync('test/shoot_the_creeps/godot-rust-helper.json');

    chai.expect(config.modules).to.deep.equal(['Hello']);
  }).timeout(5000);

  it('should create a module and it to the lib file', () => {
    shelljs.exec(`(cd test/shoot_the_creeps && node ../../bin/godot-rust-helper.js create Hello)`);

    const libFile = fs.readFileSync('test/shoot_the_creeps/src/lib.rs', { encoding: 'utf-8' }).split('\n');
    const expected = [
      '#[macro_use]',
      'extern crate gdnative;',
      '',
      'mod hello;',
      '',
      'fn init(handle: gdnative::init::InitHandle) {',
      '  \thandle.add_class::<hello::Hello>();',
      '}',
      '',
      'godot_gdnative_init!();',
      'godot_nativescript_init!(init);',
      'godot_gdnative_terminate!();'
    ];

    chai.expect(libFile).to.deep.equal(expected);
  }).timeout(5000);

  it('should create multiple modules', () => {
    shelljs.exec(`(cd test/shoot_the_creeps && node ../../bin/godot-rust-helper.js create Hello)`);
    shelljs.exec(`(cd test/shoot_the_creeps && node ../../bin/godot-rust-helper.js create World)`);

    const config = fs.readJsonSync('test/shoot_the_creeps/godot-rust-helper.json');

    const gdnlibFileExists = fs.pathExistsSync('test/godot-test-project/rust-modules/shoot_the_creeps.gdnlib');
    const helloLibFileExists = fs.pathExistsSync('test/shoot_the_creeps/src/hello.rs');
    const worldLibFileExists = fs.pathExistsSync('test/shoot_the_creeps/src/world.rs');

    chai.expect(config.modules).to.deep.equal(['Hello', 'World']);
    chai.expect(gdnlibFileExists).to.be.true;
    chai.expect(helloLibFileExists).to.be.true;
    chai.expect(worldLibFileExists).to.be.true;
  }).timeout(50000);

  it('should create multiple modules and add them to the lib file', () => {
    shelljs.exec(`(cd test/shoot_the_creeps && node ../../bin/godot-rust-helper.js create Hello)`);
    shelljs.exec(`(cd test/shoot_the_creeps && node ../../bin/godot-rust-helper.js create World)`);

    const libFile = fs.readFileSync('test/shoot_the_creeps/src/lib.rs', { encoding: 'utf-8' }).split('\n');
    const expected = [
      '#[macro_use]',
      'extern crate gdnative;',
      '',
      'mod hello;',
      'mod world;',
      '',
      'fn init(handle: gdnative::init::InitHandle) {',
      '  \thandle.add_class::<hello::Hello>();',
      '\thandle.add_class::<world::World>();',
      '}',
      '',
      'godot_gdnative_init!();',
      'godot_nativescript_init!(init);',
      'godot_gdnative_terminate!();'
    ];

    chai.expect(libFile).to.deep.equal(expected);
  }).timeout(5000);
});

describe('Removing modules', () => {
  beforeEach(function () {
    this.timeout(30000);
    shelljs.exec(`node bin/godot-rust-helper.js new test/shoot_the_creeps test/godot-test-project`);
  });

  it('should remove all traces of a created module', () => {
    shelljs.exec(`(cd test/shoot_the_creeps && node ../../bin/godot-rust-helper.js create Hello)`);
    shelljs.exec(`(cd test/shoot_the_creeps && node ../../bin/godot-rust-helper.js destroy Hello)`);

    const libFile = fs.readFileSync('test/shoot_the_creeps/src/lib.rs', { encoding: 'utf-8' }).split('\n');

    const config = fs.readJsonSync('test/shoot_the_creeps/godot-rust-helper.json');
    const moduleExists = fs.pathExistsSync('test/shoot_the_creeps/src/hello.rs');

    const expectedLibFile = [
      '#[macro_use]',
      'extern crate gdnative;',
      '',
      'fn init(handle: gdnative::init::InitHandle) {',
      '}',
      '',
      'godot_gdnative_init!();',
      'godot_nativescript_init!(init);',
      'godot_gdnative_terminate!();'
    ];

    chai.expect(config.modules).to.deep.equal([]);
    chai.expect(moduleExists).to.be.false;
    chai.expect(libFile).to.deep.equal(expectedLibFile);
  }).timeout(5000);

  it('should create two modules and remove one', () => {
    shelljs.exec(`(cd test/shoot_the_creeps && node ../../bin/godot-rust-helper.js create Hello)`);
    shelljs.exec(`(cd test/shoot_the_creeps && node ../../bin/godot-rust-helper.js create Bye)`);
    shelljs.exec(`(cd test/shoot_the_creeps && node ../../bin/godot-rust-helper.js destroy Bye)`);

    const libFile = fs.readFileSync('test/shoot_the_creeps/src/lib.rs', { encoding: 'utf-8' }).split('\n');

    const config = fs.readJsonSync('test/shoot_the_creeps/godot-rust-helper.json');
    const helloModuleExists = fs.pathExistsSync('test/shoot_the_creeps/src/hello.rs');
    const byeModuleExists = fs.pathExistsSync('test/shoot_the_creeps/src/bye.rs');

    const expectedLibFile = [
      '#[macro_use]',
      'extern crate gdnative;',
      '',
      'mod hello;',
      '',
      'fn init(handle: gdnative::init::InitHandle) {',
      '  \thandle.add_class::<hello::Hello>();',
      '}',
      '',
      'godot_gdnative_init!();',
      'godot_nativescript_init!(init);',
      'godot_gdnative_terminate!();'
    ];

    chai.expect(config.modules).to.deep.equal(["Hello"]);
    chai.expect(helloModuleExists).to.be.true;
    chai.expect(byeModuleExists).to.be.false;
    chai.expect(libFile).to.deep.equal(expectedLibFile);
  }).timeout(5000);
});

describe('Importing modules', function () {
  this.timeout(300000);

  beforeEach(function () {
    shelljs.exec(`node bin/godot-rust-helper.js new test/shoot_the_creeps test/godot-test-project`);
    shelljs.exec(`node bin/godot-rust-helper.js new test/kinematic_character test/godot-test-project`);
  });

  afterEach(function () {
    fs.removeSync(`test/kinematic_character`);
  });

  it('should import a module from another environment', function () {
    shelljs.exec(`(cd test/shoot_the_creeps && node ../../bin/godot-rust-helper.js create Hello)`);
    shelljs.exec(`(cd test/kinematic_character && node ../../bin/godot-rust-helper.js create Bye)`);

    shelljs.exec(`(cd test/shoot_the_creeps && node ../../bin/godot-rust-helper.js import ../kinematic_character Bye)`);

    const config = fs.readJSONSync('test/shoot_the_creeps/godot-rust-helper.json');
    const libFile = fs.readFileSync('test/shoot_the_creeps/src/lib.rs', { encoding: 'utf-8' }).split('\n');

    const libExpected = [
      '#[macro_use]',
      'extern crate gdnative;',
      '',
      'mod hello;',
      'mod bye;',
      '',
      'fn init(handle: gdnative::init::InitHandle) {',
      '  \thandle.add_class::<hello::Hello>();',
      '\thandle.add_class::<bye::Bye>();',
      '}',
      '',
      'godot_gdnative_init!();',
      'godot_nativescript_init!(init);',
      'godot_gdnative_terminate!();'
    ];

    const tempModuleExistsInEnvironment = fs.pathExistsSync('test/kinematic_character/src/bye.rs');

    chai.expect(config.modules).to.deep.equal(['Hello', 'Bye']);
    chai.expect(libFile).to.deep.equal(libExpected);
    chai.expect(tempModuleExistsInEnvironment).to.be.true;
  });
});

describe('Building modules', function () {
  this.timeout(300000);

  beforeEach(function () {
    shelljs.exec(`node bin/godot-rust-helper.js new test/shoot_the_creeps test/godot-test-project`);
  });

  it('should build the module and copy the dll into the Godot project module dir', function () {
    shelljs.exec(`(cd test/shoot_the_creeps && node ../../bin/godot-rust-helper.js create Hello)`);
    shelljs.exec(`(cd test/shoot_the_creeps && node ../../bin/godot-rust-helper.js build)`);

    const dllFileExists = fs.pathExistsSync('test/godot-test-project/rust-modules/shoot_the_creeps.dll');

    chai.expect(dllFileExists).to.be.true;
  });
});