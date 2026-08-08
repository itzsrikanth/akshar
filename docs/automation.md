← [Back to README](../README.md)

## Automating the first pass

Transliteration is not one problem — it's two, and they need different tools:

- **Brahmic script → Brahmic script** (e.g. Kannada → Devanagari): these scripts share a near 1:1 structural correspondence (vowels, consonants, matras, virama), so the right tool is a deterministic rule-based mapper — [`indic_transliteration`](https://pypi.org/project/indic-transliteration/)'s `sanscript` module — not a statistical model. Going through Roman as an intermediate step (as an ML Roman↔Indic model would require) throws away that structure and loses precision.
- **Brahmic script → Latin/Roman** (for parents who only read the English alphabet): here Roman *is* the destination, not a waypoint, so [AI4Bharat IndicXlit](https://github.com/AI4Bharat/IndicXlit) (ML-based, natural colloquial spelling) is a good fit.

Both are planned as a **local script, not a CI gate** — output is always a draft for human review via PR, never auto-merged.

[Bhashini TTS API](https://bhashini.gov.in/ulca) provides audio pronunciation for the mobile app across most Indic languages.
