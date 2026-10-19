"use client";

import { useEffect, useRef, useState } from "react";
import Editor, { type OnMount, type Monaco } from "@monaco-editor/react";
import type { editor, IDisposable, Position } from "monaco-editor";
import type { SchemaTable } from "@/lib/db";

export type EditorHandle = { insert: (text: string) => void; setValue: (v: string) => void; focus: () => void };

type Props = {
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  onExplain: () => void;
  schema: SchemaTable[];
  errorOffset: number | null;
  handleRef: React.RefObject<EditorHandle | null>;
};

function defineTheme(monaco: Monaco) {
  monaco.editor.defineTheme("noir", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "e3a63b", fontStyle: "bold" },
      { token: "string", foreground: "9fcf8f" },
      { token: "number", foreground: "f08d6f" },
      { token: "comment", foreground: "6f6758", fontStyle: "italic" },
      { token: "operator", foreground: "d9cdb0" },
      { token: "predefined", foreground: "8fb8de" },
    ],
    colors: {
      "editor.background": "#100f0c",
      "editor.foreground": "#ebe2cc",
      "editor.lineHighlightBackground": "#1c1a1544",
      "editorLineNumber.foreground": "#4a4436",
      "editorLineNumber.activeForeground": "#e3a63b",
      "editorCursor.foreground": "#e3a63b",
      "editor.selectionBackground": "#e3a63b33",
      "editorIndentGuide.background1": "#2a261f",
      "editorWidget.background": "#15130f",
      "editorSuggestWidget.background": "#15130f",
      "editorSuggestWidget.border": "#2e2a22",
      "editorSuggestWidget.selectedBackground": "#2a2418",
    },
  });
}

export function SqlEditor({ value, onChange, onRun, onSubmit, onExplain, schema, errorOffset, handleRef }: Props) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const actions = useRef({ onRun, onSubmit, onExplain });
  actions.current = { onRun, onSubmit, onExplain };
  const completion = useRef<IDisposable | null>(null);
  const [mounted, setMounted] = useState(false);

  const onMount: OnMount = (ed, monaco) => {
    editorRef.current = ed;
    monacoRef.current = monaco;
    setMounted(true);
    ed.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => actions.current.onRun());
    ed.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => actions.current.onSubmit());
    ed.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyE, () => actions.current.onExplain());
    handleRef.current = {
      insert: (text) => {
        const sel = ed.getSelection();
        if (sel) ed.executeEdits("schema", [{ range: sel, text, forceMoveMarkers: true }]);
        ed.focus();
      },
      setValue: (v) => {
        ed.setValue(v);
        ed.focus();
      },
      focus: () => ed.focus(),
    };
  };

  // Schema-aware autocomplete: table names, columns, and alias.column.
  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco || !schema.length) return;
    completion.current?.dispose();
    completion.current = monaco.languages.registerCompletionItemProvider("sql", {
      triggerCharacters: ["."],
      provideCompletionItems: (model: editor.ITextModel, position: Position) => {
        const word = model.getWordUntilPosition(position);
        const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
        const before = model.getLineContent(position.lineNumber).slice(0, word.startColumn - 1);
        const dotted = before.match(/(\w+)\.$/);
        const K = monaco.languages.CompletionItemKind;

        if (dotted) {
          const alias = dotted[1].toLowerCase();
          const text = model.getValue();
          const aliasTable = new RegExp(`(\\w+)\\s+(?:as\\s+)?${alias}\\b`, "i").exec(text)?.[1]?.toLowerCase();
          const t = schema.find((s) => s.table === alias || s.table === aliasTable);
          if (t) {
            return { suggestions: t.columns.map((c) => ({ label: c.name, kind: K.Field, insertText: c.name, detail: c.type, range })) };
          }
        }
        return {
          suggestions: [
            ...schema.map((t) => ({ label: t.table, kind: K.Class, insertText: t.table, detail: `table · ${t.rows} rows`, range })),
            ...schema.flatMap((t) => t.columns.map((c) => ({ label: c.name, kind: K.Field, insertText: c.name, detail: `${t.table}.${c.name} · ${c.type}`, range }))),
          ],
        };
      },
    });
    return () => completion.current?.dispose();
  }, [schema, mounted]);

  // Squiggle the exact character Postgres complained about.
  useEffect(() => {
    const ed = editorRef.current;
    const monaco = monacoRef.current;
    const model = ed?.getModel();
    if (!ed || !monaco || !model) return;
    if (errorOffset == null) {
      monaco.editor.setModelMarkers(model, "pg", []);
      return;
    }
    const pos = model.getPositionAt(Math.max(0, errorOffset));
    const wordAt = model.getWordAtPosition(pos);
    monaco.editor.setModelMarkers(model, "pg", [{
      severity: monaco.MarkerSeverity.Error,
      message: "Postgres flagged this position",
      startLineNumber: pos.lineNumber,
      startColumn: wordAt?.startColumn ?? pos.column,
      endLineNumber: pos.lineNumber,
      endColumn: wordAt?.endColumn ?? pos.column + 1,
    }]);
    ed.revealPositionInCenterIfOutsideViewport(pos);
  }, [errorOffset, mounted]);

  return (
    <Editor
      height="100%"
      defaultLanguage="sql"
      value={value}
      onChange={(v) => onChange(v ?? "")}
      onMount={onMount}
      beforeMount={defineTheme}
      theme="noir"
      loading={<div className="grid h-full place-items-center font-mono text-xs text-fog">Loading editor…</div>}
      options={{
        fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
        fontSize: 14,
        lineHeight: 22,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        padding: { top: 14, bottom: 14 },
        renderLineHighlight: "line",
        smoothScrolling: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        wordWrap: "on",
        tabSize: 2,
        automaticLayout: true,
        fixedOverflowWidgets: true,
        suggest: { showWords: false },
      }}
    />
  );
}
