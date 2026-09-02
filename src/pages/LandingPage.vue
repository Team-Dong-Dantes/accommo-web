<template>
  <q-page class="landing">
    <!-- HERO -->
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy" v-reveal>
          <p class="kicker">For ISU Echague · reviewed by OSAS</p>
          <h1 class="headline">
            Boarding houses near campus,<br />checked by the people who should.
          </h1>
          <p class="lede">
             The boarding-house app for ISU Echague students and accommodation managers — every
            listing reviewed by the Office of Student Affairs and Services before
            it goes live.
          </p>

          <div class="actions">
            <q-btn flat class="store apk glass" href="#download">
                          <Icon icon="mdi:android" width="18" height="18" class="q-mr-xs" />
                          Download APK
                        </q-btn>
            <q-btn flat class="ghost sm" href="#how">See how it works</q-btn>
          </div>

          <p class="fineprint">
             Free for students. Accommodation managers list only after OSAS accreditation.
          </p>
        </div>

        <!-- 3D phone preview -->
                <div class="hero-visual" v-reveal>
                  <div class="phone-3d">
                    <div class="phone-body">
                      <div class="phone-notch"></div>
                      <div class="phone-screen">
                                              <div class="phone-slide">
                                                <div class="slide-bg" :class="'bg-' + currentSlide + ' dir-' + slideDir" :key="currentSlide + '-' + slideDir"></div>
                                                <div class="phone-logo-wrap">
                      <div class="phone-icon"></div>
                    </div>
                                                <div class="slide-indicators">
                                                  <span v-for="i in 3" :key="i" class="slide-dot" :class="{ active: currentSlide === i - 1 }" />
                                                </div>
                                              </div>
                                            </div>
                    </div>
                  </div>
                </div>
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
            <Icon icon="mdi:android" width="20" height="20" class="q-mr-sm" />
            Download APK
          </q-btn>
          <q-btn flat color="primary" class="text-weight-bold" size="lg" style="border-radius:12px; padding:14px 20px;">
            <Icon icon="mdi:apple" width="20" height="20" class="q-mr-sm" />
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
        <Icon icon="mdi:arrow-up" width="20" height="20" />
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

// Phone slideshow — right 3x, left 3x
const slides = [0, 1, 2];
const currentSlide = ref(0);
const slideDir = ref<'right' | 'left'>('right');
let stepCount = ref(0);
let slideTimer: ReturnType<typeof setInterval> | null = null;

function nextSlide() {
  stepCount.value++;
  if (stepCount.value % 3 === 0) {
    // Reverse direction every 3 steps
    slideDir.value = slideDir.value === 'right' ? 'left' : 'right';
  }
  if (slideDir.value === 'right') {
    currentSlide.value = (currentSlide.value + 1) % 3;
  } else {
    currentSlide.value = (currentSlide.value - 1 + 3) % 3;
  }
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true });
  slideTimer = setInterval(nextSlide, 2500);
});
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll);
  if (slideTimer) clearInterval(slideTimer);
});

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
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
.container { max-width: 1080px; margin: 0 auto; padding: 0 24px; width: 100%; }
.measure { max-width: 720px; }

