import os
import re
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: render_task_template.py <template> <output>", file=sys.stderr)
        return 2

    template_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    text = template_path.read_text(encoding="utf-8")
    placeholders = sorted(set(re.findall(r"__([A-Z0-9_]+)__", text)))
    missing = []

    for name in placeholders:
        if name == "IMAGE":
            continue
        value = os.environ.get(name)
        if value is None or value == "":
            missing.append(name)
            continue
        text = text.replace(f"__{name}__", value)

    if missing:
        print("Missing required environment variables: " + ", ".join(missing), file=sys.stderr)
        return 1

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(text, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
