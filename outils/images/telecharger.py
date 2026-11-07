#!/usr/bin/env python3
"""Second passage : télécharge les images retenues dans choix.csv et écrit data/images.csv.

choix.csv : carte,fichier,format,recadrage,auteur,description
  fichier    nom du fichier sur Commons (sans « File: ») ;
  format     jpg (photo) ou png (schéma, SVG) ;
  recadrage  vide, ou « g,h,d,b » en fractions de l'image (ex. 0,0,1,0.5) ;
  auteur     vide (pris dans l'API), sinon la forme courte à citer, tirée du champ Artist ;
  description  texte alternatif, en français.
L'auteur, la licence, son adresse et la page Commons viennent de l'API.
Les schémas originaux (outils/schemas/, lignes de data/images.csv sans page Commons)
sont gardés tels quels, avec leurs fichiers, sauf si choix.csv donne une image pour la carte.
"""
import csv
import io
import json
import math
import re
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import commons as C  # noqa: E402

ICI = Path(__file__).resolve().parent
DEPOT = ICI.parent.parent
IMAGES = DEPOT / "images"
CSV_SORTIE = DEPOT / "data" / "images.csv"
MANIFESTE = ICI / "manifeste.json"
RAPPORT = ICI / "resultats" / "telechargement.txt"
# Cadre des images : la zone d'image d'une carte A5 mesure au plus environ 119 x 64 mm.
# 1000 px de large donnent au moins 213 ppp sur toute la largeur, 750 px de haut au moins 298 ppp :
# aucune perte visible à l’impression, pour des fichiers (et des PDF) plus légers.
LARGEUR_MAX = 1000
HAUTEUR_MAX = 750
POIDS_MAX = 250_000
COLONNES = ["carte", "fichier", "page_commons", "auteur", "licence", "url_licence", "description"]


def apostrophes(texte):
    """Une seule forme d'apostrophe : l'apostrophe typographique."""
    return re.sub(r"['`´]", "’", texte or "")


def licence_courte(m, cats):
    lic = (m.get("License") or "").lower()
    short = m.get("LicenseShortName") or ""
    url = m.get("LicenseUrl") or ""
    if lic.startswith("gfdl") or short.upper().startswith("GFDL"):
        # Fichier à licences multiples : on prend la licence CC trouvée dans les catégories.
        for c in cats:
            mm = re.match(r"^CC-(BY(?:-SA)?)-(\d\.\d)(?:-(\w+))?$", c)
            if mm:
                short = f"CC {mm.group(1)} {mm.group(2)}" + (f" {mm.group(3).upper()}" if mm.group(3) else "")
                kind = mm.group(1).lower()
                url = f"https://creativecommons.org/licenses/{kind}/{mm.group(2)}/"
                if mm.group(3):
                    url += f"{mm.group(3).lower()}/"
                break
    if re.match(r"(?i)^(public domain|pd)", short) or lic.startswith("pd"):
        short = "Domaine public"
    elif re.match(r"(?i)^cc0", short):
        short = "CC0"
    else:
        short = re.sub(r"\b(fr|de|it|es|nl|at|ch|br|jp)\b$", lambda x: x.group(1).upper(), short.strip())
    url = url.replace("http://", "https://")
    return short, url


def auteur_api(m):
    """Auteur du champ Artist de l'API. Auteur non nommé : « Photographe inconnu » ou « Auteur inconnu »,
    comme sur Commons (le champ peut contenir les deux langues collées : « Auteur inconnuUnknown author »)."""
    a = C.texte(m.get("Artist"))
    a = re.sub(r"(?i)^(photo(graph)?( taken)? by|photographed by|by|author:)\s*", "", a).strip(" .")
    if re.search(r"(?i)photographe inconnu|unknown photographer", a):
        return "Photographe inconnu"
    if not a or re.search(r"(?i)auteur inconnu|unknown author|^unknown$|^anonym", a):
        return "Auteur inconnu"
    return a


def recadrage_fractions(recadrage):
    if not recadrage:
        return 0.0, 0.0, 1.0, 1.0
    return tuple(float(x) for x in recadrage.split(","))


def largeur_vignette(w, h, recadrage):
    """Largeur de vignette Commons qui suffit pour remplir le cadre après recadrage."""
    g, hh, d, b = recadrage_fractions(recadrage)
    fw, fh = d - g, b - hh
    besoin = math.ceil(min(LARGEUR_MAX / fw, HAUTEUR_MAX * w / (h * fh)))
    for L in C.LARGEURS:
        if L >= besoin:
            return L
    return C.LARGEURS[-1]


def enregistrer(donnees, fmt, recadrage, chemin):
    im = Image.open(io.BytesIO(donnees))
    im.load()
    if im.mode in ("RGBA", "LA", "P", "PA"):
        im = im.convert("RGBA")
        fond = Image.new("RGBA", im.size, "white")
        fond.alpha_composite(im)
        im = fond
    im = im.convert("RGB")
    if recadrage:
        g, hh, d, b = recadrage_fractions(recadrage)
        W, H = im.size
        im = im.crop((round(g * W), round(hh * H), round(d * W), round(b * H)))
    if im.width > LARGEUR_MAX or im.height > HAUTEUR_MAX:
        im.thumbnail((LARGEUR_MAX, HAUTEUR_MAX), Image.LANCZOS)
    if fmt == "png":
        buf = io.BytesIO()
        im.save(buf, "PNG", optimize=True)
        if buf.tell() > POIDS_MAX:
            buf = io.BytesIO()
            im.quantize(colors=256, method=Image.Quantize.MEDIANCUT).save(buf, "PNG", optimize=True)
    else:
        for q in (85, 80, 75, 70, 65, 60):
            buf = io.BytesIO()
            im.save(buf, "JPEG", quality=q, optimize=True, progressive=True)
            if buf.tell() <= POIDS_MAX:
                break
    chemin.write_bytes(buf.getvalue())
    return im.size, buf.tell()


