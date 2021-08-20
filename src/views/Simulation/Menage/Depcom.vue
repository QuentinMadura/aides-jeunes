<template>
  <form @submit.prevent="onSubmit">
    <div class="field-group">
      <label for="cp" class="aj-question">{{ codePostalQuestion.label }}</label>
      <input id="cp" type="number" v-model="codePostalQuestion.selectedValue" />
    </div>

    <p v-if="retrievingCommunes"
      ><i class="fa fa-spinner fa-spin" aria-hidden="true"></i
    ></p>
    <div class="field-group" v-show="communes && communes.length">
      <label for="commune" class="aj-question">{{
        communeQuestion.label
      }}</label>
      <select v-model="communeQuestion.selectedValue" id="commune">
        <option
          v-for="(commune, index) in communes"
          v-bind:value="commune.nom"
          v-bind:key="`commune_${index}`"
        >
          {{ commune.nom }}
        </option>
      </select>
    </div>

    <template v-if="isRelevantQuestionForContribution('depcom')">
      <ContributionForm v-model="contribution.menage.depcom"></ContributionForm>
    </template>

    <WarningMessage v-if="warningMessage" :text="warningMessage" />
    <Actions v-bind:onSubmit="onSubmit" />
  </form>
</template>

<script>
import Actions from "@/components/Actions"
import Commune from "@/lib/Commune"
import WarningMessage from "@/components/WarningMessage"
import Warning from "../../../lib/Warnings"
import ContributionForm from "@/components/ContributionForm"
import { createContributionMixin } from "@/mixins/ContributionMixin"

export default {
  name: "SimulationMenageDepcom",
  components: {
    Actions,
    WarningMessage,
    ContributionForm,
  },
  mixins: [createContributionMixin()],
  data: function () {
    const menage = { ...this.$store.getters.getMenage } || {}
    const contribution = this.initContribution("menage", "depcom")
    return {
      menage: menage,
      retrievingCommunes: false,
      codePostalQuestion: {
        label: "Quel est votre code postal ?",
        selectedValue: menage._codePostal,
      },
      communeQuestion: {
        label: "Veuillez sélectionner votre ville",
        selectedValue: menage._nomCommune,
      },
      contribution,
    }
  },
  computed: {
    warningMessage() {
      return Warning.get(
        "aj_not_reliable",
        this.codePostalQuestion.selectedValue
      )
    },
  },
  asyncComputed: {
    communes: {
      get: function () {
        if (
          !this.codePostalQuestion.selectedValue ||
          this.codePostalQuestion.selectedValue.toString().length !== 5
        ) {
          return []
        }
        this.retrievingCommunes = true
        return Commune.get(this.codePostalQuestion.selectedValue)
          .then((communes) => {
            if (communes.length <= 0) {
              this.$matomo &&
                this.$matomo.trackEvent(
                  "General",
                  "Depcom introuvable",
                  `Code postal : ${this.codePostalQuestion.selectedValue}`
                )
            }
            if (
              !communes
                .map((c) => c.nom)
                .includes(this.communeQuestion.selectedValue)
            ) {
              this.communeQuestion.selectedValue =
                Commune.getMostPopulated(communes).nom
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

  methods: {
    onSubmit: function () {
      if (
        this.needCheckContrib("menage", "depcom") &&
        this.communeQuestion.selectedValue === undefined
      ) {
        this.$store.dispatch("updateError", "Ce champ est obligatoire.")
        return
      }
      const communeMatches = this.communes.filter(
        (c) => c.nom == this.communeQuestion.selectedValue
      )
      if (communeMatches.length) {
        this.menage.depcom = communeMatches[0].code
        this.menage._codePostal =
          this.codePostalQuestion.selectedValue.toString()
        this.menage._nomCommune = this.communeQuestion.selectedValue
        this.$store.dispatch("updateMenage", this.menage)
      }
      this.saveContribution("menage", "depcom")
      this.$push()
    },
  },
}
</script>

<style scoped lang="scss">
.field-group {
  margin-bottom: 2em;
}
</style>
