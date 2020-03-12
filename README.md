<p align="center">
  <img width="250" height="250" src="https://raw.githubusercontent.com/robertcorponoi/graphics/master/godot-rust-helper/godot-rust-helper-logo.png">
</p>

<h1 align="center">Godot Rust Helper</h1>

<p align="center">A shell script that helps you create and update Rust modules for Godot.<p>

<div align="center">

  [![NPM version](https://img.shields.io/npm/v/godot-rust-helper.svg?style=flat)](https://www.npmjs.com/package/godot-rust-helper)
  [![Known Vulnerabilities](https://snyk.io/test/github/robertcorponoi/godot-rust-helper/badge.svg)](https://snyk.io/test/github/robertcorponoi/godot-rust-helper)
  ![npm](https://img.shields.io/npm/dt/godot-rust-helper)
  [![NPM downloads](https://img.shields.io/npm/dm/godot-rust-helper.svg?style=flat)](https://www.npmjs.com/package/godot-rust-helper)
  <a href="https://badge.fury.io/js/godot-rust-helper"><img src="https://img.shields.io/github/issues/robertcorponoi/godot-rust-helper.svg" alt="issues" height="18"></a>
  <a href="https://badge.fury.io/js/godot-rust-helper"><img src="https://img.shields.io/github/license/robertcorponoi/godot-rust-helper.svg" alt="license" height="18"></a>
  [![Gitter](https://badges.gitter.im/gitterHQ/gitter.svg)](https://gitter.im/robertcorponoi)

</div>

## **Why**

Using Rust modules with Godot is super performant and fun but it can sometimes be intimidating or frustrating to set up and maintain. Godot rust helper aims to help you get rid of some of this frustration by managing your modules and updating their references in the Godot project. Note that this covers about 80% of use cases and if you have a different use case then I would be more than happy to add functionality to accomodate for it.

## **Install**

This CLI tool can be installed globally like so:

```bash
$ npm install -g godot-rust-helper
```

## **Step 1: Creating an Environment**

For each project you create in Godot, you have to set up a new "environment". The environment is a term used to describe a directory created by godot-rust-helper that has a config file and holds all of your Rust modules.

To create a new environment, navigate to where you would like to reside and use the new command like so:

```bash
$ godot-rust-helper new <path_to_environment_to_create> <path_to_godot_project> <targets>
```

Let's go over the possible arguments that can be passed and some examples.

- **path_to_environment_to_create** The path to the environment of the environment to create.
- **path_to_godot_project** This is the path to the root directory of the Godot project that the modules will belong to.
- **targets** Native modules in Godot can target multiple platforms and godot-rust-helper needs to know ahead of time what platforms you plan to target your modules for with the available options currently being: windows, linux, and osx. For example if you are targeting Windows and OSX, you need to have have cargo set to build a dll and a dylib file and you would pass windows,osx as the targets. By default if no targets are passed then just windows will be set.

**examples:**

Creating a default environment for Windows only builds:

```bash
$ godot-rust-helper new breakout-modules ~/Documents/projects/breakout
```

Creating an environment for Windows, Linux, and OSX builds:

```bash
$ godot-rust-helper new breakout-modules ~/Documents/projects/breakout windows,linux,osx
```

## **Step 2: Creating Modules**

Now that you've created the environment, you can go into the newly created folder and see the config file. This config file contains the path to the Godot project directory and the targets passed from the `new` command. This config file should not be modified manually as godot-rust-helper depends on it heavily.

From this directory, we can now begin to make modules with the create command like so:

```bash
$ godot-rust-helper create <name>
```

- **name** The name of the module to create. This should be the same name as you would use if you were going to use `cargo new <name> --lib`.

What this does is run `cargo new <name> --lib` and adds the necessary tags and dependencies to write Godot modules. This also the `src/lib.rs` file to the basic HelloWorld example. This script is meant to attach to a generic Node and prints "Hello, world" to the console when the project is run.

This also creates a directory in the "rust-modules" directory in your Godot project for the module which will contain the .gdnlib file and the build files.

**Note:** This command has to be run from the environment directory.

### **Removing Modules**

You can also remove all traces of modules from the environment and the Godot project by using the `destroy` command. This is the recommended way to remove modules.

**example:**

```bash
$ godot-rust-helper destroy <name>
```

where `name` is the name used when creating the module.

**Note:** This command has to be run from the environment directory.

## **Step 3: Building Modules**

After you have created your module (or you can do this with the default contents to try it out) you're ready to build your script using:

```bash
$ godot-rust-helper build
```

What this does is first run `cargo build` and then it moves the build files into the Godot project directory.

**Note:** This command has to be run from the module directory.

**Note:** The first time you run this it will take a while as it have to reach out and download the necessary dependencies, every build after that will be much quicker.

## **Final Steps**

There's one step that has to be done by hand and that's heading over to your Godot project, creating the node that your script expects, and adding the script to the node.

As an example with the default HelloWorld script that attaches to a generic Node, it would go like so:

1. Add a Node to your scene (in your custom scripts you would add the type of node that your script expects).

2. In the Node's inspector, go to the script dropdown and choose to add a new script.

3. In the Attach Node Script modal set the following options:
  - **Language:** NativeScript
  - **Class Name:** The name of the class in your Rust module's `src/lib.rs` file. In the HelloWorld example this is just HelloWorld.

3. (Optionally change the file name) Press create.

4. Click on the newly created Node.gdns (or whatever you named it above if you chose a custom name).

5. In the Library dropdown, choose load and select the "module-name.gdnlib" file in the rust-modules folder whose name corresponds to your Rust module's name.

From here you're done and if you're doing the HelloWorld example you'll see "Hello, world" printed to the console when you run the game.

**Note:** If you update your Rust module you do not have to update the corresponding .gdnlib file in Godot, it will be updated automatically.

## **Tests**

```bash
$ npm run test
```

## **License**

MIT