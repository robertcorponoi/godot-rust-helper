#!/usr/bin/env node

const path = require('path');
const toml = require('toml');
const fs = require('fs-extra');
const program = require('commander');
const pkg = require('../package.json');

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

  });

program.parse(process.argv);