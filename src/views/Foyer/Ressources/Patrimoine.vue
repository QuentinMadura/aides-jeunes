<template>
  <form>
    <h2 data-testid="immobilier-title">
      <i class="fa fa-home" aria-hidden="true"></i>
      Immobilier
    </h2>

    <YesNoQuestion class="form__group" v-model="hasTerrainsNonLoues">
      Avez-vous des terrains <b>non loués</b> ?
    </YesNoQuestion>

    <div class="form__group" v-if="hasTerrainsNonLoues">
      <label class="form__group">
        Valeur <b>patrimoniale</b> totale de vos terrains <b>non loués</b>
        <InputNumber
          v-model="demandeur.valeur_terrains_non_loues[periodKey]"
        ></InputNumber>
      </label>

      <label class="form__group">
        Valeur <b>locative</b> totale de vos terrains <b>non loués</b>
        <InputNumber
          v-model="demandeur.valeur_locative_terrains_non_loues[periodKey]"
        ></InputNumber>
      </label>
      <p>
        Pour la trouver, consultez votre avis d'imposition de taxe d'habitation
        ou de taxe foncière.
      </p>
    </div>

    <YesNoQuestion class="form__group" v-model="hasBatisNonLoues">
      Avez-vous des appartements/immeubles <b>non loués</b> ?
      <template v-slot:help>
        <p>
          Sauf résidence principale et bâtiments de l'exploitation agricole.
        </p>
      </template>
    </YesNoQuestion>

    <div class="form__group" v-if="hasBatisNonLoues">
      <label class="form__group">
        Valeur <b>patrimoniale</b> de vos appartements/immeubles
        <b>non loués</b>
        <InputNumber
          v-model="demandeur.valeur_immo_non_loue[periodKey]"
        ></InputNumber>
      </label>

      <label class="form__group">
        Valeur <b>locative</b> totale de vos appartements/immeubles
        <b>non loués</b>
        <InputNumber
          v-model="demandeur.valeur_locative_immo_non_loue[periodKey]"
        ></InputNumber>
      </label>
      <p>
        Pour la trouver, consultez votre avis d'imposition de taxe d'habitation
        ou de taxe foncière.
      </p>
    </div>

    <label v-if="hasBiensLoues" class="form__group"
      >Valeur <b>patrimoniale</b> de vos bien <b> loués</b>
      <InputNumber
        v-model="demandeur.valeur_patrimoine_loue[periodKey]"
      ></InputNumber>
    </label>

    <h2>
      <i class="fa fa-money" aria-hidden="true"></i>
      Épargne
    </h2>

    <label class="form__group">
      Livret A <span class="help-block">Aussi appelé Livret bleu.</span>
      <InputNumber v-model="demandeur.livret_a[periodKey]"></InputNumber>
    </label>

    <label class="form__group">
      Total des autres produits d'épargne produisant des revenus
      <b>non imposables</b>
      <InputNumber
        v-model="demandeur.epargne_revenus_non_imposables[periodKey]"
      ></InputNumber>
      <span>
        Assurance vie,
        <abbr title="Compte d'épargne-logement">CEL</abbr>,
        <abbr title="Livret de développement durable">LDD</abbr>,
        <abbr title="Livret d'épargne populaire">LEP</abbr>, Livret jeune,
        <abbr title="Plan d'épargne en actions">PEA</abbr>, plan d'épargne
        d'entreprise, <abbr title="Plan d'épargne logement">PEL</abbr>,
        <abbr title="Plan d'épargne populaire">PEP</abbr>.
      </span>
    </label>

    <label class="form__group">
      Total de l'épargne produisant des revenus <b>imposables</b>
      <InputNumber
        v-model="demandeur.epargne_revenus_imposables[periodKey]"
      ></InputNumber>
      <span>
        Actions, comptes à terme,
        <abbr title="Fonds communs de placement">FCP</abbr>, obligations, parts
        sociales,
        <abbr title="Société d'Investissement à CApital Variable">SICAV</abbr>,
        etc.
      </span>
    </label>

    <Actions v-bind:onSubmit="onSubmit" />
  </form>
</template>

<script>
import { patrimoineTypes } from "@/constants/resources"
import YesNoQuestion from "@/components/YesNoQuestion"
import InputNumber from "@/components/InputNumber"
import Actions from "@/components/Actions"

export default {
  name: "ressources-patrimoine",
  components: {
    InputNumber,
    YesNoQuestion,
    Actions,
  },
  data: function () {
    const situation = this.$store.state.situation
    let periodKey = "month:2012-01:120"
    let demandeur = Object.assign({}, situation.demandeur)
    let individus = this.$store.getters.peopleParentsFirst

    let patrimoineProperties = patrimoineTypes.map((p) => p.id)
    patrimoineProperties.forEach(function (patrimoinePropertyName) {
      demandeur[patrimoinePropertyName] = Object.assign(
        {},
        demandeur[patrimoinePropertyName]
      )
      demandeur[patrimoinePropertyName][periodKey] =
        demandeur[patrimoinePropertyName][periodKey] || 0
    })

    let mapping = {
      hasTerrainsNonLoues: {
        sources: [
          "valeur_terrains_non_loues",
          "valeur_locative_terrains_non_loues",
        ],
      },
      hasBatisNonLoues: {
        sources: ["valeur_immo_non_loue", "valeur_locative_immo_non_loue"],
      },
    }

    let locals = {
      hasBiensLoues: individus.some((individu) => individu.revenus_locatifs),
      hasEpargneAuxRevenusImposables: individus.some(
        (individu) => individu.revenus_capital
      ),
    }

    let localKeys = Object.keys(mapping)
    localKeys.forEach(function (keyName) {
      locals[keyName] = false
      mapping[keyName].sources.forEach(function (attributeName) {
        locals[keyName] = Boolean(
          locals[keyName] || demandeur[attributeName][periodKey]
        )
      })
    })

    return {
      demandeur,
      hasTerrainsNonLoues: true,
      ...locals,
      periodKey,
    }
  },
  methods: {
    onSubmit: function () {
      this.$store.dispatch("updateIndividu", this.demandeur)
      this.$router.push("/simulation/resultats")
    },
  },
}
</script>
