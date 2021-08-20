<template>
  <form @submit.prevent="onSubmit">
    <div class="form__group">
      <label class="aj-question"
        >Quel est le code postal de la commune de vos parents ?</label
      >
      <input type="number" v-model="codePostal" />
    </div>

    <p v-if="retrievingCommunes"
      ><i class="fa fa-spinner fa-spin" aria-hidden="true"></i
    ></p>
    <div class="form__group" v-show="communes && communes.length">
      <label class="aj-question"
        >Veuillez sélectionner la ville qui correspond</label
      >
      <select v-model="nomCommune" id="commune">
        <option
          v-for="commune in communes"
          v-bind:value="commune.nom"
          v-bind:key="commune.code"
        >
          {{ commune.nom }}
        </option>
      </select>
    </div>
    <template
      v-if="
        isRelevantQuestionForContribution(
          '_bourseCriteresSociauxCommuneDomicileFamilial',
          'bourse_criteres_sociaux_distance_domicile_familial'
        )
      "
    >
      <ContributionForm
        v-model="
          contribution[entityName]._bourseCriteresSociauxCommuneDomicileFamilial
        "
      ></ContributionForm>
    </template>
    <Actions v-bind:onSubmit="onSubmit" />
  </form>
</template>
<script>
import Actions from "@/components/Actions"
import Commune from "@/lib/Commune"
import Individu from "@/lib/Individu"
import { createContributionMixin } from "@/mixins/ContributionMixin"
import ContributionForm from "@/components/ContributionForm"

export default {
  name: "SimulationIndividuBourseCriteresSociauxCommuneDomicileFamilial",
  components: {
    Actions,
    ContributionForm,
  },
  mixins: [createContributionMixin()],
  data() {
    const id = this.$route.params.id
    const role = id.split("_")[0]
    const { individu } = Individu.get(
      this.$store.getters.peopleParentsFirst,
      role,
      this.$route.params.id,
      this.$store.state.dates
    )
    const codePostal =
      individu._bourseCriteresSociauxCommuneDomicileFamilialCodePostal
    const nomCommune =
      individu._bourseCriteresSociauxCommuneDomicileFamilialNomCommune

    const contribution = this.initContribution(
      id,
      "_bourseCriteresSociauxCommuneDomicileFamilial",
      "bourse_criteres_sociaux_distance_domicile_familial"
    )
    return {
      codePostal,
      individu,
      nomCommune,
      retrievingCommunes: false,
      contribution,
    }
  },
  asyncComputed: {
    communes: {
      get: function () {
        if (!this.codePostal || this.codePostal.toString().length !== 5) {
          return []
        }
        this.retrievingCommunes = true
        return Commune.get(this.codePostal)
          .then((communes) => {
            if (communes.length <= 0) {
              this.$matomo &&
                this.$matomo.trackEvent(
                  "General",
                  "Depcom introuvable",
                  `Code postal : ${this.codePostalQuestion.selectedValue}`
                )
            }
            if (!communes.map((c) => c.nom).includes(this.nomCommune)) {
              this.nomCommune = Commune.getMostPopulated(communes).nom
            }
            return communes
          })
          .catch(() => {
            return []
          })
          .finally(() => {
            this.retrievingCommunes = false
          })
      },
      default: [],
    },
  },
  computed: {
    entityName() {
      return this.$route.params.id
    },
  },
  methods: {
    onSubmit: function () {
      if (
        this.needCheckContrib(
          this.entityName,
          "_bourseCriteresSociauxCommuneDomicileFamilial",
          "bourse_criteres_sociaux_distance_domicile_familial"
        ) &&
        this.nomCommune === undefined
      ) {
        this.$store.dispatch("updateError", "Ce champ est obligatoire.")
        return
      }
      const communeMatches = this.communes.filter(
        (c) => c.nom == this.nomCommune
      )
      if (communeMatches.length) {
        this.individu._bourseCriteresSociauxCommuneDomicileFamilial =
          communeMatches[0].code
        this.individu._bourseCriteresSociauxCommuneDomicileFamilialCodePostal =
          this.codePostal.toString()
        this.individu._bourseCriteresSociauxCommuneDomicileFamilialNomCommune =
          this.nomCommune
        this.$store.dispatch("updateIndividu", this.individu)
      }
      this.saveContribution(
        this.entityName,
        "_bourseCriteresSociauxCommuneDomicileFamilial",
        "bourse_criteres_sociaux_distance_domicile_familial"
      )
      this.$push()
    },
  },
}
</script>
<style scoped lang="scss">
fieldset {
  margin-bottom: 2em;
}
</style>
