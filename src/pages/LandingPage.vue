<template>
  <q-page class="landing">
    <!-- HERO -->
    <section class="hero">
      <!-- Nothing but type. No photograph: the one image this site ships is an
           aerial of a road, and three layouts built around it all read as
           filler. With the imagery gone the type scale is the design, so the
           headline is set large and tight and given room. -->
      <!-- Structured on rules rather than stacked in one column: the headline
           states it, the row underneath carries the explanation against the
           actions, and the standing line closes it. The hairlines echo
           accommo-mobile's RoleFork, which is built the same way — rules and
           type, no boxes. -->
      <div class="hero-copy">
        <h1 class="headline">
          The official boarding house directory for ISU Echague.
        </h1>

        <div class="hero-row">
          <p class="lede">
            Find accredited accommodation near campus. Every listing has passed review by the
            Office of Student Affairs and Services.
          </p>

          <div class="actions">
            <a class="cta" href="#download">
              <Icon icon="lucide:smartphone" width="19" height="19" />
              Download the app
            </a>
            <a class="cta-quiet" href="#how">See how it works</a>
          </div>
        </div>

        <p class="hero-foot">
          Free for students. Accommodation managers list only after OSAS accreditation.
        </p>
      </div>
    </section>

    <!-- OSAS ACCREDITATION -->
    <section class="band paper">
      <div class="container measure" v-reveal>
        <p class="kicker">Why it's different</p>
        <h2 class="title">A boarding-house list that actually means something</h2>
        <p class="body">
          Most students find housing through posts they can't verify. On Accommo, a
          boarding house only appears after OSAS has checked who owns and runs it,
          that the documents are in order, and that it's a reasonable distance from
          campus. Listings that don't pass simply aren't shown. It's not a rating —
          it's a floor, so students start from a safer place.
        </p>
      </div>
    </section>

    <!-- HOW IT WORKS -->
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
               <li><span>3</span><div><strong>Message the accommodation manager</strong> and sort out your stay, with OSAS there if something goes wrong.</div></li>
            </ol>
          </div>

          <div class="col-block" v-reveal>
             <h3 class="sub">If you're an accommodation manager</h3>
            <ol class="steps">
               <li><span>1</span><div><strong>Add your accommodation and rooms</strong> with photos and house rules.</div></li>
              <li><span>2</span><div><strong>OSAS reviews and accredits it</strong> — your listing goes live once it's cleared.</div></li>
              <li><span>3</span><div><strong>Manage leases and rent</strong> from one dashboard instead of a spreadsheet.</div></li>
            </ol>
          </div>
        </div>
      </div>
    </section>

    <!-- DOWNLOAD -->
    <section id="download" class="band paper">
      <div class="container measure text-center" v-reveal>
        <p class="kicker">Get the app</p>
        <h2 class="title">Download Accommo for Android</h2>
        <p class="body" style="margin-bottom:24px;">
          One APK, works on Android 8+. About 15 MB. Install, sign up,
          and start browsing verified boarding houses near ISU Echague.
        </p>

        <div style="display:flex; justify-content:center; gap:14px; flex-wrap:wrap;">
          <q-btn unelevated color="primary" class="text-weight-bold" size="lg" :href="APK_URL" target="_blank" rel="noopener" style="border-radius:12px; padding:14px 28px;">
            <Icon icon="lucide:smartphone" width="20" height="20" class="q-mr-sm" />
            Download APK
          </q-btn>
          <q-btn flat color="primary" class="text-weight-bold" size="lg" style="border-radius:12px; padding:14px 20px;">
            <Icon icon="lucide:tablet-smartphone" width="20" height="20" class="q-mr-sm" />
            iOS Coming Soon
          </q-btn>
        </div>

        <p class="fineprint" style="margin-top:16px;">
           Free for students. Accommodation managers list only after OSAS accreditation.
        </p>
      </div>
    </section>

    <!-- FAQ -->
    <section id="faq" class="band paper">
      <div class="container measure" v-reveal>
        <div class="section-head"><h2 class="title">A few things people ask</h2></div>
        <div class="faq">
          <q-expansion-item
            v-for="(item, i) in faqs"
            :key="i"
            :label="item.q"
            expand-separator
            :class="i % 2 ? 'b' : 'a'"
            header-class="faq-h"
          >
            <div class="faq-a">{{ item.a }}</div>
          </q-expansion-item>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="foot">
      <div class="container foot-grid">
        <div>
          <div class="foot-brand">
                      <span class="foot-logo-img"></span>
                      accommo
                    </div>
          <p class="foot-tag">
            Boarding-house listings for ISU Echague, reviewed by the Office of
            Student Affairs and Services.
          </p>
        </div>
        <div>
          <div class="foot-h">Product</div>
          <span>Find a room</span><span>List an accommodation</span><span>For OSAS</span>
        </div>
        <div>
          <div class="foot-h">Campus</div>
          <span>ISU Echague</span><span>Office of Student Affairs</span>
        </div>
        <div>
          <div class="foot-h">Get the app</div>
          <a :href="APK_URL" target="_blank" rel="noopener">Android (APK)</a>
        </div>
      </div>
      <div class="container foot-bar">
        <span>© {{ year }} Accommo</span>
        <span>Made for ISU Echague students and accommodation managers</span>
      </div>
    </footer>

    <transition name="fade">
      <q-btn v-show="showTop" round color="primary" class="totop" @click="scrollTop">
        <Icon icon="lucide:arrow-up" width="20" height="20" />
      </q-btn>
    </transition>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const year = new Date().getFullYear();
