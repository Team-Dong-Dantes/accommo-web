<template>
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
        <a :href="APP_URL">Web app</a>
        <a :href="APK_URL" target="_blank" rel="noopener">Android (APK)</a>
      </div>
    </div>
    <div class="container foot-bar">
      <span>© {{ year }} Accommo</span>
      <span>Made for ISU Echague students and landlords/landladies</span>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { APP_URL, APK_URL } from '@/utils/appLinks'

const year = new Date().getFullYear()
</script>

<style scoped src="./landing.css"></style>

<style scoped>
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
.foot-bar { display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 34px; padding-top: 18px; font-size: 0.83rem; color: #7e8d87; }
@media (max-width: 980px) {
  .foot-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 540px) {
  .foot-grid { grid-template-columns: 1fr; }
}
</style>
