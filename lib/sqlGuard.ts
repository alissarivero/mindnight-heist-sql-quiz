/** Removes string literals, quoted identifiers, dollar-quoted bodies and comments. */
export function stripLiterals(sql: string): string {
  return sql.replace(
    /'(?:[^']|'')*'|"(?:[^"]|"")*"|(\$[A-Za-z_0-9]*\$)[\s\S]*?\1|--[^\n]*|\/\*[\s\S]*?\*\//g,
    " ",
  );
}

/** Returns an error message if the input is not exactly one statement. */
export function checkSingleStatement(sql: string): string | null {
  const body = stripLiterals(sql).trim().replace(/;\s*$/, "");
  if (!body) return "Write a query first.";
  if (body.includes(";")) return "One statement at a time, detective. Remove the extra semicolon-separated statements.";
  return null;
}