const showTop = ref(false);
// Latest signed release APK, published by the mobile repo's CI.
const APK_URL = 'https://github.com/Team-Dong-Dantes/accommo-mobile/releases/latest/download/app-release.apk';
const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
function onScroll() { showTop.value = window.scrollY > 600; }

// The hero's phone used to run a 2.5s colour-cycling timer behind a logo. The
// screen is a static app view now — a hero that animates forever competes with
// the thing it is trying to get read.
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }));
onUnmounted(() => window.removeEventListener('scroll', onScroll));

const vReveal = {
  mounted(el: HTMLElement) {
    el.classList.add('reveal');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { el.classList.add('is-visible'); obs.unobserve(el); }
      }),
      { threshold: 0.12 },
    );
    obs.observe(el);
  },
};

const faqs = [
  { q: 'How much does it cost for students?', a: 'Nothing. Students browse and message accommodation managers for free.' },
  { q: 'Why does a listing say "Accredited"?', a: 'It means OSAS has reviewed the boarding house — ownership, documents, and location — before it was listed.' },
  { q: 'I\'m an accommodation manager. How do I get listed?', a: 'Add your accommodation in the app and submit the required documents. OSAS reviews and accredits it, then your listing goes live.' },
  { q: 'Something\'s wrong with my stay — what do I do?', a: 'Open a support ticket in the app. OSAS can step in if an accommodation manager or accommodation is not holding up their side.' },
];
</script>

<style scoped>
.landing {
  --ink: #16201d;
  --muted: #5e6a66;
  --teal: #0e7c6e;
  --teal-d: #0a5a50;
  --paper: #faf8f3;
  --line: #e7e2d8;
  --surface: #ffffff;
  color: var(--ink);
  background: var(--surface);
  /* Was the raw system stack, which paired Segoe UI body copy with Space
     Grotesk headings — two unrelated faces. Hanken Grotesk is the text
     companion the rest of the app already loads and uses. */
  font-family: 'Hanken Grotesk', system-ui, -apple-system, 'Segoe UI', sans-serif;
}
.container { max-width: 1080px; margin: 0 auto; padding: 0 24px; width: 100%; }
.measure { max-width: 720px; }

/* hero — two fields, split down the middle.
   The type used to sit directly on the campus photo under a green wash and a
   radial vignette; that is what made it read as a template. Now the type has a
   calm solid ground of its own and the photograph runs at full strength beside
   it, undimmed. */
.landing { --hero-ground: #06332e; }

/* The same photograph the mobile app opens on — accommo-mobile's AuthLayout
   splash, where the role fork sits. Bundled here rather than hotlinked from
   isu.edu.ph the way mobile does it: this is the public front door, and it
   should not go blank because the campus site is slow. The solid ground stays
   underneath regardless, same reasoning as the mobile layout.
   Composition copied from that splash too — content held at the foot, so the
   picture gets the top two-thirds and the type sits on the dark end of the
   scrim rather than fighting the image. */
.hero {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: clamp(112px, 15vh, 168px) max(24px, calc((100vw - 1080px) / 2 + 24px)) clamp(28px, 4vh, 44px);
  border-bottom: none;
  background-color: var(--hero-ground);
  background-image: url('/isu-aerial.jpg');
  background-size: cover;
  /* Mobile crops this at 46% center for a portrait frame. In a landscape one
     that puts the gate and the ISU sign — the busiest part of the picture —
     directly behind the headline. Raising the crop moves that up into open
     space and leaves the plainer road and grass under the type. */
  background-position: 46% 28%;
  color: #ffffff;
}
/* Same idea as .hero-section.splash-mode .hero-overlay in
   accommo-mobile/src/layouts/AuthLayout.vue — light at the top where the
   wordmark sits, heavy at the foot where the type lands — but retuned for a
   landscape frame, where the mobile stops arrive far too late, and with a
   left-weighted pass so the contrast is strongest exactly where the copy is
   while the right half of the photograph stays open. */
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    /* The picture is bright and busy corner to corner, so the scrim has to
       commit: open across the top half, then a firm ramp into near-solid under
       the copy. Softer gradients and a corner-anchored radial were both tried
       and both left the middle of the headline sitting on the gate. */
    linear-gradient(
      180deg,
      rgba(0, 44, 37, 0.30) 0%,
      rgba(0, 44, 37, 0.08) 16%,
      rgba(0, 36, 31, 0.32) 34%,
      rgba(0, 30, 26, 0.80) 54%,
      rgba(0, 26, 22, 0.93) 78%,
      rgba(0, 24, 20, 0.96) 100%
    ),
    linear-gradient(
      90deg,
      rgba(0, 28, 24, 0.42) 0%,
      rgba(0, 28, 24, 0.14) 58%,
      rgba(0, 28, 24, 0) 82%
    ),
    linear-gradient(135deg, rgba(0, 150, 136, 0.24), rgba(0, 121, 107, 0.18));
  pointer-events: none;
}
.hero > * { position: relative; z-index: 1; }
.hero-copy { width: 100%; }