def main():
    chemin_choix = ICI / "choix.csv"
    if not chemin_choix.exists():
        print("Pas de choix.csv")
        return
    with chemin_choix.open(encoding="utf-8", newline="") as f:
        choix = [r for r in csv.DictReader(f) if r.get("carte", "").strip() and r.get("fichier", "").strip()]
    manifeste = json.loads(MANIFESTE.read_text(encoding="utf-8")) if MANIFESTE.exists() else {}
    IMAGES.mkdir(exist_ok=True)
    RAPPORT.parent.mkdir(exist_ok=True)
    sortie, rapport, gardes = [], [], set()
    # Schémas originaux : lignes sans page Commons, gardées avec leur fichier.
    cartes_choix = {r["carte"].strip() for r in choix}
    if CSV_SORTIE.exists():
        with CSV_SORTIE.open(encoding="utf-8", newline="") as f:
            for r in csv.DictReader(f):
                if r.get("page_commons", "").strip() or r["carte"].strip() in cartes_choix:
                    continue
                sortie.append({k: r.get(k, "") for k in COLONNES})
                gardes.add(Path(r["fichier"]).name)
                rapport += [f"[{r['carte']}] schéma original gardé : {r['fichier']}", ""]
    for r in sorted(choix, key=lambda r: int(r["carte"])):
        n = r["carte"].strip()
        fichier = r["fichier"].strip()
        fmt = (r.get("format") or "jpg").strip().lower()
        recad = (r.get("recadrage") or "").strip()
        titre = "File:" + fichier
        pages, _ = C.api(dict(C.props(330), titles=titre, redirects="1"))
        pg = next(iter(pages.values()))
        if pg.get("missing") or "imageinfo" not in pg:
            rapport.append(f"[{n}] {fichier} : ABSENT")
            continue
        ii, m, cats = C.meta(pg)
        verdict = C.verdict_licence(m, cats)
        w, h, mime = ii["width"], ii["height"], ii["mime"]
        L = largeur_vignette(w, h, recad)
        nom = f"{n}.{fmt}"
        cle = {"fichier": fichier, "sha1": ii.get("sha1"), "format": fmt, "recadrage": recad,
               "cadre": f"{LARGEUR_MAX}x{HAUTEUR_MAX}"}
        cible = IMAGES / nom
        if manifeste.get(n) == cle and cible.exists():
            taille = Image.open(cible).size
            poids = cible.stat().st_size
        else:
            # SVG, PDF, DjVu : on télécharge la page rendue par Commons (le fichier lui-même n'est pas une image).
            if mime in ("image/svg+xml", "application/pdf", "image/vnd.djvu") or L < w:
                pages2, _ = C.api(dict(C.props(L), titles=titre, redirects="1"))
                url = next(iter(pages2.values()))["imageinfo"][0]["thumburl"]
            else:
                url = ii["url"]
            taille, poids = enregistrer(C.telecharger(url), fmt, recad, cible)
            manifeste[n] = cle
        gardes.add(nom)
        lic, url_lic = licence_courte(m, cats)
        auteur = apostrophes((r.get("auteur") or "").strip() or auteur_api(m))
        sortie.append({
            "carte": n, "fichier": f"images/{nom}", "page_commons": ii["descriptionurl"],
            "auteur": auteur, "licence": lic, "url_licence": url_lic,
            "description": apostrophes((r.get("description") or "").strip()),
        })
        rapport += [
            f"[{n}] {fichier}",
            f"    original {w}x{h} {mime} ; sortie {taille[0]}x{taille[1]} {poids // 1024} ko",
            f"    licence API : {m['LicenseShortName']} | {m['License']} | {m['LicenseUrl']} -> {verdict} ; retenue : {lic} {url_lic}",
            f"    Artist : {C.texte(m['Artist'])}",
            f"    Credit : {C.texte(m['Credit'])}",
            f"    auteur retenu : {auteur}",
            f"    Restrictions : {C.texte(m['Restrictions'])} ; AttributionRequired : {m['AttributionRequired']}",
            f"    description API : {C.texte(m['ImageDescription'])[:300]}",
            f"    catégories licence : {'; '.join(C.categories_licence(cats))}",
            "",
        ]
    # Images qui ne sont plus retenues.
    for p in IMAGES.glob("*"):
        if re.match(r"^\d+\.(jpg|png)$", p.name) and p.name not in gardes:
            p.unlink()
    # Le manifeste ne décrit que les images de Commons (pas les schémas originaux).
    for k in list(manifeste):
        if k not in cartes_choix:
            del manifeste[k]
    MANIFESTE.write_text(json.dumps(manifeste, ensure_ascii=False, indent=1, sort_keys=True), encoding="utf-8")
    sortie.sort(key=lambda r: int(r["carte"]))
    with CSV_SORTIE.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=COLONNES)
        w.writeheader()
        w.writerows(sortie)
    total = sum(p.stat().st_size for p in IMAGES.glob("*") if p.is_file())
    rapport.append(f"TOTAL : {len(sortie)} images, {total // 1024} ko")
    RAPPORT.write_text("\n".join(rapport), encoding="utf-8")
    print(rapport[-1])


if __name__ == "__main__":
    main()
