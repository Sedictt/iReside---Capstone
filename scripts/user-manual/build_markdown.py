# -*- coding: utf-8 -*-
"""Generate GitHub Flavored Markdown versions of the user manuals with attached screenshots."""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
from manual_content import BOOK, CHAPTERS, FIL_LABELS, LANG_NOTE

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_DIR = os.path.join(ROOT, "docs", "manual")
SHOTS_DIR = os.path.join(OUT_DIR, "shots")


def pick(pair, lang):
    return pair[0] if lang == "en" else pair[1]


def to_md(text, lang):
    if not text:
        return ""
    def rep_label(m):
        label = m.group(1)
        if lang == "fil":
            fil = FIL_LABELS.get(label, label)
            if fil != label:
                return f"**{fil}** (*{label}*)"
            return f"**{fil}**"
        return f"**{label}**"
    return re.sub(r"\[\[(.+?)\]\]", rep_label, text)


def slugify(title):
    s = title.lower()
    s = re.sub(r"[^\w\s-]", "", s)
    return re.sub(r"[\s_-]+", "-", s).strip("-")


def build_markdown(lang):
    book = BOOK[lang]
    lines = []

    # Header / Title
    lines.append(f"# {book['title']}")
    lines.append(f"## {book['subtitle']}\n")
    lines.append(f"> **{book['for_whom']}**  ")
    lines.append(f"> {book['cover_note']}  ")
    lines.append(f"> *{book['edition']}*\n")
    lines.append("---\n")

    # Inside Cover
    labels = {
        "en": ("This book belongs to:", "My email address:", "My room or unit:",
               "My landlord's name and number:", "Never write your password here."),
        "fil": ("Ang librong ito ay pag-aari ni:", "Ang aking email address:", "Ang aking kwarto o unit:",
                "Pangalan at number ng may-ari:", "Huwag kailanman isulat dito ang password."),
    }[lang]

    lines.append(f"### {labels[0]}\n")
    lines.append(f"- **{labels[1]}** `_____________________________________`")
    lines.append(f"- **{labels[2]}** `_____________________________________`")
    lines.append(f"- **{labels[3]}** `_____________________________________`\n")
    lines.append(f"> [!CAUTION]")
    lines.append(f"> {labels[4]}\n")
    lines.append("---\n")

    # Table of Contents
    lines.append(f"## {book['toc']}\n")
    lines.append(f"*{book['toc_hint']}*\n")
    for i, ch in enumerate(CHAPTERS, start=1):
        ch_title = pick(ch["title"], lang)
        ch_slug = slugify(ch_title)
        lines.append(f"- [{ch_title}](#{ch_slug})")
        for task in ch.get("tasks", []):
            task_title = pick(task["title"], lang)
            task_slug = slugify(task_title)
            lines.append(f"  - [{task_title}](#{task_slug})")
    lines.append("\n---\n")

    # Chapters
    for ch in CHAPTERS:
        ch_title = pick(ch["title"], lang)
        lines.append(f"## {ch_title}\n")

        if "blocks" in ch:
            terms = [b for b in ch["blocks"] if b[0] == "term"]
            for b in ch["blocks"]:
                kind = b[0]
                if kind == "p":
                    lines.append(f"{to_md(pick(b[1:3], lang), lang)}\n")
                elif kind == "h":
                    lines.append(f"### {to_md(pick(b[1:3], lang), lang)}\n")
                elif kind == "list":
                    for item in b[1]:
                        lines.append(f"- {to_md(pick(item, lang), lang)}")
                    lines.append("")
                elif kind == "tip":
                    lines.append(f"> [!TIP]")
                    lines.append(f"> **{book['tip']}**: {to_md(pick(b[1:3], lang), lang)}\n")
                elif kind == "warning":
                    lines.append(f"> [!WARNING]")
                    lines.append(f"> **{book['warning']}**: {to_md(pick(b[1:3], lang), lang)}\n")
                elif kind == "lang_note":
                    k, en, fil = LANG_NOTE[lang]
                    note_text = en if lang == "en" else fil
                    alert = "!WARNING" if k == "warning" else "!NOTE"
                    lines.append(f"> [{alert}]")
                    lines.append(f"> {to_md(note_text, lang)}\n")
                elif kind == "qa":
                    q = pick(b[1:3], lang)
                    a = pick(b[3:5], lang)
                    q_prefix = "Q" if lang == "en" else "T"
                    a_prefix = "A" if lang == "en" else "S"
                    lines.append(f"**{q_prefix}: {to_md(q, lang)}**  ")
                    lines.append(f"{a_prefix}: {to_md(a, lang)}\n")

            if terms:
                lines.append(f"### {'Glossary & Terms' if lang == 'en' else 'Talahulugan ng mga Salita'}\n")
                sorted_terms = sorted(terms, key=lambda x: (x[1] if lang == "en" else x[2]).lower())
                for b in sorted_terms:
                    word = b[1] if lang == "en" else b[2]
                    meaning = b[3] if lang == "en" else b[4]
                    if lang == "fil" and b[1].lower() != b[2].lower():
                        lines.append(f"- **{word}** (*{b[1]}*) — {to_md(meaning, lang)}")
                    else:
                        lines.append(f"- **{word}** — {to_md(meaning, lang)}")
                lines.append("")

        for task in ch.get("tasks", []):
            task_title = pick(task["title"], lang)
            lines.append(f"### {task_title}\n")
            lines.append(f"{to_md(pick(task['intro'], lang), lang)}\n")

            for n, (en, fil, cap_en, cap_fil) in enumerate(task["steps"], start=1):
                step_text = en if lang == "en" else fil
                caption = cap_en if lang == "en" else cap_fil
                shot_rel = f"shots/{lang}/{task['key']}-{n}.jpg"
                shot_path = os.path.join(SHOTS_DIR, lang, f"{task['key']}-{n}.jpg")

                lines.append(f"#### {book['step']} {n}. {to_md(step_text, lang)}\n")
                if os.path.exists(shot_path):
                    lines.append(f"![{caption}]({shot_rel})\n")
                    lines.append(f"*{to_md(caption, lang)}*\n")

            for b in task.get("boxes", []):
                kind = b[0]
                if kind == "tip":
                    lines.append(f"> [!TIP]")
                    lines.append(f"> **{book['tip']}**: {to_md(pick(b[1:3], lang), lang)}\n")
                elif kind == "warning":
                    lines.append(f"> [!WARNING]")
                    lines.append(f"> **{book['warning']}**: {to_md(pick(b[1:3], lang), lang)}\n")

            lines.append("")

        lines.append("---\n")

    out_file = os.path.join(OUT_DIR, f"iReside_User_Manual_{lang.upper()}.md")
    with open(out_file, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Generated Markdown manual: {out_file}")
    return out_file


if __name__ == "__main__":
    for lang in ("en", "fil"):
        build_markdown(lang)
