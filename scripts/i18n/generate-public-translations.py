"""Generate checked-in public copy catalogues with Argos Translate.

Install argostranslate in a local Python environment, then run this script after
extract-public-copy.mjs. The website never loads the translation model.
"""

import json
from pathlib import Path

import ctranslate2
from argostranslate import package, translate


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "src/i18n/public-source.json"
PROTECTED = {
    "Grupo Scout Séptimo", "Montevideo", "BAUEN", "Bauen",
    "Scoutpedia", "Am Lagerfeuer", "Instagram", "YouTube", "Facebook",
}


def ensure_model(target: str) -> None:
    installed = translate.get_installed_languages()
    if any(language.code == "es" and any(other.to_lang.code == target for other in language.translations_from) for language in installed):
        return
    package.update_package_index()
    model = next(
        candidate for candidate in package.get_available_packages()
        if candidate.from_code == "es" and candidate.to_code == target
    )
    package.install_from_path(model.download())


def main() -> None:
    strings = json.loads(SOURCE.read_text(encoding="utf-8"))
    for target in ("en", "pt"):
        ensure_model(target)
        translation = translate.get_translation_from_codes("es", target)
        underlying = getattr(translation, "underlying", translation)
        if underlying is None or not hasattr(underlying, "pkg"):
            raise RuntimeError(f"Missing Argos model for es → {target}")
        model = underlying.pkg
        translator = ctranslate2.Translator(str(model.package_path / "model"), device="cpu")
        output = {}
        candidates = [source for source in strings if source not in PROTECTED]
        for start in range(0, len(candidates), 32):
            batch = candidates[start:start + 32]
            tokens = [model.tokenizer.encode(source) for source in batch]
            prefix = [[model.target_prefix]] * len(batch) if model.target_prefix else None
            results = translator.translate_batch(
                tokens, target_prefix=prefix, replace_unknowns=True,
                beam_size=1, max_batch_size=32, batch_type="examples",
            )
            for original, result in zip(batch, results):
                translated = model.tokenizer.decode(result.hypotheses[0]).strip()
                if model.target_prefix and translated.startswith(model.target_prefix):
                    translated = translated[len(model.target_prefix):].strip()
                if translated and translated != original:
                    output[original] = translated
            print(f"{target}: {min(start + 32, len(candidates))}/{len(candidates)}", flush=True)
        destination = ROOT / f"src/i18n/public-{target}.json"
        destination.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Wrote {len(output)} translations to {destination.relative_to(ROOT)}", flush=True)


if __name__ == "__main__":
    main()
