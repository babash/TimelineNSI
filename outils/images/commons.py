"""Fonctions communes : accès à l'API de Wikimedia Commons (lancé par GitHub Actions)."""
import html
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request

UA = "TimelineNSI-images/1.0 (https://github.com/babash/TimelineNSI)"
API = "https://commons.wikimedia.org/w/api.php"

# Largeurs de vignettes standard de Wikimedia (les autres peuvent être refusées).
LARGEURS = [250, 330, 500, 960, 1280, 1920]

EXTMETA = "|".join([
    "LicenseShortName", "License", "LicenseUrl", "UsageTerms", "Copyrighted",
    "AttributionRequired", "Restrictions", "Artist", "Credit", "ImageDescription",
    "ObjectName", "DateTimeOriginal",
])


def telecharger(url, essais=6):
    for i in range(essais):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=90) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and i < essais - 1:
                time.sleep(4 * (i + 1))
                continue
            raise
        except (urllib.error.URLError, TimeoutError):
            if i < essais - 1:
                time.sleep(4 * (i + 1))
                continue
            raise


def api(params):
    """Une requête query ; suit seulement les continuations de propriétés."""
    base = dict(params, action="query", format="json", formatversion="2", maxlag="5")
    pages = {}
    cont = {}
    while True:
        data = json.loads(telecharger(API + "?" + urllib.parse.urlencode(dict(base, **cont))))
        if "error" in data:
            if data["error"].get("code") == "maxlag":
                time.sleep(5)
                continue
            raise RuntimeError(data["error"])
        q = data.get("query", {})
        for pg in q.get("pages", []):
            cur = pages.setdefault(pg.get("title"), {})
            for k, v in pg.items():
                if k == "categories":
                    cur.setdefault("categories", []).extend(v)
                else:
                    cur.setdefault(k, v)
        c = data.get("continue")
        # On ne suit pas la continuation du générateur (résultats suivants).
        if c and any(k != "continue" and not k.startswith("gsr") for k in c):
            cont = {k: v for k, v in c.items()}
            continue
        break
    return pages, q.get("redirects", [])


def props(width):
    return {
        "prop": "imageinfo|categories",
        "iiprop": "url|size|mime|sha1|extmetadata",
        "iiurlwidth": str(width),
        "iiextmetadatafilter": EXTMETA,
        "iiextmetadatalanguage": "fr",
        "cllimit": "max",
    }


def texte(h):
    """HTML -> texte brut."""
    if not h:
        return ""
    h = re.sub(r"<br\s*/?>", " ", str(h))
    h = re.sub(r"<[^>]+>", "", h)
    h = html.unescape(h)
    return re.sub(r"\s+", " ", h).strip()


def meta(page):
    ii = (page.get("imageinfo") or [{}])[0]
    em = ii.get("extmetadata", {})
    m = {k: em.get(k, {}).get("value", "") for k in EXTMETA.split("|")}
    cats = [c["title"].replace("Category:", "") for c in page.get("categories", [])]
    return ii, m, cats


RE_LIC = re.compile(r"(CC|GFDL|PD|Public domain|licen|FAL|Free Art|copyright|Copyright|Attribution|BSD|GPL|MIT|Self-published|Flickr review|PD-)", re.I)


def categories_licence(cats):
    return [c for c in cats if RE_LIC.search(c)]


def verdict_licence(m, cats):
    """Classement automatique, à relire : OK, GFDL seule, NON, ?"""
    lic = (m.get("License") or "").lower()
    short = (m.get("LicenseShortName") or "").lower()
    tout = " ".join([lic, short] + [c.lower() for c in cats])
    if re.search(r"\bnc\b|-nc-|non-commercial|noncommercial|\bnd\b|-nd-|fair use|non-free", tout):
        return "NON"
    libre = re.search(r"^(pd|cc0|cc-by-\d|cc-by-sa-\d)", lic) or re.search(
        r"public domain|^cc0|^cc by|^cc-by|domaine public", short)
    if libre:
        return "OK"
    cats_libres = [c for c in cats if re.search(r"^(CC-BY|CC-Zero|CC0|PD[- ]|Public domain)", c, re.I)]
    if cats_libres:
        return "OK (catégories)"
    if "gfdl" in tout:
        return "GFDL seule"
    return "?"
