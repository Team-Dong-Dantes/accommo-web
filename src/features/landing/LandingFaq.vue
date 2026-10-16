<template>
  <section id="faq" class="band paper">
    <div class="container measure" v-reveal>
      <div class="section-head"><h2 class="title">A few things people ask</h2></div>
      <div class="faq">
        <q-expansion-item
          v-for="(item, i) in faqs"
          :key="i"
          :label="item.q"
          expand-separator
          :dark="false"
          :class="i % 2 ? 'b' : 'a'"
        >
          <div class="faq-a">{{ item.a }}</div>
        </q-expansion-item>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { vReveal } from '@/utils/reveal'

const faqs = [
  { q: 'How much does it cost for students?', a: 'Nothing. Students browse and message landlords/landladies for free.' },
  { q: 'Why does a listing say "Accredited"?', a: 'It means OSAS has reviewed the boarding house — ownership, documents, and location — before it was listed.' },
  { q: 'I\'m a landlord/landlady. How do I get listed?', a: 'Add your accommodation in the app and submit the requirements. OSAS reviews and accredits it, then your listing goes live.' },
  { q: 'Something\'s wrong with my stay — what do I do?', a: 'Open a support ticket in the app. OSAS can step in if a landlord/landlady or accommodation is not holding up their side.' },
]
</script>

<style scoped src="./landing.css"></style>

<style scoped>
.b { background: var(--paper); }
.faq-a { padding: 4px 16px 16px; color: var(--muted); font-size: 0.95rem; line-height: 1.6; }
@media (max-width: 540px) {
  .band { padding: 52px 0; }
}
</style>
