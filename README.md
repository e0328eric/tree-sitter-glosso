# tree-sitter-glosso

Tree-sitter grammar for Glosso.

Synchronized with `../glosso` at `d55018f7` (2026-10-18). Runtime `if` and
`ifx` switches use pattern cases with optional `#pattern`, comma alternatives,
and guards. Static `#if` switches keep expression cases. Brace format selectors
such as `{}`, `{c}`, and `{0:x}` are library syntax inside ordinary strings.
Symbolic suffix operators are recognized before expression delimiters. Native
builds must compile `src/scanner.c` alongside the generated `src/parser.c`.

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
