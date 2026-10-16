<template>
  <section id="how" class="band">
    <div class="container">
      <div class="section-head" v-reveal>
        <p class="kicker">How it works</p>
        <h2 class="title">From sign-up to move-in</h2>
      </div>
  
      <div class="cols">
        <div class="col-block" v-reveal>
          <h3 class="sub">If you're a student</h3>
          <ol class="steps">
            <li><span>1</span><div><strong>Make an account</strong> with your school email — takes a minute.</div></li>
            <li><span>2</span><div><strong>Browse nearby boarding houses</strong> by price, room type, and distance to campus.</div></li>
             <li><span>3</span><div><strong>Message the landlord/landlady</strong> and sort out your stay, with OSAS there if something goes wrong.</div></li>
          </ol>
        </div>
  
        <div class="col-block" v-reveal>
           <h3 class="sub">If you're a landlord/landlady</h3>
          <ol class="steps">
             <li><span>1</span><div><strong>Add your accommodation and rooms</strong> with photos and house rules.</div></li>
            <li><span>2</span><div><strong>OSAS reviews and accredits it</strong> — your listing goes live once it's cleared.</div></li>
            <li><span>3</span><div><strong>Manage leases and rent</strong> from one dashboard instead of a spreadsheet.</div></li>
          </ol>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// How it works, once for students and once for landlords/landladies.
import { vReveal } from '@/utils/reveal'
</script>

<style scoped src="./landing.css"></style>

<style scoped>
/* how */
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
.col-block { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 28px; }
.sub { font-size: 1.2rem; font-weight: 700; margin: 0 0 18px; color: var(--ink); }
.steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 16px; }
.steps li { display: flex; gap: 14px; align-items: flex-start; }
.steps span { flex: none; width: 26px; height: 26px; border-radius: 50%; background: var(--teal); color: #fff; font-weight: 700; font-size: 0.82rem; display: grid; place-items: center; }
.steps div { font-size: 0.96rem; line-height: 1.55; color: #34433f; }
.steps strong { color: var(--ink); }
@media (max-width: 980px) {
  .cols, .cards { grid-template-columns: 1fr; }
}
@media (max-width: 540px) {
  .band { padding: 52px 0; }
}
</style>
