# tree-sitter-glosso

Tree-sitter grammar for Glosso.

Synchronized with the `../glosso` compiler at `85dabc5f` (2026-10-31). Every
`.glo` file under its `std/` and `examples/` parses without errors.

Imports and exports name the module first and may list what they bring in:
`#import "Math/Core" (sqrt, Fractional, Ops.'+');`, `#import "M" ();` for
instances only, and `Alias :: #import "M";`; `#export` takes the same list. The
removed `#import,only`/`#import,hide` selectors, `Class(..)`, and `#load` are
rejected. Visibility audiences use `#public,unit` or
`#public,to("./parser.glo", "./checker.glo")`.

Memory checking is gone from the language, and so are its spellings: `#memory`
contracts, overlays and trusted blocks, `#on_drop_error`, `#fresh_result`,
`#unchecked_transfer`, `#lifetimes`, reference types (`&T`, `[&]T`), and the `mut`
qualifier. `mut` and `raw` are ordinary names now, and `true`/`false` may be
declared (`true := 1;`) as the compiler allows.

Block comments nest (`/* outer /* inner */ still outer */`). The external scanner
in `src/scanner.c` lexes comments and recognizes symbolic suffix operators before
expression delimiters, so native builds must compile it alongside the generated
`src/parser.c`. Operators may contain `=` (`==>`, `<=>`), matching the compiler's
lexer, and a member may name an operator (`Approx.'~='(a, b)`).

Aggregate fields may spell an anonymous struct, union or enum anywhere in their
type (`items: []struct { v: s64; };`). `#code statement` quotes one statement in
any expression position (`#insert #code print(x);`). Matrix literals use
`#matrix .[1, 2; 3, 4]`. Every switch, runtime or static, is written
`subject == { case ...; }`; runtime switches use pattern cases with optional
`#pattern`, comma alternatives, and guards. Brace format selectors such as `{}`,
`{c}`, and `{0:x}` are library syntax inside ordinary strings.

Enter the Nix development shell and build the WebAssembly parser:

```sh
nix develop
tree-sitter build --wasm
```

This produces `tree-sitter-glosso.wasm` in the project directory.

```sh
tree-sitter generate
tree-sitter test
tree-sitter parse ../glosso/std/**/*.glo ../glosso/examples/**/*.glo
```