.hero-foot {
  margin: clamp(22px, 3vh, 32px) 0 0;
  padding-top: clamp(18px, 2.5vh, 26px);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.82rem;
  letter-spacing: 0.01em;
}
.kicker { text-transform: uppercase; letter-spacing: 1.5px; font-size: clamp(10px, 1.1vw, 12px); font-weight: 700; color: var(--teal); margin: 0 0 clamp(10px, 1.4vh, 16px); }
.headline {
  font-family: var(--font-display);
  font-size: clamp(2rem, 1rem + 4.2vw, 3.25rem);
  line-height: 1.08; letter-spacing: -0.5px;
  font-weight: 700; margin: 0 0 clamp(14px, 2vh, 22px); color: var(--ink);
}
.lede { font-size: clamp(1rem, 0.6rem + 0.7vw, 1.12rem); line-height: 1.65; color: var(--muted); margin: 0 0 clamp(20px, 3vh, 30px); max-width: 34em; }
.actions { display: flex; flex-direction: column; align-items: flex-start; gap: 14px; }
/* Hero pairs its two actions on one row: a weighted primary and a quiet link,
   so the ranking is legible. They used to be stacked flat buttons of equal
   weight, which read as two unrelated links. */
.hero .actions { flex-direction: row; align-items: center; gap: 8px; flex-wrap: wrap; }
/* With the page stripped to type, the headline carries the whole composition:
   set large, tracked in tight, and held to a measure so it stacks into three
   dense lines instead of running as one thin ribbon. */
.hero .headline {
  color: #ffffff;
  /* Was 5rem, sized for a hero with nothing else in it. With a photograph
     behind it the type no longer has to carry the whole frame, and the smaller
     setting leaves the top half of the picture open instead of pushing the
     copy up into the bright part of it. */
  font-size: clamp(2.35rem, 1.2rem + 3.4vw, 3.6rem);
  line-height: 1.02;
  letter-spacing: -0.03em;
  font-weight: 700;
  max-width: 17ch;
  margin: 0;
  text-wrap: balance;
}
/* The explanation and the actions share one baseline row, so the hero uses its
   width instead of running as a single left-hand stack. */
.hero-row {
  display: grid;
  grid-template-columns: minmax(0, 48ch) auto;
  align-items: end;
  gap: clamp(24px, 5vw, 64px);
  margin-top: clamp(26px, 3.5vh, 40px);
  padding-top: clamp(22px, 3vh, 32px);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}
.hero .lede {
  /* Lifted from 0.72: over a photograph rather than flat colour, that read as
     washed out at body size. */
  color: rgba(255,255,255,0.88);
  font-size: clamp(1.02rem, 0.9rem + 0.35vw, 1.18rem);
  line-height: 1.6;
  margin: 0;
}
.hero .actions { justify-self: end; flex-wrap: nowrap; }

