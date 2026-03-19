import * as ts from "typescript";

interface ImportRange {
  start: number;
  end: number;
  node: ts.ImportDeclaration;
}

export function normalizeReactImports(
  content: string,
  fileName = "file.tsx",
): string {
  const source = ts.createSourceFile(
    fileName,
    content,
    ts.ScriptTarget.Latest,
    true,
    toScriptKind(fileName),
  );

  const reactImports: ImportRange[] = [];
  source.forEachChild((node) => {
    if (!ts.isImportDeclaration(node)) return;
    if (!ts.isStringLiteral(node.moduleSpecifier)) return;
    if (node.moduleSpecifier.text !== "react") return;
    reactImports.push({
      start: node.getStart(source),
      end: node.getEnd(),
      node,
    });
  });

  if (reactImports.length <= 1) return content;

  const lineEnd = content.includes("\r\n") ? "\r\n" : "\n";
  let defaultImport: string | null = null;
  let namespaceImport: string | null = null;
  let hasSideEffectImport = false;
  const valueNamed: string[] = [];
  const typeNamed: string[] = [];

  const pushUnique = (target: string[], value: string) => {
    if (!target.includes(value)) {
      target.push(value);
    }
  };

  for (const entry of reactImports) {
    const clause = entry.node.importClause;
    if (!clause) {
      hasSideEffectImport = true;
      continue;
    }

    if (clause.name && !clause.isTypeOnly && !defaultImport) {
      defaultImport = clause.name.text;
    }

    const bindings = clause.namedBindings;
    if (!bindings) continue;

    if (ts.isNamespaceImport(bindings)) {
      if (!clause.isTypeOnly && !namespaceImport) {
        namespaceImport = bindings.name.text;
      }
      continue;
    }

    for (const element of bindings.elements) {
      const imported = element.propertyName?.text ?? element.name.text;
      const local = element.name.text;
      const rendered =
        imported === local ? imported : `${imported} as ${local}`;
      if (clause.isTypeOnly || element.isTypeOnly) {
        pushUnique(typeNamed, rendered);
      } else {
        pushUnique(valueNamed, rendered);
      }
    }
  }

  const mergedNamed: string[] = [...valueNamed];
  for (const spec of typeNamed) {
    if (!valueNamed.includes(spec)) {
      mergedNamed.push(`type ${spec}`);
    }
  }

  let mergedImport = "";
  if (defaultImport && mergedNamed.length > 0) {
    mergedImport = `import ${defaultImport}, { ${mergedNamed.join(", ")} } from 'react';`;
  } else if (defaultImport) {
    mergedImport = `import ${defaultImport} from 'react';`;
  } else if (mergedNamed.length > 0) {
    mergedImport = `import { ${mergedNamed.join(", ")} } from 'react';`;
  } else if (namespaceImport) {
    mergedImport = `import * as ${namespaceImport} from 'react';`;
  } else if (hasSideEffectImport) {
    mergedImport = `import 'react';`;
  }

  if (!mergedImport) return content;

  const edits = reactImports.map((entry, index) => {
    const { start } = entry;
    let end = entry.end;
    while (
      end < content.length &&
      (content[end] === "\n" || content[end] === "\r")
    ) {
      end += 1;
    }
    return {
      start,
      end,
      text: index === 0 ? `${mergedImport}${lineEnd}` : "",
    };
  });

  let output = content;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  }
  return output;
}

function toScriptKind(fileName: string): ts.ScriptKind {
  if (fileName.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (fileName.endsWith(".jsx")) return ts.ScriptKind.JSX;
  if (fileName.endsWith(".ts")) return ts.ScriptKind.TS;
  if (fileName.endsWith(".js")) return ts.ScriptKind.JS;
  return ts.ScriptKind.TSX;
}
