---
title: "Fiche NSI – Exemple d’affichage complet"
footer: "Exemple de mise en page A4 optimisée"
---

<section>
  <h2 data-icon="📌">Objectifs</h2>
  <ul>
    <li>Synthétiser les éléments clés d’un chapitre.</li>
    <li>Illustrer avec un extrait de code concis.</li>
    <li>Donner 1 à 2 repères visuels (tableau, schéma).</li>
  </ul>
</section>

<section>
  <h2 data-icon="💡">Définitions</h2>
  <p><strong>Algorithme</strong> : suite finie d’instructions permettant de résoudre un problème.</p>
  <p><strong>Complexité</strong> : quantité de ressources (temps, mémoire) consommées par un algorithme.</p>
</section>

<section>
  <h2 data-icon="🐍">Code Python (basique)</h2>
  <pre><code class="language-python">def somme(liste):
    total = 0
    for x in liste:
        total += x
    return total

print(somme([1, 2, 3]))  # 6
</code></pre>
</section>

<section>
  <h2 data-icon="⚙️">Idiomes Python</h2>
  <pre><code class="language-python"># Compréhension de liste
evens = [x for x in range(10) if x % 2 == 0]
# Slicing
s = "NSI"
print(s[::-1])  # ISN
</code></pre>
</section>

<section>
  <h2 data-icon="🧭">Tableau compact</h2>
  <table>
    <thead>
      <tr><th>Structure</th><th>Mutable</th><th>Clés/Index</th></tr>
    </thead>
    <tbody>
      <tr><td>list</td><td>Oui</td><td>Index entiers</td></tr>
      <tr><td>tuple</td><td>Non</td><td>Index entiers</td></tr>
      <tr><td>dict</td><td>Oui</td><td>Clés hachables</td></tr>
    </tbody>
  </table>
</section>

<section>
  <h2 data-icon="🖼️">Schéma (image)</h2>
  <p>
    <img src="/img/fond1.png" alt="Illustration générique" width="500" />
  </p>
</section>

<section>
  <h2 data-icon="🗒️">Note</h2>
  <blockquote>Astuce : préférez plusieurs petites sections à une seule très dense.</blockquote>
  <p>Voir aussi : <a href="https://docs.python.org/3/" target="_blank" rel="noopener noreferrer">Documentation Python</a>.</p>
</section>