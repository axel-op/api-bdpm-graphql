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
      libelle
      statut_admin
      etat_commercialisation
      date_declaration_commercialisation
      code_CIP13
      agrement_collectivites
      taux_remboursement
      prix_sans_honoraires
      prix_avec_honoraires
      honoraires
      indications_remboursement
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
            "libelle": "plaquette(s) PVC PVDC aluminium de 30 gélule(s)",
            "statut_admin": "Présentation active",
            "etat_commercialisation": "Déclaration de commercialisation",
            "date_declaration_commercialisation": "16/03/2009",
            "code_CIP13": "3400933341671",
            "agrement_collectivites": true,
            "taux_remboursement": 65,
            "prix_sans_honoraires": 4.36,
            "prix_avec_honoraires": 5.38,
            "honoraires": 1.02,
            "indications_remboursement": null
          },
          {
            "code_CIP7": "3823529",
            "libelle": "plaquette(s) PVC PVDC aluminium de 90 gélule(s)",
            "statut_admin": "Présentation active",
            "etat_commercialisation": "Déclaration de commercialisation",
            "date_declaration_commercialisation": "16/03/2009",
            "code_CIP13": "3400938235296",
            "agrement_collectivites": true,
            "taux_remboursement": 65,
            "prix_sans_honoraires": 12.32,
            "prix_avec_honoraires": 15.08,
            "honoraires": 2.76,
            "indications_remboursement": null
          }
        ]
      }
    ]
  }
}
```
