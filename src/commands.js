'use strict'

const fs = require('fs-extra');
const chalk = require('chalk');
const shelljs = require('shelljs');
const chokidar = require('chokidar');
const { join: pathJoin, resolve: pathResolve } = require('path');

const pkg = require('../package.json');
const findNearestCargoToml = require('./find');
const { libFile, createGdnlibFile } = require('./content');

const log = console.log;

/**
 * Define the targets that can be specified during the `new` command and the default targets if none are specified.
 */
const validTargets = ['windows', 'linux', 'osx'];

/**
 * Contains the definitions of the commands that can be used.
 */
module.exports = {
  /**
   * The `new` command is used to create an environment for your Rust modules. The environment is created as a directory in the specified destination.
   * 
   * @param {string} destination The destination directory for the environment.
   * @param {string} godotProjectDir The directory of the Godot project that the Rust modules are for.
   * @param {string} [targets] The build targets that should be set.
   */
  new(destination, godotProjectDir, targets = 'windows') {
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
    targets = targets.split(',');
    targets.map(target => {
      if (!validTargets.includes(target)) {
        console.log(`An invalid target was specified: ${target}`);
        return;
      }
    });

    /**
     * Create the config file that contains the path to the Godot project and the targets that should be set.
     */
    const config = { godotProjectDir: pathResolve(godotProjectDir), targets, modules: [] };
    fs.outputJsonSync(pathJoin(destination, 'godot-rust-helper.json'), config);
  },

  /**
   * The `create` command is used inside of an environment created with `new` and is used to initialize a new Rust module.
   * 
   * @async
   * 
   * @param {string} name The name of the Rust module to create.
   */
  async create(name) {
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

    /**
     * Create the folder for the module in the Godot project directory.
     */
    fs.ensureDirSync(`${config.godotProjectDir}/rust-modules/${name}`);

    const gdnlib = createGdnlibFile(name, config.targets);
    fs.writeFileSync(`${config.godotProjectDir}/rust-modules/${name}/${name}.gdnlib`, gdnlib);

    /**
     * Lastly write to the config file to save the module created.
     */
    fs.outputJsonSync('godot-rust-helper.json', config);
  },

  /**
   * The `destroy` command is used inside of an environment created with `new` and is used to remove a Rust module created with `create`.
   * 
   * @param {string} name The name of the Rust module to destroy.
   */
  destroy(name) {
    const config = fs.readJsonSync('godot-rust-helper.json');

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
     * Next, we have to check if the module to delete actually exists.
     * 
     * If it does not, then we let the user know and stop the script.
     */
    if (!fs.pathExistsSync(name)) {
      console.log('The module to delete does not exist');
      return;
    }

    /**
     * Everything's good so we remove the module from the config, from the environment, and from the Godot project.
     */
    config.modules = config.modules.filter(module => module !== name);
    fs.outputJsonSync('godot-rust-helper.json', config);

    fs.removeSync(name);

    fs.removeSync(`${config.godotProjectDir}/rust-modules/${name}`);
  },

  /**
   * Runs the build command and copies the target files into the Godot project directory.
   * 
   * @async
   */
  async build() {
    log(chalk.white.underline(`godot-rust-helper v${pkg.version}`));
    log(chalk.cyan('building...'));
    
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

      shelljs.cp(file, pathJoin(config.godotProjectDir, 'rust-modules', name));

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
    const moduleDir = findNearestCargoToml(process.cwd());

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