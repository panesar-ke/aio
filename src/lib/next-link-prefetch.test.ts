import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { describe, expect, test } from 'vitest';

const SRC_DIR = path.join(process.cwd(), 'src');

function getTsxFiles(dir: string): Array<string> {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return getTsxFiles(entryPath);
    }

    if (!entry.name.endsWith('.tsx') || entry.name.endsWith('.test.tsx')) {
      return [];
    }

    return [entryPath];
  });
}

function getImportedLinkNames(sourceFile: ts.SourceFile): Set<string> {
  const names = new Set<string>();

  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      (statement.moduleSpecifier.getText(sourceFile) !== "'next/link'" &&
        statement.moduleSpecifier.getText(sourceFile) !== '"next/link"')
    ) {
      continue;
    }

    const importClause = statement.importClause;

    if (importClause?.name) {
      names.add(importClause.name.text);
    }
  }

  return names;
}

function getJsxTagName(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement
): string | null {
  if (ts.isIdentifier(node.tagName)) {
    return node.tagName.text;
  }

  return null;
}

function hasPrefetchFalse(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement
): boolean {
  return node.attributes.properties.some((attribute) => {
    if (
      !ts.isJsxAttribute(attribute) ||
      !ts.isIdentifier(attribute.name) ||
      attribute.name.text !== 'prefetch' ||
      !attribute.initializer ||
      !ts.isJsxExpression(attribute.initializer)
    ) {
      return false;
    }

    return attribute.initializer.expression?.kind === ts.SyntaxKind.FalseKeyword;
  });
}

function collectOffenders(
  sourceFile: ts.SourceFile,
  filePath: string
): Array<string> {
  const importedLinkNames = getImportedLinkNames(sourceFile);

  if (importedLinkNames.size === 0) {
    return [];
  }

  const offenders: Array<string> = [];

  function visit(node: ts.Node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = getJsxTagName(node);

      if (tagName && importedLinkNames.has(tagName) && !hasPrefetchFalse(node)) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(
          node.getStart(sourceFile)
        );
        offenders.push(
          `${path.relative(process.cwd(), filePath)}:${line + 1}:${character + 1}`
        );
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return offenders;
}

describe('next/link usage', () => {
  // This test reads every .tsx file under src to verify Link components use prefetch={false}.
  // Its runtime grows with the codebase, so it needs a generous timeout beyond the 5s default.
  test(
    'sets prefetch={false} on every direct Link usage',
    () => {
      const offenders = getTsxFiles(SRC_DIR).flatMap((filePath) => {
        const source = fs.readFileSync(filePath, 'utf8');
        const sourceFile = ts.createSourceFile(
          filePath,
          source,
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.TSX
        );

        return collectOffenders(sourceFile, filePath);
      });

      expect(offenders).toEqual([]);
    },
    60000
  );
});
