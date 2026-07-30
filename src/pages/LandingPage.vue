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
            The boarding-house app for ISU Echague students and landlords — every
            listing reviewed by the Office of Student Affairs and Services before
            it goes live.
          </p>

          <div class="actions">
            <q-btn unelevated class="store apk" href="/accommo.apk" download>
              <Icon icon="mdi:android" class="q-mr-xs" width="18" height="18" />
              <span class="store-txt"><small>Download for Android</small><strong>Get the APK</strong></span>
            </q-btn>
            <q-btn flat class="ghost sm" href="#how">See how it works</q-btn>
          </div>

          <p class="fineprint">
            Free for students. Landlords list only after OSAS accreditation.
          </p>
        </div>

        <!-- flat app preview -->
        <div class="hero-visual" v-reveal>
          <div class="preview">
            <div class="pv-bar">
              <span class="pv-dot"></span><span class="pv-dot"></span><span class="pv-dot"></span>
              <span class="pv-url">app.accommo.ph</span>
            </div>
            <div class="pv-body">
              <div class="pv-greet">Boarding houses near ISU Echague</div>

              <div class="pv-card">
                <div class="pv-thumb"></div>
                <div class="pv-info">
                  <div class="pv-name">Sunrise Dorm <span class="pv-tag">Accredited</span></div>
                  <div class="pv-meta">0.4 km from campus · ₱2,500 / month</div>
                  <div class="pv-osas">Reviewed by OSAS · Sep 2025</div>
                </div>
              </div>

              <div class="pv-card">
                <div class="pv-thumb alt"></div>
                <div class="pv-info">
                  <div class="pv-name">Pine View Rooms <span class="pv-tag">Accredited</span></div>
                  <div class="pv-meta">0.7 km from campus · ₱1,800 / month</div>
                  <div class="pv-osas">Reviewed by OSAS · Aug 2025</div>
                </div>
              </div>

              <div class="pv-note">
                <Icon icon="mdi:verified-user" width="16" height="16" />
                Every listing is checked for safety and paperwork before it appears.
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
              <li><span>3</span><div><strong>Message the landlord</strong> and sort out your stay, with OSAS there if something goes wrong.</div></li>
            </ol>
          </div>

          <div class="col-block" v-reveal>
            <h3 class="sub">If you're a landlord</h3>
            <ol class="steps">
              <li><span>1</span><div><strong>Add your property and rooms</strong> with photos and house rules.</div></li>
              <li><span>2</span><div><strong>OSAS reviews and accredits it</strong> — your listing goes live once it's cleared.</div></li>
              <li><span>3</span><div><strong>Manage leases and rent</strong> from one dashboard instead of a spreadsheet.</div></li>
            </ol>
          </div>
        </div>
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
          <div class="foot-brand"><Icon icon="mdi:domain" width="20" height="20" /> Accommo</div>
          <p class="foot-tag">
            Boarding-house listings for ISU Echague, reviewed by the Office of
            Student Affairs and Services.
          </p>
        </div>
        <div>
          <div class="foot-h">Product</div>
          <span>Find a room</span><span>List a property</span><span>For OSAS</span>
        </div>
        <div>
          <div class="foot-h">Campus</div>
          <span>ISU Echague</span><span>Office of Student Affairs</span>
        </div>
        <div>
          <div class="foot-h">Get the app</div>
          <a href="/accommo.apk" download>Android (APK)</a>
        </div>
      </div>
      <div class="container foot-bar">
        <span>© {{ year }} Accommo</span>
        <span>Made for ISU Echague students and landlords</span>
      </div>
    </footer>

    <transition name="fade">
      <q-btn v-show="showTop" round color="teal-8" class="totop" @click="scrollTop">
        <Icon icon="mdi:arrow-up" width="20" height="20" />
      </q-btn>
    </transition>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const year = new Date().getFullYear();
