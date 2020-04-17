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
 * The `new` command is used to create the library that will contain your Rust modules.
 * 
 * The name of the library that will contain your Rust modules. The name of the library is recommended to be the same or similar in name to your game. 
 * Also keep in mind that the library is created using `cargo new` so you should abide by the cargo project naming standards.
 */
program
  .command('new <destination> <godotProjectDir> [targets]')
  .description('Creates the library that will contain your Rust modules. Each Godot project should have its own library since each game will have its own modules.')
  .action(commands.new);

/**
 * Add the `create` command.
 * 
 * The `create` command is used inside of a library created with `new` and is used to initialize a new Rust module for use in the game.
 * 
 * The name passed to this command should be the class name of the module. Class names must start with capital letters. Examples include 'Player', 'Princess', 'Mob', 'HUD', etc.
 */
program
  .command('create <name>')
  .description('Initializes a new Rust module for use in the game.')
  .action(commands.create);

/**
 * Add the `destroy` command.
 * 
 * The `destroy` command is used inside of a library created with `new` and is used to remove a module created with `create`.
 * 
 * This is the recommended way to remove Rust modules as it cleanly removes it from the library and the Godot project.
 */
program
  .command('destroy <name>')
  .description('Removes a created Rust module.')
  .action(commands.destroy);

/**
 * Add the `import` command.
 * 
 * The `import` command is used to import a Rust module from outside the environment.
 */
program
  .command('import <path> <name>')
  .description('Imports an Rust module from another library into this library.')
  .action(commands.import);

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