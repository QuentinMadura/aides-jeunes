<template>
  <form @submit.prevent="onSubmit">
    <YesNoQuestion v-model="value">
      Participez-vous aux frais du logement ?
      <span class="help"
        >Par exemple aux dépenses d'électricité, de téléphone, etc.</span
      >
    </YesNoQuestion>

    <template v-if="isRelevantQuestionForContribution('participation_frais')">
      <ContributionForm
        v-model="contribution.menage.participation_frais"
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
  name: "SimulationMenageParticipationFrais",
  components: {
    YesNoQuestion,
    Actions,
    ContributionForm,
  },
  mixins: [createContributionMixin()],
  data: function () {
    const menage = { ...(this.$store.getters.getMenage || {}) }
    const contribution = this.initContribution("menage", "participation_frais")
    return {
      menage: menage,
      value: menage.participation_frais,
      contribution,
    }
  },
  methods: {
    onSubmit: function () {
      if (
        this.needCheckContrib("menage", "participation_frais") &&
        this.value === undefined
      ) {
        this.$store.dispatch("updateError", "Ce champ est obligatoire.")
        return
      }
      this.menage.participation_frais = this.value
      this.$store.dispatch("updateMenage", this.menage)
      this.saveContribution("menage", "participation_frais")

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
