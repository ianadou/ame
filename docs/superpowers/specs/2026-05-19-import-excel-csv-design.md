# Import Excel/CSV — Design

Date : 2026-05-19
Statut : validé (design approuvé, en attente revue spec)
Branche : `feature/import-excel-csv`

## Contexte & objectif

À la livraison chez le client, la base est vide. Le client remplace un workflow
Excel existant : il faut pouvoir **charger ses données initiales** (stock,
catégories, fournisseurs, chantiers) depuis des fichiers Excel/CSV, sans saisie
manuelle. La même fonction servira aussi aux imports ponctuels ultérieurs.

Cohérent avec l'architecture décidée (cf. `memory/project_architecture_deploiement.md`) :
toute la logique reste côté serveur Nitro pour fonctionner à l'identique une
fois packagée en sidecar Tauri.

## Périmètre

Entités importables (chacune indépendamment) : **articles, catégories,
fournisseurs, chantiers**.

Formats acceptés : **CSV** et **Excel `.xlsx`**.

Comportement : **upsert** sur clé + **import partiel** (lignes valides
appliquées, lignes en erreur listées dans un rapport).

Parcours : **aperçu/validation (dry-run) avant application**, puis confirmation
→ application → rapport final.

## Hors périmètre (YAGNI)

- Export de données (feature séparée, Phase 5 du spec produit).
- UI de re-mapping de colonnes (on impose en-têtes + alias + modèle).
- Import de `mouvements` / `commandes` (données d'audit immuables — passage
  obligatoire par le flux normal).
- Génération de modèle `.xlsx` (le modèle CSV s'ouvre dans Excel).
- Traitement asynchrone / jobs en arrière-plan (requête synchrone suffisante à
  cette échelle).
- Notifications push (sujet distinct, différé).

## Architecture

Approche retenue : **parsing côté serveur Nitro** (source unique de vérité,
réutilise zod + Drizzle existants, bundle client léger, comportement identique
en sidecar Tauri).

### Endpoints

- `POST /api/import/:entite`
  - `entite` ∈ `articles | categories | fournisseurs | chantiers` (sinon 400).
  - Corps : `multipart/form-data`, champ fichier `file`.
  - Query `?dryRun=1` : parse + valide, **aucune écriture**, renvoie rapport
    + aperçu.
  - Sans `dryRun` : applique l'upsert (transaction), renvoie le rapport final.
- `GET /api/import/:entite/modele`
  - Renvoie un fichier **CSV** (téléchargement) : ligne d'en-têtes correcte
    + 1 ligne d'exemple. `Content-Type: text/csv`,
    `Content-Disposition: attachment; filename="modele-<entite>.csv"`.

### Lib & parsing

- CSV : `csv-parse` (dépendance à ajouter). Gère guillemets, sauts de ligne
  embarqués, et **délimiteur auto `;` ou `,`** (l'Excel FR exporte en `;`).
- XLSX : `exceljs` (dépendance à ajouter). Lecture de la **1ʳᵉ feuille**.
  Choix explicite de NE PAS utiliser le paquet npm `xlsx`/SheetJS (avis de
  sécurité).
- En-têtes : 1ʳᵉ ligne. Mapping insensible à la casse et aux accents, après
  `trim`, via une table d'**alias** par colonne (libellés FR + noms de champs).
- Normalisation numérique : `prixUnitaire`, `stockActuel`, `seuilAlerte`
  acceptent le format FR (`1 234,50` → `1234.5`, espaces/insécables retirés).
- Encodage CSV : décodage UTF-8 par défaut, repli Latin-1 (Excel FR) si
  séquence UTF-8 invalide détectée.

## Contrat par entité

Colonnes obligatoires marquées `*`. Les colonnes inconnues sont ignorées
(signalées en avertissement dans le rapport).

### Articles — clé d'upsert : `reference` (UNIQUE en base)

| Colonne | Type | Règle |
|---|---|---|
| reference* | string | clé d'upsert |
| nom* | string | |
| categorie | string (nom) | résolue par nom ; **créée à plat si absente** |
| unite | string | défaut `pièce` |
| prixUnitaire | number | format FR accepté ; optionnel |
| stockActuel | int | défaut 0 |
| seuilAlerte | int | défaut 5 |
| emplacement | string | optionnel |
| notes | string | optionnel |

### Catégories — clé d'upsert : `nom` (clé applicative)

| Colonne | Type | Règle |
|---|---|---|
| nom* | string | clé d'upsert |
| description | string | optionnel |
| parent | string (nom) | résolu par nom ; si introuvable → erreur de ligne |

### Fournisseurs — clé d'upsert : `nom` (clé applicative)

`nom*`, `contact`, `telephone`, `email` (validé format e-mail si présent),
`adresse`, `notes`.

### Chantiers — clé d'upsert : `nom` (clé applicative)

`nom*`, `adresse`, `statut` (∈ `en_cours|termine|en_pause`, défaut `en_cours`),
`dateDebut`, `dateFin`, `notes`.

### Clé applicative non-unique

`reference` (articles) est UNIQUE en base. Pour catégories/fournisseurs/
chantiers, l'upsert se fait par `nom` au niveau applicatif (SELECT par `nom`
puis UPDATE/INSERT). Si **plusieurs** lignes existantes matchent la clé →
la ligne d'import est mise en **erreur** (`upsert ambigu`), aucune écriture
pour cette ligne.

## Validation & rapport

### Schémas

Schémas zod **dédiés import** dans `server/utils/validation.ts`
(`importArticleSchema`, etc.), alignés sur les schémas existants mais avec
coercition des chaînes (CSV) vers nombres/enum et valeurs par défaut. La
résolution `categorie`/`parent` (nom → id) se fait après validation de forme,
avant écriture.

### Forme du rapport (JSON)

```
{
  entite: "articles",
  total: 120,            // lignes de données lues (hors en-tête)
  valides: 117,
  crees: 90,             // (apply uniquement)
  maj: 27,               // (apply uniquement)
  avertissements: [ "Colonne inconnue ignorée : « TVA »" ],
  erreurs: [ { ligne: 14, champ: "prixUnitaire", message: "nombre invalide : « abc »" } ],
  apercu: [ { ligne: 2, action: "create", donnees: { ... } } ]   // dryRun seulement, max 100
}
```

### Application

- Lignes invalides : écartées et listées dans `erreurs` (n° de ligne =
  numéro de ligne du fichier, en-tête = ligne 1).
- Lignes valides : appliquées dans **une transaction** (`db.transaction`).
  Atomicité de l'ensemble appliqué : si une erreur DB survient pendant
  l'application, rollback complet et rapport d'échec global. Les erreurs de
  validation de ligne sont filtrées **avant** toute écriture (donc pas de
  rollback pour ces cas — import partiel assumé).
- Réponse `?dryRun=1` : identique mais sans écriture, `crees/maj` absents,
  `apercu` renseigné (max 100 lignes).

### Garde-fous

- Fichier vide / 0 ligne de données → 400, message clair.
- Colonne(s) obligatoire(s) absente(s) → 400, message listant les colonnes
  attendues (rejet global, pas de traitement ligne à ligne).
- Taille max **5 Mo** et **5000 lignes** → 400 si dépassé.
- Extension non `.csv`/`.xlsx` → 400.

## UI/UX

### Composant `ImportDialog` (réutilisable, modal)

États successifs :
1. **Sélection** : zone déposer/choisir un fichier (`.csv,.xlsx`) + lien
   « Télécharger le modèle » (`GET /api/import/:entite/modele`).
2. **Aperçu** : appel auto `?dryRun=1` au dépôt → affiche compteurs
   (total / valides / erreurs), table des premières lignes (`apercu`), liste
   des erreurs et avertissements. Bouton **« Appliquer l'import »** (désactivé
   si 0 ligne valide).
