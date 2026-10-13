{
  description = "Tree-sitter Glosso development environment";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { nixpkgs, ... }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
    in
    {
      devShells = nixpkgs.lib.genAttrs systems (system:
        let
          pkgs = import nixpkgs { inherit system; };
          wasiCC = pkgs.pkgsCross.wasi32.stdenv.cc;

          # Tree-sitter expects an SDK prefix containing bin/clang.
          wasiSdk = pkgs.runCommand "tree-sitter-wasi-sdk" { } ''
            mkdir -p "$out/bin"
            ln -s ${wasiCC}/bin/${wasiCC.targetPrefix}clang "$out/bin/clang"
          '';
        in
        {
          default = pkgs.mkShell {
            packages = [ pkgs.tree-sitter pkgs.nodejs ];

            # This native hardening flag is unsupported by the Wasm compiler.
            hardeningDisable = [ "zerocallusedregs" ];
            TREE_SITTER_WASI_SDK_PATH = "${wasiSdk}";
          };
        });
    };
}
