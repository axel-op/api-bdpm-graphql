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
      code_substance
      denomination
      dosage_substance
      reference_dosage
    }
  }
  
  presentations(codes_CIP7_ou_CIP13: [3334167, 3400938235296]) {
    code_CIP7
    code_CIP13
    libelle
    medicament {
      code_CIS
      denomination
    }
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
            "code_substance": "39727",
            "denomination": "AMLODIPINE",
            "dosage_substance": "5 mg",
            "reference_dosage": "une gélule",
          },
          {
            "code_substance": "93748",
            "denomination": "AMLODIPINE (BÉSILATE D')",
            "dosage_substance": "6,944 mg",
            "reference_dosage": "une gélule",
          }
        ]
      }
    ],
    "presentations": [
      {
        "code_CIP7": "3334167",
        "code_CIP13": "3400933341671",
        "libelle": "plaquette(s) PVC PVDC aluminium de 30 gélule(s)",
        "medicament": {
          "code_CIS": "62204255",
          "denomination": "AMLODIPINE PFIZER 5 mg, gélule"
        }
      },
      {
        "code_CIP7": "3823529",
        "code_CIP13": "3400938235296",
        "libelle": "plaquette(s) PVC PVDC aluminium de 90 gélule(s)",
        "medicament": {
          "code_CIS": "62204255",
          "denomination": "AMLODIPINE PFIZER 5 mg, gélule"
        }
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

### Requête filtrée par date

Il est possible de filtrer les médicaments par date d'autorisation de mise sur le marché (AMM).

Le paramètre `date_AMM` est [de type `DateFilter`](./schema.graphql) et a deux propriétés : `before` renverra les médicaments mis sur le marché avant ou à cette date, et `after` renverra les médicaments mis sur le marché à ou après cette date.

Spécifier une même date pour les deux propriétés renverra les médicaments mis sur le marché à cette date exactement.

Exemple de requête :

```graphql
{
  dateAvant: medicaments(
    date_AMM: {before: "22/12/1999"},
    limit: 2
  ) {
    denomination
    date_AMM
  }
  
  dateApres: medicaments(
    date_AMM: {after: "22/12/1999"},
    limit: 2
  ) {
    denomination
    date_AMM
  }
  
  dateExacte: medicaments(
    date_AMM: {after: "22/12/1999", before: "22/12/1999"}
  ) {
    denomination
    date_AMM
  }
  
  periode: medicaments(
    date_AMM: {after: "01/11/1999", before: "08/11/1999"}
  ) {
    denomination
    date_AMM
  }
}
```

Réponse :

```json
{
  "data": {
    "dateAvant": [
      {
        "denomination": "RANITIDINE BIOGARAN 150 mg, comprimé effervescent",
        "date_AMM": "04/07/1989"
      },
      {
        "denomination": "FENOFIBRATE TEVA 100 mg, gélule",
        "date_AMM": "06/12/1996"
      }
    ],
    "dateApres": [
      {
        "denomination": "ANASTROZOLE ACCORD 1 mg, comprimé pelliculé",
        "date_AMM": "28/10/2010"
      },
      {
        "denomination": "ACTAEA RACEMOSA FERRIER, degré de dilution compris entre 2CH et 30CH ou entre 4DH et 60DH",
        "date_AMM": "03/01/2008"
      }
    ],
    "dateExacte": [
      {
        "denomination": "FAMOTIDINE EG 20 mg, comprimé pelliculé",
        "date_AMM": "22/12/1999"
      },
      {
        "denomination": "FAMOTIDINE EG 40 mg, comprimé pelliculé",
        "date_AMM": "22/12/1999"
      }
    ],
    "periode": [
      {
        "denomination": "KABIVEN, émulsion pour perfusion",
        "date_AMM": "08/11/1999"
      },
      {
        "denomination": "CISPLATINE MYLAN 25 mg/25 ml, solution à diluer pour perfusion",
        "date_AMM": "02/11/1999"
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
