# API GraphQL de la Base de Données Publique des Médicaments

Démarrer le serveur :

```bash
node src/server.js
```

## Exemples

### Requête par code

Exemple de requête :

```graphql
{
  medicaments(codes_CIS: [62204255]) {
    code_CIS
    denomination
    presentations {
      code_CIP7
      code_CIP13
      libelle
      taux_remboursement
      prix_sans_honoraires
      prix_avec_honoraires
    }
    substances {
      substance {
        code_substance
        denomination
      }
      dosage_substance
      reference_dosage
      designation_element_pharmaceutique
    }
  }
  
  presentations(codes_CIP7_ou_CIP13: [3334167, 3400938235296]) {
    code_CIP7
    code_CIP13
    libelle
  }
  
  substances(codes_substances: [39727]) {
    code_substance
    denomination
  }
}
```

Réponse :

```json
{
  "data": {
    "medicaments": [
      {
        "code_CIS": "62204255",
        "denomination": "AMLODIPINE PFIZER 5 mg, gélule",
        "presentations": [
          {
            "code_CIP7": "3334167",
            "code_CIP13": "3400933341671",
            "libelle": "plaquette(s) PVC PVDC aluminium de 30 gélule(s)",
            "taux_remboursement": 65,
            "prix_sans_honoraires": 4.36,
            "prix_avec_honoraires": 5.38
          },
          {
            "code_CIP7": "3823529",
            "code_CIP13": "3400938235296",
            "libelle": "plaquette(s) PVC PVDC aluminium de 90 gélule(s)",
            "taux_remboursement": 65,
            "prix_sans_honoraires": 12.32,
            "prix_avec_honoraires": 15.08
          }
        ],
        "substances": [
          {
            "substance": {
              "code_substance": "39727",
              "denomination": "AMLODIPINE"
            },
            "dosage_substance": "5 mg",
            "reference_dosage": "une gélule",
            "designation_element_pharmaceutique": "gélule"
          },
          {
            "substance": {
              "code_substance": "93748",
              "denomination": "AMLODIPINE (BÉSILATE D')"
            },
            "dosage_substance": "6,944 mg",
            "reference_dosage": "une gélule",
            "designation_element_pharmaceutique": "gélule"
          }
        ]
      }
    ],
    "presentations": [
      {
        "code_CIP7": "3334167",
        "code_CIP13": "3400933341671",
        "libelle": "plaquette(s) PVC PVDC aluminium de 30 gélule(s)"
      },
      {
        "code_CIP7": "3823529",
        "code_CIP13": "3400938235296",
        "libelle": "plaquette(s) PVC PVDC aluminium de 90 gélule(s)"
      }
    ],
    "substances": [
      {
        "code_substance": "39727",
        "denomination": "AMLODIPINE"
      }
    ]
  }
}
```

### Requête paginée

Exemple de requête :

```graphql
{
  page_1: presentations(limit: 3, from: 0) {
    code_CIP7
    libelle
  }
  
  page_2: presentations(limit: 3, from: 3) {
    code_CIP7
    libelle
  }
  
  pages_1_et_2: presentations(limit: 6) {
    code_CIP7
    libelle
  }
}
```

Réponse :

```json
{
  "data": {
    "page_1": [
      {
        "code_CIP7": "2160191",
        "libelle": "plaquette(s) thermoformée(s) aluminium de 28 comprimé(s)"
      },
      {
        "code_CIP7": "2160363",
        "libelle": "4 poche(s) bicompartimenté(e)(s) polymère multicouches BIOFINE de 1000 ml"
      },
      {
        "code_CIP7": "2160417",
        "libelle": "flacon(s) polyéthylène haute densité (PEHD) de 28 comprimé(s)"
      }
    ],
    "page_2": [
      {
        "code_CIP7": "2160423",
        "libelle": "flacon(s) polyéthylène haute densité (PEHD) de 14 comprimé(s)"
      },
      {
        "code_CIP7": "2160469",
        "libelle": "1 flacon(s) polyéthylène de 5 ml avec compte-gouttes"
      },
      {
        "code_CIP7": "2160908",
        "libelle": "4 seringue(s) préremplie(s) en verre de 0,5 ml dans stylo pré-rempli"
      }
    ],
    "pages_1_et_2": [
      {
        "code_CIP7": "2160191",
        "libelle": "plaquette(s) thermoformée(s) aluminium de 28 comprimé(s)"
      },
      {
        "code_CIP7": "2160363",
        "libelle": "4 poche(s) bicompartimenté(e)(s) polymère multicouches BIOFINE de 1000 ml"
      },
      {
        "code_CIP7": "2160417",
        "libelle": "flacon(s) polyéthylène haute densité (PEHD) de 28 comprimé(s)"
      },
      {
        "code_CIP7": "2160423",
        "libelle": "flacon(s) polyéthylène haute densité (PEHD) de 14 comprimé(s)"
      },
      {
        "code_CIP7": "2160469",
        "libelle": "1 flacon(s) polyéthylène de 5 ml avec compte-gouttes"
      },
      {
        "code_CIP7": "2160908",
        "libelle": "4 seringue(s) préremplie(s) en verre de 0,5 ml dans stylo pré-rempli"
      }
    ]
  }
}
```
