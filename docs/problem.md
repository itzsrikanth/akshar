← [Back to README](../README.md)

## The problem

Across India, millions of children study a regional language as their second or third language. Their parents often speak the language but cannot read the script — a Hindi-speaking family in Karnataka, a Telugu family in Maharashtra, a Tamil family in Delhi.

When the child comes home with Kannada homework, the parent is stuck. They can understand Kannada when spoken but cannot read ಕನ್ನಡ script, cannot decode the questions, cannot check the answers.

Akshar solves that: for every line of every textbook lesson, provide the original text alongside a pronunciation guide in a script the parent already knows (Devanagari, Latin, Tamil, Telugu…) and a translation for meaning.

---

## What already exists — and why it is not enough

Before building, a landscape scan was done to check for existing solutions. Nothing with this specific combination exists. Here is what does exist and why it does not cover this gap:

| Project | What it is | Why it does not cover this gap |
|---|---|---|
| **AI4Bharat IndicXlit** | Transformer model for Roman↔21 Indic script transliteration, 26M word pairs | A tool/engine, not a content repository. No textbook content, no curriculum structure. |
| **indic-transliteration** (Vishvas Vasuki) | Python library, cross-script Indic transliteration | A library, not content. |
| **AI4Bharat Indic-TTS** | Text-to-speech for Indian languages | Complementary (audio pronunciation) but no curriculum content layer. |
| **DIKSHA** (diksha.gov.in) | Government platform delivering NCERT and state board textbooks | Has licensed source content but as PDFs only. No structured text extraction, no transliteration, no parent-facing pronunciation guide. A delivery platform, not a data layer. |
| **Bhashini / ULCA** (bhashini.gov.in) | Government AI platform, 10M transliteration pairs, open API | Infrastructure only. No curriculum content. |
| **Bharatiya Bhasha Pustak Pariyojana (BBPP)** | Initiative to produce textbooks in 22 Indian languages via AI translation | Different problem: translating the medium of instruction. Not helping parents who cannot read the regional script. |
| **StoryWeaver / Pratham Books** (storyweaver.org.in) | 53K+ storybooks in 330 languages, CC-licensed, community contributions | Supplementary reading only. Not curriculum-organised by board/grade/subject. No transliteration for pronunciation. |
| **State textbook apps on Play Store** | PDF viewers for existing textbooks | Closed, PDF-only, no structured text, not open source. |

The ecosystem has the tools but no one has built the structured, human-verified, community-contributed content data layer on top. That is what Akshar is.