/* hero — fluid & viewport-aware */
.hero {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  padding: 0;
  border-bottom: none;
  background: linear-gradient(170deg, rgba(22, 32, 29, 0.85) 0%, rgba(14, 124, 110, 0.65) 50%, rgba(10, 90, 80, 0.8) 100%), url('/hero-bg.png') center/cover no-repeat;
  background-attachment: fixed;
  color: #ffffff;
}
.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 55% 40% at 38% 50%, transparent 15%, rgba(14, 124, 110, 0.15) 40%, rgba(22, 32, 29, 0.55) 100%);
  pointer-events: none;
  z-index: 0;
}
.hero > * { position: relative; z-index: 1; }
.hero-grid {
  padding: clamp(80px, 10vh, 120px) 0 clamp(40px, 5vh, 60px);
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: clamp(32px, 5vw, 64px);
  align-items: center;
  width: 100%;
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
.primary { background: var(--teal); color: #fff; font-weight: 600; border-radius: 10px; padding: 12px 22px; }
.primary:hover { background: var(--teal-d); }
.primary.sm { padding: 9px 18px; font-size: 0.92rem; margin-top: 18px; }
.ghost { color: var(--teal-d); font-weight: 600; border-radius: 10px; padding: 12px 16px; }
.ghost:hover { background: rgba(14, 124, 110, 0.08); }
.ghost.sm { margin-top: 14px; padding: 6px 0; }
.hero .kicker { color: #46ecd4; }
.hero .headline { color: #ffffff; text-shadow: 0 2px 12px rgba(0,0,0,0.3); }
.hero .lede { color: rgba(255,255,255,0.82); }
.hero .fineprint { color: rgba(255,255,255,0.6); margin: 22px 0 0; font-size: 0.85rem; }
.hero .ghost { color: rgba(255,255,255,0.85); }
.hero .ghost:hover { background: rgba(255,255,255,0.1); color: #ffffff; }
.store.apk { background: #ffffff; color: #0e7c6e; }
.store.apk:hover { background: #f0f2f1; }
.store.glass {
  background: rgba(255,255,255,0.15) !important;
  color: #ffffff !important;
  border: 1px solid rgba(255,255,255,0.3) !important;
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 600;
  font-size: 0.92rem;
}
.store.glass:hover { background: rgba(255,255,255,0.25) !important; }

/* 3D phone — standard size, logo-only with color slide */
.hero-visual { display: flex; justify-content: center; align-items: center; width: 100%; }
.phone-3d {
  perspective: 900px;
  transform: rotateY(-5deg) rotateX(2deg);
}
.phone-body {
  width: 220px;
  background: #1a1a1a;
  border-radius: 32px;
  padding: 12px 6px;
  aspect-ratio: 9/19;
  display: flex; flex-direction: column;
  box-shadow:
    0 0 0 2px #333,
    0 0 0 4px #1a1a1a,
    0 28px 64px -16px rgba(0,0,0,0.5);
}
.phone-notch {
  width: 55px; height: 5px;
  background: #333;
  border-radius: 3px;
  margin: 0 auto 10px;
}
.phone-screen {
  flex: 1;
  border-radius: 22px;
  overflow: hidden;
}

/* slideshow */
.phone-slide {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  position: relative;
  overflow: hidden;
}
.slide-bg {
  position: absolute; inset: 0;
  z-index: 0;
}
.slide-bg.bg-0 { background: #ffffff; }
.slide-bg.bg-1 { background: #0d9488; }
.slide-bg.bg-2 { background: #16201d; }
.slide-bg.dir-right { animation: slideInRight 0.45s cubic-bezier(0.4, 0, 0.2, 1); }
.slide-bg.dir-left  { animation: slideInLeft 0.45s cubic-bezier(0.4, 0, 0.2, 1); }
@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes slideInLeft  { from { transform: translateX(-100%); } to { transform: translateX(0); } }

.phone-logo-wrap {
  flex: 1; z-index: 1;
  display: flex; align-items: center; justify-content: center;
}
.phone-icon {
  width: 92px; height: 92px;
  background-color: #0d9488;
  -webkit-mask: url(/accommo-logo.svg) no-repeat center / contain;
  mask: url(/accommo-logo.svg) no-repeat center / contain;
  transition: background-color 0.4s ease, filter 0.4s ease;
}
.bg-0 ~ .phone-logo-wrap .phone-icon { background-color: #0d9488; }
.bg-1 ~ .phone-logo-wrap .phone-icon { background-color: #ffffff; }
.bg-2 ~ .phone-logo-wrap .phone-icon { background-color: #0d9488; filter: drop-shadow(0 0 16px rgba(13,148,136,0.6)) drop-shadow(0 0 32px rgba(13,148,136,0.3)); }

/* indicators — clear & visible */
.slide-indicators {
  display: flex; gap: 8px; z-index: 1;
  padding-bottom: 18px;
}
.slide-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: rgba(128,128,128,0.35);
  transition: background 0.3s ease, transform 0.3s ease;
}
.slide-dot.active {
  background: #0d9488;
  transform: scale(1.5);
}
.bg-1 ~ .slide-indicators .slide-dot { background: rgba(255,255,255,0.4); }
.bg-1 ~ .slide-indicators .slide-dot.active { background: #ffffff; transform: scale(1.6); }
.bg-2 ~ .slide-indicators .slide-dot { background: rgba(255,255,255,0.25); }
.bg-2 ~ .slide-indicators .slide-dot.active { background: #0d9488; transform: scale(1.6); box-shadow: 0 0 8px rgba(13,148,136,0.5); }

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

@media (max-width: 880px) {
  .hero { min-height: auto; min-height: 100dvh; background-attachment: scroll; }
  .hero-grid, .cols, .cards { grid-template-columns: 1fr; }
  .hero-grid { padding: 80px 20px 40px; }
  .phone-3d { display: none; }
  .foot-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 540px) {
  .hero { padding: 0; }
  .hero-grid { padding: 80px 16px 36px; }
  .band { padding: 52px 0; }
  .foot-grid { grid-template-columns: 1fr; }
}
</style>

<style>
html { scroll-behavior: smooth; }
.landing section[id] { scroll-margin-top: 72px; }
</style>
