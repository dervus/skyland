import Controller from "@ember/controller"
import showModal from "discourse/lib/show-modal"

export default Controller.extend({
  actions: {
    upsertAccount() {
      showModal("upsert-account", { model: { username: this.account && this.account.username } })
    }
  }
})
