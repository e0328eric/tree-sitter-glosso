/**
 * @file Tree-sitter grammar for Glosso
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  assignment: 1,
  range: 2,
  binary: 3,
  unary: 4,
  call: 5,
  controlFlow: 6,
  statement: 7,
  resultType: 1,
};

module.exports = grammar({
  name: "glosso",

  word: ($) => $.identifier,

  externals: ($) => [$._symbolic_suffix_operator],

  extras: ($) => [/\s/, $.comment],

  conflicts: ($) => [
    [$.lifetime, $._non_range_expression],
    [$.type_constructor_pattern, $._non_range_expression],
    [$.parameter, $._non_range_expression, $._postfix_expression_base],
    [$.for_statement, $._non_range_expression, $._postfix_expression_base],
    [$.for_statement, $._non_range_expression],
    [$._non_range_expression, $._pointer_type_qualifier],
    [$._non_range_expression, $._pointer_type_qualifier, $._postfix_expression_base],
    [$._variable_declaration_body, $._non_range_expression, $._postfix_expression_base],
    [$.binding_list, $._non_range_expression],
    [$._non_range_expression, $.qualified_operator, $._postfix_expression_base],
    [$._non_range_expression, $._pattern_unary],
    [$._non_range_expression, $._pattern_unary, $._postfix_expression_base],
    [$._non_range_expression, $.pattern_binding],
    [$._non_range_expression, $.pattern_binding, $._postfix_expression_base],
    [$._non_range_expression, $._prefix_operator],
    [$._non_range_expression, $._postfix_expression_base, $._prefix_operator],
    [$._non_range_expression, $._postfix_expression_base],
    [$._expression, $._postfix_expression_base],
    [$.qualified_operator, $._postfix_expression_base],
    [$._expression, $.qualified_operator, $._postfix_expression_base],
    [$._expression, $._postfix_expression_base, $._prefix_operator],
    [$._postfix_expression_base, $._prefix_operator],
    [$.pattern_binding, $._postfix_expression_base],
    [$.generic_type_constructor_pattern, $._postfix_expression_base],
    [$.type_constructor_pattern, $.generic_type_constructor_pattern, $._postfix_expression_base],
    [$._expression, $._prefix_operator],
    [$.declaration_name, $.binding_list],
    [$.parenthesized_type, $.type_element],
    [$.tuple_type, $.type_element],
    [$.binding_list, $.tuple_type, $.type_element],
    [$.tuple_type, $.function_type],
    [$.parameter_list, $.function_type],
    [$.parameter, $.function_type],
    [$.empty_parameter],
    [$.range_expression],
    [$.switch_statement, $.pattern_arm_block],
    [$.struct_literal, $.struct_pattern],
    [$.array_literal, $.slice_pattern],
    [$._empty_tuple_pattern, $.tuple_literal],
    [$._pattern_unary, $.struct_pattern_field],
    [$._expression, $._pattern_unary],
    [$._expression, $.pattern_binding],
    [$.binding_list, $._expression],
    [$.shorthand_member_pattern, $.struct_pattern_field],
    [$.shorthand_member_pattern, $.shorthand_member_expression],
    [$.shorthand_member_pattern, $.struct_pattern_field, $.shorthand_member_expression],
    [$.type_constructor_pattern],
    [$.type_constructor_pattern, $._expression],
    [$.type_constructor_pattern, $._modified_type],
    [$.type_constructor_pattern, $.named_type],
    [$._code_splice_call_expression, $._postfix_expression_base],
    [$._code_splice_member_expression, $._postfix_expression_base],
    [$._single_statement, $.static_if_statement],
    [$.for_statement, $._prefix_operator],
    [$.for_statement, $._postfix_expression_base],
    [$.for_statement, $._expression],
    [$.for_statement, $._expression, $._postfix_expression_base],
    [$.for_statement, $._postfix_expression_base, $._prefix_operator],
    [$.for_statement, $._expression, $._postfix_expression_base, $._prefix_operator],
    [$.for_statement, $._expression, $._prefix_operator],
    [$._for_closed_range, $.range_expression],
    [$.type_hole, $.array_type_constructor_pattern],
    [$.array_type, $.type_hole, $.array_type_constructor_pattern],
    [$.lifetime, $._expression],
    [$.receiver_parameter, $.parameter],
    [$._variable_declaration_body, $._expression, $._postfix_expression_base],
    [$.parameter, $._expression, $._postfix_expression_base],
    [$.binary_expression, $.constant_pattern],
    [$._pattern_unary, $._postfix_expression_base],
    [$._expression, $._pattern_unary, $._postfix_expression_base],
    [$._expression, $.pattern_binding, $._postfix_expression_base],
    [$._expression, $._pattern_range],
    [$.binding_list, $.for_statement, $._expression],
    [$.binding_list, $.for_statement],
    [$._address_qualifier],
    [$._bracket_reference_type, $._prefix_operator],
    [$._prefix_operator, $.unary_expression],
    [$._prefix_operator, $.unary_expression, $._bracket_reference_type],
    [$._reference_element_name, $.array_type_constructor_pattern],
    [$._reference_element_name, $.array_type],
    [$._reference_element_name, $.array_type, $.array_type_constructor_pattern],
    [$._reference_element_base, $.type_constructor_pattern],
    [$._reference_element_base, $._reference_element_constructor_pattern],
    [$._reference_element_name, $.type_constructor_pattern],
    [$.qualified_operator, $.pattern_binding, $._postfix_expression_base],
    [$._pointer_type_qualifier, $.for_statement],
    [$._pointer_type_qualifier, $._postfix_expression_base],
    [$._pointer_type_qualifier, $._expression],
    [$._pointer_type_qualifier, $._expression, $._postfix_expression_base],
  ],

  supertypes: ($) => [
    $._declaration,
    $._statement,
    $._expression,
    $._type,
    $._pattern,
  ],

  inline: ($) => [
    $._identifier,
    $._declaration_body,
    $._function_declaration_tail,
    $._parameter,
    $._function_modifier,
    $._non_run_expression,
    $._primary_expression,
    $._pattern_primary,
    $.type_identifier,
    $.autocast_value,
    $._operator,
    $._binding_name,
    $._separator,
    $._unqualified_operator,
  ],

  rules: {
    source_file: ($) => repeat($._declaration),

    comment: (_) =>
      token(
        prec(
          2,
        choice(
          seq("//", /[^\n]*/),
          seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/"),
        ),
        ),
      ),

    _declaration: ($) =>
      choice(
        $.feature_directive,
        $.top_run_declaration,
        $.insert_declaration,
        $.import_declaration,
        $.load_declaration,
        $.export_declaration,
        $.thread_local_declaration,
        $.instance_declaration,
        $.inherent_declaration,
        $.visibility_group,
        $.conditional_declaration,
        $.memory_overlay,
        $.named_declaration,
      ),

    feature_directive: ($) =>
      seq(
        choice("#enable", "#disable"),
        "(",
        field("feature", $.identifier),
        ")",
        optional(";"),
      ),

    visibility_modifier: (_) =>
      choice("#private", seq("#public", optional(seq("(", "unit", ")")))),

    visibility_group: ($) =>
      seq(field("visibility", $.visibility_modifier), $.declaration_block),

    declaration_block: ($) => seq("{", repeat($._declaration), "}"),

    conditional_declaration: ($) =>
      seq(
        "#if",
        field("condition", $._expression),
        field("consequence", $.declaration_block),
        optional(seq(
          "else",
          field("alternative", choice($.declaration_block, $.conditional_declaration)),
        )),
      ),

    top_run_declaration: ($) =>
      choice(
        seq("#comptime", field("body", $.block)),
        seq(
          "#comptime",
          $.arrow,
          field("type", $._type),
          field("body", $.block),
          optional(";"),
        ),
        seq("#comptime", field("value", $._expression), ";"),
      ),

    insert_declaration: ($) =>
      seq("#insert", $._insert_operand, optional(";")),

    import_declaration: ($) =>
      seq(
        "#import",
        optional($.import_selector),
        field("module", $.string_literal),
        ";",
      ),

    import_selector: ($) =>
      seq(
        ",",
        field("mode", choice("only", "hide")),
        "(",
        commaSep(choice($.identifier, $.quoted_operator, $.non_hygienic_identifier, $.code_splice_identifier)),
        ")",
      ),

    load_declaration: ($) =>
      seq(
        "#load",
        optional($.load_modifier),
        field("path", $.string_literal),
        ";",
      ),

    export_declaration: ($) =>
      seq("#export", field("path", $.string_literal), ";"),

    load_modifier: (_) => seq(",", "embed"),

    thread_local_declaration: ($) =>
      seq(
        optional(field("visibility", $.visibility_modifier)),
        "#thread_local",
        field(
          "declaration",
          alias($._thread_local_global_declaration, $.named_declaration),
        ),
      ),

    _thread_local_global_declaration: ($) =>
      seq(
        optional("mut"),
        field("name", $.declaration_name),
        $.global_variable_declaration_tail,
      ),

    named_declaration: ($) =>
      choice(
        seq(
          $._memory_declaration_prefix,
          $._memory_named_declaration_body,
        ),
        seq(
          optional(field("visibility", $.visibility_modifier)),
          "mut",
          field("name", $.declaration_name),
          $.global_variable_declaration_tail,
        ),
        seq(
          optional(field("visibility", $.visibility_modifier)),
          field("name", $.declaration_name),
          choice(
            seq("::", $._declaration_body),
            seq(choice(":=", "::="), $._named_definition_body),
            seq(
              ":",
              optional(field("type", $._type)),
              choice(":", "::"),
              $._named_definition_body,
            ),
            $.global_variable_declaration_tail,
            $.typed_constant_declaration_tail,
          ),
        ),
      ),

    _memory_named_declaration_body: ($) =>
      seq(
        field("name", $.declaration_name),
        choice(
          "::", ":=", "::=",
          seq(":", optional(field("type", $._type)), choice(":", "::")),
        ),
        choice(
          alias($._prefixed_function_declaration, $.function_declaration),
          alias($._prefixed_fn_ptr_declaration, $.function_pointer_type_declaration),
        ),
      ),

    declaration_name: ($) =>
      choice($._identifier, $.quoted_operator, $.code_splice_identifier),

    _declaration_body: ($) =>
      choice(
        $._named_definition_body,
        $.constant_declaration_body,
      ),

    _named_definition_body: ($) =>
      choice(
        $.qualified_import_declaration,
        $.qualified_load_declaration,
        $.qualified_export_declaration,
        $.library_declaration,
        $.function_pointer_type_declaration,
        $.typeclass_declaration,
        $.distinct_type_declaration,
        $.struct_declaration,
        $.enum_flags_declaration,
        $.enum_declaration,
        $.union_declaration,
        $.function_declaration,
      ),

    typeclass_declaration: ($) =>
      seq(
        "typeclass",
        "(",
        commaSep($.typeclass_parameter),
        ")",
        repeat($.where_clause),
        repeat(choice($.derive_directive, $.minimal_directive)),
        "{",
        repeat(
          choice(
            $.typeclass_method_signature,
            seq($.typeclass_associated_type, ";"),
          ),
        ),
        optional($.typeclass_associated_type),
        "}",
      ),

    typeclass_parameter: ($) =>
      seq(
        optional(field("modifier", $.comptime_modifier)),
        field("name", $.identifier),
        ":",
        field("kind", $._type),
      ),

    typeclass_method_signature: ($) =>
      choice(
        seq(
          field("name", $.declaration_name),
          "::",
          alias($._typeclass_function_declaration, $.function_declaration),
        ),
        seq(
          $.memory_prefix,
          field("name", $.declaration_name),
          "::",
          alias($._prefixed_typeclass_function_declaration, $.function_declaration),
        ),
      ),

    typeclass_associated_type: ($) =>
      seq(
        field("name", $.declaration_name),
        "::",
        field("type", $._type),
      ),

    derive_directive: ($) => seq("#derive", "(", commaSep1($.identifier), ")"),

    minimal_directive: ($) =>
      seq("#minimal", "(", optional($.minimal_requirement), ")"),

    minimal_requirement: ($) =>
      seq($.minimal_conjunction, repeat(seq("|", $.minimal_conjunction))),

    minimal_conjunction: ($) =>
      seq($.minimal_atom, repeat(seq(",", $.minimal_atom))),

    minimal_atom: ($) =>
      choice(
        $.minimal_method,
        seq("(", $.minimal_requirement, ")"),
      ),

    minimal_method: ($) => choice($.identifier, $.quoted_operator),

    distinct_type_declaration: ($) =>
      seq(
        $._distinct_type_declaration_body,
        ";",
      ),

    _distinct_type_declaration_body: ($) =>
      seq(
        "distinct",
        field("underlying_type", $._type),
        repeat(field("derive", $.distinct_derive_directive)),
      ),

    distinct_derive_directive: ($) =>
      seq(
        "#derive",
        choice(
          seq("(", commaSep1(field("class", $._type)), ")"),
          seq(",", field("mode", alias("all", $.identifier))),
        ),
      ),

    instance_declaration: ($) =>
      seq(
        field("target", $.type_constructor_pattern),
        ":::",
        "instance",
        optional("!"),
        field("class", $.identifier),
        repeat($.where_clause),
        "{",
        repeat(
          choice(
            $.instance_method,
            seq($.instance_associated_type, ";"),
          ),
        ),
        optional($.instance_associated_type),
        "}",
      ),

    instance_method: ($) =>
      choice(
        seq(field("name", $.declaration_name), "::", $.function_declaration),
        seq(
          $.memory_prefix,
          field("name", $.declaration_name),
          "::",
          alias($._prefixed_function_declaration, $.function_declaration),
        ),
      ),

    instance_associated_type: ($) =>
      seq(
        field("name", $.declaration_name),
        "::",
        field("type", $._type),
      ),

    inherent_declaration: ($) =>
      seq(
        field("target", $.type_constructor_pattern),
        ":::",
        optional(field("visibility", $.visibility_modifier)),
        repeat($.where_clause),
        "{",
        repeat(choice($.inherent_method, $.inherent_visibility_group)),
        "}",
      ),

    inherent_visibility_group: ($) =>
      seq(
        field("visibility", $.visibility_modifier),
        "{",
        repeat(choice($.inherent_method, $.inherent_visibility_group)),
        "}",
      ),

    inherent_method: ($) =>
      choice(
        seq(
          optional(field("visibility", $.visibility_modifier)),
          field("name", $.identifier),
          "::",
          alias($._inherent_function_declaration, $.function_declaration),
        ),
        seq(
          $._memory_declaration_prefix,
          field("name", $.identifier),
          "::",
          alias($._prefixed_inherent_function_declaration, $.function_declaration),
        ),
      ),

    qualified_import_declaration: ($) =>
      seq(
        "#import",
        optional($.import_selector),
        field("module", $.string_literal),
        ";",
      ),

    qualified_load_declaration: ($) =>
      seq(
        "#load",
        optional($.load_modifier),
        field("path", $.string_literal),
        ";",
      ),

    qualified_export_declaration: ($) =>
      seq("#export", field("path", $.string_literal), ";"),

    library_declaration: ($) =>
      seq(
        "#library",
        repeat(seq(",", field("modifier", $.library_modifier))),
        field("path", $.string_literal),
        ";",
      ),

    library_modifier: (_) => choice("system", "dyn", "static"),

    function_pointer_type_declaration: ($) =>
      prec.right(
        seq(
          "#fn_ptr",
          field("parameters", $.fn_ptr_parameter_list),
          optional(seq($.arrow, field("return_type", $._fn_ptr_return_type))),
          repeat(choice("#c_call", "#no_context", $.lifetimes_directive, $.memory_directive)),
          ";",
        ),
      ),

    _prefixed_fn_ptr_declaration: ($) =>
      seq(
        "#fn_ptr",
        field("parameters", $.fn_ptr_parameter_list),
        optional(seq($.arrow, field("return_type", $._fn_ptr_return_type))),
        repeat(choice("#c_call", "#no_context", $.lifetimes_directive)),
        ";",
      ),

    constant_declaration_body: ($) =>
      choice(
        prec(10, seq(field("value", $.code_expression), optional(";"))),
        prec(
          11,
          seq(
            field("value", alias($._single_code_expression, $.code_expression)),
            ";",
          ),
        ),
        prec(
          10,
          seq(
            field("value", alias($._block_run_expression, $.run_expression)),
            optional(";"),
          ),
        ),
        prec(
          10,
          seq(
            field("value", alias($._value_run_expression, $.run_expression)),
            ";",
          ),
        ),
        prec(10, seq(field("value", $.string_block), ";")),
        seq(field("value", $._non_run_expression), ";"),
      ),

    global_variable_declaration_tail: ($) =>
      prec.right(
        seq(
          choice(
            seq("::=", field("value", $._expression)),
            seq(":=", field("value", $._expression)),
            seq(
              ":",
              choice(
                seq(
                  field("type", $._type),
                  optional(
                    seq(
                      choice("=", ":="),
                      field("value", $._expression),
                    ),
                  ),
                ),
                seq(
                  choice("=", ":="),
                  field("value", $._expression),
                ),
              ),
            ),
          ),
          ";",
        ),
      ),

    typed_constant_declaration_tail: ($) =>
      seq(
        ":",
        optional(field("type", $._type)),
        choice(":", "::"),
        field("value", $._expression),
        ";",
      ),

    struct_declaration: ($) =>
      seq(
        "struct",
        repeat($.struct_modifier),
        "{",
        repeat(choice($.struct_field, $.empty_field, $.struct_visibility_group)),
        "}",
      ),

    struct_visibility_group: ($) =>
      seq(
        field("visibility", $.visibility_modifier),
        "{",
        repeat(choice($.struct_field, $.empty_field, $.struct_visibility_group)),
        "}",
      ),

    struct_modifier: ($) =>
      choice(
        "#c_call",
        "#packed",
        $.align_directive,
        $.modify_directive,
        $.derive_directive,
        $.magic_directive,
        $.lifetimes_directive,
      ),

    align_directive: ($) =>
      seq("#align", "(", field("alignment", $.integer_literal), ")"),

    empty_field: ($) =>
      seq(
        optional(field("visibility", $.visibility_modifier)),
        "#empty",
        ":",
        commaSep1(field("type", $._type)),
        ";",
      ),

    struct_field: ($) =>
      seq(
        optional(field("visibility", $.visibility_modifier)),
        optional("using"),
        optional(seq("#as", optional("using"))),
        field("name", $.identifier),
        ":",
        field("type", $._aggregate_field_type),
        optional(seq("=", field("default", $._expression))),
        ";",
      ),

    enum_declaration: ($) =>
      seq(
        "enum",
        optional(field("backing_type", $._type)),
        repeat($.derive_directive),
        "{",
        repeat(choice($.enum_variant, $.enum_visibility_group)),
        "}",
      ),

    enum_flags_declaration: ($) =>
      seq(
        "enum_flags",
        field("backing_type", $._type),
        repeat($.derive_directive),
        "{",
        repeat(choice($.enum_variant, $.enum_visibility_group)),
        "}",
      ),

    enum_visibility_group: ($) =>
      seq(
        field("visibility", $.visibility_modifier),
        "{",
        repeat(choice($.enum_variant, $.enum_visibility_group)),
        "}",
      ),

    enum_variant: ($) =>
      seq(
        optional(field("visibility", $.visibility_modifier)),
        field("name", $.identifier),
        optional(seq("::", optional("-"), field("value", $.integer_literal))),
        ";",
      ),

    union_declaration: ($) =>
      seq(
        "union",
        repeat(choice("#raw", $.derive_directive, $.magic_directive, $.lifetimes_directive)),
        "{",
        repeat(choice($.union_field, $.union_visibility_group)),
        "}",
      ),

    union_visibility_group: ($) =>
      seq(
        field("visibility", $.visibility_modifier),
        "{",
        repeat(choice($.union_field, $.union_visibility_group)),
        "}",
      ),

    union_field: ($) =>
      seq(
        optional(field("visibility", $.visibility_modifier)),
        optional(field("conversion", $.from_directive)),
        field("name", $.identifier),
        ":",
        field("type", $._aggregate_field_type),
        ";",
      ),

    _aggregate_field_type: ($) =>
      choice(
        $._type,
        $.struct_declaration,
        $.enum_flags_declaration,
        $.enum_declaration,
        $.union_declaration,
      ),

    from_directive: (_) => "#from",

    function_declaration: ($) =>
      seq(
        field("parameters", $.parameter_list),
        $._function_declaration_tail,
      ),

    _inherent_function_declaration: ($) =>
      seq(
        field("parameters", alias($.inherent_parameter_list, $.parameter_list)),
        $._function_declaration_tail,
      ),

    _prefixed_function_declaration: ($) =>
      seq(field("parameters", $.parameter_list), functionTail($, false)),

    _prefixed_inherent_function_declaration: ($) =>
      seq(
        field("parameters", alias($.inherent_parameter_list, $.parameter_list)),
        functionTail($, false),
      ),

    _function_declaration_tail: ($) => functionTail($, true),

    _typeclass_function_declaration: ($) =>
      seq(field("parameters", $.parameter_list), functionTail($, true, true)),

    _prefixed_typeclass_function_declaration: ($) =>
      seq(field("parameters", $.parameter_list), functionTail($, false, true)),

    parameter_list: ($) =>
      seq("(", commaSep($._parameter), ")"),

    _parameter: ($) =>
      choice(
        $.parameter,
        $.comptime_parameter,
        $.empty_parameter,
        $.c_varargs_parameter,
      ),

    inherent_parameter_list: ($) =>
      seq(
        "(",
        choice(
          commaSep($._parameter),
          seq($.receiver_parameter, optional(seq(",", commaSep($._parameter)))),
        ),
        ")",
      ),

    receiver_parameter: ($) =>
      seq(
        optional("noalias"),
        optional("mut"),
        optional(choice(
          seq("*", optional("const")),
          seq("&", optional($.lifetime), optional("mut")),
        )),
        $.self_expression,
      ),

    fn_ptr_parameter_list: ($) =>
      seq("(", commaSep(choice($.fn_ptr_parameter, $.c_varargs_parameter)), ")"),

    fn_ptr_parameter: ($) =>
      seq(
        optional("noalias"),
        field("name", $.identifier),
        ":",
        field("type", $._type),
      ),

    c_varargs_parameter: ($) => $._ellipsis,

    empty_parameter: ($) =>
      seq(
        "#empty",
        ":",
        commaSep1(field("type", $._type)),
      ),

    comptime_parameter: ($) =>
      seq(
        choice(
          seq("#comptime", optional("#lazy")),
          seq("#lazy", "#comptime"),
        ),
        field("name", $.binding_list),
        ":",
        field("type", $._type),
        optional(seq("=", field("default", $._expression))),
      ),

    parameter: ($) =>
      seq(
        repeat(choice("using", "noalias")),
        optional("#lazy"),
        optional("mut"),
        choice(
          seq(
            field("name", $._binding_name),
            ":=",
            field("default", $._expression),
          ),
          seq(
            field("name", $.binding_list),
            ":",
            field("type", choice($.variadic_type, $._type)),
            optional(seq("=", field("default", $._expression))),
          ),
        ),
      ),
    binding_list: ($) => seq($._binding_name, repeat(seq(",", $._binding_name))),

    _binding_name: ($) =>
      choice($._identifier, $.non_hygienic_identifier, $.code_splice_identifier),

    variadic_type: ($) =>
      seq(
        $._ellipsis,
        optional(
          choice(
            $.identifier,
            $.generic_type_variable,
            $.variadic_constraint,
          ),
        ),
      ),

    variadic_constraint: ($) =>
      seq(
        "(",
        $.identifier,
        repeat1(seq("&&", $.identifier)),
        ")",
      ),

    _function_modifier: ($) =>
      choice($._function_non_bodyless_modifier, $._function_bodyless_modifier),

    _function_non_bodyless_modifier: ($) =>
      choice($.memory_directive, $._function_plain_non_bodyless_modifier),

    _function_plain_non_bodyless_modifier: ($) =>
      choice(
        $.lifetimes_directive,
        $.operator_directive,
        $.modify_directive,
        $.expand_directive,
        "#c_call",
        "#no_context",
        "#dump",
        "#must",
        "#returns_twice",
        "#fresh_result",
        "#unchecked_transfer",
        $.inline_directive,
      ),

    _function_bodyless_modifier: ($) =>
      choice($.magic_directive, $.foreign_directive),

    expand_directive: ($) =>
      seq("#expand", optional(seq(",", field("mode", alias("expression", $.identifier))))),

    inline_directive: ($) =>
      seq("#inline", optional(seq(",", field("mode", $.inline_modifier)))),

    inline_modifier: (_) => choice("always", "never"),

    where_clause: ($) => seq("where", field("condition", $._expression)),

    lifetimes_directive: ($) =>
      seq("#lifetimes", "(", sep1($.identifier, ","), ")"),

    // Leading blocks attach only to functions and named function-pointer types.
    // Trailing contracts retain the historical single-effect and (...) forms.
    _memory_declaration_prefix: ($) =>
      choice(
        seq($.memory_prefix, optional(field("visibility", $.visibility_modifier))),
        seq(field("visibility", $.visibility_modifier), $.memory_prefix),
      ),

    memory_prefix: ($) => seq("#memory", "{", commaSep($.memory_effect), "}"),

    memory_directive: ($) =>
      seq(
        "#memory",
        choice(
          $.memory_effect,
          seq("{", commaSep($.memory_effect), "}"),
          seq("(", commaSep($.memory_effect), ")"),
        ),
      ),

    memory_effect: ($) =>
      prec.right(choice(
        seq(
          field("kind", alias(choice("returns_fresh", "returns_static"), $.identifier)),
          optional(seq("(", sep1($.memory_place, ","), ")")),
        ),
        seq(
          field("kind", alias(choice("returns_borrow", "returns_unique_borrow"), $.identifier)),
          "(", $.memory_place, optional(seq(",", $.memory_place)), ")",
        ),
        seq(
          field("kind", alias(choice(
            "kills", "maybe_kills", "invalidates", "maybe_invalidates",
            "noescape", "reads", "maybe_reads", "writes", "maybe_writes",
            "exclusive", "initialized", "initializes", "valid",
            "sendable", "shareable", "thread_safe",
          ), $.identifier)),
          "(", sep1($.memory_place, ","), ")",
        ),
        seq(
          field("kind", alias(choice("disjoint", "outlives", "guarded_by"), $.identifier)),
          "(", $.memory_place, ",", $.memory_place, ")",
        ),
        seq(
          field("kind", alias(choice("owns", "maybe_owns", "escapes", "maybe_escapes"), $.identifier)),
          "(", sep1($.memory_place, ","),
          optional(seq(",", alias("into", $.identifier), ":", $.memory_place)),
          ")",
        ),
        seq(
          field("kind", alias(choice("gives", "maybe_gives"), $.identifier)),
          "(", sep1($.memory_place, ","),
          optional(seq(",", alias("released_by", $.identifier), ":", $._memory_releaser)),
          ")",
        ),
        seq(
          field("kind", alias("released_by", $.identifier)),
          "(",
          choice(
            seq(
              $._memory_releaser,
              optional(seq(
                ",", choice($.memory_place, $.memory_typed_releaser),
                optional(seq(",", $.memory_place)),
              )),
            ),
            commaSep1($.memory_release_argument),
          ),
          ")",
        ),
        seq(
          field("kind", alias("leak", $.identifier)),
          optional(seq("(", $.memory_qualified_name, ")")),
        ),
        seq(
          field("kind", alias(choice("unknown", "requires_unsafe"), $.identifier)),
          optional(seq("(", sep1($.memory_unknown_argument, ","), ")")),
        ),
      )),

    memory_release_argument: ($) =>
      choice(
        seq(field("name", alias("by", $.identifier)), ":", $._memory_releaser),
        seq(field("name", alias(choice("place", "instance"), $.identifier)), ":", $.memory_place),
      ),

    memory_unknown_argument: ($) =>
      choice(
        seq(field("name", alias("arg", $.identifier)), ":", $.memory_place),
        seq(field("name", alias("result", $.identifier)), ":", $.memory_qualified_name),
        seq(field("name", alias("reason", $.identifier)), ":", $.string_literal),
      ),

    memory_place: ($) =>
      prec.right(seq(
        choice(
          $.identifier,
          $.self_expression,
          seq(alias("arg", $.identifier), optional(seq("(", $.integer_literal, ")"))),
        ),
        repeat(seq(".", field("field", choice($.identifier, $.integer_literal)))),
      )),

    memory_qualified_name: ($) =>
      seq($.identifier, repeat(seq(".", field("field", choice($.identifier, $.integer_literal))))),

    _memory_releaser: ($) =>
      choice($.memory_qualified_name, $.memory_typed_releaser),

    memory_typed_releaser: ($) =>
      seq("(", field("owner", $._type), ")", ".", field("method", $.identifier)),

    memory_overlay: ($) =>
      seq($._memory_overlay_body, optional(";")),

    _memory_overlay_body: ($) =>
      seq(
        "#memory",
        field("target", $.memory_qualified_name),
        "{", commaSep1($.memory_effect), "}",
      ),

    memory_trusted_statement: ($) =>
      seq("#memory", ",", choice("trusted", "trust"), field("body", $.block)),

    modify_directive: ($) =>
      seq(
        "#modify",
        choice(
          field("body", $.block),
          field("condition", $._expression),
        ),
      ),

    operator_directive: ($) =>
      seq(
        "#operator",
        "(",
        field("mode", $.identifier),
        optional(seq(",", choice(
          field("level", $.integer_literal),
          field("modifier", $.operator_try_modifier),
        ))),
        ")",
      ),

    operator_try_modifier: ($) => seq("try", "(", field("target", $.identifier), ")"),

    magic_directive: ($) =>
      seq("#magic", field("name", $.string_literal)),

    foreign_directive: ($) =>
      seq(
        "#foreign",
        field("library", choice($.identifier, $.string_literal)),
        optional(field("symbol", $.string_literal)),
      ),

    block: ($) =>
      seq(
        "{",
        repeat($._statement),
        optional(
          alias(
            $._code_splice_final_statement,
            $.expression_statement,
          ),
        ),
        "}",
      ),

    _code_splice_final_statement: ($) =>
      alias($._code_splice_call_expression, $.postfix_expression),

    _code_splice_call_expression: ($) =>
      seq(
        field("function", choice(
          $.code_splice_identifier,
          alias($._code_splice_member_expression, $.postfix_expression),
        )),
        field("arguments", $.argument_list),
      ),

    _code_splice_member_expression: ($) =>
      seq(
        field("object", choice(
          $.code_splice_identifier,
          alias($._code_splice_member_expression, $.postfix_expression),
        )),
        ".",
        field("field", choice($.identifier, $.code_splice_identifier)),
      ),

    _statement: ($) =>
      choice(
        $.nested_declaration,
        $.memory_overlay,
        $.memory_trusted_statement,
        $.block,
        $.inline_bytes_statement,
        $.inline_asm_statement,
        $.label_statement,
        $.return_statement,
        $.caller_return_statement,
        $.break_statement,
        $.continue_statement,
        $.while_statement,
        $.for_statement,
        $.inline_statement,
        $.try_defer_statement,
        $.defer_statement,
        $.on_drop_error_statement,
        $.caller_defer_statement,
        $.using_statement,
        $.switch_statement,
        $.if_statement,
        $.push_context_statement,
        $.push_allocator_statement,
        $.static_if_statement,
        $.assert_statement,
        $.insert_statement,
        $.compile_error_statement,
        $.falling_statement,
        $.variable_declaration,
        $.assignment_statement,
        $.expression_statement,
      ),

    nested_declaration: ($) =>
      choice(
        seq(
          field("name", $.declaration_name),
          "::",
          choice(
            alias($._nested_distinct_type_declaration, $.distinct_type_declaration),
            $.struct_declaration,
            $.enum_declaration,
            $.union_declaration,
            $.function_declaration,
          ),
        ),
        $._memory_nested_declaration,
      ),

    _memory_nested_declaration: ($) =>
      seq($.memory_prefix, $._memory_named_declaration_body),

    _nested_distinct_type_declaration: ($) =>
      seq($._distinct_type_declaration_body, optional(";")),

    inline_bytes_statement: ($) =>
      seq("#bytes", field("value", $._expression), optional(";")),

    inline_asm_statement: ($) =>
      choice(
        seq(
          "#asm",
          field("body", $.structured_asm_body),
          optional(";"),
        ),
        seq(
          "#asm",
          field("template", choice($._expression, $.multiline_string_literal)),
          optional($.asm_operands),
          optional(";"),
        ),
      ),

    structured_asm_body: ($) =>
      seq(
        "{",
        field("template", $.multiline_string_literal),
        repeat(field("operand", choice($.structured_asm_input_operand, $.structured_asm_output_operand))),
        optional(field("clobbers", $.structured_asm_clobber_clause)),
        "}",
      ),

    structured_asm_input_operand: ($) =>
      seq(
        field("name", $.identifier),
        ":",
        field("direction", alias("in", $.asm_operand_direction)),
        "(",
        field("constraint", $.structured_asm_constraint),
        ")",
        optional(seq("=", field("value", $._expression))),
        ";",
      ),

    structured_asm_output_operand: ($) =>
      seq(
        field("name", $.identifier),
        ":",
        field("direction", $.asm_operand_direction),
        "(",
        field("constraint", $.structured_asm_constraint),
        optional(seq(",", field("flag", $.structured_asm_operand_flag))),
        ")",
        optional(seq("=", field("target", $.identifier))),
        ";",
      ),

    asm_operand_direction: (_) => choice("out", "inout"),

    structured_asm_constraint: ($) =>
      choice(
        field("kind", $.structured_asm_constraint_kind),
        seq("fixed", "(", field("register", $.identifier), ")"),
      ),

    structured_asm_constraint_kind: (_) =>
      choice(
        ".Register",
        ".Byte_Register",
        ".Floating_Register",
        ".Vector_Register",
        ".Predicate_Register",
        ".Memory",
        ".Immediate",
        ".Constant",
        ".Address",
        ".Register_Or_Memory",
        ".Register_Or_Immediate",
        ".Register_Memory_Or_Immediate",
        ".Any",
      ),

    structured_asm_operand_flag: (_) => ".Early_Clobber",

    structured_asm_clobber_clause: ($) =>
      seq(
        "clobber",
        ":",
        sep1(choice($.identifier, $.structured_asm_clobber_kind), ","),
        ";",
      ),

    structured_asm_clobber_kind: (_) =>
      choice(".Memory", ".Condition_Codes"),

    asm_operands: ($) =>
      prec.right(
        seq(
          ":",
          optional($.asm_output_list),
          optional(seq(":", optional($.asm_input_list))),
          optional(seq(":", optional($.asm_clobber_list))),
        ),
      ),

    asm_output_list: ($) => prec.right(commaSep1($.asm_output_operand)),
    asm_input_list: ($) => prec.right(commaSep1($.asm_input_operand)),
    asm_clobber_list: ($) => prec.right(commaSep1($.string_literal)),

    asm_output_operand: ($) =>
      seq(
        field("kind", choice("out", "inout")),
        "(",
        field("constraint", $.string_literal),
        ",",
        field("target", $.identifier),
        ")",
      ),

    asm_input_operand: ($) =>
      seq(
        "in",
        "(",
        field("constraint", $.string_literal),
        ",",
        field("value", $._expression),
        ")",
      ),

    label_statement: ($) => prec(1, seq($.label, choice(":", ";"))),

    return_statement: ($) =>
      prec.dynamic(
        2,
        prec.right(seq("return", optional(commaSep1($._expression)), ";")),
      ),

    caller_return_statement: ($) =>
      prec.dynamic(
        2,
        prec.right(seq("`return", optional(commaSep1($._expression)), ";")),
      ),

    break_statement: (_) => prec(PREC.statement, seq("break", optional(";"))),

    continue_statement: (_) => prec(PREC.statement, seq("continue", optional(";"))),

    while_statement: ($) =>
      seq("while", field("condition", $._expression), field("body", $._if_body)),

    for_statement: ($) =>
      seq(
        "for",
        optional(field("direction", alias("<", $.operator))),
        optional(seq(":", field("expansion", $.identifier))),
        optional(
          choice(
            seq(
              optional(field("mode", alias($._pointer_prefix, $.for_pointer_binder))),
              optional("mut"),
              field("name", $._identifier),
              ",",
              optional("mut"),
              field("index", $._identifier),
              ":",
            ),
            seq(
              optional(field("mode", alias($._pointer_prefix, $.for_pointer_binder))),
              optional("mut"),
              field("name", $._identifier),
              ":",
            ),
          ),
        ),
        choice(
          seq(
            field("value", prec.dynamic(2, choice(
              $.run_expression,
              $._non_range_expression,
              alias($._for_closed_range, $.range_expression),
            ))),
            field("body", $._if_body),
          ),
          // An identifier or call after .. is the endpoint, never the body.
          seq(
            field("value", alias($._for_open_range, $.range_expression)),
            field("body", choice($.block, $.if_statement)),
          ),
        ),
      ),

    _for_closed_range: ($) =>
      prec.left(PREC.range, seq(
        optional(field("start", $._expression)),
        field("operator", $.range_operator),
        field("end", $._expression),
      )),

    _for_open_range: ($) =>
      prec.left(PREC.range - 1, seq(
        optional(field("start", $._expression)),
        field("operator", $.range_operator),
      )),

    for_pointer_binder: (_) => "*",

    inline_statement: ($) =>
      seq("#inline", field("statement", choice($.while_statement, $.for_statement))),

    try_defer_statement: ($) =>
      seq("#try", "defer", field("statement", $._statement)),

    defer_statement: ($) => seq("defer", field("statement", $._statement)),

    on_drop_error_statement: ($) =>
      seq(
        "#on_drop_error",
        "(",
        field("owner", $.identifier),
        ",",
        field("error", $.identifier),
        ")",
        field("body", $.block),
      ),

    caller_defer_statement: ($) =>
      seq("`defer", field("statement", $._statement)),

    using_statement: ($) =>
      seq("using", field("name", $.identifier), optional(";")),

    switch_statement: ($) =>
      choice(
        seq(
          "if",
          optional(field("modifier", $.partial_directive)),
          field("subject", $._expression),
          field("operator", $._unqualified_operator),
          "{",
          // Runtime switches use patterns with or without #pattern.
          repeat(choice($.pattern_case_clause, $.default_clause, $.inline_statement)),
          "}",
        ),
        prec.dynamic(1, seq(
          "if",
          optional(field("modifier", $.partial_directive)),
          "#pattern",
          choice(
            seq(
              "{",
              repeat(choice($.pattern_case_clause, $.default_clause, $.inline_statement)),
              "}",
            ),
            seq(
              optional(field("subject", $._expression)),
              field("operator", $._unqualified_operator),
              "{",
              repeat(choice($.pattern_case_clause, $.default_clause, $.inline_statement)),
              "}",
            ),
          ),
        )),
      ),

    partial_directive: (_) => "#partial",

    case_clause: ($) =>
      prec.right(
        10,
        seq(
          "case",
          commaSep1(field("value", $._expression)),
          ";",
          repeat($._statement),
        ),
      ),

    pattern_case_clause: ($) =>
      prec.right(
        10,
        seq(
          "case",
          commaSep1(field("value", choice(
            $.pattern_arm_block,
            prec.dynamic(1, $._pattern),
            $._expression,
          ))),
          optional(seq("if", field("guard", $._expression))),
          ";",
          repeat($._statement),
        ),
      ),

    default_clause: ($) =>
      prec.right(10, seq("else", ";", repeat($._statement))),

    _if_body: ($) =>
      choice(
        $.block,
        alias($.if_assignment, $.assignment_statement),
        alias($.if_variable_declaration, $.variable_declaration),
        alias($.if_call, $.expression_statement),
        $._single_statement,
      ),

    if_assignment: ($) =>
      prec.right(
        seq(
          field("left", $.if_assignment_start),
          field("right", $._expression),
          ";",
        ),
      ),

    if_assignment_start: (_) =>
      token(
        seq(
          /(?:[\p{L}_][\p{L}\p{N}_]*|#self)(?:(?:\.[\p{L}_][\p{L}\p{N}_]*|\.\*)|\[(?:[^\[\]\n]|\[[^\[\]\n]*\])*\])*/,
          /\s*[+\-*\/%&|^~<>!?]*=/,
        ),
      ),

    if_variable_declaration: ($) =>
      prec.right(
        2,
        seq(
          field("name", $.if_variable_declaration_start),
          field("value", $._expression),
          optional(";"),
        ),
      ),

    if_variable_declaration_start: (_) =>
      token(
        seq(
          /[\p{L}_][\p{L}\p{N}_]*/,
          /\s*:=/,
        ),
      ),

    if_call: ($) =>
      prec.right(seq(
        field("function", $.if_call_start),
        field("arguments", $.if_call_arguments),
        repeat(choice(
          seq(".", field("field", choice($.identifier, $.code_splice_identifier, alias($._tuple_index, $.integer_literal)))),
          ".*",
          seq(".&", optional($._address_qualifier)),
          field("arguments", $.argument_list),
          field("index", $.index_suffix),
          field("index", $.qualified_index_suffix),
          seq(".", "cast", "(", field("type", $._type), ")"),
          seq(".", "acast"),
          $.memory_directive,
        )),
        optional(field("operator", $.try_operator)),
        optional(";"),
      )),

    if_call_start: (_) =>
      token(
        seq(
          // Keep return/cast/if keywords out of the call token so a following
          // parenthesized value remains part of the enclosing statement.
          choice(
            /[\p{L}_&&[^icar]][\p{L}\p{N}_]*/,
            "r",
            "re",
            "ret",
            "retu",
            "retur",
            /r[\p{L}\p{N}_&&[^e]][\p{L}\p{N}_]*/,
            /re[\p{L}\p{N}_&&[^t]][\p{L}\p{N}_]*/,
            /ret[\p{L}\p{N}_&&[^u]][\p{L}\p{N}_]*/,
            /retu[\p{L}\p{N}_&&[^r]][\p{L}\p{N}_]*/,
            /retur[\p{L}\p{N}_&&[^n]][\p{L}\p{N}_]*/,
            /return[\p{L}\p{N}_]+/,
            "#self",
            "i",
            /i(?:[\p{L}\p{N}_&&[^f]][\p{L}\p{N}_]*|f[\p{L}\p{N}_]+)/,
            "c",
            "ca",
            "cas",
            /c[\p{L}\p{N}_&&[^a]][\p{L}\p{N}_]*/,
            /ca[\p{L}\p{N}_&&[^s]][\p{L}\p{N}_]*/,
            /cas[\p{L}\p{N}_&&[^t]][\p{L}\p{N}_]*/,
            /cast[\p{L}\p{N}_][\p{L}\p{N}_]*/,
            "a",
            "ac",
            "aca",
            "acas",
            /a[\p{L}\p{N}_&&[^c]][\p{L}\p{N}_]*/,
            /ac[\p{L}\p{N}_&&[^a]][\p{L}\p{N}_]*/,
            /aca[\p{L}\p{N}_&&[^s]][\p{L}\p{N}_]*/,
            /acas[\p{L}\p{N}_&&[^t]][\p{L}\p{N}_]*/,
            /acast[\p{L}\p{N}_][\p{L}\p{N}_]*/,
          ),
          // Recognize the start of an unbraced member-call body before its
          // receiver can be consumed as an operator or index qualifier.
          /(?:\.[\p{L}_][\p{L}\p{N}_]*|\.\*|\[(?:[^\[\]\n]|\[[^\[\]\n]*\])*\])*/,
          /\s*\(/,
        ),
      ),

    if_call_arguments: ($) =>
      seq(commaSep(choice($.named_argument, $._expression)), ")"),

    _single_statement: ($) =>
      choice(
        $.memory_overlay,
        $.memory_trusted_statement,
        $.inline_bytes_statement,
        $.inline_asm_statement,
        $.label_statement,
        $.return_statement,
        $.caller_return_statement,
        $.break_statement,
        $.continue_statement,
        $.while_statement,
        $.for_statement,
        $.inline_statement,
        $.try_defer_statement,
        $.defer_statement,
        $.on_drop_error_statement,
        $.caller_defer_statement,
        $.using_statement,
        $.switch_statement,
        $.if_statement,
        $.push_context_statement,
        $.push_allocator_statement,
        $.static_if_statement,
        $.assert_statement,
        $.insert_statement,
        $.compile_error_statement,
        $.falling_statement,
        $.variable_declaration,
        $.assignment_statement,
        $.expression_statement,
      ),

    assert_statement: ($) =>
      choice(
        prec.right(
          11,
          seq(
            "#assert",
            field("modifier", $.comptime_modifier),
            field("condition", $._expression),
            optional(seq(",", field("message", $._expression))),
            optional(";"),
          ),
        ),
        prec.right(
          10,
          seq(
            "#assert",
            field("condition", $._expression),
            optional(seq(",", field("message", $._expression))),
            optional(";"),
          ),
        ),
      ),

    comptime_modifier: (_) => token(prec(3, "#comptime")),

    if_statement: ($) =>
      prec.right(
        seq(
          "if",
          field("condition", $._expression),
          field("consequence", $._if_body),
          optional(seq("else", field("alternative", $._if_body))),
        ),
      ),

    push_context_statement: ($) =>
      seq(
        "#push_context",
        optional(field("value", $._expression)),
        field("body", $.block),
      ),

    push_allocator_statement: ($) =>
      seq(
        "#push_allocator",
        "(",
        field("value", $._expression),
        ")",
        optional(";"),
      ),

    static_if_statement: ($) =>
      prec.right(
        choice(
          seq(
            "#if",
            field("condition", $._expression),
            field("operator", $._unqualified_operator),
            "{",
            repeat(choice($.case_clause, $.default_clause)),
            "}",
          ),
          seq(
            "#if",
            field("condition", $._expression),
            field("consequence", $._if_body),
            optional(
              seq(
                "else",
                field("alternative", choice($._if_body, $.static_if_statement)),
              ),
            ),
          ),
        ),
      ),

    insert_statement: ($) =>
      prec.dynamic(1, prec.right(PREC.statement,
        seq("#insert", $._insert_operand, optional(";")),
      )),

    _insert_operand: ($) =>
      seq(
        optional($.insert_scope),
        field(
          "value",
          choice(
            alias($._insert_run_expression, $.run_expression),
            $._expression,
          ),
        ),
      ),

    insert_scope: ($) =>
      seq(
        ",",
        "scope",
        "(",
        optional(field("environment", $._expression)),
        ")",
      ),

    _insert_run_expression: ($) =>
      prec(
        PREC.unary,
        choice(
          seq($.arrow, field("type", $._type), field("body", $.block)),
          field("body", $.block),
        ),
      ),

    compile_error_statement: ($) =>
      seq("#compile_error", field("message", $._expression), optional(";")),

    falling_statement: (_) => seq("#falling", optional(";")),

    variable_declaration: ($) =>
      prec.right(
        seq(
          $._variable_declaration_body,
          repeat($.memory_directive),
          ";",
        ),
      ),

    _variable_declaration_body: ($) =>
      choice(
        $._immutable_variable_declaration_body,
        seq("mut", $._mutable_variable_declaration_body),
      ),

    _immutable_variable_declaration_body: ($) =>
      choice(
        seq(
          field("name", $.binding_list),
          "::=",
          field("value", $._expression),
        ),
        seq(
          field("name", $.binding_list),
          ":=",
          field("value", $._expression),
        ),
        seq(
          field("name", $.binding_list),
          "::",
          field("value", choice(
            alias($._single_code_expression, $.code_expression),
            $._expression,
          )),
        ),
        seq(
          field("name", $.binding_list),
          ":",
          choice(
            seq(
              field("type", $._type),
              optional(
                seq(
                  choice(":=", "=", "::", ":"),
                  field("value", $._expression),
                ),
              ),
            ),
            seq(
              choice(":=", "=", "::", ":"),
              field("value", $._expression),
            ),
          ),
        ),
      ),

    _mutable_variable_declaration_body: ($) =>
      choice(
        seq(
          field("name", $.binding_list),
          choice("::=", ":="),
          field("value", $._expression),
        ),
        seq(
          field("name", $.binding_list),
          ":",
          choice(
            seq(
              field("type", $._type),
              optional(seq(choice(":=", "="), field("value", $._expression))),
            ),
            seq(choice(":=", "="), field("value", $._expression)),
          ),
        ),
      ),

    assignment_statement: ($) =>
      prec.right(
        PREC.assignment + 1,
        seq(
          field("left", $._expression),
          field("operator", choice("=", $.assignment_operator)),
          field("right", choice($.assignment_expression, $._expression)),
          ";",
        ),
      ),

    expression_statement: ($) =>
      choice(
        prec(10, seq(alias($._block_run_expression, $.run_expression), optional(";"))),
        prec.dynamic(
          2,
          prec.right(
            PREC.statement,
            seq($.pattern_binding_expression, optional(";")),
          ),
        ),
        prec.right(seq($._expression, choice(";", ","))),
      ),

    _type: ($) =>
      choice(
        $.result_type,
        $._modified_type,
      ),

    _modified_type: ($) =>
      choice(
        $.optional_type,
        $.matrix_type,
        $.simd_type,
        $.generic_type,
        $.many_pointer_type,
        $.array_type,
        $.layout_type,
        $.pointer_type,
        $.reference_type,
        $.borrowed_slice_type,
        $.lifetime,
        $.function_type,
        $.tuple_type,
        $.parenthesized_type,
        $.generic_type_variable,
        $.context_type,
        $.self_type,
        $.never_type,
        $.string_literal,
        $.named_type,
      ),

    _reference_element_base: ($) =>
      choice(
        $.optional_type,
        $.matrix_type,
        $.simd_type,
        $.generic_type,
        $.many_pointer_type,
        $.array_type,
        $.layout_type,
        $.pointer_type,
        $.reference_type,
        $.borrowed_slice_type,
        $.lifetime,
        $.function_type,
        $.tuple_type,
        $.parenthesized_type,
        $.generic_type_variable,
        $.context_type,
        $.self_type,
        $.never_type,
        $.string_literal,
        alias($._reference_element_name, $.named_type),
      ),

    // Keep a bracketed name ambiguous until its following token decides
    // between an element borrow (&[T]) and an array reference (&[N]T).
    _reference_element_name: ($) =>
      seq(
        choice($.identifier, $.code_splice_identifier),
        repeat(seq(".", choice($.identifier, $.code_splice_identifier))),
      ),

    _reference_element_type: ($) => choice(
      $._reference_element_base,
      alias($._reference_element_result_type, $.result_type),
    ),

    _reference_element_result_type: ($) =>
      prec.right(PREC.resultType, seq(
        field("error", $._reference_element_base),
        "!",
        field("type", $._type),
      )),

    optional_type: ($) =>
      prec.right(
        PREC.unary,
        seq("?", field("type", $._modified_type)),
      ),

    result_type: ($) =>
      prec.right(
        PREC.resultType,
        seq(
          field("error", $._modified_type),
          // A lambda's result return type takes priority over a unary ! body.
          token(prec(2, "!")),
          field("type", $._type),
        ),
      ),

    _fn_ptr_return_type: ($) =>
      choice(
        $.fn_ptr_result_type,
        $._fn_ptr_modified_type,
      ),

    _fn_ptr_modified_type: ($) =>
      choice(
        $.optional_type,
        alias($.fn_ptr_generic_type, $.generic_type),
        $.matrix_type,
        $.simd_type,
        $.many_pointer_type,
        $.array_type,
        $.layout_type,
        $.pointer_type,
        $.reference_type,
        $.borrowed_slice_type,
        $.lifetime,
        $.function_type,
        $.tuple_type,
        $.parenthesized_type,
        $.generic_type_variable,
        $.context_type,
        $.self_type,
        $.never_type,
        $.string_literal,
        $.named_type,
      ),

    fn_ptr_result_type: ($) =>
      prec.right(
        PREC.resultType,
        seq(
          field("error", $._fn_ptr_modified_type),
          "!",
          field("type", $._type),
        ),
      ),

    fn_ptr_generic_type: ($) =>
      prec.right(
        10,
        seq(
          field("name", $.type_identifier),
          "(",
          commaSep1($._type),
          ")",
          repeat(seq(".", field("member", choice($.identifier, $.code_splice_identifier)))),
        ),
      ),

    generic_type_variable: ($) => seq("$", field("name", $.identifier)),

    matrix_type: ($) =>
      prec(
        2,
        seq(
          "Matrix",
          "(",
          field("element", $._type),
          ",",
          field("rows", $.type_dimension),
          ",",
          field("columns", $.type_dimension),
          ")",
        ),
      ),

    simd_type: ($) =>
      prec(
        2,
        seq(
          "Simd",
          "(",
          field("element", $._type),
          ",",
          field("lanes", $.integer_literal),
          ")",
        ),
      ),

    type_dimension: ($) =>
      choice(
        $.integer_literal,
        $.identifier,
        seq("-", $.integer_literal),
      ),

    array_type: ($) =>
      choice(
        seq(
          "[",
          "]",
          repeat(choice("const", "volatile")),
          field("element", $._modified_type),
        ),
        seq(
          "[",
          field(
            "length",
            choice(
              "..",
              $.integer_literal,
              alias("_", $.type_hole),
              $.identifier,
            ),
          ),
          "]",
          field("element", $._modified_type),
        ),
      ),

    many_pointer_type: ($) =>
      seq(
        "[",
        "*",
        "]",
        repeat(choice("const", "volatile")),
        field("element", $._modified_type),
      ),

    layout_type: ($) =>
      seq(field("layout", choice("#aos", "#soa")), field("type", $._modified_type)),

    pointer_type: ($) =>
      seq(
        "*",
        repeat(choice("const", "volatile")),
        field("pointee", $._modified_type),
      ),

    reference_type: ($) =>
      prec(PREC.unary, seq(
        "&",
        optional($.lifetime),
        optional("mut"),
        choice(
          field("pointee", $._modified_type),
          seq("[", field("element", $._reference_element_type), "]"),
        ),
      )),

    borrowed_slice_type: ($) =>
      prec(PREC.unary, seq(
        "[", "&", optional($.lifetime), "]",
        optional("mut"),
        field("element", $._modified_type),
      )),

    lifetime: ($) => $.label,

    _bracket_reference_type: ($) =>
      prec.dynamic(2, prec(PREC.unary, seq(
        $._reference_prefix,
        optional($.lifetime),
        optional("mut"),
        choice(
          field("pointee", choice($.array_type, $.many_pointer_type, $.borrowed_slice_type)),
          seq("[", field("element", $._reference_element_type), "]"),
        ),
      ))),

    function_type: ($) =>
      seq(
        "(",
        commaSep(seq(optional("noalias"), $.type_element)),
        ")",
        $.arrow,
        field("return_type", $._type),
      ),

    tuple_type: ($) =>
      seq(
        "(",
        choice(
          seq(
            $.type_element,
            ",",
            repeat(seq($.type_element, ",")),
            optional($.type_element),
          ),
          seq(field("name", $.identifier), ":", field("type", $._type)),
        ),
        ")",
      ),

    parenthesized_type: ($) => seq("(", $._type, ")"),

    type_element: ($) =>
      seq(optional(seq(field("name", $.identifier), ":")), field("type", $._type)),

    generic_type: ($) =>
      prec.right(
        1,
        seq(
          field("name", $.type_identifier),
          "(",
          commaSep1($._type),
          ")",
          repeat(seq(".", field("member", choice($.identifier, $.code_splice_identifier)))),
        ),
      ),

    context_type: (_) => "#Context",

    self_type: (_) => "#Self_Type",

    never_type: (_) => "#Never",

    self_expression: (_) => "#self",

    named_type: ($) => $.type_identifier,

    type_identifier: ($) =>
      prec.left(
        seq(
          choice($.identifier, $.code_splice_identifier),
          repeat(seq(".", choice($.identifier, $.code_splice_identifier))),
        ),
      ),

    type_constructor_pattern: ($) =>
      choice(
        $.never_type,
        $.result_type_constructor_pattern,
        $.optional_type_constructor_pattern,
        $.generic_type_variable,
        $.code_splice_identifier,
        $.type_hole,
        $.array_type_constructor_pattern,
        $.layout_type_constructor_pattern,
        $.pointer_type_constructor_pattern,
        $.reference_type_constructor_pattern,
        $.borrowed_slice_type_constructor_pattern,
        $.lifetime,
        $.function_type_constructor_pattern,
        $.tuple_type_constructor_pattern,
        $.generic_type_constructor_pattern,
        $.string_literal,
        $.type_identifier,
      ),

    _reference_element_constructor_pattern: ($) =>
      choice(
        $.never_type,
        $.result_type_constructor_pattern,
        $.optional_type_constructor_pattern,
        $.generic_type_variable,
        $.type_hole,
        $.array_type_constructor_pattern,
        $.layout_type_constructor_pattern,
        $.pointer_type_constructor_pattern,
        $.reference_type_constructor_pattern,
        $.borrowed_slice_type_constructor_pattern,
        $.lifetime,
        $.function_type_constructor_pattern,
        $.tuple_type_constructor_pattern,
        $.generic_type_constructor_pattern,
        $.string_literal,
        $._reference_element_name,
      ),

    optional_type_constructor_pattern: ($) =>
      prec.right(
        PREC.unary,
        seq(
          "?",
          field("type", $.type_constructor_pattern),
        ),
      ),

    result_type_constructor_pattern: ($) =>
      prec.right(
        PREC.resultType,
        seq(
          field("error", $.type_constructor_pattern),
          "!",
          field("type", $.type_constructor_pattern),
        ),
      ),

    type_hole: (_) => "_",

    array_type_constructor_pattern: ($) =>
      choice(
        seq(
          "[",
          "*",
          "]",
          repeat(choice("const", "volatile")),
          optional(field("element", $.type_constructor_pattern)),
        ),
        seq(
          "[",
          "]",
          repeat(choice("const", "volatile")),
          optional(field("element", $.type_constructor_pattern)),
        ),
        seq(
          "[",
          choice(
            "..",
            $.integer_literal,
            alias("_", $.type_hole),
            $.identifier,
          ),
          "]",
          optional(field("element", $.type_constructor_pattern)),
        ),
      ),

    pointer_type_constructor_pattern: ($) =>
      seq(
        "*",
        repeat(choice("const", "volatile")),
        field("pointee", $.type_constructor_pattern),
      ),

    reference_type_constructor_pattern: ($) =>
      prec(PREC.unary, seq(
        "&", optional($.lifetime), optional("mut"),
        choice(
          field("pointee", $.type_constructor_pattern),
          seq("[", field("element", alias($._reference_element_constructor_pattern, $.type_constructor_pattern)), "]"),
        ),
      )),

    borrowed_slice_type_constructor_pattern: ($) =>
      prec(PREC.unary, seq(
        "[", "&", optional($.lifetime), "]", optional("mut"),
        field("element", $.type_constructor_pattern),
      )),

    layout_type_constructor_pattern: ($) =>
      seq(
        field("layout", choice("#aos", "#soa")),
        field("type", $.type_constructor_pattern),
      ),

    function_type_constructor_pattern: ($) =>
      prec(
        2,
        seq(
          "(",
          commaSep($.type_constructor_pattern),
          ")",
          $.arrow,
          field("return_type", $.type_constructor_pattern),
        ),
      ),

    tuple_type_constructor_pattern: ($) =>
      seq(
        "(",
        commaSep1($.type_constructor_pattern),
        ")",
      ),

    generic_type_constructor_pattern: ($) =>
      prec(
        1,
        seq(
          field("name", $.type_identifier),
          "(",
          commaSep1($.type_constructor_pattern),
          ")",
        ),
      ),

    _expression: ($) =>
      choice(
        $.run_expression,
        $._non_run_expression,
      ),

    _non_run_expression: ($) =>
      choice($.range_expression, $._non_range_expression),

    _non_range_expression: ($) =>
      choice(
        $.binary_expression,
        $.unary_expression,
        $.cast_expression,
        $.insert_expression,
        $.try_expression,
        $.pattern_test_expression,
        $.pattern_quote_expression,
        $.pattern_binding_expression,
        $.return_expression,
        $.break_expression,
        $.continue_expression,
        $.ifx_expression,
        $.meaningful_expression,
        $.postfix_expression,
        $._primary_expression,
      ),

    ifx_expression: ($) =>
      prec.right(
        choice(
          prec.dynamic(1, seq(
            "ifx",
            "#pattern",
            optional(field("subject", $._expression)),
            field("operator", $._unqualified_operator),
            "{",
            repeat(choice($.pattern_case_clause, $.default_clause, $.inline_statement)),
            "}",
          )),
          seq(
            "ifx",
            field("subject", $._expression),
            field("operator", $._unqualified_operator),
            "{",
            repeat(choice($.pattern_case_clause, $.default_clause, $.inline_statement)),
            "}",
          ),
          seq(
            "ifx",
            field("condition", $._expression),
            field("consequence", $._expression),
            "else",
            field("alternative", $._expression),
          ),
        ),
      ),

    assignment_expression: ($) =>
      prec.right(
        PREC.assignment,
        seq(
          field("left", $._expression),
          field("operator", $.assignment_operator),
          field("right", choice($.assignment_expression, $._expression)),
        ),
      ),

    binary_expression: ($) =>
      prec.left(
        PREC.binary,
        seq(
          field("left", $._expression),
          field("operator", $._operator),
          field("right", $._expression),
        ),
      ),

    range_expression: ($) =>
      choice(
        prec.dynamic(
          1,
          prec.left(
            PREC.range,
            seq(
              field("start", $._expression),
              field("operator", $.range_operator),
              field("end", $._expression),
            ),
          ),
        ),
        prec.left(
          PREC.range - 1,
          seq(
            field("start", $._expression),
            field("operator", $.range_operator),
          ),
        ),
        prec.right(
          PREC.range,
          seq(
            field("operator", $.range_operator),
            optional(field("end", $._expression)),
          ),
        ),
      ),

    unary_expression: ($) =>
      prec(
        PREC.unary,
        choice(
          seq(field("operator", $._prefix_operator), field("argument", $._expression)),
          seq(
            field("operator", alias($._pointer_prefix, $.prefix_operator)),
            repeat1($._pointer_type_qualifier),
            field("argument", $._expression),
          ),
          prec.dynamic(1, seq(
            field("operator", alias($._reference_prefix, $.prefix_operator)),
            choice(
              seq($.lifetime, optional("mut")),
              $._address_qualifier,
            ),
            field("argument", $._expression),
          )),
        ),
      ),

    _address_qualifier: (_) =>
      choice("mut", "raw_mut", seq("raw", optional("mut"))),

    _pointer_type_qualifier: (_) => choice("const", "volatile"),

    qualified_operator: ($) =>
      seq(
        field("scope", $.identifier),
        ",,",
        field("operator", choice($._unqualified_operator, $.quoted_operator, $.range_operator)),
      ),

    cast_expression: ($) =>
      prec(
        PREC.unary,
        choice(
          seq("cast", "(", field("type", $._type), ")", field("value", $._expression)),
          seq("cast", field("value", $.autocast_value)),
          seq("acast", field("value", $._expression)),
        ),
      ),

    autocast_value: ($) =>
      choice(
        $.integer_literal,
        $.float_literal,
        $.char_literal,
        $.string_literal,
        $.c_string_literal,
        $.byte_string_literal,
        $.string_block,
        $.boolean_literal,
        $.null_literal,
        $.label_none_literal,
        $.label,
        $.context_expression,
        $.self_expression,
        $.self_type,
        $.never_type,
        $.source_location_expression,
        $.code_expression,
        $.lambda_expression,
        $.tuple_literal,
        $.shorthand_member_expression,
        $.array_literal,
        $.array_type,
        $.many_pointer_type,
        $.borrowed_slice_type,
        alias($._bracket_reference_type, $.reference_type),
        $.simd_literal,
        $.matrix_literal,
        $.struct_literal,
        $.non_hygienic_identifier,
        $._identifier,
      ),

    run_expression: ($) =>
      choice(
        $._block_run_expression,
        $._value_run_expression,
      ),

    _block_run_expression: ($) =>
      prec(
        PREC.unary,
        seq(
          "#comptime",
          choice(
            seq($.arrow, field("type", $._type), field("body", $.block)),
            field("body", $.block),
          ),
        ),
      ),

    _value_run_expression: ($) =>
      prec(
        PREC.unary,
        seq("#comptime", field("value", $._expression)),
      ),

    try_expression: ($) =>
      prec(
        PREC.unary,
        seq("#try", "{", field("value", $._expression), "}"),
      ),

    insert_expression: ($) =>
      prec(
        PREC.unary,
        seq("#insert", $._insert_operand),
      ),

    meaningful_expression: ($) =>
      prec(
        PREC.unary,
        seq("#meaningful", choice(field("body", $.block), field("value", $._expression))),
      ),

    return_expression: ($) =>
      prec.right(
        seq("return", field("value", $._expression)),
      ),

    break_expression: (_) => prec(PREC.controlFlow, "break"),

    continue_expression: (_) => prec(PREC.controlFlow, "continue"),

    pattern_test_expression: ($) =>
      prec(
        PREC.unary,
        seq(
          "#pattern",
          choice(
            field("arms", $.pattern_arm_block),
            field("arm", $.pattern_arm),
          ),
        ),
      ),

    pattern_quote_expression: ($) =>
      prec.right(seq("#pattern", field("pattern", $._pattern))),

    pattern_binding_expression: ($) =>
      prec.right(
        PREC.unary,
        seq(
          "#pattern",
          field("pattern", $._pattern),
          ":=",
          field("value", $._expression),
          "else",
          field("alternative", $.block),
        ),
      ),

    pattern_arm_block: ($) =>
      seq("{", repeat(seq($.pattern_arm, optional($._separator))), "}"),

    pattern_arm: ($) =>
      seq(field("pattern", $._pattern), "=", field("value", $._expression)),

    _pattern: ($) =>
      choice(
        $.or_pattern,
        $._pattern_range,
      ),

    or_pattern: ($) =>
      prec.dynamic(2, prec.left(
        1,
        seq(
          field("left", $._pattern),
          // In pattern context, stop a constant operand before an alternative.
          // Parenthesized values still lex | as an ordinary expression operator.
          $._pattern_alternative_operator,
          field("right", $._pattern_range),
        ),
      )),

    _pattern_range: ($) =>
      choice(
        // Prefer one quoted range over a quoted prefix and an outer range.
        prec.dynamic(3, alias($.range_expression, $.range_pattern)),
        $._pattern_unary,
      ),

    _pattern_unary: ($) =>
      choice(
        $.unary_expression,
        prec.dynamic(1, $.binary_expression),
        $.constant_pattern,
        $.pattern_postfix_expression,
        $._pattern_primary,
      ),

    constant_pattern: ($) =>
      prec(
        3,
        seq(
          field("operator", alias($._equality_operator, $.constant_pattern_operator)),
          field("value", $._expression),
        ),
      ),

    pattern_postfix_expression: ($) =>
      prec.left(
        PREC.call,
        choice(
          seq(
            field("function", choice($.pattern_postfix_expression, $._pattern_primary)),
            field("arguments", $.pattern_argument_list),
          ),
          // Match expression member scores so qualified alternatives stay patterns.
          prec.dynamic(2, seq(
            field("object", choice($.pattern_postfix_expression, $._pattern_primary)),
            ".",
            field("field", $.identifier),
          )),
          seq(
            field("type", choice($.pattern_postfix_expression, $._pattern_primary)),
            field("literal", $.struct_pattern),
          ),
        ),
      ),

    pattern_argument_list: ($) => seq("(", commaSep($._pattern), ")"),

    _pattern_primary: ($) =>
      choice(
        $.integer_literal,
        $.float_literal,
        $.char_literal,
        $.string_literal,
        $.c_string_literal,
        $.byte_string_literal,
        $.boolean_literal,
        $.null_literal,
        $.pattern_rest,
        $.pointer_pattern,
        $.pattern_binding,
        $.insert_expression,
        $.non_hygienic_identifier,
        $.code_splice_identifier,
        $.shorthand_member_pattern,
        $.struct_pattern,
        $.slice_pattern,
        alias($._empty_tuple_pattern, $.tuple_literal),
        $.parenthesized_pattern,
      ),

    _empty_tuple_pattern: (_) => seq(".(", ")"),

    pattern_rest: ($) => $._ellipsis,

    pointer_pattern: ($) =>
      prec.dynamic(2, prec(4, seq($._single_pointer_prefix, field("name", $._identifier)))),

    pattern_binding: ($) =>
      seq(
        field("name", $._identifier),
        optional(
          seq(
            field("operator", $.binding_operator),
            field("pattern", $._pattern_unary),
          ),
        ),
      ),

    binding_operator: (_) => token(prec(2, "@")),

    shorthand_member_pattern: ($) =>
      seq(".", field("field", choice($.identifier, $.code_splice_identifier))),

    struct_pattern: ($) => seq(".{", commaSep($.struct_pattern_field), "}"),

    slice_pattern: ($) => seq(".[", commaSep($._pattern), "]"),

    struct_pattern_field: ($) =>
      choice(
        $.pattern_rest,
        seq(
          ".",
          field("name", choice($.identifier, $.code_splice_identifier)),
          optional(seq("=", field("value", $._pattern))),
        ),
        field("value", $._pattern),
      ),

    parenthesized_pattern: ($) => seq("(", $._pattern, ")"),

    postfix_expression: ($) =>
      prec.left(
        PREC.call,
        choice(
          seq(field("function", $._postfix_expression_base), field("arguments", $.argument_list)),
          seq(field("object", $._postfix_expression_base), field("index", $.index_suffix)),
          seq(field("object", $._postfix_expression_base), field("index", $.qualified_index_suffix)),
          seq(
            field("procedure", $._postfix_expression_base),
            field("label", $.nonlocal_label_suffix),
          ),
          seq(field("object", $._postfix_expression_base), ".", "cast", "(", field("type", $._type), ")"),
          seq(field("object", $._postfix_expression_base), ".", "acast"),
          seq(field("object", $._postfix_expression_base), choice(".*", seq(".&", optional($._address_qualifier)))),
          prec.dynamic(2, seq(
            field("object", $._postfix_expression_base),
            ".",
            field("field", choice($.identifier, $.code_splice_identifier, alias($._tuple_index, $.integer_literal))),
          )),
          seq(field("type", $._postfix_expression_base), field("literal", $.struct_literal)),
          seq(field("argument", $._postfix_expression_base), $.memory_directive),
          seq(
            field("argument", $._postfix_expression_base),
            field("operator", $.quoted_operator),
          ),
          seq(
            field("argument", $._postfix_expression_base),
            field("operator", $.suffix_operator),
          ),
          // Fixity is declared in source. Treat an operator at a delimiter as a
          // suffix only when a binary expression or switch cannot consume it.
          prec.dynamic(-1, seq(
            field("argument", $._postfix_expression_base),
            field("operator", alias($._symbolic_suffix_operator, $.suffix_operator)),
          )),
          seq(
            field("argument", $._postfix_expression_base),
            field("operator", $.try_operator),
          ),
        ),
      ),

    _postfix_expression_base: ($) =>
      choice($.postfix_expression, $._primary_expression),

    argument_list: ($) =>
      seq(
        "(",
        commaSep(
          choice(
            $.named_argument,
            $.variadic_argument,
            alias($._single_code_expression, $.code_expression),
            $._expression,
          ),
        ),
        ")",
      ),

    variadic_argument: ($) =>
      seq(field("value", $._expression), $._ellipsis),

    named_argument: ($) =>
      seq(
        ".",
        field("name", choice($.identifier, $.code_splice_identifier)),
        "=",
        field("value", $._expression),
        optional($._ellipsis),
      ),

    index_suffix: ($) => seq("[", field("value", $._expression), "]"),

    qualified_index_suffix: ($) =>
      seq(
        field("scope", $.identifier),
        ",,",
        field("index", $.index_suffix),
      ),

    nonlocal_label_suffix: ($) =>
      seq(",,", field("name", $.label)),

    _primary_expression: ($) =>
      choice(
        $.integer_literal,
        $.float_literal,
        $.char_literal,
        $.string_literal,
        $.c_string_literal,
        $.byte_string_literal,
        $.string_block,
        $.boolean_literal,
        $.null_literal,
        $.label_none_literal,
        $.label,
        $.context_expression,
        $.self_expression,
        $.self_type,
        $.never_type,
        $.source_location_expression,
        $.code_expression,
        $.lambda_expression,
        $.tuple_literal,
        $.shorthand_member_expression,
        $.array_literal,
        $.array_type,
        $.many_pointer_type,
        $.borrowed_slice_type,
        alias($._bracket_reference_type, $.reference_type),
        $.simd_literal,
        $.matrix_literal,
        $.struct_literal,
        $.quoted_operator,
        $.non_hygienic_identifier,
        $.code_splice_identifier,
        $.generic_type_variable,
        $._identifier,
        $.parenthesized_expression,
      ),

    parenthesized_expression: ($) => seq(
      "(",
      choice($._expression, alias($._parenthesized_bitwise_expression, $.binary_expression)),
      ")",
    ),

    // Parentheses restore bitwise | inside a range bound in pattern context.
    _parenthesized_bitwise_expression: ($) =>
      prec.dynamic(3, prec.left(PREC.binary, seq(
        field("left", choice(
          $._expression,
          alias($._parenthesized_bitwise_expression, $.binary_expression),
        )),
        field("operator", alias($._pattern_alternative_operator, $.operator)),
        field("right", $._expression),
      ))),

    code_expression: ($) =>
      seq(
        "#code",
        field("body", $.code_block),
      ),

    _single_code_expression: ($) =>
      seq("#code", field("body", $._code_single_statement)),

    _code_single_statement: ($) =>
      prec.right(
        -1,
        choice(
          alias($._memory_overlay_body, $.memory_overlay),
          $.memory_trusted_statement,
          alias($._memory_nested_declaration, $.nested_declaration),
          $.on_drop_error_statement,
          alias($._code_final_variable_declaration, $.variable_declaration),
          alias(
            $._code_final_return_statement,
            $.return_statement,
          ),
          alias(
            $._code_final_assignment_statement,
            $.assignment_statement,
          ),
          alias(
            $._code_single_expression_statement,
            $.expression_statement,
          ),
        ),
      ),

    _code_single_expression_statement: ($) =>
      prec(
        PREC.call + 1,
        choice(
          alias($._code_single_call_expression, $.postfix_expression),
          $.parenthesized_expression,
        ),
      ),

    _code_single_call_expression: ($) =>
      prec(
        PREC.call + 1,
        seq(
          field(
            "function",
            choice(
              $.identifier,
              $.non_hygienic_identifier,
              $.code_splice_identifier,
              $.quoted_operator,
            ),
          ),
          field("arguments", $.argument_list),
        ),
      ),

    code_block: ($) =>
      seq(
        "{",
        repeat(
          choice(
            $.pattern_case_clause,
            $._statement,
            $.instance_declaration,
            $.inherent_declaration,
          ),
        ),
        optional($._code_final_statement),
        "}",
      ),

    _code_final_statement: ($) =>
      choice(
        alias(
          $._code_final_variable_declaration,
          $.variable_declaration,
        ),
        alias(
          $._code_final_return_statement,
          $.return_statement,
        ),
        alias(
          $._code_final_assignment_statement,
          $.assignment_statement,
        ),
        alias(
          $._code_final_expression_statement,
          $.expression_statement,
        ),
      ),

    _code_final_variable_declaration: ($) =>
      prec.right(seq($._variable_declaration_body, repeat($.memory_directive))),

    _code_final_return_statement: ($) =>
      prec.right(
        PREC.statement + 1,
        seq("return", commaSep1($._expression)),
      ),

    _code_final_assignment_statement: ($) =>
      prec.right(
        PREC.assignment + 1,
        seq(
          field("left", $._expression),
          field("operator", choice("=", $.assignment_operator)),
          field("right", choice($.assignment_expression, $._expression)),
        ),
      ),

    _code_final_expression_statement: ($) =>
      prec.right(PREC.statement, $._expression),

    lambda_expression: ($) =>
      prec.right(
        seq(
          field("parameters", $.lambda_parameter_list),
          optional(seq($.arrow, field("return_type", $._type))),
          field("body", choice($.block, $._expression)),
        ),
      ),

    lambda_parameter_list: ($) =>
      choice(
        "||",
        seq("|", commaSep($.lambda_parameter), "|"),
      ),

    lambda_parameter: ($) =>
      seq(
        optional("noalias"),
        optional("mut"),
        field("name", $._identifier),
        optional(seq(":", field("type", $._type))),
      ),

    string_block: ($) =>
      seq(
        "#string",
        repeat(seq(",", field("modifier", $.string_modifier))),
        repeat1($.multiline_string_line),
      ),

    string_modifier: (_) => choice("oneline", "escape"),

    multiline_string_literal: ($) => repeat1($.multiline_string_line),

    char_literal: (_) =>
      token(seq("#char", /[ \t]*/, '"', repeat(choice(/[^"\\\n]/, /\\./)), '"')),

    boolean_literal: (_) => choice("true", "false"),

    null_literal: (_) => "null",

    label_none_literal: (_) => token(prec(2, "#undefined")),

    context_expression: (_) => "context",

    source_location_expression: (_) => "#source_location",

    shorthand_member_expression: ($) =>
      seq(".", field("field", choice($.identifier, $.code_splice_identifier))),

    tuple_literal: ($) => seq(".(", commaSep($._expression), ")"),

    struct_literal: ($) => seq(".{", commaSep($.struct_literal_field), "}"),

    struct_literal_field: ($) =>
      choice(
        $.inline_statement,
        seq(
          ".",
          field("name", choice($.identifier, $.code_splice_identifier)),
          "=",
          field("value", $._expression),
        ),
        field("value", $._expression),
      ),

    array_literal: ($) => seq(".[", commaSep($._expression), "]"),

    simd_literal: ($) => seq("#simd", field("value", $.array_literal)),

    matrix_literal: ($) =>
      seq(
        "#matrix",
        ".[",
        optional(seq(sep1($.matrix_row, ";"), optional(";"))),
        "]",
      ),

    matrix_row: ($) => commaSep1($._expression),

    _operator: ($) =>
      choice($._unqualified_operator, $.quoted_operator, $.qualified_operator),

    _unqualified_operator: ($) =>
      choice(
        $.operator,
        alias($._equality_operator, $.operator),
        alias($._negative_operator, $.operator),
        alias($._single_pointer_prefix, $.operator),
      ),

    _prefix_operator: ($) =>
      choice(
        $.prefix_operator,
        alias($._negative_operator, $.prefix_operator),
        alias($._pointer_prefix, $.prefix_operator),
        prec(PREC.unary, alias($._reference_prefix, $.prefix_operator)),
        $.quoted_operator,
        $.qualified_operator,
      ),

    _separator: (_) => choice(";", ","),

    // These modifiers remain valid names when no qualifying operand follows.
    _identifier: ($) => choice(
      $.identifier,
      alias("mut", $.identifier),
      alias("const", $.identifier),
      alias("raw", $.identifier),
      alias("raw_mut", $.identifier),
    ),

    identifier: (_) => /[\p{L}_][\p{L}\p{N}_]*/,

    code_splice_identifier: (_) =>
      token(seq("``", /[\p{L}_][\p{L}\p{N}_]*/)),

    non_hygienic_identifier: (_) => token(seq("`", /[\p{L}_][\p{L}\p{N}_]*/)),

    label: (_) => token(seq("'", /[\p{L}_][\p{L}\p{N}_]*/)),

    quoted_operator: (_) =>
      token(
        choice(
          seq("'", /[\p{L}_][\p{L}\p{N}_]*/, "'"),
          seq(
            "'",
            choice(
              /[^:\p{L}_'\n\s;][^'\n\s;]*/,
              /:/,
              /::/,
              /:[^:'\n\s;][^'\n\s;]*/,
              /::[^:'\n\s;][^'\n\s;]*/,
              /:::[^'\n\s;][^'\n\s;]*/,
            ),
            "'",
          ),
        ),
      ),

    _negative_operator: (_) => token(prec(1, choice("-", "-%"))),

    operator: (_) =>
      token(
        prec(
          1,
          choice(
            "<=>",
            "-=",
            "-",
            /[+*\/<>!@%\^&|~][+\-*\/<>!@%\^&|~]*=?/,
            /-[+\-*\/<!@%\^&|~][+\-*\/<>!@%\^&|~]*=?/,
          ),
        ),
      ),

    _equality_operator: (_) => token(prec(1, "==")),

    prefix_operator: (_) =>
      token(prec(1, choice("!!", "!", "?", "+", "~"))),

    // Captures, dereferences, and multiplication must share the singleton token.
    _single_pointer_prefix: (_) => token(prec(1, "*")),

    _pointer_prefix: ($) =>
      choice($._single_pointer_prefix, token(prec(1, /\*\*+/))),

    _reference_prefix: (_) => token(prec(1, /&+/)),

    _pattern_alternative_operator: (_) => token(prec(1, "|")),

    suffix_operator: (_) => token(prec(2, "++")),

    range_operator: (_) => token(prec(2, choice("..=", ".."))),

    try_operator: (_) => token(prec(2, "?")),

    _ellipsis: (_) => token(prec(3, "...")),

    assignment_operator: (_) =>
      token(
        prec(
          2,
          choice(
            "+=",
            "-=",
            "*=",
            "/=",
            "%=",
            "<<=",
            "<<|=",
            ">>=",
            ">>|=",
            "&=",
            "|=",
            "^=",
            /[+*\/@%\^&|~][+\-*\/<>!@%\^&|~]*=/,
            /-[+\-*\/<!@%\^&|~][+\-*\/<>!@%\^&|~]*=/,
          ),
        ),
      ),

    arrow: (_) => token(prec(2, "->")),

    integer_literal: (_) =>
      token(choice(
        /[0-9][0-9_]*#[0-9A-Za-z][0-9A-Za-z_]*/,
        /[0-9][0-9_]*/,
      )),

    _tuple_index: (_) => token(/[0-9][0-9_]*/),

    float_literal: (_) =>
      token(choice(
        /[0-9][0-9_]*\.[0-9][0-9_]*(?:[eE][+-]?[0-9][0-9_]*)?/,
        /[0-9][0-9_]*[eE][+-]?[0-9][0-9_]*/,
      )),

    string_literal: (_) =>
      quotedString('"'),

    c_string_literal: (_) => quotedString('c"'),

    byte_string_literal: (_) => quotedString('b"'),

    multiline_string_line: (_) => token(seq("\\\\", /[^\n]*/)),
  },
});

function quotedString(start) {
  return token(seq(start, repeat(choice(/[^"\\]/, /\\[\s\S]/)), '"'));
}

function functionTail($, allowMemory, allowSignature = false) {
  const nonBodyless = allowMemory
    ? $._function_non_bodyless_modifier
    : $._function_plain_non_bodyless_modifier;
  const modifier = allowMemory
    ? $._function_modifier
    : choice(nonBodyless, $._function_bodyless_modifier);
  const bodyless = seq($._function_bodyless_modifier, repeat(modifier));
  return seq(
    optional(seq($.arrow, field("return_type", $._type))),
    choice(
      seq(repeat(nonBodyless), repeat($.where_clause), field("body", $.block)),
      seq(
        repeat(nonBodyless),
        allowSignature ? optional(bodyless) : bodyless,
        repeat($.where_clause),
        ";",
      ),
    ),
  );
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)), optional(","));
}

function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}
