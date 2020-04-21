'use strict'

const chai = require('chai');
const fs = require('fs-extra');
const shelljs = require('shelljs');

afterEach(function () {
  this.timeout(500000);

  fs.removeSync('test/shoot_the_creeps');
  fs.removeSync('test/godot-test-project/rust-modules');
});

after(function () {
  this.timeout(500000);

  fs.removeSync('test/shoot_the_creeps');
  fs.removeSync('test/godot-test-project/rust-modules');
});

describe('Creating a new environment', () => {
  it('should not create an environment because the Godot project provided does not have a project.godot file', () => {
    shelljs.exec(`node bin/godot-rust-helper.js new test/test-environment src`);

    chai.expect(fs.pathExistsSync('test/test-environment')).to.be.false;
  }).timeout(300000);

  it('should create a new environment with the default Cargo.toml file', () => {
    shelljs.exec(`node bin/godot-rust-helper.js new test/shoot_the_creeps test/godot-test-project`);

    const toml = fs.readFileSync('test/shoot_the_creeps/Cargo.toml', { encoding: 'utf-8' }).split('\n');

    chai.expect(toml[8]).to.equal(`[lib]`);
    chai.expect(toml[9]).to.equal(`crate-type = ["cdylib"]`);
    chai.expect(toml[11]).to.equal(`[dependencies]`);
    chai.expect(toml[12]).to.equal(`gdnative = { git = "https://github.com/GodotNativeTools/godot-rust" }`);
  }).timeout(300000);

  it('should create a new environment with extensions added to the Cargo.toml file', () => {
    shelljs.exec(`node bin/godot-rust-helper.js new test/shoot_the_creeps test/godot-test-project --extensions`);

    const toml = fs.readFileSync('test/shoot_the_creeps/Cargo.toml', { encoding: 'utf-8' }).split('\n');

    chai.expect(toml[8]).to.equal(`[lib]`);
    chai.expect(toml[9]).to.equal(`crate-type = ["cdylib"]`);
    chai.expect(toml[11]).to.equal(`[dependencies]`);
    chai.expect(toml[12]).to.equal(`gdnative = { git = "https://github.com/GodotNativeTools/godot-rust" }`);
    chai.expect(toml[13]).to.equal(`godot_rust_helper_extensions = { git = "https://github.com/robertcorponoi/godot-rust-helper-extensions" }`);
  }).timeout(300000);

  it('should create a new environment with a config file containing the default targets', () => {
    shelljs.exec(`node bin/godot-rust-helper.js new test/shoot_the_creeps test/godot-test-project`);

    const config = fs.readJsonSync('test/shoot_the_creeps/godot-rust-helper.json');
    const gdnlib = fs.readFileSync('test/godot-test-project/rust-modules/shoot_the_creeps.gdnlib', { encoding: 'utf-8' }).split('\n');

    const expectedConfig = {
      name: 'shoot_the_creeps',
      godotProjectDir: 'C:\\Users\\Bob\\Documents\\Projects\\godot-rust-helper\\test\\godot-test-project',
      targets: ['windows'],
      modules: [],
      extensions: false
    };

    const expectedGdnlib = [
      '[entry]',
      '',
      'Windows.64="res://rust-modules/shoot_the_creeps.dll\"',
      '',
      '[dependencies]',
      '',
      'Windows.64=[  ]',
      '',
      '[general]',
      '',
      'singleton=false',
      'load_once=true',
      'symbol_prefix="godot_"',
      'reloadable=true',
      ''
    ];

    chai.expect(config).to.deep.equal(expectedConfig);
    chai.expect(gdnlib).to.deep.equal(expectedGdnlib)
  }).timeout(300000);

  it('should create a new environment with a config file containing the linux, and osx as targets', () => {
    shelljs.exec(`node bin/godot-rust-helper.js new test/shoot_the_creeps test/godot-test-project --targets=linux,osx`);

    const config = fs.readJsonSync('test/shoot_the_creeps/godot-rust-helper.json');
    const gdnlib = fs.readFileSync('test/godot-test-project/rust-modules/shoot_the_creeps.gdnlib', { encoding: 'utf-8' }).split('\n');

    const expectedConfig = {
      name: 'shoot_the_creeps',
      godotProjectDir: 'C:\\Users\\Bob\\Documents\\Projects\\godot-rust-helper\\test\\godot-test-project',
      targets: ['linux', 'osx'],
      modules: [],
      extensions: false
    };

    const expectedGdnlib = [
      '[entry]',
      '',
      'OSX.64="res://rust-modules/libshoot_the_creeps.dylib\"',
      'X11.64="res://rust-modules/libshoot_the_creeps.so\"',
      '',
      '[dependencies]',
      '',
      'OSX.64=[  ]',
      'X11.64=[  ]',
      '',
      '[general]',
      '',
      'singleton=false',
      'load_once=true',
      'symbol_prefix="godot_"',
      'reloadable=true',
      ''
    ];

    chai.expect(config).to.deep.equal(expectedConfig);
    chai.expect(gdnlib).to.deep.equal(expectedGdnlib);
  }).timeout(300000);

  it('should create a rust-modules folder in the godot project dir and create a gdnlib file for the library', () => {
    shelljs.exec(`node bin/godot-rust-helper.js new test/shoot_the_creeps test/godot-test-project`);

    chai.expect(fs.pathExistsSync('test/godot-test-project/rust-modules/shoot_the_creeps.gdnlib')).to.be.true;
  }).timeout(300000);
});

