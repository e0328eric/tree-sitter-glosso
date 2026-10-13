# tree-sitter-glosso

Tree-sitter grammar for Glosso.

Enter the Nix development shell and build the WebAssembly parser:

```sh
nix develop
tree-sitter build --wasm
```

This produces `tree-sitter-glosso.wasm` in the project directory.

```sh
tree-sitter generate
tree-sitter parse ../glosso/examples/*.glo ../glosso/examples/parts/*.glo
```
