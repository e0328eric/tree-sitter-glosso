[
  "if"
  "else"
  "while"
  "for"
  "return"
  "struct"
  "union"
  "enum"
  "using"
  "defer"
  "where"
  "cast"
] @keyword

[
  "#run"
  "#import"
  "#load"
  "#private_section"
  "#thread_local"
  "#from_header"
  "#library"
  "#system_library"
  "#fn_ptr"
  "#c_ptr"
  "#as"
  "#empty"
  "#raw"
  "#aos"
  "#soa"
  "#operator"
  "#precedence"
  "#prefix"
  "#suffix"
  "#expand"
  "#magic"
  "#foreign"
  "#c_call"
  "#no_context"
  "#dump"
  "#fallback"
  "#must"
  "#noreturn"
  "#bytes"
  "#asm"
  "#push_context"
  "#push_allocator"
  "#if"
  "#insert"
  "#falling"
  "#meaningful"
  "#code"
  "#string"
] @attribute

(comment) @comment
(string_literal) @string
(multiline_string_line) @string
(char_literal) @character
(integer_literal) @number
(float_literal) @number.float
(boolean_literal) @boolean
(null_literal) @constant.builtin
(label_none_literal) @constant.builtin
(context_expression) @constant.builtin
(context_type) @type.builtin

(declaration_name) @function
(function_declaration (parameter_list (parameter name: (binding_list (identifier) @variable.parameter))))
(parameter name: (binding_list (identifier) @variable.parameter))
(struct_field name: (identifier) @property)
(union_field name: (identifier) @property)
(enum_variant name: (identifier) @constant)
(struct_literal_field name: (identifier) @property)
(shorthand_member_expression field: (identifier) @property)
(postfix_expression field: (identifier) @property)
(postfix_expression function: (identifier) @function)

(identifier) @variable
(non_hygienic_identifier) @variable
(label) @label
(quoted_operator) @operator
(operator) @operator
(prefix_operator) @operator
