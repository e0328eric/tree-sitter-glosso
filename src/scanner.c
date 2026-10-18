#include "tree_sitter/parser.h"

enum TokenType {
  SYMBOLIC_SUFFIX_OPERATOR,
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

static bool skip_trivia(TSLexer *lexer) {
  for (;;) {
    while (is_space(lexer->lookahead)) lexer->advance(lexer, false);
    if (lexer->lookahead != '/') return true;

    lexer->advance(lexer, false);
    if (lexer->lookahead == '/') {
      do {
        lexer->advance(lexer, false);
      } while (!lexer->eof(lexer) && lexer->lookahead != '\n');
    } else if (lexer->lookahead == '*') {
      lexer->advance(lexer, false);
      bool star = false;
      for (;;) {
        if (lexer->eof(lexer)) return false;
        int32_t c = lexer->lookahead;
        lexer->advance(lexer, false);
        if (star && c == '/') break;
        star = c == '*';
      }
    } else {
      return false;
    }
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
  if (!valid_symbols[SYMBOLIC_SUFFIX_OPERATOR]) return false;
  while (is_space(lexer->lookahead)) lexer->advance(lexer, true);

  int32_t first = lexer->lookahead;
  if (!is_operator(first)) return false;
  lexer->advance(lexer, false);
  int32_t second = lexer->lookahead;
  if (first == '/' && (second == '/' || second == '*')) return false;

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
