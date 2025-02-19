<template>
  <form>
    <p>
      Indiquez toutes les ressources <strong>nettes versées</strong> perçues
      <span v-if="individu._role !== 'demandeur'"
        ><strong>par {{ getIndividuNom() }}</strong></span
      >
      en France comme à l'étranger.
    </p>
    <div
      class="form__group"
      s
      v-for="(type, index) in types"
      v-bind:key="type.meta.id"
    >
      <RessourceMontants
        v-if="isSimple(type.meta.id)"
        v-bind:individu="type.individu"
        v-bind:index="index"
        v-bind:type="type"
        v-on:update="process"
      />
      <RessourceAutoEntreprise
        v-if="type.meta.id.startsWith('rpns_auto_entrepreneur_CA')"
        v-bind:individu="type.individu"
        v-bind:ressource="type"
        v-on:update="updateTNSAmount"
        v-on:updateExtra="updateTNSExtra"
      />
      <RessourceMicroEntreprise
        v-if="type.meta.id.startsWith('rpns_micro_entreprise_CA')"
        v-bind:individu="type.individu"
        v-bind:ressource="type"
        v-on:update="updateTNSAmount"
        v-on:updateExtra="updateTNSExtra"
      />
      <RessourceProfessionLiberale
        v-if="type.meta.id === 'rpns_autres_revenus'"
        v-bind:individu="type.individu"
        v-bind:ressource="type"
        v-on:update="updateTNSAmount"
        v-on:updateExtra="updateTNSExtra"
      />
      <RessourceExploitantAgricole
        v-if="type.meta.id === 'rpns_benefice_exploitant_agricole'"
        v-bind:individu="type.individu"
        v-bind:ressource="type"
        v-on:update="updateTNSAmount"
        v-on:updateExtra="updateTNSExtra"
      />
    </div>

    <Actions v-bind:onSubmit="onSubmit"> </Actions>
  </form>
</template>

<script>
import Actions from "@/components/Actions"
import RessourceAutoEntreprise from "@/components/Ressource/AutoEntreprise"
import RessourceExploitantAgricole from "@/components/Ressource/ExploitantAgricole"
import RessourceMicroEntreprise from "@/components/Ressource/MicroEntreprise"
import RessourceProfessionLiberale from "@/components/Ressource/ProfessionLiberale"
import RessourceMontants from "@/components/Ressource/Montants"

import RessourceProcessor from "@/mixins/RessourceProcessor"
import { ressourceTypes } from "@/constants/resources"
import Ressource from "@/lib/Ressource"
import Individu from "@/lib/Individu"

export default {
  name: "ressources-montants",
  mixins: [RessourceProcessor],
  components: {
    RessourceAutoEntreprise,
    RessourceExploitantAgricole,
    RessourceMicroEntreprise,
    RessourceProfessionLiberale,
    RessourceMontants,
    Actions,
  },
  data: function () {
    const individu = this.getIndividu()
    return {
      individu,
      types: this.getTypes(individu),
    }
  },
  watch: {
    $route(toRoute, fromRoute) {
      if (
        toRoute.params.id != fromRoute.params.id ||
        toRoute.params.category != fromRoute.params.category
      ) {
        this.individu = this.getIndividu()
        this.types = this.getTypes(this.individu)
      }
    },
  },
  methods: {
    getIndividuNom: function () {
      return Individu.label(this.individu, "nom")
    },
    getIndividu: function () {
      const id = this.$route.params.id
      const role = id.split("_")[0]
      const { individu } = Individu.get(
        this.$store.getters.peopleParentsFirst,
        role,
        this.$route.params.id,
        this.$store.state.dates
      )
      return individu
    },
    getTypes: function (individu) {
      const selectedTypes = Ressource.getIndividuRessourceTypesByCategory(
        individu,
        this.$route.params.category,
        this.$store.state.situation
      )
      return ressourceTypes.reduce((result, type) => {
        if (selectedTypes[type.id]) {
          let amounts = Object.assign({}, individu[type.id])
          let months = Ressource.getPeriodsForCurrentYear(
            this.$store.state.dates,
            type
          )

          result.push({
            amounts,
            individu,
            months,
            displayMonthly: this.getDisplayMonthly(months, amounts),
            meta: type,
            extra: (type.extra || []).reduce((a, e) => {
              a[e.id] = individu[e.id]
              return a
            }, {}),
          })
        }
        return result
      }, [])
    },
    isSimple: function (type) {
      const complex = [
        "rpns_auto_entrepreneur_CA_achat_revente",
        "rpns_auto_entrepreneur_CA_bic",
        "rpns_auto_entrepreneur_CA_bnc",
        "rpns_benefice_exploitant_agricole",
        "rpns_micro_entreprise_CA_bic_vente_imp",
        "rpns_micro_entreprise_CA_bic_service_imp",
        "rpns_micro_entreprise_CA_bnc_imp",
        "rpns_autres_revenus",
      ]
      return complex.indexOf(type) === -1
    },
    onSubmit: function () {
      this.save(this.types, true)
      this.$push()
    },
    updateTNSAmount: function (type, period, value) {
      type.amounts[period] = value
    },
    updateTNSExtra: function (type, item, value) {
      type.extra[item] = value
    },
  },
}
</script>
