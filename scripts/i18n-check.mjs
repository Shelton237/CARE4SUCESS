// Vérifie la couverture des traductions.
//   node scripts/i18n-check.mjs                 -> toutes les pages listées ci-dessous
//   node scripts/i18n-check.mjs src/pages/X.tsx -> fichiers précis
// Extrait les textes passés à t("...") et tt("...") puis liste ceux qui n'ont pas
// de traduction en/mg/ar dans src/i18n/dict/*.json.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const DEFAULT_FILES = [
  "src/components/Layout.tsx",
  "src/components/LanguageMenu.tsx",
  "src/pages/Home.tsx",
  "src/pages/Services.tsx",
  "src/pages/LanguesLanding.tsx",
  "src/pages/Competences.tsx",
  "src/pages/CommentCaMarche.tsx",
  "src/pages/DevenirProfesseur.tsx",
  "src/pages/Faq.tsx",
  "src/pages/faqData.ts",
  "src/pages/EvaluationGratuite.tsx",
];
const LANGS = ["en", "mg", "ar"];

const dictDir = path.resolve("src/i18n/dict");
const dict = {};
for (const f of fs.readdirSync(dictDir).filter(f => f.endsWith(".json"))) {
  Object.assign(dict, JSON.parse(fs.readFileSync(path.join(dictDir, f), "utf8")));
}

function keysOf(file) {
  const src = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const keys = [];
  (function visit(n) {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && (n.expression.text === "t" || n.expression.text === "tt")) {
      const a = n.arguments[0];
      if (a && (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a))) keys.push({ key: a.text, line: sf.getLineAndCharacterOfPosition(a.getStart()).line + 1 });
    }
    ts.forEachChild(n, visit);
  })(sf);
  return keys;
}

// --skeleton=chemin.json : écrit la liste (sans doublon) des textes sans traduction complète
const skeletonArg = process.argv.find(a => a.startsWith("--skeleton="));
const skeleton = {};
const args = process.argv.slice(2).filter(a => !a.startsWith("--"));
const files = args.length ? args : DEFAULT_FILES;
let missingTotal = 0, keyTotal = 0;
const used = new Set();
for (const file of files) {
  if (!fs.existsSync(file)) { console.log("(absent)", file); continue; }
  const keys = keysOf(file);
  const bad = [];
  for (const { key, line } of keys) {
    keyTotal++;
    used.add(key);
    const entry = dict[key];
    const miss = LANGS.filter(l => !entry || !entry[l] || !String(entry[l]).trim());
    if (miss.length) { bad.push({ line, key, miss }); skeleton[key] = { en: entry?.en ?? "", mg: entry?.mg ?? "", ar: entry?.ar ?? "" }; }
  }
  missingTotal += bad.length;
  console.log(`${bad.length === 0 ? "OK " : "KO "} ${file}  (${keys.length} textes${bad.length ? `, ${bad.length} sans traduction complète` : ""})`);
  for (const b of bad.slice(0, 200)) console.log(`     L${b.line} [${b.miss.join(",")}] ${JSON.stringify(b.key).slice(0, 110)}`);
}
if (skeletonArg) fs.writeFileSync(skeletonArg.slice("--skeleton=".length), JSON.stringify(skeleton, null, 2) + "\n");
const unused = Object.keys(dict).filter(k => !used.has(k));
if (process.argv.length <= 2 && unused.length) console.log(`\n${unused.length} entrée(s) de dictionnaire non utilisée(s) par les fichiers ci-dessus (ex. ${JSON.stringify(unused[0]).slice(0, 70)})`);
console.log(`\nTotal : ${keyTotal} textes, ${missingTotal} incomplets`);
process.exit(missingTotal ? 1 : 0);