describe('Creating modules', function () {
  it('should create a module and add an entry for it in the config file', () => {
    shelljs.exec(`node bin/godot-rust-helper.js new test/shoot_the_creeps test/godot-test-project`);

    shelljs.exec(`(cd test/shoot_the_creeps && node ../../bin/godot-rust-helper.js create Hello)`);

    const config = fs.readJsonSync('test/shoot_the_creeps/godot-rust-helper.json');

    chai.expect(config.modules).to.deep.equal(['Hello']);
  }).timeout(300000);

  it('should create a module and it to the lib file', () => {
    shelljs.exec(`node bin/godot-rust-helper.js new test/shoot_the_creeps test/godot-test-project`);

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
  }).timeout(300000);

  it('should create a module and create a module file for it', () => {
    shelljs.exec(`node bin/godot-rust-helper.js new test/shoot_the_creeps test/godot-test-project`);

    shelljs.exec(`(cd test/shoot_the_creeps && node ../../bin/godot-rust-helper.js create Hello)`);

    const modFile = fs.readFileSync('test/shoot_the_creeps/src/hello.rs', { encoding: 'utf-8' }).split('\n');
    const expectedModFile = [
      '#[derive(gdnative::NativeClass)]',
      '#[inherit(gdnative::Node)]',
      'pub struct Hello;',
      '',
      '#[gdnative::methods]',
      'impl Hello {',
      '  fn _init(_owner: gdnative::Node) -> Self {',
      '    Hello',
      '  }',
      '',
      '  #[export]',
      '  fn _ready(&self, _owner: gdnative::Node) {',
      '    godot_print!("hello, world.")',
      '  }',
      '}',
      ''
    ];

    chai.expect(modFile).to.deep.equal(expectedModFile);
  }).timeout(300000);

  it('should create a module with multiple capital letters in the name', () => {
    shelljs.exec(`node bin/godot-rust-helper.js new test/shoot_the_creeps test/godot-test-project`);

    shelljs.exec(`(cd test/shoot_the_creeps && node ../../bin/godot-rust-helper.js create MainScene)`);

    const libFile = fs.readFileSync('test/shoot_the_creeps/src/lib.rs', { encoding: 'utf-8' }).split('\n');
    const config = fs.readJSONSync('test/shoot_the_creeps/godot-rust-helper.json');

    const expectedLibFile = [
      '#[macro_use]',
      'extern crate gdnative;',
      '',
      'mod main_scene;',
      '',
      'fn init(handle: gdnative::init::InitHandle) {',
      '  \thandle.add_class::<main_scene::MainScene>();',
      '}',
      '',
      'godot_gdnative_init!();',
      'godot_nativescript_init!(init);',
      'godot_gdnative_terminate!();'
    ];

    chai.expect(libFile).to.deep.equal(expectedLibFile);
    chai.expect(config.modules).to.deep.equal(['MainScene']);
    chai.expect(fs.pathExistsSync('test/shoot_the_creeps/src/main_scene.rs')).to.be.true;
  }).timeout(300000);

  it('should create multiple modules', () => {
    shelljs.exec(`node bin/godot-rust-helper.js new test/shoot_the_creeps test/godot-test-project`);

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
  }).timeout(300000);

  it('should create multiple modules and add them to the lib file', () => {
    shelljs.exec(`node bin/godot-rust-helper.js new test/shoot_the_creeps test/godot-test-project`);

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
  }).timeout(300000);
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
  }).timeout(300000);

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
  }).timeout(300000);
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
  this.timeout(5000000);

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