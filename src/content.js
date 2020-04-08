'use strict'

/**
 * Contains the default content for the src/lib.rs file.
 */
const libFile = `#[macro_use]
extern crate gdnative;

#[derive(gdnative::NativeClass)]
#[inherit(gdnative::Node)]
struct HelloWorld;

#[gdnative::methods]
impl HelloWorld {
  fn _init(_owner: gdnative::Node) -> Self {
    HelloWorld
  }

  #[export]
  fn _ready(&self, _owner: gdnative::Node) {
    godot_print!("hello, world.")
  }
}

fn init(handle: gdnative::init::InitHandle) {
  handle.add_class::<HelloWorld>();
}

godot_gdnative_init!();
godot_nativescript_init!(init);
godot_gdnative_terminate!();
`;

/**
 * Creates a gdnlib file on the parameters provided.
 * 
 * @param {string} name The name of the Rust module being created.
 * @param {Array<string>} targets The targets to add to this gndlib file.
 * 
 * @returns {string} Returns the gdnlib file as a string.
 */
function createGdnlibFile(name, targets) {
  const gdnlibArr = [
    '[entry]',
    '',
    '',
    '[dependencies]',
    '',
    '',
    '[general]',
    '',
    'singleton=false',
    'load_once=true',
    'symbol_prefix="godot_"',
    'reloadable=true',
    ''
  ];

  const entryInsertPoint = 2;
  const depInsertPoint = 6;

  targets.map(target => {
    switch (target) {
      case 'windows':
        gdnlibArr.splice(entryInsertPoint, 0, `Windows.64="res://rust-modules/${name}/${name}.dll"`);
        gdnlibArr.splice(depInsertPoint, 0, `Windows.64=[  ]`);
        break;
      case 'linux':
        gdnlibArr.splice(entryInsertPoint, 0, `X11.64="res://rust-modules/lib${name}/${name}.so"`);
        gdnlibArr.splice(depInsertPoint, 0, `X11.64=[  ]`);
        break;
      case 'osx':
        gdnlibArr.splice(entryInsertPoint, 0, `OSX.64="res://rust-modules/lib${name}/${name}.dylib"`);
        gdnlibArr.splice(depInsertPoint, 0, `OSX.64=[  ]`);
        break;
    }
  });

  return gdnlibArr.join('\n');
}

module.exports = { libFile, createGdnlibFile };