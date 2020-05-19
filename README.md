<p align="center">
  <img width="250" height="250" src="https://raw.githubusercontent.com/robertcorponoi/graphics/master/godot-rust-helper/godot-rust-helper-logo.png">
</p>

<h1 align="center">Godot Rust Helper</h1>

<p align="center">A simple CLI tool to help you create and update Rust modules for your Godot projects.<p>
  
  **Note:** This is not maintained anymore and as been replaced by [godot_rust_helper](https://github.com/robertcorponoi/godot_rust_helper)

<div align="center">

  [![NPM version](https://img.shields.io/npm/v/godot-rust-helper.svg?style=flat)](https://www.npmjs.com/package/godot-rust-helper)
  [![Known Vulnerabilities](https://snyk.io/test/github/robertcorponoi/godot-rust-helper/badge.svg)](https://snyk.io/test/github/robertcorponoi/godot-rust-helper)
  ![npm](https://img.shields.io/npm/dt/godot-rust-helper)
  [![NPM downloads](https://img.shields.io/npm/dm/godot-rust-helper.svg?style=flat)](https://www.npmjs.com/package/godot-rust-helper)
  <a href="https://badge.fury.io/js/godot-rust-helper"><img src="https://img.shields.io/github/issues/robertcorponoi/godot-rust-helper.svg" alt="issues" height="18"></a>
  <a href="https://badge.fury.io/js/godot-rust-helper"><img src="https://img.shields.io/github/license/robertcorponoi/godot-rust-helper.svg" alt="license" height="18"></a>
  [![Gitter](https://badges.gitter.im/gitterHQ/gitter.svg)](https://gitter.im/robertcorponoi)

</div>

**Note:** This is the documentation for the new 2.x version of godot-rust-helper. If you are looking for 1.x and below, you can find it [here](https://github.com/robertcorponoi/godot-rust-helper/tree/v1.1.0).

## **Install**

Since godot-rust-helper is a CLI tool that is meant to be used whenever you want, you should install it globally like so:

```bash
$ npm install -g godot-rust-helper
```

## **Step 1: Creating the Project's Library**

For each game you create in Godot you will have to create a new library. The library itself is a cargo library and it holds all of the modules used in your game.

To create the project's library, navigate to where you would like to store the modules (outside of your Godot project directory) and use the `new` command:

```bash
$ godot-rust-helper new <library_name> <path_to_godot_project> [options]
```

Let's go over the arguments and options in detail with some examples.

**Arguments:**

- **library_name** The name of the library that will contain your Rust modules. The name of the library is recommended to be the same or similar in name to your game. Also keep in mind that the library is created using `cargo new` so you should abide by the cargo project naming standards.
- **path_to_godot_project** This is the path to the root directory of the Godot project that the modules will belong to.

**Options:**
- `--targets` Native modules in Godot can target multiple platforms and godot-rust-helper needs to know ahead of time what platforms you plan to target your modules for with the available options currently being: windows, linux, and osx. For example if you are targeting Windows and OSX, you need to have have cargo set to build a dll and a dylib file and you would pass `--targets=windows,osx` as the targets. By default if no targets are passed then just `--targets=windows` will be set.
- `--extensions` If this flag is passed the [extensions](https://github.com/robertcorponoi/godot-rust-helper-extensions) dependency will be added to the library. The extensions are a new and growing feature so stay tuned to see what gets added to them and check out the documention in the extensions repository to see if and how you can use it in your modules.

**examples:**

Creating a default library for Windows only builds:

```bash
$ godot-rust-helper new breakout_modules ~/Documents/projects/breakout
```

Creating an library for Windows, Linux, and OSX builds:

```bash
$ godot-rust-helper new breakout-modules ~/Documents/projects/breakout windows,linux,osx
```

**Note:** The `src/lib.rs` file is completely managed by godot-rust-helper and should not be modified. Any modifications to the file will result in the modules not functioning properly or they will be overwritten when a module is created/destroyed. Custom mods can be added to the file through `godot-rust-helper mod` as shown [here](#mod) (coming soon).

## **Step 2: Creating Modules**

Now that you've created the library, you can go into the newly created folder and see the config file. This config file contains the path to the Godot project directory and the targets passed from the `new` command. This config file should not be modified manually as godot-rust-helper depends on it heavily.

From this directory, we can now begin to make modules with the create command like so:

```bash
$ godot-rust-helper create <class_name>
```

- **name** The name passed to this command should be the class name of the module. Class names must start with capital letters. Examples include 'Player', 'Princess', 'Mob', 'HUD', etc.

What this does is create a `src/<name>.rs` file for the module and adds an entry for it in the `src/lib.rs` file. If you attach this script as it is to a Node and run the game then "hello, world" will print to the godot console.

**Note:** This command has to be run from the library's directory.

**examples:**

```bash
$ godot-rust-helper create Player
```

```bash
$ godot-rust-helper create HUD
```

## **Step 3: Building Modules**

After you have created your module (or you can do this with the default contents to try it out) you're ready to run a build using:

```bash
$ godot-rust-helper build
```

What this does is first run `cargo build` and then it moves the build files into the Godot project directory.

**Note:** This command has to be run from the library's directory.

**Note:** The first time you run this it will take a while as it have to reach out and download the necessary dependencies, every build after that will be much quicker.

The build command also supports the `--watch` option which will watch the src directory of your module for changes and re-build it automatically.

**examples:**

Running the build command:

```bash
$ godot-rust-helper build
```

Running the build command and watching for changes to any modules in the library.

```bash
$ godot-rust-helper build --watch
```

## **Step 4: Using the Module in Godot**

The last step that has to be done to use your module in your Godot project is creating the script and attaching it to the node that needs to use it.

After you have created a module and run a build, you can attach the script to a node like so:

1. Choose the node to add the script to and in the inspector go to the script dropdown and choose to add a new script.
2. In the Attach Node Script modal, set the following options:
  - **Language:** NativeScript
  - **Class Name:** The name you passed to `godot-rust-helper create` which is the class name of the Rust module you created.
3. Change the name of the script to match the class name and save the script to the rust-modules folder
4. Click on the newly created .gdns file (or after the steps above it should be active in the inspector already) and in the Library dropdown choose load and select the "library_name.gdnlib" file in the rust-modules folder. This library name is the same name passed to `godot-rust-helper new`.
4. Click on the newly created Node.gdns (or whatever you named it above if you chose a custom name).

Now if you run your game you will see your script's functionality up and running!

**Note:** If you update your Rust module you do not have to update the corresponding .gdnlib file in Godot, it will be updated automatically.

## **Other Commands**

The following are commands are situational but are not needed for the basic setup.

### **destroy**

Removes a Rust module from the library. You will still need to remove the script reference from your node in Godot as it will throw an error if you attempt to run the game since the script no longer exists.

```bash
$ godot-rust-helper destroy <class_name>
```

- **class_name** The name of the class to destroy. This should be the same name that was used when it was created with `godot-rust-helper create`.

**examples:**

```bash
$ godot-rust-helper destroy Player
```

```bash
$ godot-rust-helper destroy HUD
```

### **mod**

Coming soon!

### **import**

Imports a Rust module from another library into the current library.

```bash
$ godot-rust-helper import <path_to_library> <class_name>
```

- **path_to_library** The path to the library that contains the module to import.
- **class_name** The class name of the module to import. This should be the same name that was passed to `godot-rust-helper create` when it was created.

**examples:**

```bash
$ godot-rust-helper import ../kinematic_character Player
```

```bash
$ godot-rust-helper import ../kinematic_character Princess
```

## **Tests**

```bash
$ npm run test
```

## **License**

MIT
