# tree-sitter-glosso

Tree-sitter grammar for Glosso.

Tracks the `../glosso` compiler, including `#module_params`, `#specialize`,
and type-field probes (2026-11-01).

Generic functions and structs use `#specialize`, with a block or condition.
Inside `#meaningful`, `T,,foo;` checks whether type `T` has an accessible field
named `foo`: `#specialize #meaningful { T,,foo; }`. Bare names after `,,` use a
`scoped_name_suffix`; the compiler resolves fields versus function labels.
Quoted nonlocal labels (`worker,,'entry`) retain `nonlocal_label_suffix`.

Modules declare compile-time parameters with
`#module_params(T: type, COUNT: ssize = 4, ENABLED := false);`.
A typed parameter without a default is required; inferred parameters use `:=`.
The directive requires a terminating semicolon.

Imports and exports name the module first, followed by optional arguments in
parentheses and optional selected names in braces:

```glosso
#module_params(DYLIB_PREFIX := path_dirname(GLOSSO_STANDARD_DIRECTORY));
#import "Glosso"(DYLIB_PREFIX = "$ORIGIN/../share");
#export "./core.glo"(DYLIB_PREFIX) { parse, Tokens };
Math :: #import "Math/Core" { sqrt, Fractional, Ops.'+' };
#import "M" {};
```

Arguments may be positional or named (`NAME = value` or `.NAME = value`),
with positional arguments first. Parameter, argument, and selection lists allow
a trailing comma. `()` supplies no explicit arguments and uses defaults;
`{}` imports instances only. Omitting `{...}` selects all exported names.
The same syntax works with aliases and `#export`. Parentheses no longer select
names. The removed `#import,only`/`#import,hide` selectors, `Class(..)` selectors,
and `#load` are rejected. Visibility audiences use `#public,unit` or
`#public,to("./parser.glo", "./checker.glo")`.

Memory checking is gone from the language, and so are its spellings: `#memory`
contracts, overlays and trusted blocks, `#on_drop_error`, `#fresh_result`,
`#unchecked_transfer`, `#lifetimes`, reference types (`&T`, `[&]T`), and the `mut`
qualifier. `mut` and `raw` are ordinary names now, and `true`/`false` may be
declared (`true := 1;`) as the compiler allows.

Block comments nest (`/* outer /* inner */ still outer */`). The external scanner
in `src/scanner.c` lexes comments and recognizes symbolic suffix operators before
expression delimiters, so native builds must compile it alongside the generated
`src/parser.c`. Operators may contain `=` (`==>`, `<=>`),
matching the compiler's lexer, and a member may name an operator (`Approx.'~='(a, b)`).

Variables support `#align expression` and `#link_section expression` after the
type or initializer, for example `buffer: [8]u8 #align 64 #link_section ".data";`.
Struct alignment remains `struct #align(64) { ... }`.

Aggregate fields may spell an anonymous struct, union or enum anywhere in their
type (`items: []struct { v: s64; };`). `#code statement` quotes one statement in
any expression position (`#insert #code print(x);`). Matrix literals use
`#matrix .[1, 2; 3, 4]`. Every switch, runtime or static, is written
`subject == { case ...; }`; runtime switches use pattern cases with optional
`#pattern`, comma alternatives, and guards. A switch's `else;` remains a default
arm after nested `if` statements, including when comments separate `else` and
`;`. An ordinary `else` binds to the nearest `if`. Brace format selectors such as `{}`,
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
