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
};

module.exports = grammar({
  name: "glosso",

  word: ($) => $.identifier,

  extras: ($) => [/\s/, $.comment],

  conflicts: ($) => [
    [$.binary_expression, $.run_expression, $.postfix_expression],
    [$.binary_expression, $.meaningful_expression, $.postfix_expression],
    [$.binary_expression, $.cast_expression, $.postfix_expression],
    [$.binary_expression, $.unary_expression, $.postfix_expression],
    [$.named_type, $._expression],
    [$.declaration_name, $.binding_list],
    [$.global_variable_declaration_tail, $.typed_constant_declaration_tail],
    [$.parenthesized_type, $.type_element],
    [$.tuple_type, $.type_element],
    [$.tuple_type, $.function_type],
    [$.empty_field],
    [$.empty_parameter],
    [$.range_expression],
    [$.argument_list, $.parenthesized_expression],
    [$.struct_literal, $.struct_pattern],
    [$._pattern, $.struct_pattern_field],
    [$._expression, $._pattern],
    [$._expression, $.pattern_binding],
    [$.shorthand_member_pattern, $.struct_pattern_field],
    [$.shorthand_member_pattern, $.shorthand_member_expression],
    [$.shorthand_member_pattern, $.struct_pattern_field, $.shorthand_member_expression],
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
    $._operator,
    $._binding_name,
    $._separator,
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
        $.top_run_declaration,
        $.import_declaration,
        $.load_declaration,
        $.private_section_declaration,
        $.thread_local_declaration,
        $.static_if_declaration,
        $.named_declaration,
      ),

    top_run_declaration: ($) =>
      seq(
        "#run",
        choice(
          seq($.arrow, field("type", $._type), field("body", $.block)),
          field("body", $.block),
          field("value", $._expression),
        ),
        optional(";"),
      ),

    import_declaration: ($) =>
      seq("#import", field("module", $.string_literal), optional(";")),

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
              field("operator", $.operator),
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
        field("value", $._expression),
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

    declaration_name: ($) => choice($.identifier, $.quoted_operator),

    _declaration_body: ($) =>
      choice(
        $.qualified_import_declaration,
        $.library_declaration,
        $.function_pointer_type_declaration,
        $.struct_declaration,
        $.enum_declaration,
        $.union_declaration,
        $.function_declaration,
        $.constant_declaration_body,
      ),

    qualified_import_declaration: ($) =>
      seq("#import", field("module", $.string_literal), optional(";")),

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
        optional(seq($.arrow, field("return_type", $._type))),
        repeat(choice("#c_call", "#no_context")),
        optional(";"),
      ),

    constant_declaration_body: ($) =>
      seq(field("value", $._expression), optional(";")),

    global_variable_declaration_tail: ($) =>
      seq(
        choice(
          seq(":=", field("value", $._expression)),
          seq(
            ":",
            optional(field("type", $._type)),
            optional(seq("=", field("value", $._expression))),
          ),
        ),
        optional(";"),
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
      seq("struct", "{", repeat(choice($.struct_field, $.empty_field)), "}"),

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

    enum_variant: ($) =>
      seq(
        field("name", $.identifier),
        optional(seq("::", field("value", $.integer_literal))),
        optional($._separator),
      ),

    union_declaration: ($) =>
      seq("union", optional("#raw"), "{", repeat($.union_field), "}"),

    union_field: ($) =>
      seq(
        field("name", $.identifier),
        ":",
        field("type", $._type),
        optional($._separator),
      ),

    function_declaration: ($) =>
      seq(
        field("parameters", $.parameter_list),
        optional(seq($.arrow, field("return_type", $._type))),
        repeat($._function_modifier),
        repeat($.where_clause),
        choice(field("body", $.block), ";"),
      ),

    parameter_list: ($) => seq("(", commaSep(choice($.parameter, $.empty_parameter, $.c_varargs_parameter)), ")"),

    fn_ptr_parameter_list: ($) =>
      seq("(", commaSep(choice($.fn_ptr_parameter, $.c_varargs_parameter)), ")"),

    fn_ptr_parameter: ($) =>
      seq(
        field("name", $.identifier),
        ":",
        field("type", $._type),
      ),

    c_varargs_parameter: (_) => "...",

    empty_parameter: ($) =>
      seq(
        "#empty",
        ":",
        commaSep1(field("type", $._type)),
      ),

    parameter: ($) =>
      seq(
        optional("using"),
        field("name", $.binding_list),
        ":",
        field("type", choice($.variadic_type, $._type)),
        optional(seq("=", field("default", $._expression))),
      ),

    binding_list: ($) => seq($._binding_name, repeat(seq(",", $._binding_name))),

    _binding_name: ($) => choice($.identifier, $.non_hygienic_identifier),

    variadic_type: ($) => seq("..", optional($.identifier)),

    _function_modifier: ($) =>
      choice(
        $.operator_directive,
        $.precedence_directive,
        "#expand",
        "#magic",
        $.magic_directive,
        $.foreign_directive,
        "#c_call",
        "#no_context",
        "#dump",
        "#fallback",
        "#must",
        "#noreturn",
        $.inline_directive,
      ),

    inline_directive: ($) =>
      seq("#inline", optional(seq(",", field("mode", $.inline_modifier)))),

    inline_modifier: (_) => choice("always", "never"),

    where_clause: ($) => seq("where", field("condition", $._expression)),

    operator_directive: ($) =>
      seq(
        "#operator",
        "(",
        field("mode", $.identifier),
        optional(seq(",", field("level", $.integer_literal))),
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

    block: ($) => seq("{", repeat($._statement), "}"),

    _statement: ($) =>
      choice(
        $.nested_declaration,
        $.inline_bytes_statement,
        $.inline_asm_statement,
        $.label_statement,
        $.return_statement,
        $.while_statement,
        $.for_statement,
        $.defer_statement,
        $.using_statement,
        $.switch_statement,
        $.if_statement,
        $.push_context_statement,
        $.push_allocator_statement,
        $.static_if_statement,
        $.insert_statement,
        $.compile_error_statement,
        $.falling_statement,
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
      seq(
        "#asm",
        field("template", $._expression),
        optional($.asm_operands),
        optional(";"),
      ),

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
      prec.right(seq("return", optional(commaSep1($._expression)), optional(";"))),

    while_statement: ($) =>
      seq("while", field("condition", $._expression), field("body", $.block)),

    for_statement: ($) =>
      seq(
        "for",
        optional(field("direction", $.operator)),
        optional(seq(field("name", $.identifier), ":")),
        field("value", $._expression),
        field("body", $.block),
      ),

    defer_statement: ($) => seq("defer", field("statement", $._statement)),

    using_statement: ($) =>
      seq("using", field("name", $.identifier), optional(";")),

    switch_statement: ($) =>
      choice(
        seq(
          "if",
          optional(field("modifier", $.partial_directive)),
          field("subject", $._expression),
          field("operator", $.operator),
          "{",
          repeat(choice($.case_clause, $.default_clause)),
          "}",
        ),
        seq(
          "if",
          optional(field("modifier", $.partial_directive)),
          "#pattern",
          optional(field("subject", $._expression)),
          field("operator", $.operator),
          "{",
          repeat(choice($.pattern_case_clause, $.default_clause)),
          "}",
        ),
      ),

    partial_directive: (_) => "#partial",

    case_clause: ($) =>
      seq("case", field("value", $._expression), ";", repeat($._statement)),

    pattern_case_clause: ($) =>
      seq(
        "case",
        field("value", choice($.pattern_arm_block, $._pattern, $._expression)),
        ";",
        repeat($._statement),
      ),

    default_clause: ($) =>
      seq("else", ";", repeat($._statement)),

    _if_body: ($) => choice($.block, $._single_statement),

    _single_statement: ($) =>
      choice(
        $.inline_bytes_statement,
        $.inline_asm_statement,
        $.label_statement,
        $.return_statement,
        $.while_statement,
        $.for_statement,
        $.defer_statement,
        $.using_statement,
        $.switch_statement,
        $.if_statement,
        $.push_context_statement,
        $.push_allocator_statement,
        $.static_if_statement,
        $.insert_statement,
        $.compile_error_statement,
        $.falling_statement,
        $.variable_declaration,
        $.assignment_statement,
        $.expression_statement,
      ),

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
            field("operator", $.operator),
            "{",
            repeat(choice($.case_clause, $.default_clause)),
            "}",
          ),
          seq(
            "#if",
            field("condition", $._expression),
            field("consequence", $.block),
            optional(seq("else", field("alternative", choice($.block, $.static_if_statement)))),
          ),
        ),
      ),

    insert_statement: ($) =>
      seq("#insert", field("value", $._expression), optional(";")),

    compile_error_statement: ($) =>
      seq("#compile_error", field("message", $.string_literal), optional(";")),

    falling_statement: (_) => seq("#falling", optional(";")),

    variable_declaration: ($) =>
      prec.right(
        seq(
          field("name", $.binding_list),
          choice(
            seq(":=", field("value", $._expression)),
            seq("::", field("value", $._expression)),
            seq(
              ":",
              optional(field("type", $._type)),
              optional(
                choice(
                  seq("=", field("value", $._expression)),
                  seq("::", field("value", $._expression)),
                  seq(":", field("value", $._expression)),
                ),
              ),
            ),
          ),
          optional(";"),
        ),
      ),

    assignment_statement: ($) =>
      prec.right(
        PREC.assignment + 1,
        seq(
          field("left", $._expression),
          field("operator", choice("=", $.assignment_operator)),
          field("right", $._expression),
          optional(";"),
        ),
      ),

    expression_statement: ($) => seq($._expression, optional(";")),

    _type: ($) =>
      choice(
        $.generic_type,
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

    generic_type_variable: ($) => seq("$", field("name", $.identifier)),

    array_type: ($) =>
      seq("[", optional(".."), "]", field("element", $._type)),

    layout_type: ($) =>
      seq(field("layout", choice("#aos", "#soa")), field("type", $._type)),

    c_pointer_type: ($) =>
      seq("#c_ptr", field("pointer", $.pointer_type)),

    pointer_type: ($) =>
      seq("*", optional("const"), field("pointee", $._type)),

    function_type: ($) =>
      seq(
        "(",
        commaSep($.type_element),
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
      prec(
        1,
        seq(
          field("name", $.identifier),
          "(",
          commaSep1($._type),
          ")",
        ),
      ),

    context_type: (_) => "#Context",

    named_type: ($) => $.identifier,

    _expression: ($) =>
      choice(
        $.assignment_expression,
        $.binary_expression,
        $.range_expression,
        $.unary_expression,
        $.cast_expression,
        $.run_expression,
        $.pattern_test_expression,
        $.meaningful_expression,
        $.postfix_expression,
        $._primary_expression,
      ),

    assignment_expression: ($) =>
      prec.right(
        PREC.assignment,
        seq(
          field("left", $._expression),
          field("operator", $.assignment_operator),
          field("right", $._expression),
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
        prec.left(
          PREC.range,
          seq(
            field("start", $._expression),
            field("operator", $.range_operator),
            optional(field("end", $._expression)),
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

    cast_expression: ($) =>
      prec(
        PREC.unary,
        seq(
          "cast",
          optional(seq("(", field("type", $._type), ")")),
          field("value", $._expression),
        ),
      ),

    run_expression: ($) =>
      prec(
        PREC.unary,
        seq(
          "#run",
          choice(
            seq($.arrow, field("type", $._type), field("body", $.block)),
            field("body", $.block),
            field("value", $._expression),
          ),
        ),
      ),

    meaningful_expression: ($) =>
      prec(
        PREC.unary,
        seq("#meaningful", choice(field("body", $.block), field("value", $._expression))),
      ),

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

    pattern_arm_block: ($) =>
      seq("{", repeat(seq($.pattern_arm, optional($._separator))), "}"),

    pattern_arm: ($) =>
      seq(field("pattern", $._pattern), "=", field("value", $._expression)),

    _pattern: ($) =>
      choice(
        $.pattern_postfix_expression,
        $._pattern_primary,
      ),

    pattern_postfix_expression: ($) =>
      prec.left(
        PREC.call,
        choice(
          seq(field("function", $._pattern), field("arguments", $.pattern_argument_list)),
          seq(field("object", $._pattern), ".", field("field", $.identifier)),
          seq(field("type", $._pattern), field("literal", $.struct_pattern)),
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
        $.shorthand_member_pattern,
        $.struct_pattern,
        $.parenthesized_pattern,
      ),

    pattern_rest: (_) => "...",

    pointer_pattern: ($) => seq("*", field("name", $.identifier)),

    pattern_binding: ($) => field("name", $.identifier),

    shorthand_member_pattern: ($) => seq(".", field("field", $.identifier)),

    struct_pattern: ($) => seq(".{", commaSep($.struct_pattern_field), "}"),

    struct_pattern_field: ($) =>
      choice(
        $.pattern_rest,
        seq(".", field("name", $.identifier), optional(seq("=", field("value", $._pattern)))),
        field("value", $._pattern),
      ),

    parenthesized_pattern: ($) => seq("(", $._pattern, ")"),

    postfix_expression: ($) =>
      prec.left(
        PREC.call,
        choice(
          seq(field("function", $._expression), field("arguments", $.argument_list)),
          seq(field("object", $._expression), field("index", $.index_suffix)),
          seq(field("object", $._expression), ".", "cast", "(", field("type", $._type), ")"),
          seq(field("object", $._expression), ".", "*"),
          seq(field("object", $._expression), ".", field("field", $.identifier)),
          seq(field("type", $._expression), field("literal", $.struct_literal)),
          seq(field("argument", $._expression), field("operator", $.quoted_operator)),
        ),
      ),

    argument_list: ($) => seq("(", commaSep($._expression), ")"),

    index_suffix: ($) => seq("[", field("value", $._expression), "]"),

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
        $.shorthand_member_expression,
        $.array_literal,
        $.struct_literal,
        $.non_hygienic_identifier,
        $.identifier,
        $.parenthesized_expression,
      ),

    parenthesized_expression: ($) => seq("(", $._expression, ")"),

    code_expression: ($) => seq("#code", field("body", $.block)),

    string_block: ($) => seq("#string", repeat1($.multiline_string_line)),

    char_literal: (_) =>
      token(seq("#char", /[ \t]*/, '"', repeat(choice(/[^"\\\n]/, /\\./)), '"')),

    boolean_literal: (_) => choice("true", "false"),

    null_literal: (_) => "null",

    label_none_literal: (_) => token(prec(2, "---")),

    context_expression: (_) => "context",

    shorthand_member_expression: ($) => seq(".", field("field", $.identifier)),

    struct_literal: ($) => seq(".{", commaSep($.struct_literal_field), "}"),

    struct_literal_field: ($) =>
      choice(
        seq(".", field("name", $.identifier), "=", field("value", $._expression)),
        field("value", $._expression),
      ),

    array_literal: ($) => seq(".[", commaSep($._expression), "]"),

    _operator: ($) => choice($.operator, $.quoted_operator),

    _prefix_operator: ($) => choice($.prefix_operator, $.quoted_operator),

    _separator: (_) => choice(";", ","),

    identifier: (_) => /[\p{L}_][\p{L}\p{N}_]*/,

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
            "==",
            "-=",
            "-",
            /[+*\/<>!@%\^&|~?][+\-*\/<>!@%\^&|~?]*=?/,
            /-[+\-*\/<!@%\^&|~?][+\-*\/<>!@%\^&|~?]*=?/,
          ),
        ),
      ),

    prefix_operator: (_) =>
      token(prec(1, choice("!", "-", "+", "~", "*", "&"))),

    range_operator: (_) => token(prec(2, choice("..=", ".."))),

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
            /[+*\/@%\^&|~?][+\-*\/<>!@%\^&|~?]*=/,
            /-[+\-*\/<!@%\^&|~?][+\-*\/<>!@%\^&|~?]*=/,
          ),
        ),
      ),

    arrow: (_) => token(prec(2, "->")),

    integer_literal: (_) =>
      token(choice(/0[xX][0-9a-fA-F_]+/, /0[bB][01_]+/, /[0-9][0-9_]*/)),

    float_literal: (_) => token(/[0-9][0-9_]*\.[0-9][0-9_]*/),

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
