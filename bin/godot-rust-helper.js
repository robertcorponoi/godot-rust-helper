#!/usr/bin/env node

const path = require('path');
const fs = require('fs-extra');
const shell = require('shelljs');
const program = require('commander');
const pkg = require('../package.json');

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
 * Add the `new` command.
 * 
 * The `new` command is used to create a new environment used to hold your Rust modules. Each Godot project should have its own
 * environment since the environment manages the Godot project's modules and dependencies.
 */
program
  .command('new <destination> <godotProjectDir> [targets]')
  .description('Creates a new environment for managing your Rust modules. Each Godot project should have its own environment since the environment manages the Godot project\'s modules and dependencies')
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
     * to have a godot.project file.
     * 
     * If there is no godot.project file, then we let the user know and stop the script.
     */
    if (!fs.pathExistsSync(path.join(godotProjectDir, 'godot.project'))) {
      console.log('The godot project dir provided is not valid.');
      return;
    }

    /**
     * So the destination directory can be created and the Godot project directory is valid so we create the destination directory.
     * 
     * Also create the 'rust-modules' directory in the Godot project so that we don't clutter the root directory.
     */
    fs.mkdirpSync(destination);
    fs.mkdirpSync(path.join(godotProjectDir, 'rust-modules'));

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
    const config = { godotProjectDir, targets };
    fs.outputJsonSync(path.join(destination, 'godot-rust-helper.json'), config);
  });

/**
 * Add the `create` command.
 * 
 * The `create` command is used inside of an environment created with `new` and is used to initialize a new Rust module.
 */
program
  .command('create <name>')
  .description('Creates a new Rust module')
  .action(name => {
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
    if (shell.exec(`cargo new ${name} --lib`).code !== 0) {
      console.log('Could not create Rust module, try running the command again.');
      return;
    }

    /**
     * Get the location of the [lib] tag in the Cargo.toml of the Rust module.
     */
    const cargoLibLoc = shell.grep('-n', '\[lib\]', `${name}/Cargo.toml`);
  });

program.parse(process.argv);