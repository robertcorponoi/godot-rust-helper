'use strict'

module.exports = {
  /**
   * Returns the initial contents of the src/lib.rs file.
   * 
   * @returns {string}
   */
  createInitialLibFile() {
    return `#[macro_use]
extern crate gdnative;

fn init(handle: gdnative::init::InitHandle) {
}

godot_gdnative_init!();
godot_nativescript_init!(init);
godot_gdnative_terminate!();`
  },

  /**
   * Creates the contents for the src/lib.rs file depending on what modules are present.
   * 
   * @param {string} file The contents of the existing file.
   * @param {Array<string>} modules The modules that have been created.
   * 
   * @returns {string} Returns a lib.rs file with the modules specified.
   */
  createLibFile(modules) {
    let mods = '';
    let classes = '';

    modules.map(mod => {
      let modlc = mod.toLowerCase();

      mods += `\nmod ${modlc};`;
      classes += `\thandle.add_class::<${modlc}::${mod}>();`;

      if (modules.indexOf(mod) != modules.length - 1) classes += '\n';
    });
    mods += '\n';

    return `#[macro_use]
extern crate gdnative;
${mods}
fn init(handle: gdnative::init::InitHandle) {
  ${classes}
}

godot_gdnative_init!();
godot_nativescript_init!(init);
godot_gdnative_terminate!();`
  },

  /**
   * Creates the default lib file for each module added.
   * 
   * @param {string} name The name of the module.
   * 
   * @returns {string} Returns a string with a sample module file.
   */
  createModuleFile(name) {
    return `#[derive(gdnative::NativeClass)]
#[inherit(gdnative::Node)]
pub struct ${name};

#[gdnative::methods]
impl ${name} {
  fn _init(_owner: gdnative::Node) -> Self {
    ${name}
  }

  #[export]
  fn _ready(&self, _owner: gdnative::Node) {
    godot_print!("hello, world.")
  }
}
`;
  },

  /**
   * Creates a gdnlib file on the parameters provided.
   * 
   * @param {string} name The name of the environment created.
   * @param {Array<string>} targets The targets to add to this gndlib file.
   * 
   * @returns {string} Returns the gdnlib file as a string.
   */
  createGdnlibFile(name, targets) {
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
          gdnlibArr.splice(entryInsertPoint, 0, `Windows.64="res://rust-modules/${name}.dll"`);
          gdnlibArr.splice(depInsertPoint, 0, `Windows.64=[  ]`);
          break;
        case 'linux':
          gdnlibArr.splice(entryInsertPoint, 0, `X11.64="res://rust-modules/lib${name}.so"`);
          gdnlibArr.splice(depInsertPoint, 0, `X11.64=[  ]`);
          break;
        case 'osx':
          gdnlibArr.splice(entryInsertPoint, 0, `OSX.64="res://rust-modules/lib${name}.dylib"`);
          gdnlibArr.splice(depInsertPoint, 0, `OSX.64=[  ]`);
          break;
      }
    });

    return gdnlibArr.join('\n');
  },
}
