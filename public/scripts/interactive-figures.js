export function defineInteractiveFigure(tagName, setup) {
  if (customElements.get(tagName)) return

  customElements.define(
    tagName,
    class extends HTMLElement {
      connectedCallback() {
        if (this.cleanup) return
        this.cleanup = setup(this)
      }

      disconnectedCallback() {
        if (typeof this.cleanup === "function") this.cleanup()
        this.cleanup = null
      }
    },
  )
}

window.defineInteractiveFigure = defineInteractiveFigure
