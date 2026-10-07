import { readFileSync, writeFileSync } from "node:fs"
const p = "src/components/reference/cockpit/CockpitEditor.tsx"
let c = readFileSync(p, "utf8")

// Imports MDXEditor
c = c.replace(
  'import ReactMarkdown from "react-markdown"',
  `import ReactMarkdown from "react-markdown"
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  ListsToggle,
  MDXEditor,
  UndoRedo,
  headingsPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from "@mdxeditor/editor"
import "@mdxeditor/editor/editor.css"`
)

// Textarea de contenu -> éditeur riche WYSIWYG (comme Word)
const oldTx = `                <Textarea
                  ref={contentRef}
                  value={form.content}
                  onChange={(event) => set("content", event.target.value)}
                  placeholder={"Rédigez ici en markdown.\n\n## Un titre\n\nDu texte en **gras**, un [lien](https://…), une citation :\n> Verbum sap…"}
                  className="min-h-[440px] rounded-none font-mono text-[13px] leading-relaxed"
                />`
if (!c.includes(oldTx)) throw new Error("textarea contenu introuvable")
c = c.replace(oldTx, `                {/* Éditeur riche WYSIWYG : gras, italique, titres, listes, liens par
                    simples boutons (comme Word) — aucun code à écrire à la main.
                    Le contenu reste stocké en markdown, de façon transparente. */}
                <div className="min-h-[440px] border">
                  <MDXEditor
                    markdown={form.content}
                    onChange={(value) => set("content", value)}
                    placeholder="Rédigez votre article — la barre d'outils gère gras, titres, listes, liens…"
                    plugins={[
                      headingsPlugin(),
                      listsPlugin(),
                      quotePlugin(),
                      thematicBreakPlugin(),
                      linkPlugin(),
                      markdownShortcutPlugin(),
                      toolbarPlugin({
                        toolbarContents: () => (
                          <div className="flex flex-wrap items-center gap-1 p-1">
                            <UndoRedo />
                            <BoldItalicUnderlineToggles />
                            <ListsToggle />
                            <BlockTypeSelect />
                            <CreateLink />
                          </div>
                        ),
                      }),
                    ]}
                    contentEditableClassName="min-h-[380px] px-4 py-3 text-[15px] leading-relaxed focus:outline-none"
                    className="min-h-[440px]"
                  />
                </div>`)

// insertAtCursor : sans textarea, insère à la fin (boutons Image/Vidéo médiathèque)
c = c.replace(
  "  const insertAtCursor = (snippet: string) => {\n    const textarea = contentRef.current\n    const position = textarea ? textarea.selectionStart : form.content.length",
  "  const insertAtCursor = (snippet: string) => {\n    const textarea = contentRef.current\n    const position = textarea ? textarea.selectionStart : form.content.length"
)

writeFileSync(p, c)
console.log("WYSIWYG intégré")
