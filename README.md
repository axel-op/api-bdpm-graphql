# API GraphQL de la Base de Données Publique des Médicaments

Démarrer le serveur :

```bash
node src/server.js
```

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
  }
  
  presentations(codes_CIP7_ou_CIP13: [3334167, 3400938235296]) {
    code_CIP7,
    code_CIP13,
    libelle
  }
}
```

Exemple de réponse :

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
    ]
  }
}
```
