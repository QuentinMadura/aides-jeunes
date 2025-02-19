<template>
  <form @submit.prevent="onSubmit">
    <fieldset v-if="questionType === 'enum'">
      <legend>
        <h2 class="aj-question">
          <span v-html="question"></span>
          <EnSavoirPlus v-if="showMoreInfo" />
        </h2>
        <p v-if="step.help" v-html="step.help"></p>
      </legend>
      <div class="aj-selections">
        <div
          class="aj-selection-wrapper"
          v-for="(item, index) in items"
          :key="item.value"
        >
          <input
            :id="item.value"
            type="radio"
            :name="fieldName"
            :value="item.value"
            v-model="value"
            :autofocus="index === 0"
          />
          <label :for="item.value">
            {{ item.label }}
          </label>
        </div>
      </div>
    </fieldset>

    <div v-else-if="questionType === 'number'">
      <h2 class="aj-question">
        <span v-html="question" />
        <EnSavoirPlus v-if="showMoreInfo" />
      </h2>
      <p v-if="step.help" v-html="step.help"></p>
      <label>
        <InputNumber :min="step.min" v-model="value"></InputNumber>
      </label>
    </div>

    <div v-else-if="questionType === 'date'">
      <label :for="fieldName"
        ><h2 class="aj-question">
          <span v-html="question"></span>
          <EnSavoirPlus v-if="showMoreInfo" /> </h2
      ></label>
      <InputDate required :id="fieldName" v-model="value" />
    </div>

    <YesNoQuestion v-else v-model="value">
      <span v-html="question"></span><EnSavoirPlus v-if="showMoreInfo" />
      <template v-slot:help v-if="step.help"
        ><p v-html="step.help"></p
      ></template>
    </YesNoQuestion>
    <Actions v-bind:onSubmit="onSubmit" />
  </form>
</template>

<script>
import Actions from "@/components/Actions"
import YesNoQuestion from "../../components/YesNoQuestion.vue"
import Hint from "@/lib/Hint"

import { executeFunctionOrReturnValue, capitalize } from "@/lib/Utils"
import EnSavoirPlus from "@/components/EnSavoirPlus"
import InputNumber from "@/components/InputNumber"
import InputDate from "@/components/InputDate"
import { ENTITIES_PROPERTIES, UPDATE_METHODS } from "@/lib/State/steps"

export default {
  name: "MutualizedStep",
  components: {
    Actions,
    EnSavoirPlus,
    InputNumber,
    InputDate,
    YesNoQuestion,
  },
  data() {
    const entityName = this.$route.path.split("/")[2]
    const entity = ENTITIES_PROPERTIES[entityName].loadEntity(this)
    return {
      value: entity[this.$route.params.fieldName],
      entityName,
      entity,
    }
  },
  computed: {
    entityProperties() {
      return ENTITIES_PROPERTIES[this.entityName]
    },
    fieldName() {
      return this.$route.params.fieldName
    },
    items() {
      return executeFunctionOrReturnValue(this.step, "items", this)
    },
    question() {
      return capitalize(
        executeFunctionOrReturnValue(this.step, "question", this)
      )
    },
    questionType() {
      return this.step.questionType
    },
    showMoreInfo() {
      const showMoreInfo =
        this.step.showMoreInfo === undefined ||
        executeFunctionOrReturnValue(this.step, "showMoreInfo", this)
      return showMoreInfo && Hint.get(this.fieldName)
    },
    step() {
      return this.entityProperties.STEPS[this.fieldName]
    },
  },
  methods: {
    onSubmit() {
      if (!this.step.optional && this.requiredValueMissing()) {
        return
      }
      this.entity[this.fieldName] = this.value
      this.$store.dispatch(UPDATE_METHODS[this.entityName], this.entity)
      this.$push()
    },
    requiredValueMissing() {
      const hasError = this.value === undefined
      this.$store.dispatch(
        "updateError",
        hasError && "Ce champ est obligatoire."
      )
      return hasError
    },
  },
}
</script>
