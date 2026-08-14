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

  extras: ($) => [/\s/, $.comment],

  conflicts: ($) => [
    [$._expression, $._postfix_expression_base],
    [$.qualified_operator, $._postfix_expression_base],
    [$._expression, $.qualified_operator, $._postfix_expression_base],
    [$._expression, $._postfix_expression_base, $._prefix_operator],
    [$._postfix_expression_base, $._prefix_operator],
    [$.pattern_binding, $._postfix_expression_base],
    [$.generic_type_constructor_pattern, $._expression, $._postfix_expression_base],
    [$.generic_type_constructor_pattern, $._postfix_expression_base],
    [$.type_constructor_pattern, $.generic_type_constructor_pattern, $._expression, $._postfix_expression_base],
    [$.type_constructor_pattern, $.generic_type_constructor_pattern, $._postfix_expression_base],
    [$.return_statement, $.return_expression],
    [$._expression, $._prefix_operator],
    [$.declaration_name, $.type_constructor_pattern],
    [$.declaration_name, $.binding_list],
    [$.declaration_name, $.binding_list, $.type_constructor_pattern],
    [$.parenthesized_type, $.type_element],
    [$.tuple_type, $.type_element],
    [$.binding_list, $.tuple_type, $.type_element],
    [$.tuple_type, $.function_type],
    [$.parameter_list, $.function_type],
    [$.parameter, $.function_type],
    [$.empty_field],
    [$.empty_parameter],
    [$.memory_borrow_place_effect, $.memory_parameter_effect_kind],
    [$.range_expression],
    [$.switch_statement, $.pattern_arm_block],
    [$.struct_literal, $.struct_pattern],
    [$.array_literal, $.slice_pattern],
    [$._pattern_unary, $.struct_pattern_field],
    [$._expression, $._pattern_unary],
    [$._expression, $.pattern_binding],
    [$.binding_list, $._expression],
    [$.shorthand_member_pattern, $.struct_pattern_field],
    [$.shorthand_member_pattern, $.shorthand_member_expression],
    [$.shorthand_member_pattern, $.struct_pattern_field, $.shorthand_member_expression],
    [$.type_constructor_pattern],
    [$.type_constructor_pattern, $._expression],
    [$._single_statement, $.static_if_statement],
  ],

  supertypes: ($) => [
    $._declaration,
    $._statement,
    $._expression,
    $._type,
    $._pattern,
  ],

  inline: ($) => [
    $._declaration_body,
    $._function_modifier,
    $._primary_expression,
    $._pattern_primary,
    $.type_identifier,
    $.autocast_value,
    $.memory_parameter,
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
        $.memory_overlay,
        $.insert_declaration,
        $.import_declaration,
        $.load_declaration,
        $.private_section_declaration,
        $.thread_local_declaration,
        $.static_if_declaration,
        $.instance_declaration,
        $.named_declaration,
      ),

    feature_directive: ($) =>
      seq(
        choice("#enable", "#disable"),
        "(",
        field("feature", $.identifier),
        optional(seq(",", field("mode", $.identifier))),
        ")",
        optional(";"),
      ),

    top_run_declaration: ($) =>
      seq(
        "#comptime",
        choice(
          seq($.arrow, field("type", $._type), field("body", $.block)),
          field("body", $.block),
          field("value", $._expression),
        ),
        optional(";"),
      ),

    insert_declaration: ($) =>
      seq("#insert", field("value", $._expression), optional(";")),

    import_declaration: ($) =>
      seq(
        "#import",
        optional($.import_selector),
        field("module", $.string_literal),
        optional(";"),
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
      seq("#load", field("path", $.string_literal), optional(";")),

    private_section_declaration: (_) =>
      seq("#private_section", optional(seq(",", "siblings")), optional(";")),

    thread_local_declaration: ($) =>
      seq("#thread_local", field("declaration", $.named_declaration)),

    static_if_declaration: ($) =>
      prec.right(
        seq(
          "#if",
          field("condition", $._expression),
          choice(
            seq(
              field("operator", $._unqualified_operator),
              "{",
              repeat(choice($.static_declaration_case_clause, $.static_declaration_default_clause)),
              "}",
            ),
            seq(
              field("consequence", $.declaration_block),
              optional(seq("else", field("alternative", choice($.declaration_block, $.static_if_declaration)))),
            ),
          ),
        ),
      ),

    declaration_block: ($) =>
      seq("{", repeat(choice($._declaration, $.compile_error_statement)), "}"),

    static_declaration_case_clause: ($) =>
      seq(
        "case",
        commaSep1(field("value", $._expression)),
        ";",
        repeat(choice($._declaration, $.compile_error_statement)),
      ),

    static_declaration_default_clause: ($) =>
      seq("else", ";", repeat(choice($._declaration, $.compile_error_statement))),

    named_declaration: ($) =>
      seq(
        field("name", $.declaration_name),
        choice(
          seq("::", $._declaration_body),
          $.global_variable_declaration_tail,
          $.typed_constant_declaration_tail,
        ),
      ),

    declaration_name: ($) =>
      choice($.identifier, $.quoted_operator, $.code_splice_identifier),

    _declaration_body: ($) =>
      choice(
        $.qualified_import_declaration,
        $.qualified_load_declaration,
        $.library_declaration,
        $.function_pointer_type_declaration,
        $.typeclass_declaration,
        $.distinct_type_declaration,
        $.struct_declaration,
        $.enum_flags_declaration,
        $.enum_declaration,
        $.union_declaration,
        $.function_declaration,
        $.constant_declaration_body,
      ),

    typeclass_declaration: ($) =>
      seq(
        "typeclass",
        "(",
        commaSep($.typeclass_parameter),
        ")",
        repeat($.where_clause),
        repeat(choice($.derive_directive, "#fallback", $.minimal_directive)),
        "{",
        repeat(choice($.typeclass_method_signature, $.typeclass_associated_type)),
        "}",
      ),

    typeclass_parameter: ($) =>
      seq(field("name", $.identifier), ":", field("kind", $._type)),

    typeclass_method_signature: ($) =>
      seq(field("name", $.declaration_name), "::", $.function_declaration),

    typeclass_associated_type: ($) =>
      seq(
        field("name", $.declaration_name),
        "::",
        field("type", $._type),
        optional($._separator),
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
        "distinct",
        field("underlying_type", $._type),
        optional(";"),
      ),

    instance_declaration: ($) =>
      seq(
        field("target", $.type_constructor_pattern),
        "::",
        "instance",
        optional("!"),
        field("class", $.identifier),
        repeat($.where_clause),
        "{",
        repeat(choice($.instance_method, $.instance_associated_type)),
        "}",
      ),

    instance_method: ($) =>
      seq(field("name", $.declaration_name), "::", $.function_declaration),

    instance_associated_type: ($) =>
      seq(
        field("name", $.declaration_name),
        "::",
        field("type", $._type),
        optional($._separator),
      ),

    qualified_import_declaration: ($) =>
      seq(
        "#import",
        optional($.import_selector),
        field("module", $.string_literal),
        optional(";"),
      ),

    qualified_load_declaration: ($) =>
      seq("#load", field("path", $.string_literal), optional(";")),

    library_declaration: ($) =>
      seq(
        "#library",
        repeat(seq(",", field("modifier", $.library_modifier))),
        field("path", $.string_literal),
        optional(";"),
      ),

    library_modifier: (_) => choice("system", "dyn", "static"),

    function_pointer_type_declaration: ($) =>
      seq(
        "#fn_ptr",
        field("parameters", $.fn_ptr_parameter_list),
        choice(
          seq(
            $.arrow,
            field("return_type", $._fn_ptr_return_type),
            repeat(choice("#c_call", "#no_context")),
            ";",
          ),
          seq(
            repeat(choice("#c_call", "#no_context")),
            optional(";"),
          ),
        ),
      ),

    constant_declaration_body: ($) =>
      choice(
        prec(10, seq(field("value", $.run_expression), optional(";"))),
        prec(10, seq(field("value", $.string_block), optional(";"))),
        seq(field("value", $._expression), optional(";")),
      ),

    global_variable_declaration_tail: ($) =>
      prec.right(
        seq(
          choice(
            seq(":=", field("value", $._expression)),
            seq(
              ":",
              optional(field("type", $._type)),
              optional(seq("=", field("value", $._expression))),
            ),
          ),
          repeat(field("directive", $.memory_directive)),
          optional(";"),
        ),
      ),

    typed_constant_declaration_tail: ($) =>
      seq(
        ":",
        optional(field("type", $._type)),
        choice(":", "::"),
        field("value", $._expression),
        optional(";"),
      ),

    struct_declaration: ($) =>
      seq(
        "struct",
        repeat($.struct_modifier),
        "{",
        repeat(choice($.struct_field, $.empty_field)),
        "}",
      ),

    struct_modifier: ($) =>
      choice(
        "#c_call",
        "#packed",
        $.modify_directive,
        $.derive_directive,
        $.magic_directive,
      ),

    empty_field: ($) =>
      seq(
        "#empty",
        ":",
        commaSep1(field("type", $._type)),
        optional($._separator),
      ),

    struct_field: ($) =>
      seq(
        optional("using"),
        optional(seq("#as", optional("using"))),
        field("name", $.identifier),
        ":",
        field("type", $._type),
        optional(seq("=", field("default", $._expression))),
        optional($._separator),
      ),

    enum_declaration: ($) =>
      seq("enum", "{", repeat($.enum_variant), "}"),

    enum_flags_declaration: ($) =>
      seq("enum_flags", field("backing_type", $._type), "{", repeat($.enum_variant), "}"),

    enum_variant: ($) =>
      seq(
        field("name", $.identifier),
        optional(seq("::", field("value", $.integer_literal))),
        optional($._separator),
      ),

    union_declaration: ($) =>
      seq(
        "union",
        repeat(choice("#raw", $.derive_directive, $.magic_directive)),
        "{",
        repeat($.union_field),
        "}",
      ),

    union_field: ($) =>
      seq(
        optional(field("conversion", $.from_directive)),
        field("name", $.identifier),
        ":",
        field("type", $._type),
        optional($._separator),
      ),

    from_directive: (_) => "#from",

    function_declaration: ($) =>
      seq(
        field("parameters", $.parameter_list),
        optional(seq($.arrow, field("return_type", $._type))),
        repeat($._function_modifier),
        repeat($.where_clause),
        choice(field("body", $.block), ";"),
      ),

    parameter_list: ($) =>
      seq(
        "(",
        commaSep(
          choice(
            $.parameter,
            $.comptime_parameter,
            $.empty_parameter,
            $.c_varargs_parameter,
          ),
        ),
        ")",
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
      choice($.identifier, $.non_hygienic_identifier, $.code_splice_identifier),

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
      choice(
        $.operator_directive,
        $.precedence_directive,
        $.modify_directive,
        $.expand_directive,
        "#magic",
        $.magic_directive,
        $.foreign_directive,
        $.memory_directive,
        "#c_call",
        "#no_context",
        "#dump",
        "#fallback",
        "#must",
        "#noreturn",
        "#returns_twice",
        $.inline_directive,
      ),

    expand_directive: ($) =>
      seq("#expand", optional(seq(",", field("mode", alias("expression", $.identifier))))),

    inline_directive: ($) =>
      seq("#inline", optional(seq(",", field("mode", $.inline_modifier)))),

    inline_modifier: (_) => choice("always", "never"),

    where_clause: ($) => seq("where", field("condition", $._expression)),

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
        optional(seq(",", choice(field("level", $.integer_literal), field("modifier", $.identifier)))),
        ")",
      ),

    precedence_directive: ($) =>
      seq(
        "#precedence",
        "(",
        field("associativity", $.identifier),
        ",",
        field("level", $.integer_literal),
        ")",
      ),

    magic_directive: ($) =>
      seq("#magic", field("name", $.string_literal)),

    foreign_directive: ($) =>
      seq(
        "#foreign",
        field("library", choice($.identifier, $.string_literal)),
        optional(field("symbol", $.string_literal)),
      ),

    memory_directive: ($) =>
      seq(
        "#memory",
        choice(
          field("effect", $.memory_effect),
          seq("(", commaSep1(field("effect", $.memory_effect)), ")"),
        ),
      ),

    memory_effect: ($) =>
      choice(
        $.memory_simple_effect,
        $.memory_borrow_place_effect,
        $.memory_parameter_effect,
        $.memory_release_effect,
        $.memory_resource_effect,
      ),

    memory_simple_effect: ($) =>
      choice(
        "leak",
        prec.right(seq(
          choice("returns_fresh", "returns_static", "unknown"),
          optional(seq("(", field("place", $.memory_qualified_name), ")")),
        )),
      ),

    memory_borrow_place_effect: ($) =>
      seq(
        "returns_borrow",
        "(",
        field("place", $.memory_qualified_name),
        ",",
        field("parameter", $.memory_parameter),
        ")",
      ),

    memory_parameter_effect: ($) =>
      seq(
        field("kind", $.memory_parameter_effect_kind),
        "(",
        field("parameter", $.memory_parameter),
        ")",
      ),

    memory_parameter_effect_kind: (_) =>
      choice(
        "returns_borrow",
        "kills",
        "invalidates",
        "noescape",
        "escapes",
        "reads",
        "writes",
      ),

    memory_parameter: ($) =>
      choice(
        $.identifier,
        $.memory_argument_reference,
      ),

    memory_argument_reference: ($) =>
      seq(
        field("function", $.identifier),
        "(",
        field("index", $.integer_literal),
        ")",
      ),

    memory_release_effect: ($) =>
      seq(
        "released_by",
        "(",
        optional(seq(field("place", $.memory_qualified_name), ",")),
        field("releaser", $.memory_qualified_name),
        ")",
      ),

    memory_resource_effect: ($) =>
      seq(
        "resource",
        "(",
        optional(seq(field("place", $.memory_qualified_name), ",")),
        "released_by",
        ":",
        field("releaser", $.memory_qualified_name),
        ")",
      ),

    memory_qualified_name: ($) =>
      seq($.identifier, repeat(seq(".", $.identifier))),

    memory_overlay: ($) =>
      seq(
        "#memory",
        field("target", $.memory_qualified_name),
        "{",
        commaSep1(field("effect", $.memory_effect)),
        "}",
        optional(";"),
      ),

    block: ($) => seq("{", repeat($._statement), "}"),

    _statement: ($) =>
      choice(
        $.nested_declaration,
        $.block,
        $.inline_bytes_statement,
        $.inline_asm_statement,
        $.label_statement,
        $.return_statement,
        $.break_statement,
        $.continue_statement,
        $.while_statement,
        $.for_statement,
        $.inline_statement,
        $.try_defer_statement,
        $.defer_statement,
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
        $.memory_overlay,
        $.variable_declaration,
        $.assignment_statement,
        $.expression_statement,
      ),

    nested_declaration: ($) =>
      seq(
        field("name", $.declaration_name),
        "::",
        choice(
          $.qualified_import_declaration,
          $.qualified_load_declaration,
          $.library_declaration,
          $.struct_declaration,
          $.enum_declaration,
          $.union_declaration,
          $.function_declaration,
        ),
      ),

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

    label_statement: ($) => prec(1, seq($.label, ";")),

    return_statement: ($) =>
      choice(
        prec.dynamic(
          2,
          prec.right(seq("return", commaSep1($._expression), ";")),
        ),
        prec.dynamic(1, prec.right(seq("return", commaSep1($._expression)))),
        seq("return", optional(";")),
      ),

    break_statement: (_) => prec(PREC.statement, seq("break", optional(";"))),

    continue_statement: (_) => prec(PREC.statement, seq("continue", optional(";"))),

    while_statement: ($) =>
      seq("while", field("condition", $._expression), field("body", $._if_body)),

    for_statement: ($) =>
      seq(
        "for",
        optional(field("direction", $._unqualified_operator)),
        optional(seq(":", field("expansion", $.identifier))),
        optional(
          choice(
            seq(field("name", $.identifier), ",", field("index", $.identifier), ":"),
            seq(field("name", $.identifier), ":"),
          ),
        ),
        field("value", prec.dynamic(2, $._expression)),
        field("body", $._if_body),
      ),

    inline_statement: ($) =>
      seq("#inline", field("statement", choice($.while_statement, $.for_statement))),

    try_defer_statement: ($) =>
      seq("#try", "defer", field("statement", $._statement)),

    defer_statement: ($) => seq("defer", field("statement", $._statement)),

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
          repeat(choice($.case_clause, $.default_clause, $.inline_statement)),
          "}",
        ),
        seq(
          "if",
          optional(field("modifier", $.partial_directive)),
          "#pattern",
          choice(
            seq(
              "{",
              repeat(choice($.pattern_case_clause, $.default_clause)),
              "}",
            ),
            seq(
              optional(field("subject", $._expression)),
              field("operator", $._unqualified_operator),
              "{",
              repeat(choice($.pattern_case_clause, $.default_clause)),
              "}",
            ),
          ),
        ),
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
      seq(
        "case",
        field("value", choice($.pattern_arm_block, $._pattern, $._expression)),
        optional(seq("if", field("guard", $._expression))),
        ";",
        repeat($._statement),
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
          /[\p{L}_][\p{L}\p{N}_]*(?:(?:\.[\p{L}_][\p{L}\p{N}_]*|\.\*)|\[[^\]\n]*\])*/,
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
      seq(
        field("function", $.if_call_start),
        field("arguments", $.if_call_arguments),
        optional(field("operator", $.try_operator)),
        optional(";"),
      ),

    if_call_start: (_) =>
      token(
        seq(
          choice(
            "i",
            /[\p{L}_&&[^i]][\p{L}\p{N}_]*/,
            /i(?:[\p{L}\p{N}_&&[^f]][\p{L}\p{N}_]*|f[\p{L}\p{N}_]+)/,
          ),
          /\s*\(/,
        ),
      ),

    if_call_arguments: ($) =>
      seq(commaSep(choice($.named_argument, $._expression)), ")"),

    _single_statement: ($) =>
      choice(
        $.inline_bytes_statement,
        $.inline_asm_statement,
        $.label_statement,
        $.return_statement,
        $.break_statement,
        $.continue_statement,
        $.while_statement,
        $.for_statement,
        $.inline_statement,
        $.try_defer_statement,
        $.defer_statement,
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
        $.memory_overlay,
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
      seq("#insert", field("value", $._expression), optional(";")),

    compile_error_statement: ($) =>
      seq("#compile_error", field("message", $._expression), optional(";")),

    falling_statement: (_) => seq("#falling", optional(";")),

    variable_declaration: ($) =>
      prec.right(
        choice(
          seq(field("name", $.binding_list), ":=", field("value", $._expression), optional(";")),
          seq(field("name", $.binding_list), "::", field("value", $._expression), optional(";")),
          seq(
            field("name", $.binding_list),
            ":",
            optional(field("type", $._type)),
            choice(
              seq("=", field("value", $._expression), optional(";")),
              seq("::", field("value", $._expression), optional(";")),
              seq(":", field("value", $._expression), optional(";")),
              seq(
                repeat1(field("directive", $.memory_directive)),
                optional(";"),
              ),
              ";",
            ),
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
          optional(";"),
        ),
      ),

    expression_statement: ($) => prec.right(seq($._expression, optional(choice(";", ",")))),

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
        $.c_pointer_type,
        $.pointer_type,
        $.function_type,
        $.tuple_type,
        $.parenthesized_type,
        $.generic_type_variable,
        $.context_type,
        $.named_type,
      ),

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
          "!",
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
        $.c_pointer_type,
        $.pointer_type,
        $.function_type,
        $.tuple_type,
        $.parenthesized_type,
        $.generic_type_variable,
        $.context_type,
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
          field("length", choice("..", $.integer_literal, $.identifier)),
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

    c_pointer_type: ($) =>
      seq("#c_ptr", field("pointer", $.pointer_type)),

    pointer_type: ($) =>
      seq(
        "*",
        repeat(choice("const", "volatile")),
        field("pointee", $._modified_type),
      ),

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
        $.result_type_constructor_pattern,
        $.optional_type_constructor_pattern,
        $.generic_type_variable,
        $.code_splice_identifier,
        $.type_hole,
        $.array_type_constructor_pattern,
        $.pointer_type_constructor_pattern,
        $.function_type_constructor_pattern,
        $.tuple_type_constructor_pattern,
        $.generic_type_constructor_pattern,
        $.type_identifier,
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
          choice("..", $.integer_literal, $.identifier),
          "]",
          optional(field("element", $.type_constructor_pattern)),
        ),
      ),

    pointer_type_constructor_pattern: ($) =>
      seq(
        optional("#c_ptr"),
        "*",
        repeat(choice("const", "volatile")),
        field("pointee", $.type_constructor_pattern),
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
        $.binary_expression,
        $.range_expression,
        $.unary_expression,
        $.cast_expression,
        $.run_expression,
        $.try_expression,
        $.pattern_test_expression,
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
          seq(
            "ifx",
            "#pattern",
            optional(field("subject", $._expression)),
            field("operator", $._unqualified_operator),
            "{",
            repeat(choice($.pattern_case_clause, $.default_clause)),
            "}",
          ),
          seq(
            "ifx",
            field("subject", $._expression),
            field("operator", $._unqualified_operator),
            "{",
            repeat(choice($.case_clause, $.default_clause)),
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
        seq(field("operator", $._prefix_operator), field("argument", $._expression)),
      ),

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
        $.string_block,
        $.boolean_literal,
        $.null_literal,
        $.label_none_literal,
        $.label,
        $.context_expression,
        $.code_expression,
        $.lambda_expression,
        $.tuple_literal,
        $.shorthand_member_expression,
        $.array_literal,
        $.simd_literal,
        $.struct_literal,
        $.non_hygienic_identifier,
        $.identifier,
      ),

    run_expression: ($) =>
      prec(
        PREC.unary,
        seq(
          "#comptime",
          choice(
            seq($.arrow, field("type", $._type), field("body", $.block)),
            field("body", $.block),
            field("value", $._expression),
          ),
        ),
      ),

    try_expression: ($) =>
      prec(
        PREC.unary,
        seq("#try", "{", field("value", $._expression), "}"),
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
      prec.left(
        1,
        seq(
          field("left", $._pattern),
          "|",
          field("right", $._pattern_range),
        ),
      ),

    _pattern_range: ($) =>
      choice(
        $.range_pattern,
        $._pattern_unary,
      ),

    range_pattern: ($) =>
      prec.left(
        2,
        seq(
          field("start", $._pattern_unary),
          field("operator", $.range_operator),
          field("end", $._pattern_unary),
        ),
      ),

    _pattern_unary: ($) =>
      choice(
        $.constant_pattern,
        $.pattern_postfix_expression,
        $._pattern_primary,
      ),

    constant_pattern: ($) =>
      prec(
        3,
        seq(
          field("operator", alias($._equality_operator, $.constant_pattern_operator)),
          field("value", choice($.pattern_postfix_expression, $._pattern_primary)),
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
          seq(
            field("object", choice($.pattern_postfix_expression, $._pattern_primary)),
            ".",
            field("field", $.identifier),
          ),
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
        $.boolean_literal,
        $.null_literal,
        $.pattern_rest,
        $.pointer_pattern,
        $.pattern_binding,
        $.non_hygienic_identifier,
        $.code_splice_identifier,
        $.shorthand_member_pattern,
        $.struct_pattern,
        $.slice_pattern,
        $.parenthesized_pattern,
      ),

    pattern_rest: ($) => $._ellipsis,

    pointer_pattern: ($) =>
      prec(4, seq("*", field("name", $.identifier))),

    pattern_binding: ($) =>
      seq(
        field("name", $.identifier),
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
          seq(field("object", $._postfix_expression_base), ".*"),
          seq(
            field("value", $._postfix_expression_base),
            field("directive", $.memory_directive),
          ),
          seq(
            field("object", $._postfix_expression_base),
            ".",
            field("field", choice($.identifier, $.code_splice_identifier, $.integer_literal)),
          ),
          seq(field("type", $._postfix_expression_base), field("literal", $.struct_literal)),
          seq(
            field("argument", $._postfix_expression_base),
            field("operator", $.quoted_operator),
          ),
          seq(
            field("argument", $._postfix_expression_base),
            field("operator", $.suffix_operator),
          ),
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
        commaSep(choice($.named_argument, $.variadic_argument, $._expression)),
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
        $.string_block,
        $.boolean_literal,
        $.null_literal,
        $.label_none_literal,
        $.label,
        $.context_expression,
        $.code_expression,
        $.lambda_expression,
        $.tuple_literal,
        $.shorthand_member_expression,
        $.array_literal,
        $.simd_literal,
        $.struct_literal,
        $.quoted_operator,
        $.non_hygienic_identifier,
        $.code_splice_identifier,
        $.generic_type_variable,
        $.identifier,
        $.parenthesized_expression,
      ),

    parenthesized_expression: ($) => seq("(", $._expression, ")"),

    code_expression: ($) => seq("#code", field("body", $.code_block)),

    code_block: ($) => seq("{", repeat(choice($._statement, $.instance_declaration)), "}"),

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
        field("name", $.identifier),
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

    label_none_literal: (_) => token(prec(2, choice("---", "#undefined"))),

    context_expression: (_) => "context",

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

    _operator: ($) =>
      choice($._unqualified_operator, $.quoted_operator, $.qualified_operator),

    _unqualified_operator: ($) =>
      choice($.operator, alias($._equality_operator, $.operator)),

    _prefix_operator: ($) =>
      choice($.prefix_operator, $.quoted_operator, $.qualified_operator),

    _separator: (_) => choice(";", ","),

    identifier: (_) => /[\p{L}_][\p{L}\p{N}_]*/,

    code_splice_identifier: (_) =>
      token(seq("``", /[\p{L}_][\p{L}\p{N}_]*/)),

    non_hygienic_identifier: (_) => token(seq("`", /[\p{L}_][\p{L}\p{N}_]*/)),

    label: (_) => token(seq("'", /[\p{L}_][\p{L}\p{N}_]*/)),

    quoted_operator: (_) =>
      token(
        choice(
          seq("'", /[\p{L}_][\p{L}\p{N}_]*/, "'"),
          seq("'", /[^\p{L}_'\n\s;][^'\n\s;]*/, "'"),
        ),
      ),

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
      token(prec(1, choice("!!", "!", "?", "-", "+", "~", /\*+/, "&"))),

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

    float_literal: (_) =>
      token(choice(
        /[0-9][0-9_]*\.[0-9][0-9_]*(?:[eE][+-]?[0-9][0-9_]*)?/,
        /[0-9][0-9_]*[eE][+-]?[0-9][0-9_]*/,
      )),

    string_literal: (_) =>
      token(seq('"', repeat(choice(/[^"\\\n]/, /\\./)), '"')),

    multiline_string_line: (_) => token(seq("\\\\", /[^\n]*/)),
  },
});

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)), optional(","));
}

function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}