/* hero actions */
.cta {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 13px 22px;
  border-radius: 12px;
  background: #ffffff;
  color: #0b5f55;
  font-size: 0.95rem; font-weight: 700;
  text-decoration: none;
  box-shadow: 0 10px 26px -12px rgba(0,0,0,0.65);
  transition: transform 0.12s ease, box-shadow 0.2s ease, background 0.2s ease;
}
.cta:hover { background: #f2f5f4; box-shadow: 0 14px 32px -12px rgba(0,0,0,0.7); }
.cta:active { transform: translateY(1px); }
.cta-quiet {
  padding: 13px 16px;
  color: rgba(255,255,255,0.86);
  font-size: 0.95rem; font-weight: 600;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  border-radius: 8px;
  transition: color 0.2s ease, background 0.2s ease;
}
.cta-quiet:hover { color: #ffffff; background: rgba(255,255,255,0.1); }
.cta:focus-visible, .cta-quiet:focus-visible { outline: 3px solid #46ecd4; outline-offset: 3px; }

/* bands */
.band { padding: 76px 0; border-bottom: 1px solid var(--line); }
.paper { background: var(--paper); }
.section-head { margin-bottom: 36px; }
  .title { font-family: var(--font-display); font-size: clamp(1.6rem, 3vw, 2.1rem); font-weight: 700; letter-spacing: -0.3px; margin: 0; color: var(--ink); }
.body { font-size: 1.04rem; line-height: 1.7; color: var(--muted); margin: 16px 0 0; }

/* how */
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
.col-block { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 28px; }
.sub { font-size: 1.2rem; font-weight: 700; margin: 0 0 18px; }
.steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 16px; }
.steps li { display: flex; gap: 14px; align-items: flex-start; }
.steps span { flex: none; width: 26px; height: 26px; border-radius: 50%; background: var(--teal); color: #fff; font-weight: 700; font-size: 0.82rem; display: grid; place-items: center; }
.steps div { font-size: 0.96rem; line-height: 1.55; color: #34433f; }
.steps strong { color: var(--ink); }

/* audience cards */
.cards { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.card { background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 32px; }

/* faq */
.faq { border: 1px solid var(--line); border-radius: 14px; overflow: hidden; background: #fff; }
.faq-h { font-weight: 600; font-size: 1rem; }
.a { background: #fff; } .b { background: var(--paper); }
.faq-a { padding: 4px 16px 16px; color: var(--muted); font-size: 0.95rem; line-height: 1.6; }

/* cta / store buttons (used in hero) */
.store { background: #16201d; color: #fff; border-radius: 11px; padding: 10px 18px; display: inline-flex; align-items: center; }
.store-txt { display: flex; flex-direction: column; line-height: 1.15; text-align: left; }
.store-txt small { font-size: 10px; opacity: 0.8; } .store-txt strong { font-size: 14px; }
.store.apk { background: var(--teal); }
.store.apk:hover { background: var(--teal-d); }

/* footer */
.foot { background: #16201d; color: #aebab4; padding: 56px 0 26px; border-bottom: none; }
.foot-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 28px; }
.foot-brand { color: #fff; font-weight: 700; font-size: 1.15rem; display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.foot-logo-img {
  display: inline-block;
  width: 28px; height: 28px;
  background-color: #ffffff;
  -webkit-mask: url(/accommo-logo.svg) no-repeat center / contain;
  mask: url(/accommo-logo.svg) no-repeat center / contain;
}
.foot-tag { font-size: 0.9rem; max-width: 300px; line-height: 1.6; }
.foot-h { color: #fff; font-weight: 700; font-size: 0.9rem; margin-bottom: 12px; }
.foot a, .foot span { display: block; color: #93a39d; font-size: 0.88rem; padding: 4px 0; }
.foot-bar { display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 34px; padding-top: 18px; font-size: 0.83rem; color: #7e8d87; }

.totop { position: fixed; bottom: 24px; right: 24px; z-index: 50; box-shadow: 0 10px 24px rgba(22, 32, 29, 0.25); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.reveal { opacity: 0; transform: translateY(22px); transition: opacity 0.6s ease, transform 0.6s ease; }
.reveal.is-visible { opacity: 1; transform: none; }

@media (max-width: 980px) {
  /* The measures are set in ch, so the type reflows on its own; only the frame
     needs adjusting. */
  .hero { padding-left: 24px; padding-right: 24px; }
  .cols, .cards { grid-template-columns: 1fr; }
  .foot-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 860px) {
  /* Not enough width to hold the explanation against the actions, so the row
     becomes two stacked bands on one rule. */
  .hero-row { grid-template-columns: 1fr; gap: clamp(20px, 3.5vh, 28px); }
  .hero .actions { justify-self: stretch; }
}
@media (max-width: 540px) {
  .hero { padding: 104px 20px 28px; }
  /* At phone widths 15ch would break the headline into six short lines; let it
     use the full column instead. */
  .hero .headline { max-width: none; letter-spacing: -0.028em; }
  /* Too narrow for a row: full-width primary with the quiet link centred under
     it, rather than the primary stretching and shoving the link onto a second
     line at its own inset. */
  .hero .actions { flex-direction: column; align-items: stretch; width: 100%; gap: 2px; }
  .cta { justify-content: center; }
  .cta-quiet { text-align: center; }
  .band { padding: 52px 0; }
  .foot-grid { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
  .cta { transition: none; }
}
</style>

<style>
html { scroll-behavior: smooth; }
.landing section[id] { scroll-margin-top: 72px; }
</style>
