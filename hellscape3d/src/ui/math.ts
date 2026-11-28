/**
 * Testo con formule: le parti di formula (vedi `questions/math.ts`) diventano
 * KaTeX, come nella versione precedente (`assets/js/ui.js`, `math`); il resto
 * resta testo. KaTeX produce anche MathML, letto dagli screen reader.
 */
import katex from "katex";
import { scienceParts } from "../questions/math.ts";

/** Aggiunge a `element` il testo `value` con le formule rese; restituisce `element`. */
export function appendMath<T extends HTMLElement>(element: T, value: string): T {
  for (const part of scienceParts(value)) {
    if (part.text !== undefined) element.append(document.createTextNode(part.text));
    else {
      const span = document.createElement("span");
      span.className = `${part.display ? "math-block" : "math-inline"} math-scroll`;
      katex.render(part.math!, span, { displayMode: part.display ?? false, trust: false, throwOnError: true, strict: "ignore", maxExpand: 1000 });
      element.append(span);
    }
  }
  return element;
}

/** Elemento `tag` con classe e testo con formule; `prefix` resta testo semplice. */
export function mathElement<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, value: string, prefix = ""): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (prefix) element.append(document.createTextNode(prefix));
  return appendMath(element, value);
}
