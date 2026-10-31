#include "tree_sitter/parser.h"

enum TokenType {
  SYMBOLIC_SUFFIX_OPERATOR,
  COMMENT,
};

static bool is_space(int32_t c) {
  return c == ' ' || c == '\t' || c == '\r' || c == '\n' || c == '\v' || c == '\f';
}

static bool is_operator(int32_t c) {
  switch (c) {
    case '+': case '-': case '*': case '/': case '<': case '>': case '!':
    case '@': case '%': case '^': case '&': case '|': case '~': case '=':
      return true;
    default:
      return false;
  }
}

// Consumes the rest of a comment whose opening '/' has been consumed and whose
// second character ('/' or '*') is the lookahead. Block comments nest as in the
// compiler's lexer: every "/*" needs its own "*/". Returns false for an
// unterminated block comment, which the compiler rejects.
static bool finish_comment(TSLexer *lexer) {
  if (lexer->lookahead == '/') {
    while (!lexer->eof(lexer) && lexer->lookahead != '\n') lexer->advance(lexer, false);
    return true;
  }
  lexer->advance(lexer, false);
  unsigned depth = 1;
  while (depth > 0) {
    if (lexer->eof(lexer)) return false;
    int32_t c = lexer->lookahead;
    lexer->advance(lexer, false);
    if (c == '/' && lexer->lookahead == '*') {
      lexer->advance(lexer, false);
      depth++;
    } else if (c == '*' && lexer->lookahead == '/') {
      lexer->advance(lexer, false);
      depth--;
    }
  }
  return true;
}

// Skips whitespace and comments, nested ones included. Returns false when a
// '/' starts something other than a comment or a block comment never closes.
static bool skip_trivia(TSLexer *lexer) {
  for (;;) {
    while (is_space(lexer->lookahead)) lexer->advance(lexer, false);
    if (lexer->lookahead != '/') return true;
    lexer->advance(lexer, false);
    if (lexer->lookahead != '/' && lexer->lookahead != '*') return false;
    if (!finish_comment(lexer)) return false;
  }
}

void *tree_sitter_glosso_external_scanner_create(void) { return NULL; }
void tree_sitter_glosso_external_scanner_destroy(void *payload) { (void)payload; }

unsigned tree_sitter_glosso_external_scanner_serialize(void *payload, char *buffer) {
  (void)payload;
  (void)buffer;
  return 0;
}

void tree_sitter_glosso_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
  (void)payload;
  (void)buffer;
  (void)length;
}

bool tree_sitter_glosso_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  (void)payload;
  if (!valid_symbols[COMMENT] && !valid_symbols[SYMBOLIC_SUFFIX_OPERATOR]) return false;
  while (is_space(lexer->lookahead)) lexer->advance(lexer, true);

  int32_t first = lexer->lookahead;
  if (!is_operator(first)) return false;
  lexer->advance(lexer, false);
  int32_t second = lexer->lookahead;

  // Comments are extras, so they are valid wherever a token may start.
  if (first == '/' && (second == '/' || second == '*')) {
    if (!valid_symbols[COMMENT] || !finish_comment(lexer)) return false;
    lexer->mark_end(lexer);
    lexer->result_symbol = COMMENT;
    return true;
  }
  if (!valid_symbols[SYMBOLIC_SUFFIX_OPERATOR]) return false;

  unsigned length = 1;
  while (is_operator(lexer->lookahead)) {
    lexer->advance(lexer, false);
    length++;
  }
  if (length == 1 && (first == '=' || first == '@')) return false;
  if (length == 2 && first == '-' && second == '>') return false;

  // Only the operator belongs to the token. Look past comments and whitespace
  // to distinguish a suffix from a binary operator with a following operand.
  lexer->mark_end(lexer);
  if (!skip_trivia(lexer)) return false;
  switch (lexer->lookahead) {
    case ',': case ';': case ')': case ']': case '}':
      lexer->result_symbol = SYMBOLIC_SUFFIX_OPERATOR;
      return true;
    default:
      return false;
  }
}
