## 2.2.0 / 2020-04-21
- [FEATURE] Modules with multiple uppercase letters (ex. MainScene) will now have their classes created as MainScene but will be registered as main_scene.
- [MISC] Expended tests for new feature.

## 2.1.0 / 2020-04-19
- [FEATURE] Made targets an option instead of an argument.
- [FEATURE] Added extensions option to add the `godot_rust_helper_extensions` dependency.
- [MISC] Expanded tests and documentation.

## 2.0.0 / 2020-04-16
- [FEATURE] Major rework to project structures. Modules are now all part of one project instead of being spread out across multiple projects.
- [DOCS] Updated documentation to be up to date with the rework.
- [MISC] Updated tests for the rework.

## 1.1.0 / 2020-04-08
- [FEATURE] Added ability to import outside modules using the `import` command.
- [DOCS] Added documentation for `import` command.

## 1.0.1 / 2020-04-08
- [HOTFIX] Fix delimiter on mac/linux & add 'lib' prefix @harumaxy

## 1.0.0 / 2020-04-01
- [FEATURE] Added --watch option to the build command to watch the src folder for changes and build automatically.
- [MISC] Moved the commands to src/commands.js to clean up the bin file.

## 0.1.1 / 2020-03-30
- [MISC] Added LICENSE file.
- [MISC] Updated out-of-date dependencies to their latest versions.

## 0.1.0 / 2020-03-12
- Initial release.