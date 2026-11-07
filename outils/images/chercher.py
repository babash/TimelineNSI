#!/usr/bin/env python3
"""Premier passage : cherche des candidates sur Commons pour chaque carte de requetes.json.

Pour chaque carte, écrit dans resultats/ :
  <n>.txt  le résumé des candidates (taille, licence, auteur, description) ;
  <n>.jpg  une planche d'aperçus numérotés (moins de 50 ko).
Une carte déjà traitée avec les mêmes requêtes n'est pas refaite.
Mettre "_actif": true dans requetes.json pour relancer des recherches ;
"_cartes": ["76", "77"] limite la recherche à ces cartes.
"""
import hashlib
import io
import json
import sys
import time
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
import commons as C  # noqa: E402

ICI = Path(__file__).resolve().parent
RES = ICI / "resultats"
TUILE = 210
COLS = 4
MAX_CAND = 16


def police(taille):
    for f in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]:
        try:
            return ImageFont.truetype(f, taille)
        except OSError:
            pass
    return ImageFont.load_default()


def candidates(req):
    largeur = 500 if req.get("tuile", TUILE) > 300 else 330
    vues = {}
    ordre = []
    titres = req.get("titres", [])
    if titres:
        pages, _ = C.api(dict(C.props(largeur), titles="|".join(titres), redirects="1"))
        rang = {t: i for i, t in enumerate(titres)}
        for t, pg in sorted(pages.items(), key=lambda kv: rang.get(kv[0], 999)):
            if pg.get("missing") or "imageinfo" not in pg:
                ordre.append((t, None))
                continue
            vues[t] = pg
            ordre.append((t, pg))
    for s in req.get("recherches", []):
        lim = req.get("limite", 6)
        pages, _ = C.api(dict(C.props(largeur), generator="search", gsrsearch=s,
                              gsrnamespace="6", gsrlimit=str(lim)))
        for t, pg in sorted(pages.items(), key=lambda kv: kv[1].get("index", 0)):
            if t in vues or "imageinfo" not in pg:
                continue
            vues[t] = pg
            ordre.append((t, pg))
        time.sleep(0.3)
    return ordre


def planche(liste, chemin, tuile=TUILE, cols=COLS):
    TUILE, COLS = tuile, cols
    n = len(liste)
    lignes = max(1, (n + COLS - 1) // COLS)
    img = Image.new("RGB", (COLS * TUILE, lignes * TUILE), "white")
    d = ImageDraw.Draw(img)
    f = police(22)
    for i, (num, url) in enumerate(liste):
        x, y = (i % COLS) * TUILE, (i // COLS) * TUILE
        try:
            im = Image.open(io.BytesIO(C.telecharger(url)))
            if im.mode in ("RGBA", "LA", "P"):
                im = im.convert("RGBA")
                fond = Image.new("RGBA", im.size, "white")
                fond.alpha_composite(im)
                im = fond
            im = im.convert("RGB")
            im.thumbnail((TUILE - 6, TUILE - 6))
            img.paste(im, (x + (TUILE - im.width) // 2, y + (TUILE - im.height) // 2))
        except Exception as e:  # noqa: BLE001
            d.text((x + 10, y + 90), "erreur", fill="red", font=f)
            print("  aperçu", num, e)
        d.rectangle([x, y, x + 34, y + 28], fill="black")
        d.text((x + 4, y + 2), str(num), fill="yellow", font=f)
        d.rectangle([x, y, x + TUILE - 1, y + TUILE - 1], outline="#888")
        time.sleep(0.15)
    limite = 50_000 if TUILE <= 300 else 120_000
    for q in (60, 50, 42, 35, 28):
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=q, optimize=True)
        if buf.tell() < limite:
            break
    chemin.write_bytes(buf.getvalue())


def main():
    reqs = json.loads((ICI / "requetes.json").read_text(encoding="utf-8"))
    if not reqs.get("_actif", True):
        print("Recherche désactivée (_actif = false dans requetes.json)")
        return
    RES.mkdir(exist_ok=True)
    seules = set(reqs.get("_cartes") or [])
    for carte, req in reqs.items():
        if carte.startswith("_") or (seules and carte not in seules):
            continue
        empreinte = hashlib.sha1(json.dumps(req, sort_keys=True).encode()).hexdigest()[:12]
        txt = RES / f"{carte}.txt"
        if txt.exists() and empreinte in txt.read_text(encoding="utf-8").splitlines()[0]:
            continue
        print("Carte", carte)
        try:
            ordre = candidates(req)
        except Exception as e:  # noqa: BLE001
            print("  ERREUR", e)
            txt.write_text(f"# carte {carte} requêtes {empreinte}-erreur\nERREUR {e}\n", encoding="utf-8")
            continue
        lignes = [f"# carte {carte} requêtes {empreinte}", json.dumps(req, ensure_ascii=False), ""]
        apercus = []
        num = 0
        for t, pg in ordre:
            if pg is None:
                lignes.append(f"--  {t} : ABSENT de Commons\n")
                continue
            num += 1
            if num > MAX_CAND:
                break
            ii, m, cats = C.meta(pg)
            lignes += [
                f"[{num}] {t}",
                f"    taille {ii.get('width')}x{ii.get('height')} {ii.get('mime')} {ii.get('size', 0) // 1024} ko",
                f"    licence : {m['LicenseShortName']} | {m['License']} | {m['LicenseUrl']} -> {C.verdict_licence(m, cats)}",
                f"    auteur : {C.texte(m['Artist'])[:200]}",
                f"    crédit : {C.texte(m['Credit'])[:200]}",
                f"    description : {C.texte(m['ImageDescription'])[:400]}",
                f"    catégories licence : {'; '.join(C.categories_licence(cats))[:300]}",
                f"    catégories : {'; '.join(c for c in cats if c not in C.categories_licence(cats))[:400]}",
                "",
            ]
            apercus.append((num, ii.get("thumburl") or ii.get("url")))
        txt.write_text("\n".join(lignes), encoding="utf-8")
        planche(apercus, RES / f"{carte}.jpg", req.get("tuile", TUILE), req.get("colonnes", COLS))


if __name__ == "__main__":
    main()
