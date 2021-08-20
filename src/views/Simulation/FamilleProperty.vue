<template>
  <form @submit.prevent="onSubmit">
    <div v-if="questionType === 'number'">
      <h2 class="aj-question">
        <span v-html="question" />
        <EnSavoirPlus v-if="showMoreInfo" />
      </h2>
      <label>
        <InputNumber :min="meta.min" v-model="value"></InputNumber>
      </label>
    </div>
    <YesNoQuestion v-else v-model="value">
      <span v-html="question" />
      <EnSavoirPlus v-if="showMoreInfo" />
      <template v-slot:help v-if="meta.help">
        <p v-html="meta.help" />
      </template>
    </YesNoQuestion>

    <template
      v-if="
        isRelevantQuestionForContribution(fieldName, meta.openfiscaVariable)
      "
    >
      <ContributionForm
        v-model="contribution.famille[fieldName]"
      ></ContributionForm>
    </template>

    <Actions v-bind:onSubmit="onSubmit" />
  </form>
</template>

<script>
import Actions from "@/components/Actions"
import Hint from "@/lib/Hint"
import FamilleQuestions from "@/lib/FamilleQuestions"
import { executeFunctionOrReturnValue, capitalize } from "@/lib/Utils"
import EnSavoirPlus from "@/components/EnSavoirPlus"
import YesNoQuestion from "@/components/YesNoQuestion"
import InputNumber from "@/components/InputNumber"
import { createContributionMixin } from "@/mixins/ContributionMixin"
import ContributionForm from "@/components/ContributionForm"

export default {
  name: "FamilleProperty",
  components: {
    InputNumber,
    Actions,
    YesNoQuestion,
    EnSavoirPlus,
    ContributionForm,
  },
  mixins: [createContributionMixin()],
  data: function () {
    const params = this.$route.params
    const famille = { ...this.$store.state.situation.famille }
    const value = famille[params.fieldName]
    const contribution = this.initContribution(
      "famille",
      params.fieldName,
      FamilleQuestions[params.fieldName].openfiscaVariable
    )
    return {
      famille,
      value,
      contribution,
    }
  },
  computed: {
    fieldName: function () {
      return this.$route.params.fieldName
    },
    meta: function () {
      return FamilleQuestions[this.fieldName]
    },
    questionType: function () {
      return this.meta.questionType
    },
    question: function () {
      return capitalize(
        executeFunctionOrReturnValue(this.meta, "question", this)
      )
    },
    showMoreInfo: function () {
      return Hint.get(this.fieldName)
    },
    items: function () {
      return executeFunctionOrReturnValue(this.meta, "items", this)
    },
  },
  methods: {
    requiredValueMissing: function () {
      const hasError = this.value === undefined
      this.$store.dispatch(
        "updateError",
        hasError && "Ce champ est obligatoire."
      )
      return hasError
    },
    onSubmit: function () {
      if (
        this.needCheckContrib(
          "famille",
          this.fieldName,
          this.meta.openfiscaVariable
        ) &&
        this.requiredValueMissing()
      ) {
        return
      }
      this.famille[this.fieldName] = this.value
      this.$store.dispatch("updateFamille", this.famille)
      this.saveContribution(
        "famille",
        this.fieldName,
        this.meta.openfiscaVariable
      )
      this.$push()
    },
  },
}
</script>