const showTop = ref(false);
const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
function onScroll() { showTop.value = window.scrollY > 600; }
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
  { q: 'How much does it cost for students?', a: 'Nothing. Students browse and message landlords for free.' },
  { q: 'Why does a listing say "Accredited"?', a: 'It means OSAS has reviewed the boarding house — ownership, documents, and location — before it was listed.' },
  { q: 'I\'m a landlord. How do I get listed?', a: 'Add your property in the app and submit the required documents. OSAS reviews and accredits it, then your listing goes live.' },
  { q: 'Something\'s wrong with my stay — what do I do?', a: 'Raise a concern in the app. OSAS can step in if a landlord or property isn\'t holding up their side.' },
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
  min-height: calc(100svh - 66px);
  display: flex;
  align-items: center;
  padding: clamp(40px, 7vh, 96px) 0 clamp(40px, 6vh, 80px);
  border-bottom: 1px solid var(--line);
}
.hero-grid {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: clamp(32px, 5vw, 64px);
  align-items: center;
  width: 100%;
}
.kicker { text-transform: uppercase; letter-spacing: 1.5px; font-size: clamp(10px, 1.1vw, 12px); font-weight: 700; color: var(--teal); margin: 0 0 clamp(10px, 1.4vh, 16px); }
.headline {
  font-family: Georgia, "Times New Roman", serif;
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
.fineprint { margin: 22px 0 0; font-size: 0.85rem; color: var(--muted); }

/* flat preview */
.hero-visual { display: flex; justify-content: center; width: 100%; }
.preview {
  width: min(340px, 84vw);
  border: 1px solid var(--line); border-radius: 16px; background: #fff;
  overflow: hidden; box-shadow: 0 24px 50px -28px rgba(22, 32, 29, 0.4);
}
.pv-bar { display: flex; align-items: center; gap: 6px; padding: 11px 14px; background: #f3f1ec; border-bottom: 1px solid var(--line); }
.pv-dot { width: 9px; height: 9px; border-radius: 50%; background: #d8d3c7; }
.pv-url { margin-left: 8px; font-size: 11px; color: #9a958a; }
.pv-body { padding: 18px; }
.pv-greet { font-weight: 700; font-size: 15px; margin-bottom: 14px; }
.pv-card { display: flex; gap: 12px; padding: 12px; border: 1px solid var(--line); border-radius: 12px; margin-bottom: 10px; align-items: center; }
.pv-thumb { width: 56px; height: 56px; border-radius: 9px; background: linear-gradient(135deg, #cfded9, #accdc4); flex: none; }
.pv-thumb.alt { background: linear-gradient(135deg, #e3ddcf, #cfc6b1); }
.pv-name { font-weight: 700; font-size: 13.5px; display: flex; align-items: center; gap: 8px; }
.pv-tag { font-size: 10px; font-weight: 700; color: var(--teal-d); background: rgba(14, 124, 110, 0.1); padding: 2px 7px; border-radius: 999px; }
.pv-meta { font-size: 11.5px; color: var(--muted); margin-top: 2px; }
.pv-osas { font-size: 10.5px; color: #8a958f; margin-top: 3px; }
.pv-note { display: flex; gap: 8px; align-items: flex-start; margin-top: 14px; padding: 12px; background: var(--paper); border-radius: 10px; font-size: 11.5px; color: var(--muted); line-height: 1.5; }
.pv-note .q-icon { color: var(--teal); margin-top: 1px; }

/* bands */
.band { padding: 76px 0; border-bottom: 1px solid var(--line); }
.paper { background: var(--paper); }
.section-head { margin-bottom: 36px; }
.title { font-family: Georgia, "Times New Roman", serif; font-size: clamp(1.6rem, 3vw, 2.1rem); font-weight: 700; letter-spacing: -0.3px; margin: 0; color: var(--ink); }
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
  .hero { min-height: auto; }
  .hero-grid, .cols, .cards { grid-template-columns: 1fr; }
  .foot-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 540px) {
  .hero { padding: 40px 0 48px; }
  .band { padding: 52px 0; }
  .foot-grid { grid-template-columns: 1fr; }
}
</style>

<style>
html { scroll-behavior: smooth; }
.landing section[id] { scroll-margin-top: 72px; }
</style>
