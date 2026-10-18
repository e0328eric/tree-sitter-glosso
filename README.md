# tree-sitter-glosso

Tree-sitter grammar for Glosso.

Synchronized with the `../glosso` working tree based on `8f509e8e` (2026-10-19),
including its uncommitted module and visibility updates. Named modules and source
files both use `#import`; `#load` and `#load,embed` are no longer supported.
Imports and exports accept `only`/`hide` selectors, including class members such
as `Show(..)` and `Class.Output`, with optional statement semicolons. Visibility
audiences use `#public,unit` or `#public,to("./parser.glo", "./checker.glo")`;
the old `#public(unit)` spelling is no longer supported.

Matrix literals use `#matrix .[1, 2; 3, 4]`, with commas between elements and
semicolons between rows. Trusted memory blocks use `#memory,trusted { ... }` or
`#memory,trust { ... }`, with optional justification comments. Memory contracts
accept `requires_unsafe`
and the checked effects `exclusive`, `disjoint`, `outlives`, `initialized`,
`initializes`, `valid`, `sendable`, `shareable`, `thread_safe`, and `guarded_by`.
Runtime `if` and `ifx` switches use pattern cases with optional `#pattern`, comma
alternatives, and guards. Static `#if` switches keep expression cases. Brace
format selectors such as `{}`, `{c}`, and `{0:x}` are library syntax inside
ordinary strings.
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
