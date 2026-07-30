<template>
  <q-layout view="lHh Lpr lFf" class="admin-grid-bg">
    <q-page-container>
      <div class="window-height window-width row justify-center items-center">
        <div class="col-12 col-sm-8 col-md-5 col-lg-4 q-pa-md flex column items-center">
          <router-view />
        </div>
      </div>
    </q-page-container>
  </q-layout>
</template>

<style scoped>
.admin-grid-bg {
  background-color: #0d1219;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  background-position: center center;
}
</style>
