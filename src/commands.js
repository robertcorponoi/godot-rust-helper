'use strict'

const fs = require('fs-extra');
const chalk = require('chalk');
const shelljs = require('shelljs');
const chokidar = require('chokidar');
const { join: pathJoin, resolve: pathResolve, basename: pathBasename } = require('path');

const utils = require('./utils');
const content = require('./content');
const pkg = require('../package.json');

const log = console.log;

/**
 * The targets that can be used with the `new` command's `--targets` option.
 */
const validTargets = ['windows', 'linux', 'osx'];

/**
 * Contains the definitions of the commands that can be used.
 */
module.exports = {
  /**
   * The `new` command is used to create the library that will contain your Rust modules.
   * 
   * The name of the library that will contain your Rust modules. The name of the library is recommended to be the same or similar in name to your game. 
   * Also keep in mind that the library is created using `cargo new` so you should abide by the cargo project naming standards.
   * 
   * @async
   * 
   * @param {string} name The name of the library that will contain your Rust modules. The name of the library is recommended to be the same name as your game, snake_case, maybe with `_modules` at the end. Also keep in mind that the library is created using `cargo new`
   * @param {string} godotProjectDir The directory that contains the project.godot file of the game that the modules are for.
   * @param {string} [targets] The build targets that should be set. As of writing this, the available targets are windows, linux, and osx with the default being just windows.
   */
  async new(name, godotProjectDir, targets = 'windows') {
    log(chalk.white('creating library'));
    // Check to see if the library already exists in the current directory.
    if (fs.pathExistsSync(name)) {
      log(chalk.red('A library with the specified name already exists, please choose another name for the library.'));
      return;
    }

    // Check to see if the path to the Godot project is valid. In order it to be considered valid, it needs to have a project.godot file.
    if (!fs.pathExistsSync(pathJoin(godotProjectDir, 'project.godot'))) {
      log(chalk.red('The godot project dir provided is not valid.'));
      return;
    }

    // Run the `cargo new` command in the current directory to create the library.
    try {
      await shelljs.exec(`cargo new ${name} --lib`);
    } catch (err) {
      log(chalk.red(err));
      log(chalk.red('Could not create the library, check the details of the error above and try running the command again.'));
      return;
    }

    // We don't want to overwrite the contents of the Cargo.toml file because of entries like author so we're going to modify just the pieces of it that we need to.
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
     * Check to see if the provided targets are valid.
     * 
     * If the targets are not valid, then we let the user know and stop the script.
     * 
     * If no targets are provided, then the default targets will be set which currently are: ['windows']
     */
    targets = targets.split(',');
    targets.map(target => {
      if (!validTargets.includes(target)) {
        console.log(`An invalid target was specified: ${target}`);
        return;
      }
    });

    // Define the contents of the config file and write it to the library directory.
    const config = {
      name: pathBasename(name),
      godotProjectDir: pathResolve(godotProjectDir),
      targets,
      modules: []
    };

    // Save the config file as we're done working with it for now.
    fs.outputJsonSync(`${name}/godot-rust-helper.json`, config);

    // Create the initial src/lib.rs file.
    fs.writeFileSync(`${name}/src/lib.rs`, content.createInitialLibFile());

    // Create the 'rust-modules' directory in the Godot project so that we don't clutter the root directory.
    fs.mkdirpSync(pathJoin(godotProjectDir, 'rust-modules'));

    // Create the gdnlib file for the module and save it to the Godot project directory.
    const gdnlib = content.createGdnlibFile(name, config.targets);
    fs.writeFileSync(`${config.godotProjectDir}/rust-modules/${pathBasename(name)}.gdnlib`, gdnlib);
    log(chalk.green('library created successfully'));
  },

  /**
   * The `create` command is used inside of a library created with `new` and is used to initialize a new Rust module for use in the game.
   * 
   * The name passed to this command should be the class name of the module. Class names must start with capital letters. Examples include 'Player', 'Princess', 'Mob', 'HUD', etc.
   * 
   * @async
   * 
   * @param {string} name The class name of the module to create; examples include 'Player', 'Princess', 'Mob', 'HUD', etc.
   */
  async create(name) {
    log(chalk.white('creating module'));

    // Check to see if we are in a library created with the `new` command which is done by checking to see if there is a godot-rust-helper.json config file present.
    if (!fs.pathExistsSync('godot-rust-helper.json')) {
      log(chalk.red('This command can only be used inside of a library created with the new command'));
      return;
    }

    // Check to see if a module with the same name was already created.
    const nameNormalized = name.toLowerCase();
    const config = fs.readJsonSync('godot-rust-helper.json');
    if (config.modules.includes(name)) {
      log(chalk.red('A module with the same name already exists.'));
      return;
    }

    // Save the module name to the config file so that it can be worked with later.
    config.modules.push(name);
    fs.outputJsonSync('godot-rust-helper.json', config);

    // Create a new src/lib.rs with the new module added to it.
    const libFileNew = content.createLibFile(config.modules);
    fs.writeFileSync(`src/lib.rs`, libFileNew);

    // Create a sample lib file for the module that prints "Hello, World!" when the game is run.
    fs.writeFileSync(`src/${nameNormalized}.rs`, content.createModuleFile(name));

    log(chalk.green('module created'));
  },

  /**
   * The `destroy` command is used inside of a library created with `new` and is used to remove a module created with `create`.
   * 
   * @param {string} name The name of the module to destroy. This should be the same name provided when it was created.
   */
  destroy(name) {
    log(chalk.white('destroying module'));

    // Check to see if we are in a library directory as the command can only be run from inside there.
    if (!fs.pathExistsSync('godot-rust-helper.json')) {
      log(chalk.red('This command can only be used inside of a library created with the new command.'));
      return;
    }

    // Check to see if the file actually has a .rs file in the src directory.
    const nameNormalized = name.toLowerCase();
    if (!fs.pathExistsSync(`src/${nameNormalized}.rs`)) {
      log(chalk.red('The module to delete does not exist in the src directory.'));
      return;
    }

    // Get the config file so we can see what modules have been created.
    const config = fs.readJsonSync('godot-rust-helper.json');

    // Remove the module from the config file and save it again.
    config.modules = config.modules.filter(module => module.toLowerCase() !== nameNormalized);
    fs.outputJsonSync('godot-rust-helper.json', config);

    // Create a new src/lib.rs file based on the modules that are left over.
    let libFile;
    if (config.modules.length === 0) libFile = content.createInitialLibFile();
    else libFile = content.createLibFile(config.modules);
    fs.writeFileSync(`src/lib.rs`, libFile);

    // Remove the module's .rs file.
    fs.removeSync(`src/${nameNormalized}.rs`);

    log(chalk.green('module destroyed'));
  },

  /**
   * The `import` command is used to import a Rust module from a another library into this one.
   * 
   * @param {string} path The path to the library to import the module from.
   * @param {string} name The name of the module to import. This should be the same name provided when it was created.
   */
  import(path, name) {
    log(chalk.white('starting import'));

    // Check to see if we are in a library.
    if (!fs.pathExistsSync('godot-rust-helper.json')) {
      log(chalk.red('The import command can only be used from the root of the library.'));
      return;
    }

    // Check to see if the path to the library to import the module from is valid.
    if (!fs.pathExistsSync(path)) {
      log(chalk.red('There path to the library that contains the module to import is not valid.'));
      return;
    }

    // Check to see if the library to import the module from is a valid library.
    if (!fs.pathExistsSync(pathJoin(path, 'godot-rust-helper.json'))) {
      log(chalk.red('The path to the library provided is not valid.'));
      return;
    }

    // Check to see if the module to import exists in the target's config.
    const importConfig = fs.readJSONSync(pathJoin(path, 'godot-rust-helper.json'));
    if (!importConfig.modules.includes(name)) {
      log(chalk.red('The module to import does not exist in the library\'s config.'));
      return;
    }

    // Add the module to import to the config.
    const config = fs.readJsonSync('godot-rust-helper.json');
    config.modules.push(name);
    fs.outputJSONSync('godot-rust-helper.json', config);

    // Copy the module into the current library.
    log(chalk.white('importing module...'));
    const namelc = name.toLowerCase();
    fs.copyFileSync(pathJoin(path, 'src', `${namelc}.rs`), `src/${namelc}.rs`);

    // Add its entry to the src/lib.rs file.
    fs.writeFileSync('src/lib.rs', content.createLibFile(config.modules));
    log(chalk.green('import complete'));
  },

  /**
   * Runs `cargo build` and copies the target files into the Godot project directory.
   * 
   * @async
   */
  async build() {
    log(chalk.white.underline(`godot-rust-helper v${pkg.version}`));
    log(chalk.cyan('building...'));

    // Find the root of the module, aka the directory that contains the Cargo.toml.
    const moduleDir = utils.findFile(process.cwd(), 'Cargo.toml');

    // Get the config so that we can check the targets later.
    const config = fs.readJsonSync(pathJoin(utils.findFile(process.cwd(), 'godot-rust-helper.json'), 'godot-rust-helper.json'));

    // Run the `cargo build` command to generate the target files.
    try {
      shelljs.exec(`cargo build`);
    } catch (err) {
      console.log(`There was an error building the module, please try again.`);
      return;
    }

    // Get the path to where the build files are stored.
    const base = pathJoin(moduleDir, 'target', 'debug');

    // Go through each of the targets specified in the config and copy the matching build files to the Godot project dir.
    config.targets.map(target => {
      const normalized = {
        linux: 'so',
        osx: 'dylib',
        windows: 'dll'
      };

      const isWindows = process.platform == 'win32'
      const file = pathJoin(base, `${isWindows ? '' : `lib`}${config.name}.${normalized[target]}`);

      shelljs.cp(file, pathJoin(config.godotProjectDir, 'rust-modules'));

      log(chalk.green('build complete'));
    });
  },

  /**
   * Runs the build command keeps running it whenever a file in the src folder is changed.
   * 
   * @async
   */
  async watch() {
    /**
     * First we have to find the root of the module, because it might not be where the command is being run from.
     */
    const moduleDir = utils.findFile(process.cwd(), 'Cargo.toml');

    /**
     * Now that we have the module dir, we can watch the src dir.
     */
    const watcher = chokidar.watch(pathJoin(moduleDir, 'src'), {
      ignored: /(^|[\/\\])\../,
      persistent: true
    });

    watcher.on('change', async () => this.buildWithLog());

    this.buildWithLog();
  },

  /**
   * Used by the build --watch command to run the build command and provide logging.
   * 
   * @async
   */
  async buildWithLog() {
    const date = (new Date()).toISOString().slice(0, 19).replace(/-/g, "-").replace("T", " ");

    await this.build();

    log('');
    log(chalk.white(`[${date}] waiting for changes...`));
  },
}