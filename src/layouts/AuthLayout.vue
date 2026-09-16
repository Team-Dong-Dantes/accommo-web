<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <!-- Two fields: the campus photograph carries the identity, the panel
           carries the form. The panel is light because it is the door to a
           light console — a dark sign-in followed by the dashboard was a flash
           of white on every login. -->
      <div class="auth-split">
        <aside class="auth-plate">
          <a href="/" class="auth-wordmark">accommo</a>
          <p class="auth-plate-foot">
            Isabela State University, Echague campus.
          </p>
        </aside>

        <main class="auth-panel">
          <div class="auth-panel-inner">
            <router-view />
          </div>
        </main>
      </div>
    </q-page-container>
  </q-layout>
</template>

<style scoped>
/* The photograph runs the full width and the panel dissolves into it, so the
   two halves read as one image with the form emerging from it rather than two
   plates butted against a hard vertical line. */
.auth-split {
  position: relative;
  display: grid;
  grid-template-columns: 1.08fr 0.92fr;
  min-height: 100vh;
  min-height: 100dvh;
  background-color: #06332e;
  background-image: url('/isu-aerial.jpg');
  background-size: cover;
  background-position: 42% 34%;
  overflow: hidden;
}
/* Weighted to the top and foot, where the wordmark and the standing line sit;
   the middle of the picture is left alone. */
.auth-split::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      180deg,
      rgba(0, 40, 34, 0.74) 0%,
      rgba(0, 36, 31, 0.28) 32%,
      rgba(0, 32, 27, 0.46) 68%,
      rgba(0, 26, 22, 0.90) 100%
    ),
    linear-gradient(135deg, rgba(0, 150, 136, 0.24), rgba(0, 121, 107, 0.18));
  pointer-events: none;
}

/* ---- photograph half: content only, the picture is on the container ---- */
.auth-plate {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(28px, 3.4vw, 52px);
  color: #ffffff;
}

.auth-wordmark {
  align-self: flex-start;
  color: #ffffff;
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  text-decoration: none;
  border-radius: 6px;
}
.auth-wordmark:focus-visible { outline: 3px solid #46ecd4; outline-offset: 4px; }

.auth-plate-foot {
  max-width: 28ch;
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.85rem;
  line-height: 1.5;
}

/* ---- form half ---- */
.auth-panel {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  padding: clamp(32px, 4vw, 64px) clamp(24px, 4vw, 56px);
}
/* The glass is a layer of its own rather than the panel's own background: a
   mask set on .auth-panel would apply to its descendants too and fade the left
   edge of the form along with it. */
.auth-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  /* rgba of --c-surface (#FAFCFE). Clear over the photograph at the seam,
     thickening to solid well before the form begins, so the join is a dissolve
     instead of an edge. */
  /* A dark veil, not a light one: the controls on top are glass, so the
     photograph has to stay visible through them, which only works if the type
     is light and the ground behind it is deep. It dissolves to nothing at the
     seam so the picture carries across unbroken. */
  background: linear-gradient(
    90deg,
    rgba(0, 30, 26, 0) 0%,
    rgba(0, 30, 26, 0.24) 10%,
    rgba(0, 28, 24, 0.46) 26%,
    rgba(0, 26, 22, 0.56) 52%,
    rgba(0, 24, 20, 0.60) 100%
  );
  /* Deliberately light: at 0.78 with an 18px blur the right half went flat and
     the panes had nothing behind them to be glass against. */
  -webkit-backdrop-filter: blur(9px) saturate(1.12);
  backdrop-filter: blur(9px) saturate(1.12);
  /* Masked to match the paint, or the clear end would still blur the picture
     and leave a visible rectangle across the photograph. */
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 22%);
  mask-image: linear-gradient(90deg, transparent 0%, #000 22%);
  pointer-events: none;
}
.auth-panel-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 384px;
}

@media (max-width: 900px) {
  /* The photograph becomes a header band rather than disappearing, so the
     screen still says where it belongs before asking for credentials. */
  .auth-split { grid-template-columns: 1fr; grid-template-rows: auto 1fr; background-position: 46% 24%; }
  .auth-plate {
    min-height: 200px;
    padding: clamp(20px, 5vw, 28px);
  }
  .auth-plate-foot { max-width: none; font-size: 0.8rem; }
  .auth-panel {
    padding: clamp(36px, 9vw, 52px) 20px clamp(32px, 8vw, 48px);
    align-items: start;
  }
  /* Stacked, so the dissolve turns with the seam. */
  .auth-panel::before {
    background: linear-gradient(
      180deg,
      rgba(0, 30, 26, 0) 0%,
      rgba(0, 30, 26, 0.38) 7%,
      rgba(0, 28, 24, 0.66) 15%,
      rgba(0, 26, 22, 0.78) 30%,
      rgba(0, 24, 20, 0.82) 100%
    );
    -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 15%);
    mask-image: linear-gradient(180deg, transparent 0%, #000 15%);
  }
}
</style>
