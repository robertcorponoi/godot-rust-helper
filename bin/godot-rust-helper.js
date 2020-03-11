#!/usr/bin/env node

const fs = require('fs-extra');
const shelljs = require('shelljs');
const program = require('commander');
const pkg = require('../package.json');

const { join: pathJoin, resolve: pathResolve } = require('path');

const findNearestCargoToml = require('../src/find');
const { libFile, createGdnlibFile } = require('../src/content');

/**
 * Define the targets that can be specified during the `new` command and the default targets if none are specified.
 */
const defaultTargets = ['windows'];
const validTargets = ['windows', 'linux', 'osx'];

/**
 * Set the version number of `godot-rust-helper` to be the same as the version number in the package.json.
 */
program.version(pkg.version);

/**
 * Adds the `new` command.
 * 
 * The `new` command is used to create an environment for your Rust modules. The environment is created as a directory in the specified destination.
 * 
 * Each Godot project should have a new environment created for it since each game will have its own modules.
 */
program
  .command('new <destination> <godotProjectDir> [targets]')
  .description('Creates a new environment for managing your Rust modules. Each Godot project should have a new environment created for it since each game will have its own modules.')
  .action((destination, godotProjectDir, targets) => {
    /**
     * First, we check to see if the destination directory for the environment exists.
     * 
     * If it does, we let the user know and then just stop the script.
     */
    if (fs.pathExistsSync(destination)) {
      console.log('The destination folder already exists, please choose another destination for the environment.');
      return;
    }

    /**
     * Next, we check to see if the provided Godot project is valid. In order for a Godot project to be considered valid, it needs
     * to have a project.godot file.
     * 
     * If there is no godot.project file, then we let the user know and stop the script.
     */
    if (!fs.pathExistsSync(pathJoin(godotProjectDir, 'project.godot'))) {
      console.log('The godot project dir provided is not valid.');
      return;
    }

    /**
     * So the destination directory can be created and the Godot project directory is valid so we create the destination directory.
     * 
     * Also create the 'rust-modules' directory in the Godot project so that we don't clutter the root directory.
     */
    fs.mkdirpSync(destination);
    fs.mkdirpSync(pathJoin(godotProjectDir, 'rust-modules'));

    /**
     * Check to see if the provided targets are valid.
     * 
     * If the targets are not valid, then we let the user know and stop the script.
     * 
     * If no targets are provided, then the default targets will be set which currently are: ['windows']
     */
    if (targets) {
      targets = targets.split(',');
      targets.map(target => {
        if (!validTargets.includes(target)) {
          console.log(`An invalid target was specified: ${target}`);
          return;
        }
      });
    } else {
      targets = defaultTargets;
    }

    /**
     * Create the config file that contains the path to the Godot project and the targets that should be set.
     */
    const config = { godotProjectDir: pathResolve(godotProjectDir), targets, modules: [] };
    fs.outputJsonSync(pathJoin(destination, 'godot-rust-helper.json'), config);
  });

/**
 * Add the `create` command.
 * 
 * The `create` command is used inside of an environment created with `new` and is used to initialize a new Rust module.
 * 
 * The name provided to this command will be used to create the name for the Rust package so name it accordingly.
 */
program
  .command('create <name>')
  .description('Creates a new Rust module and creates the gdnlib file in the Godot project directory.')
  .action(async name => {
    /**
     * First, we have to make sure that we are in an environment created by `new`. This is done by checking to see if there is a 
     * godot-rust-helper.json configuration file present.
     * 
     * If we are not in an environment, we let the user know and stop the script.
     */
    if (!fs.pathExistsSync('godot-rust-helper.json')) {
      console.log('This command can only be used inside of an envrionment created with the new command');
      return;
    }

    /**
     * Next, we have to check if a module with the same name already exists.
     * 
     * If it does, then we let the user know and stop the script.
     */
    if (fs.pathExistsSync(name)) {
      console.log('A module with the same name already exists.');
      return;
    }

    /**
     * We are in an envrionment and the module does not already exist, we can now create the module.
     * 
     * We do this by running `cargo new --lib` to create a new cargo project.
     */
    try {
      await shelljs.exec(`cargo new ${name} --lib`);
    } catch (err) {
      console.log(err);
      console.log('Could not create Rust module, try running the command again.');
      return;
    }

    /**
    * Check if the Cargo.toml file has everything we need and if not then we have to add it.
    */
    const moduleToml = fs.readFileSync(`${name}/Cargo.toml`, { encoding: 'utf-8' }).split('\n');

    if (!moduleToml.includes('[lib]')) {
      const libInsertPoint = moduleToml.indexOf('[dependencies]');

      moduleToml.splice(libInsertPoint, 0, '[lib]');
      moduleToml.splice(libInsertPoint + 1, 0, '');
      moduleToml.splice(libInsertPoint + 1, 0, 'crate-type = ["cdylib"]');
    }

    const depInsertPoint = moduleToml.indexOf('[dependencies]');
    moduleToml.splice(depInsertPoint + 1, 0, 'gdnative = { git = "https://github.com/GodotNativeTools/godot-rust" }');

    fs.writeFileSync(`${name}/Cargo.toml`, moduleToml.join('\n'));

    /**
     * Replace the contents of the default src/lib.rs with the example HelloWorld module.
     */
    fs.writeFileSync(`${name}/src/lib.rs`, libFile);

    /**
     * Create the gdnlib file for the Godot project this module is related to.
     */
    const config = fs.readJsonSync('godot-rust-helper.json');
    config.modules.push(name);

    const gdnlib = createGdnlibFile(name, config.targets);
    fs.writeFileSync(`${config.godotProjectDir}/rust-modules/${name}.gdnlib`, gdnlib);

    /**
     * Lastly write to the config file to save the module created.
     */
    fs.outputJsonSync('godot-rust-helper.json', config);
  });

/**
 * Add the `build` command.
 * 
 * The `build` command runs `cargo build` and copies the target files into the Godot project directory.
 */
program
  .command('build')
  .description('Runs cargo build and copies the target files into the Godot project directory.')
  .action(async () => {
    /**
     * First we have to find the root of the module, because it might not be where the command is being run from.
     */
    const moduleDir = findNearestCargoToml(process.cwd());

    /**
     * Get the config so that we can check the targets later.
     */
    const config = fs.readJsonSync(pathResolve(moduleDir, '..', 'godot-rust-helper.json'));

    /**
     * Then we have to run Cargo build to create the build files.
     */
    try {
      shelljs.exec(`cargo build`);
    } catch (err) {
      console.log(`There was an error building the module, please try again.`);
      return;
    }

    /**
     * Get the name of the module from the base path to it.
     */
    const name = moduleDir.split('\\').pop();

    /**
     * Get the base path to the build files.
     */
    const base = pathJoin(moduleDir, 'target', 'debug');

    /**
     * Go through the targets specified in the config file and copy the build files to the Godot project dir.
     */
    config.targets.map(target => {
      const normalized = {
        linux: 'so',
        osx: 'dylib',
        windows: 'dll'
      };

      const file = pathJoin(base, `${name}.${normalized[target]}`);

      shelljs.cp(file, pathJoin(config.godotProjectDir, 'rust-modules'));
    });

    /**
     * Let the user know that the build is finished.
     */
    console.info('Build complete!');
  });

program.parse(process.argv);