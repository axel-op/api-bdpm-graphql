const files = {
    medicaments: 'CIS_bdpm',
    presentations: 'CIS_CIP_bdpm',
    conditions: 'CIS_CPD_bdpm',
    substances: 'CIS_COMPO_bdpm',
    groupesGeneriques: 'CIS_GENER_bdpm',
};

const schemas = {
    [files.medicaments]: [
        'CIS',
        'denomination',
        'forme_pharmaceutique',
        'voies_administration',
        'statut_admin_AMM',
        'type_procedure_AMM',
        'etat_commercialisation',
        'date_AMM',
        'statut_BDM',
        'numero_autorisation_europeenne',
        'titulaires',
        'surveillance_renforcee'
    ],
    [files.presentations]: [
        'CIS',
        'CIP7',
        'libelle',
        'statut_admin',
        'etat_commercialisation',
        'date_declaration_commercialisation',
        'CIP13',
        'agrement_collectivites',
        'taux_remboursement',
        'prix_sans_honoraires',
        'prix_avec_honoraires',
        'honoraires',
        'indications_remboursement'
    ],
    [files.substances]: [
        'CIS',
        'designation_element_pharmaceutique',
        'code_substance',
        'denomination',
        'dosage_substance',
        'reference_dosage',
        'nature_composant',
        'numero_liaison_sa_ft'
    ],
    [files.conditions]: [
        'CIS',
        'conditions_prescription'
    ],
    [files.groupesGeneriques]: [
        'id',
        'libelle',
        'CIS',
        'type',
        'numero_tri'
    ],
};

module.exports = {
    files,
    schemas
}
