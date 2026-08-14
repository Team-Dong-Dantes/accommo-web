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
            <q-btn flat class="store apk glass" href="#download">
                          <Icon icon="mdi:android" width="18" height="18" class="q-mr-xs" />
                          Download APK
                        </q-btn>
            <q-btn flat class="ghost sm" href="#how">See how it works</q-btn>
          </div>

          <p class="fineprint">
            Free for students. Landlords list only after OSAS accreditation.
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
                                                  <svg class="phone-icon" :class="{ glow: currentSlide === 2 }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1095 1095">
            <path d="M525.56 45.47C575.55 43.2 622.87 47.55 671.52 58.97C707.69 67.45 744.37 80.93 776.27 100.21C855.34 148.02 911.16 217.73 934.81 307.62C939.5 325.44 943.04 344.17 944.88 362.5C948.44 398.13 946.5 434.69 946.48 470.5C946.46 543.5 946.29 616.5 946.29 689.5C946.28 779.83 946.38 870.17 946.37 960.5C946.37 980.16 946.44 999.82 946.52 1019.48C946.56 1030.45 944 1042.53 932.21 1046.65C922.51 1050.03 907.85 1048.21 897.5 1048.2C875.17 1048.16 852.83 1048.13 830.5 1048.15C818.88 1048.15 804.86 1049.02 798.38 1037.13C794.66 1030.3 795.02 1023.06 794.99 1015.5C794.95 1005.5 795.01 995.5 795 985.5C794.93 944.83 795.1 904.17 795.13 863.5C795.2 747.5 794.82 631.5 795.19 515.5C795.27 488.5 795.26 461.5 795.13 434.5C795.03 413.99 795.32 393.73 791.87 373.53C787.95 350.56 778.5 327.65 767.1 307.39C719.88 223.47 620.61 190.38 528.57 198.4C487.5 201.98 446.92 215.49 411.04 235.57C382.46 251.58 355.83 272.01 332.77 295.27C326.98 301.11 320.95 306.82 315.41 312.88C311.09 317.6 307.49 323.26 300.5 323.92C298.1 324.14 295.41 324.14 293.12 323.37C287.38 321.43 275.39 309.49 270.6 304.92C253.9 289 236.12 273.94 218.7 258.82C213.6 254.39 198.51 242.77 195.54 237.96C189.09 227.55 196.71 219.34 203.34 211.82C218.74 194.34 235.92 178.26 253.14 162.64C325.55 96.94 427.37 49.94 525.56 45.47ZM431.56 403.46C485.87 400.58 539.7 411.31 588.72 434.8C598.75 439.6 608.42 445 618.21 450.28C623.33 453.05 628.86 455.38 631.4 461.05C635.15 469.41 633.32 480.54 633.29 489.5C633.24 508.83 633.3 528.17 633.3 547.5C633.29 563.17 633.33 578.83 633.31 594.5C633.31 602.67 634.06 611.55 629.05 618.52C623.52 626.19 610.84 630.54 602.3 626.17C598.29 624.12 596.37 620.18 593.84 616.69C589.13 610.19 583.91 603.96 578.32 598.19C562.91 582.27 544.24 570.24 523.9 561.61C454.09 532.01 359.14 556.17 319.46 622.92C294.66 664.64 297.82 708.64 298.12 755.5C298.51 815.48 298.55 875.52 298.16 935.5C298.01 958.5 298.07 981.5 298.17 1004.5C298.22 1014.87 300.2 1027.95 294.73 1037.28C287.96 1048.86 275.33 1048.19 263.5 1048C248.5 1047.74 233.5 1047.75 218.5 1048.01C208.01 1048.16 193.13 1049.8 188.42 1039.85C185.55 1033.74 186.51 1026.14 186.48 1018.5C186.43 1004 186.48 989.5 186.48 975C186.49 912.5 186.33 850 186.37 787.5C186.39 743.5 186.33 699.5 186.49 655.5C186.54 633.49 186.39 611.5 186.45 589.5C186.49 573.83 186.4 558.17 186.42 542.5C186.44 516.5 186.5 490.5 186.42 464.5C186.37 448.83 186.48 433.17 186.5 417.5C186.52 406.01 186.4 394.63 190.72 383.83C195.1 372.88 204.28 362.41 215.06 354.63C287.33 302.12 394.17 285.9 476.1 315.47C500.96 324.45 524.46 337.97 545.05 355.03C555.16 363.4 564.45 372.72 573.12 382.5C577.53 387.44 582.51 391.93 585.79 397.78C590.02 405.3 588.5 415.59 588.48 424C588.46 430 588.42 436 588.47 442C588.54 449.17 588.44 456.33 588.47 463.5Z" fill="currentColor"/>
          </svg>
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
          <q-btn unelevated color="teal-7" class="text-weight-bold" size="lg" href="/accommo.apk" download style="border-radius:12px; padding:14px 28px;">
            <Icon icon="mdi:android" width="20" height="20" class="q-mr-sm" />
            Download APK
          </q-btn>
          <q-btn flat color="teal-7" class="text-weight-bold" size="lg" style="border-radius:12px; padding:14px 20px;">
            <Icon icon="mdi:apple" width="20" height="20" class="q-mr-sm" />
            iOS Coming Soon
          </q-btn>
        </div>

        <p class="fineprint" style="margin-top:16px;">
          Free for students. Landlords list only after OSAS accreditation.
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
                      <svg class="foot-logo-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1095 1095">
                        <path d="M525.56 45.47C575.55 43.2 622.87 47.55 671.52 58.97C707.69 67.45 744.37 80.93 776.27 100.21C855.34 148.02 911.16 217.73 934.81 307.62C939.5 325.44 943.04 344.17 944.88 362.5C948.44 398.13 946.5 434.69 946.48 470.5C946.46 543.5 946.29 616.5 946.29 689.5C946.28 779.83 946.38 870.17 946.37 960.5C946.37 980.16 946.44 999.82 946.52 1019.48C946.56 1030.45 944 1042.53 932.21 1046.65C922.51 1050.03 907.85 1048.21 897.5 1048.2C875.17 1048.16 852.83 1048.13 830.5 1048.15C818.88 1048.15 804.86 1049.02 798.38 1037.13C794.66 1030.3 795.02 1023.06 794.99 1015.5C794.95 1005.5 795.01 995.5 795 985.5C794.93 944.83 795.1 904.17 795.13 863.5C795.2 747.5 794.82 631.5 795.19 515.5C795.27 488.5 795.26 461.5 795.13 434.5C795.03 413.99 795.32 393.73 791.87 373.53C787.95 350.56 778.5 327.65 767.1 307.39C719.88 223.47 620.61 190.38 528.57 198.4C487.5 201.98 446.92 215.49 411.04 235.57C382.46 251.58 355.83 272.01 332.77 295.27C326.98 301.11 320.95 306.82 315.41 312.88C311.09 317.6 307.49 323.26 300.5 323.92C298.1 324.14 295.41 324.14 293.12 323.37C287.38 321.43 275.39 309.49 270.6 304.92C253.9 289 236.12 273.94 218.7 258.82C213.6 254.39 198.51 242.77 195.54 237.96C189.09 227.55 196.71 219.34 203.34 211.82C218.74 194.34 235.92 178.26 253.14 162.64C325.55 96.94 427.37 49.94 525.56 45.47ZM431.56 403.46C485.87 400.58 539.7 411.31 588.72 434.8C598.75 439.6 608.42 445 618.21 450.28C623.33 453.05 628.86 455.38 631.4 461.05C635.15 469.41 633.32 480.54 633.29 489.5C633.24 508.83 633.3 528.17 633.3 547.5C633.29 563.17 633.33 578.83 633.31 594.5C633.31 602.67 634.06 611.55 629.05 618.52C623.52 626.19 610.84 630.54 602.3 626.17C598.29 624.12 596.37 620.18 593.84 616.69C589.13 610.19 583.91 603.96 578.32 598.19C562.91 582.27 544.24 570.24 523.9 561.61C454.09 532.01 359.14 556.17 319.46 622.92C294.66 664.64 297.82 708.64 298.12 755.5C298.51 815.48 298.55 875.52 298.16 935.5C298.01 958.5 298.07 981.5 298.17 1004.5C298.22 1014.87 300.2 1027.95 294.73 1037.28C287.96 1048.86 275.33 1048.19 263.5 1048.18C240.5 1048.15 217.5 1048.21 194.5 1048.22C184.67 1048.23 169.86 1050.15 160.79 1046.64C142.35 1039.49 147.25 1009.39 147.25 993.5C147.26 939.83 147.36 886.17 147.3 832.5C147.26 800.5 147.21 768.5 147.29 736.5C147.38 700.11 147.82 665.16 156.31 629.7C179.46 533 241.74 458.36 335.09 422.59C365.79 410.83 398.79 405.21 431.56 403.46ZM465.64 799.47C478.56 798.93 491.57 799.29 504.5 799.33C513.14 799.36 521.8 798.88 528.96 804.54C536.63 810.6 537.61 820.48 537.75 829.5C537.93 841.83 537.78 854.17 537.82 866.5C537.86 879.05 538.13 892.16 526.04 899.49C519.7 903.33 512.63 902.79 505.5 902.8C495.17 902.8 484.83 902.83 474.5 902.78C465.05 902.74 455.37 902.74 449.01 894.48C440.13 882.97 443.21 866.12 443.21 852.5C443.21 833.76 438.14 800.6 465.64 799.47ZM583.66 799.46C596.57 798.9 609.59 799.18 622.5 799.3C630.24 799.38 638.41 798.79 645.06 803.41C649.74 806.67 653.3 812.19 654.65 817.72C655.79 822.38 655.29 827.74 655.31 832.5C655.37 842.17 655.3 851.83 655.3 861.5C655.3 868.69 656.1 876.36 654.9 883.49C653.85 889.75 649.44 896.18 644 899.45C637.4 903.43 629.9 902.8 622.5 902.79C612.5 902.77 602.5 902.83 592.5 902.76C582.46 902.69 572.46 902.48 566.05 893.44C558.23 882.42 561.22 865.22 561.3 852.5C561.42 833.51 555.98 800.67 583.66 799.46ZM461.66 930.28C467.66 929.04 474.39 929.75 480.5 929.7C489.17 929.64 497.83 929.67 506.5 929.75C510.73 929.78 515.25 929.33 519.4 930.21C523.56 931.08 527.86 933.64 530.85 936.62C537.57 943.35 537.63 952.64 537.74 961.5C537.88 973.83 537.81 986.17 537.84 998.5C537.86 1010.37 537.62 1022.83 526.02 1029.47C519.67 1033.1 512.56 1032.84 505.5 1032.84C494.83 1032.83 484.17 1032.93 473.5 1032.88C464.55 1032.84 454.94 1032.31 448.87 1024.66C440.35 1013.92 443.18 998.34 443.18 985.5C443.19 967.31 437.48 935.31 461.66 930.28ZM579.65 930.27C584.42 929.26 589.64 929.79 594.5 929.75C604.83 929.65 615.17 929.62 625.5 929.75C633.23 929.86 641.04 929.92 647.18 935.35C654.24 941.6 655.09 949.59 655.21 958.5C655.39 971.84 655.32 985.16 655.4 998.5C655.46 1009.86 655.52 1021.55 645.06 1028.56C638.89 1032.69 631.63 1032.79 624.5 1032.82C613.17 1032.87 601.83 1032.92 590.5 1032.81C581.85 1032.72 571.99 1031.83 566.3 1024.25C558.53 1013.9 561.16 994.92 561.18 982.5C561.19 965 556.65 935.11 579.65 930.27Z" fill-rule="evenodd"/>
                      </svg>
                      accommo
                    </div>
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
  width: 90px; height: auto;
  transition: fill 0.4s ease, filter 0.4s ease;
}
.bg-0 ~ .phone-logo-wrap .phone-icon { fill: #0d9488; }
.bg-1 ~ .phone-logo-wrap .phone-icon { fill: #ffffff; }
.bg-2 ~ .phone-logo-wrap .phone-icon { fill: #0d9488; filter: drop-shadow(0 0 16px rgba(13,148,136,0.6)) drop-shadow(0 0 32px rgba(13,148,136,0.3)); }

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
.foot-logo-svg { height: 28px; width: auto; fill: #ffffff; }
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