3. **Résultat** : appel sans `dryRun` → rapport final (créés / mis à jour /
   erreurs), bouton **« Télécharger les erreurs (CSV) »**, fermeture →
   rafraîchit la liste de la page.

### Points d'entrée

- Bouton **« Importer »** (variante secondaire, icône Upload), à côté de
  « Ajouter », sur les pages liste **Stock**, **Fournisseurs**, **Chantiers**.
- Pas de page Catégories dans l'app → le modal de la page **Stock** propose
  un sélecteur d'entité **Articles / Catégories** (les deux relèvent du
  stock). Aucune page nouvelle à créer.

### Composable

`useImport(entite)` : `previsualiser(file)` → rapport dry-run ;
`appliquer(file)` → rapport final ; `urlModele`.

## Vérification

Le projet n'a **pas de framework de test** (cohérent Phases 1-4) ; on ne
l'introduit pas unilatéralement dans cette feature. Vérification par :

- `bun run lint` (0 erreur attendu).
- Scripts smoke : pour chaque entité, un fichier CSV **et** un fichier XLSX
  d'exemple → `?dryRun=1` (vérifier compteurs/erreurs/aperçu) puis apply
  (vérifier créés/maj, ré-exécution = idempotence par upsert), plus un cas
  d'erreur (colonne manquante, type invalide, upsert ambigu).
- Contrôle visuel du `ImportDialog` (dépôt → aperçu → application → refresh).

## Dépendances à ajouter

- `csv-parse` (parsing CSV serveur).
- `exceljs` (lecture XLSX serveur).

## Risques / points ouverts

- Format de date (`dateDebut/dateFin` chantiers) : on attend ISO `YYYY-MM-DD`.
  Les dates Excel peuvent arriver en numéro de série (xlsx) → `exceljs` les
  restitue en `Date` ; on formate en `YYYY-MM-DD`. Pour CSV, on impose
  `YYYY-MM-DD` (documenté dans le modèle), sinon erreur de ligne.
- Détection délimiteur CSV : auto sur la 1ʳᵉ ligne (`;` vs `,`) ; si ambigu,
  défaut `;` (Excel FR) — documenté dans le modèle.
