#!/usr/bin/env python3
"""Download openly licensed Wikimedia Commons photos for the demo trail.

Photos stay under their original licenses. The app code is MIT; these files are not.
"""

from __future__ import annotations

import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

OUT = Path("/workspace/public/seed")
OUT.mkdir(parents=True, exist_ok=True)

UA = "FieldnoteDemo/1.0 (Hacktoberfest educational demo; species field guide)"

QUERIES = [
    ("pied-kingfisher", "Pied kingfisher Ceryle rudis"),
    ("african-fish-eagle", "African fish eagle Haliaeetus vocifer"),
    ("village-weaver", "Village weaver Ploceus cucullatus male"),
    ("african-grey", "African grey parrot Psittacus erithacus"),
    ("cattle-egret", "Cattle egret Bubulcus ibis"),
    ("hooded-vulture", "Hooded vulture Necrosyrtes monachus"),
    ("olive-baboon", "Olive baboon Papio anubis"),
    ("forest-elephant", "African forest elephant Loxodonta cyclotis"),
    ("hippo", "Hippopotamus amphibius"),
    ("agama", "Agama agama red headed lizard"),
    ("mona-monkey", "Mona monkey Cercopithecus mona"),
    ("roan", "Roan antelope Hippotragus equinus"),
    ("oil-palm", "Elaeis guineensis oil palm fruit"),
    ("baobab", "Adansonia digitata baobab"),
    ("swallowtail", "Papilio demodocus butterfly"),
    ("goliath", "Goliath beetle Goliathus"),
    ("flamboyant", "Delonix regia red flowers"),
    ("sunbird", "splendid sunbird Cinnyris"),
    ("bee-eater", "Little bee-eater Merops pusillus"),
    ("malachite", "Malachite kingfisher Corythornis"),
    ("hero", "sunlit tropical forest path"),
    ("canopy", "rainforest canopy walkway"),
    ("hornbill", "Yellow-casqued hornbill"),
    ("buffalo", "African buffalo Syncerus caffer"),
    ("jacana", "African jacana Actophilornis"),
    ("robin", "European robin Erithacus rubecula"),
]


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as res:
        return res.read()


def license_ok(name: str) -> bool:
    text = (name or "").lower()
    if any(bad in text for bad in ("noncommercial", "non-commercial", "-nc", "nc-sa", "by-nc")):
        return False
    return any(
        good in text
        for good in (
            "cc0",
            "public domain",
            "cc by",
            "cc-by",
            "attribution",
            "no restrictions",
        )
    )


def search(query: str) -> list[dict]:
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": f"filetype:bitmap {query}",
        "gsrnamespace": "6",
        "gsrlimit": "8",
        "prop": "imageinfo",
        "iiprop": "url|mime|size|extmetadata",
        "iiurlwidth": "1600",
    }
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    data = json.loads(fetch(url))
    pages = (data.get("query") or {}).get("pages") or {}
    found = []
    for page in pages.values():
        info = (page.get("imageinfo") or [None])[0]
        if not info:
            continue
        mime = info.get("mime") or ""
        if mime not in ("image/jpeg", "image/png", "image/webp"):
            continue
        width = info.get("thumbwidth") or info.get("width") or 0
        if width < 800:
            continue
        meta = info.get("extmetadata") or {}
        license_name = (meta.get("LicenseShortName") or {}).get("value") or ""
        if not license_ok(license_name):
            continue
        artist = (meta.get("Artist") or {}).get("value") or ""
        credit = (meta.get("Credit") or {}).get("value") or ""
        desc = (meta.get("ImageDescription") or {}).get("value") or ""
        found.append(
            {
                "title": page.get("title"),
                "license": license_name,
                "artist": artist,
                "credit": credit,
                "description": desc,
                "page": (meta.get("LicenseUrl") or {}).get("value")
                or f"https://commons.wikimedia.org/wiki/{urllib.parse.quote((page.get('title') or '').replace(' ', '_'))}",
                "url": info.get("thumburl") or info.get("url"),
                "source": info.get("descriptionurl"),
                "width": width,
            }
        )
    found.sort(key=lambda item: item["width"], reverse=True)
    return found


def strip_html(value: str) -> str:
    import re

    text = re.sub(r"<[^>]+>", " ", value or "")
    return re.sub(r"\s+", " ", text).strip()


def main() -> None:
    credits = []
    for slug, query in QUERIES:
        dest = OUT / f"{slug}.jpg"
        if dest.exists() and dest.stat().st_size > 20_000:
            print(f"skip {slug}")
            continue
        try:
            hits = search(query)
        except Exception as exc:  # noqa: BLE001
            print(f"FAIL search {slug}: {exc}")
            time.sleep(1)
            continue
        if not hits:
            print(f"NONE {slug}")
            time.sleep(0.6)
            continue
        hit = hits[0]
        try:
            raw = fetch(hit["url"])
        except Exception as exc:  # noqa: BLE001
            print(f"FAIL download {slug}: {exc}")
            time.sleep(1)
            continue
        dest.write_bytes(raw)
        credits.append(
            {
                "file": f"/seed/{slug}.jpg",
                "slug": slug,
                "title": hit["title"],
                "license": hit["license"],
                "artist": strip_html(hit["artist"]),
                "source": hit["source"],
                "licenseUrl": hit["page"],
                "query": query,
            }
        )
        print(f"OK {slug} {hit['license']} {len(raw)//1024}KB {hit['title']}")
        time.sleep(0.8)

    credit_path = OUT / "credits.json"
    existing = []
    if credit_path.exists():
        existing = json.loads(credit_path.read_text())
    by_file = {item["file"]: item for item in existing}
    for item in credits:
        by_file[item["file"]] = item
    credit_path.write_text(json.dumps(list(by_file.values()), indent=2))
    print(f"credits {len(by_file)}")


if __name__ == "__main__":
    main()
