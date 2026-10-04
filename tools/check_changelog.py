#!/usr/bin/env python3
"""Fail unless a push bumps VERSION and adds a matching CHANGELOG.md entry.

Usage: python3 tools/check_changelog.py [BASE_SHA]
With no BASE_SHA (or an all-zero one, e.g. a brand-new branch) only the
VERSION <-> CHANGELOG consistency is checked.
"""
import re
import subprocess
import sys

HEADING = re.compile(r"^## v(\d+\.\d+\.\d+) - (\d{4}-\d{2}-\d{2})\s*$", re.M)


def parse(v):
    return tuple(int(x) for x in v.strip().split("."))


def git(*args):
    return subprocess.run(["git", *args], capture_output=True, text=True, check=True).stdout


def main():
    errors = []
    version = open("VERSION").read().strip()
    if not re.fullmatch(r"\d+\.\d+\.\d+", version):
        errors.append(f"VERSION must look like 1.2.3, got {version!r}")
    headings = HEADING.findall(open("CHANGELOG.md").read())
    if not headings:
        errors.append("CHANGELOG.md has no '## vX.Y.Z - YYYY-MM-DD' sections")
    elif headings[0][0] != version:
        errors.append(f"Top CHANGELOG.md entry is v{headings[0][0]} but VERSION is {version}")

    base = sys.argv[1] if len(sys.argv) > 1 else ""
    if base and set(base) != {"0"}:
        changed = [f for f in git("diff", "--name-only", base, "HEAD").split() if f]
        if changed:
            if "CHANGELOG.md" not in changed:
                errors.append("This push changes files but does not update CHANGELOG.md")
            if "VERSION" not in changed:
                errors.append("This push changes files but does not bump VERSION")
            else:
                try:
                    old = git("show", f"{base}:VERSION").strip()
                    if parse(version) <= parse(old):
                        errors.append(f"VERSION {version} must be greater than the previous {old}")
                except subprocess.CalledProcessError:
                    pass  # VERSION didn't exist before this push

    if errors:
        print("Changelog / version check failed:\n  - " + "\n  - ".join(errors))
        sys.exit(1)
    print(f"OK: v{version} is logged in CHANGELOG.md")


if __name__ == "__main__":
    main()
