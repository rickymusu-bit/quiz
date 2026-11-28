/**
 * Formule nei testi delle banche: stesse regole della versione precedente
 * (`assets/js/datasets.js`, `mathParts` e `scienceParts`), portate senza
 * modifiche e verificate da un test che confronta le due versioni su tutte le
 * banche. Le formule sono delimitate da \( \) o \[ \] (anche con il doppio
 * escape delle banche storiche); in più alcune scritture in testo semplice
 * delle banche attuali, come «Q = mcΔT», diventano formule.
 */

export interface MathPart {
  text?: string;
  math?: string;
  display?: boolean;
}

export function mathParts(text: string): MathPart[] {
  // Historical banks use one extra escaping layer inside delimited formulas.
  // Normalize only that layer for rendering; preserve the source bank and IDs.
  const re =
    /\\\\\(([\s\S]*?)\\\\\)|\\\\\[([\s\S]*?)\\\\\]|\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g;
  const out: MathPart[] = [];
  let last = 0,
    m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    const legacy = m[1] !== undefined || m[2] !== undefined;
    let formula = m[1] ?? m[2] ?? m[3] ?? m[4];
    if (legacy) formula = formula.replace(/\\\\/g, "\\");
    out.push({
      math: formula,
      display: m[2] !== undefined || m[4] !== undefined,
    });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}
export function scienceParts(value: string): MathPart[] {
  const formulas = [
    [
      "T(K) = T(°C) + 273,15",
      String.raw`T_{\mathrm K}=t_{\mathrm C}+273{,}15`,
    ],
    [
      "T(°C) = (T(°F) − 32)·5/9",
      String.raw`t_{\mathrm C}=\frac{5}{9}(t_{\mathrm F}-32)`,
    ],
    ["ΔT = Q/(mc)", String.raw`\Delta T=\frac{Q}{m\,c}`],
    ["ΔT = Q/C", String.raw`\Delta T=\frac{Q}{C}`],
    ["Q = mcΔT", String.raw`Q=m\,c\,\Delta T`],
    ["Q = mLf", String.raw`Q=m\,L_f`],
    ["Q = mL", String.raw`Q=m\,L`],
    ["Q = Pt", String.raw`Q=P\,t`],
    ["P = λAΔT/s", String.raw`P=\frac{\lambda A\,\Delta T}{s}`],
    ["ΔL = αL0ΔT", String.raw`\Delta L=\alpha L_0\,\Delta T`],
    ["ΔV = βV0ΔT", String.raw`\Delta V=\beta V_0\,\Delta T`],
    ["C_B/C_A", String.raw`\frac{C_B}{C_A}`],
    ["C = mc", String.raw`C=m\,c`],
    ["Q1 + Q2 = 0", String.raw`Q_1+Q_2=0`],
    ["Δy/Δx", String.raw`\frac{\Delta y}{\Delta x}`],
    ["y = k/x", String.raw`y=\frac{k}{x}`],
    ["y = 12/x", String.raw`y=\frac{12}{x}`],
    ["y = kx", String.raw`y=k\,x`],
    ["y = 3x + b", String.raw`y=3x+b`],
    ["y = 2x + 1", String.raw`y=2x+1`],
    ["y = x + 5", String.raw`y=x+5`],
    ["y = 3x", String.raw`y=3x`],
    ["C = 2n + 3", String.raw`C=2n+3`],
    ["P = kn", String.raw`P=k\,n`],
    ["Qrecipiente", String.raw`Q_{\mathrm{recipiente}}`],
    ["αA", String.raw`\alpha_A`],
    ["αB", String.raw`\alpha_B`],
    ["L0", String.raw`L_0`],
    ["V0", String.raw`V_0`],
    ["Lf", String.raw`L_f`],
    ["m1", String.raw`m_1`],
    ["m2", String.raw`m_2`],
  ];
  const out: MathPart[] = [];
  for (const part of mathParts(value)) {
    if (part.math !== undefined) {
      out.push(part);
      continue;
    }
    let rest = part.text!;
    while (rest) {
      let found: { index: number; plain: string; formula: string } | null = null;
      for (const [plain, formula] of formulas) {
        const index = rest.indexOf(plain);
        if (
          index >= 0 &&
          (!found ||
            index < found.index ||
            (index === found.index && plain.length > found.plain.length))
        )
          found = { index, plain, formula };
      }
      if (!found) {
        out.push({ text: rest });
        break;
      }
      if (found.index) out.push({ text: rest.slice(0, found.index) });
      out.push({ math: found.formula, display: false });
      rest = rest.slice(found.index + found.plain.length);
    }
  }
  return out;
}
