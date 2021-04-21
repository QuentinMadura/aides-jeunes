var filter = require('lodash/filter');
var forEach = require('lodash/forEach');
var assign = require('lodash/assign');
var pickBy = require('lodash/pickBy');
var difference = require('lodash/difference');
var cloneDeep = require('lodash/cloneDeep')

var common = require('./common');
var buildOpenFiscaIndividu = require('./individu');
var migrations = require('../../migrations');

var propertyMove = require('./propertyMove');
var last3MonthsDuplication = require('./last3MonthsDuplication');

function dispatchIndividuals(situation) {
    var individus = mapIndividus(situation);

    var familles = { _: situation.famille}
    var foyers_fiscaux = {
        _: {
            declarants: [],
            personnes_a_charge: [],
            ...situation.foyer_fiscal
        }
    }
    var menages = { _: situation.menage }

    var demandeur = common.getDemandeur(situation);
    var demandeurId = demandeur && demandeur.id;

    familles._.parents = [ demandeurId ];
    menages._.personne_de_reference = [ demandeurId ];

    const aCharge = demandeur.enfant_a_charge && Object.keys(demandeur.enfant_a_charge).length && demandeur.enfant_a_charge[Object.keys(demandeur.enfant_a_charge)]

    if (aCharge) {
        var parent1 = {
            id: 'parent1'
        }
        individus[parent1.id] = {...parent1, id: undefined}
        familles.parents = { parents: [parent1.id] }
        foyers_fiscaux._.declarants.push(parent1.id)
        menages.parents = {
            personne_de_reference: [parent1.id]
        }

        foyers_fiscaux._.personnes_a_charge.push(demandeurId);
    } else {
        foyers_fiscaux._.declarants.push(demandeurId);
    }

    var conjoint = common.getConjoint(situation);
    var conjointId = conjoint && conjoint.id;
    if (conjointId) {
        familles._.parents.push(conjointId);
        menages._.conjoint = [ conjointId ];

        if (aCharge) {
            foyers_fiscaux[conjointId] = {
                declarants: [conjointId]
            }
        } else {
            foyers_fiscaux._.declarants.push(conjointId);
        }
    }

    var enfants = common.getEnfants(situation);
    var validEnfants = filter(enfants, function(enfant) { return common.isIndividuValid(enfant, situation); });
    var enfantIds = validEnfants.map(function(enfant) { return enfant.id; });
    familles._.enfants = enfantIds;
    foyers_fiscaux._.personnes_a_charge = [].concat(...foyers_fiscaux._.personnes_a_charge).concat(...enfantIds);
    menages._.enfants = enfantIds;

    return {
        individus: individus,
        familles,
        foyers_fiscaux,
        menages,
    };


}

function setNonInjectedPrestations(testCase, periods, value) {
    var prestationsFinancieres = pickBy(common.requestedVariables, function(definition) {
        return ((! definition.type) || definition.type === 'float');
    });

    forEach(prestationsFinancieres, function(definition, prestationName) {
        forEach(testCase[definition.entity], function(entity) {
            entity[prestationName] = entity[prestationName] || {};
            forEach(periods, function(period) {
                if (value === undefined) {
                    delete entity[prestationName][period];
                } else {
                    entity[prestationName][period] = entity[prestationName][period] || value;
                }
            });
        });
    });
}
exports.setNonInjectedPrestations = setNonInjectedPrestations;


function mapIndividus(situation) {
    var individus = filter(common.getIndividusSortedParentsFirst(situation), function(individu) {
        return common.isIndividuValid(individu, situation);
    });
    return individus.map(function(individu) {
        return buildOpenFiscaIndividu(individu, situation);
    }).reduce(function(accum, individu) {
        accum[individu.id] = individu;
        delete individu.id;
        return accum;
    }, {});
}

function giveValueToRequestedVariables(testCase, periods, value, demandeur) {

    var prestationsWithInterest = pickBy(common.requestedVariables, function(definition, prestationName) {
        return ((!definition.interestFlag) || demandeur[definition.interestFlag]) && !prestationName.match(/fonds_solidarite_logement_aide_maintien_eligibilite/) && !prestationName.match(/eure_et_loir/);
    });

    if (! (periods instanceof Array)) {
        periods = [periods];
    }

    forEach(prestationsWithInterest, function(definition, prestationName) {
        forEach(testCase[definition.entity], function(entity) {
            entity[prestationName] = entity[prestationName] || {};
            forEach(periods, function(period) {
                if (typeof entity[prestationName][period] !== 'undefined' && entity[prestationName][period] !== null) {
                    return;
                }
                if (value === undefined) {
                    delete entity[prestationName][period];
                } else {
                    entity[prestationName][period] = value;
                }
            });
        });
    });
}
exports.giveValueToRequestedVariables = giveValueToRequestedVariables;
exports.dispatchIndividuals = dispatchIndividuals;

// Use heuristics to pass functional tests
// Complexity may be added in the future in the application (new questions to ask)
// So far, due to a bug or some ambiguity
// cf. https://github.com/openfisca/openfisca-france/pull/1233
// logement_conventionne needs to be true when the loan in fully paid
// to avoid a benefit from appearing
function applyHeuristicsAndFix(testCase, dateDeValeur) {
    var thisMonth = common.getPeriods(dateDeValeur).thisMonth;

    var menage = assign({}, {
        logement_conventionne: {}
    }, testCase.menages._);
    menage.logement_conventionne[thisMonth] = menage.statut_occupation_logement && menage.statut_occupation_logement[thisMonth] == 'primo_accedant' && menage.loyer && menage.loyer[thisMonth] == 0;

    testCase.menages._ = menage;
    return testCase;
}

exports.buildOpenFiscaRequest = function(sourceSituation) {
    var situation = sourceSituation.toObject ? migrations.apply(sourceSituation).toObject() : cloneDeep(sourceSituation);

    var testCase = dispatchIndividuals(situation);

    console.log(JSON.stringify(testCase, null, 2))

    // Variables stored to properly restore UI should not be sent to OpenFisca
    forEach(testCase, (items) => {
        forEach(items, (item) => {
            const propsToDelete = Object.keys(item).filter(i => i.startsWith('_'))
            propsToDelete.forEach(function(propertyName) {
                delete item[propertyName];
            });
        })
    })

    propertyMove.movePropertyValuesToGroupEntity(testCase);

    var periods = common.getPeriods(situation.dateDeValeur);
    setNonInjectedPrestations(testCase, difference(periods.last12Months, periods.last3Months), 0);
    last3MonthsDuplication(testCase, situation.dateDeValeur);
    giveValueToRequestedVariables(testCase, periods.thisMonth, null, situation.demandeur);

    testCase.foyers_fiscaux._.nantes_metropole_tarification_solidaire_transport_quotient_familial = { "2019": null }

    return applyHeuristicsAndFix(testCase, sourceSituation.dateDeValeur);
};
