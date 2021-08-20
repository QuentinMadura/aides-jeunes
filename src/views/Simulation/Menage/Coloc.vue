<template>
  <form @submit.prevent="onSubmit">
    <YesNoQuestion v-model="value"> Est-ce une colocation ? </YesNoQuestion>

    <template v-if="isRelevantQuestionForContribution('coloc')">
      <ContributionForm v-model="contribution.menage.coloc"></ContributionForm>
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
  name: "SimulationMenageColoc",
  components: {
    YesNoQuestion,
    Actions,
    ContributionForm,
  },
  mixins: [createContributionMixin()],
  data: function () {
    const menage = { ...(this.$store.getters.getMenage || {}) }
    const contribution = this.initContribution("menage", "coloc")
    return {
      menage: menage,
      value: menage.coloc,
      contribution,
    }
  },
  methods: {
    onSubmit: function () {
      if (
        this.needCheckContrib("menage", "coloc") &&
        this.value === undefined
      ) {
        this.$store.dispatch("updateError", "Ce champ est obligatoire.")
        return
      }
      this.menage.coloc = this.value
      this.$store.dispatch("updateMenage", this.menage)
      this.saveContribution("menage", "coloc")
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
