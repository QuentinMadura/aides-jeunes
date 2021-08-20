<template>
  <form @submit.prevent="onSubmit">
    <YesNoQuestion v-model="value">
      Est-ce une chambre ?
      <span class="help">
        Une chambre est un logement qui ne comporte qu'une seule pièce et n'est
        pas équipé d'un WC.
      </span>
    </YesNoQuestion>

    <template v-if="isRelevantQuestionForContribution('logement_chambre')">
      <ContributionForm
        v-model="contribution.menage.logement_chambre"
      ></ContributionForm>
    </template>

    <Actions v-bind:onSubmit="onSubmit" />
  </form>
</template>

<script>
import Actions from "@/components/Actions"
import YesNoQuestion from "@/components/YesNoQuestion"
import ContributionForm from "@/components/ContributionForm"
import { createContributionMixin } from "@/mixins/ContributionMixin"

export default {
  name: "SimulationMenageLogementChambre",
  components: {
    YesNoQuestion,
    Actions,
    ContributionForm,
  },
  mixins: [createContributionMixin()],
  data: function () {
    const menage = { ...(this.$store.getters.getMenage || {}) }
    const contribution = this.initContribution("menage", "logement_chambre")
    return {
      menage: menage,
      value: menage.logement_chambre,
      contribution,
    }
  },
  methods: {
    onSubmit: function () {
      if (
        this.needCheckContrib("menage", "logement_chambre") &&
        this.value === undefined
      ) {
        this.$store.dispatch("updateError", "Ce champ est obligatoire.")
        return
      }
      this.menage.logement_chambre = this.value
      this.$store.dispatch("updateMenage", this.menage)
      this.saveContribution("menage", "logement_chambre")
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
