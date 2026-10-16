// v-reveal: fades a block up the first time it scrolls into view. The
// `.reveal` / `.is-visible` rules live with each component that uses it.
export const vReveal = {
  mounted(el: HTMLElement) {
    el.classList.add('reveal')
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { el.classList.add('is-visible'); obs.unobserve(el); }
      }),
      { threshold: 0.12 },
    )
    obs.observe(el)
  },
}
