"""Controlli strutturali e di varietà delle banche attive di Fool."""
import json
import re
import unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXPECTED = {
    "termologia": (10, 100),
    "introduzione-fisica-misura": (4, 100),
}
FIELDS = {"id", "difficolta", "tipologia", "testo", "alternative", "corretta", "spiegazione"}
DIFFICULTIES = {"facile", "media", "difficile"}
TYPES = {"conoscenza", "ragionamento", "calcolo"}


def normalized_question(text):
    text = unicodedata.normalize("NFD", text.casefold())
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = re.sub(r"\d+(?:[.,]\d+)?", "#", text)
    return re.sub(r"[^\w#]+", " ", text, flags=re.UNICODE).strip()


def check(condition, message):
    if not condition:
        raise AssertionError(message)


def validate_bank(entry):
    file = (ROOT / entry["url"]).resolve()
    check(file.is_relative_to(ROOT), f"Path fuori dal repository: {entry['url']}")
    check(file.is_file(), f"File banca mancante: {entry['url']}")
    bank = json.loads(file.read_text(encoding="utf-8"))
    check(set(bank) == {"versione", "titolo", "argomenti"}, "Campi banca inattesi")
    check(bank["versione"] == 1, "Il formato della banca rimane schema v1")
    check(isinstance(bank["titolo"], str) and bank["titolo"].strip(), "Titolo mancante")
    expected_topics, expected_total = EXPECTED[entry["id"]]
    check(len(bank["argomenti"]) == expected_topics, "Numero argomenti inatteso")
    seen_ids, seen_texts, topics, counters = set(), set(), set(), Counter()
    for topic in bank["argomenti"]:
        check(set(topic) == {"id", "nome", "domande"}, "Schema argomento inatteso")
        check(topic["id"] not in topics, "Argomento duplicato")
        topics.add(topic["id"])
        check(topic["nome"].strip() and isinstance(topic["nome"], str), "Nome argomento vuoto")
        check(len(topic["domande"]) == expected_total // expected_topics, "Quota argomento inattesa")
        for q in topic["domande"]:
            check(set(q) == FIELDS, f"Schema domanda inatteso: {q.get('id')}")
            check(q["id"].startswith(topic["id"] + "_v2_"), f"ID non riconosciuto: {q['id']}")
            check(q["id"] not in seen_ids, f"ID duplicato: {q['id']}")
            seen_ids.add(q["id"])
            check(q["difficolta"] in DIFFICULTIES, f"Difficoltà errata: {q['id']}")
            check(q["tipologia"] in TYPES, f"Tipologia errata: {q['id']}")
            check(isinstance(q["testo"], str) and 15 <= len(q["testo"]) <= 250, f"Testo: {q['id']}")
            check(isinstance(q["spiegazione"], str) and q["spiegazione"].strip(), f"Spiegazione: {q['id']}")
            check(len(q["alternative"]) == 4 and all(isinstance(x, str) and x.strip() for x in q["alternative"]), f"Alternative incomplete: {q['id']}")
            check(len(set(q["alternative"])) == 4, f"Alternative duplicate: {q['id']}")
            check(q["corretta"] in "ABCD", f"Lettera soluzione errata: {q['id']}")
            fingerprint = normalized_question(q["testo"])
            check(fingerprint not in seen_texts, f"Domanda/variante numerica duplicata: {q['id']}")
            seen_texts.add(fingerprint)
            if q["tipologia"] == "calcolo":
                check(bool(re.search(r"\d|[=×·/]", q["spiegazione"])), f"Calcolo senza passaggio quantitativo: {q['id']}")
            counters[q["difficolta"]] += 1
            counters[q["tipologia"]] += 1
            counters["soluzione_" + q["corretta"]] += 1
    check(len(seen_ids) == expected_total, "Numero totale domande inatteso")
    for difficulty in DIFFICULTIES:
        check(counters[difficulty] >= 20, f"Disponibilità insufficiente per {difficulty}")
    for letter in "ABCD":
        check(counters["soluzione_" + letter] >= 15, "Posizioni di risposta sbilanciate")
    return {"banca": entry["id"], "domande": len(seen_ids), "difficolta": {k: counters[k] for k in sorted(DIFFICULTIES)}, "tipologie": {k: counters[k] for k in sorted(TYPES)}}


def main():
    catalogue = json.loads((ROOT / "datasets.json").read_text(encoding="utf-8"))
    check(catalogue["versione"] == 1, "Versione catalogo inattesa")
    banks = catalogue["banche"]
    check({b["id"] for b in banks} == set(EXPECTED), "Banche catalogo inattese")
    results = [validate_bank(b) for b in banks]
    print(json.dumps({"verifica": "OK", "risultati": results}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
