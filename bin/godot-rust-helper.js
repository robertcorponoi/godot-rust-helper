#!/usr/bin/env node

const program = require('commander');
const pkg = require('../package.json');
const commands = require('../src/commands');

/**
 * Set the version number of `godot-rust-helper` to be the same as the version number in the package.json.
 */
program.version(pkg.version);
program.option('--watch', 'Watch files in src folder and rebuild on changes.')

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
  .action(commands.new);

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
  .action(commands.create);

/**
 * Add the `destroy` command.
 * 
 * The `destroy` command is used inside of an environment created with `new` and is used to remove a Rust module created with `create`.
 * 
 * This is the recommended way to remove Rust modules as it gets rid of any traces from the environment and the Godot project.
 */
program
  .command('destroy <name>')
  .description('Removes all traces of a created Rust module')
  .action(commands.destroy);

/**
 * Add the `build` command.
 * 
 * The `build` command runs `cargo build` and copies the target files into the Godot project directory.
 */
program
  .command('build')
  .description('Runs cargo build and copies the target files into the Godot project directory.')
  .action(() => program.watch ? commands.watch() : commands.build());

/**
 * Add the `watch` command.
 * 
 * The `watch` command runs the `build` command and watches for changes to the module's src folder so it can keep running the `build`
 * command each time a file is changed.
 */
program
  .command('watch')
  .description('Runs the build command whenever a file in the module\'s src folder is changed.')
  .action(async () => await commands.watch());

program.parse(process.argv);