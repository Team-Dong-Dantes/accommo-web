<template>
  <q-btn flat round dense color="grey-7" size="15px" class="relative-position q-mr-sm">
    <Icon icon="mdi:bell" width="15" height="15" />

    <q-badge v-if="unreadCount > 0" color="red" floating rounded style="top: 0px; right: 0px; font-weight: bold;">
      {{ unreadCount }}
    </q-badge>

    <q-menu anchor="bottom right" self="top right" :offset="[0, 12]"
      style="border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); width: 340px; max-height: 80vh;">
      <div class="row items-center justify-between q-pa-md border-bottom bg-white sticky-top z-top">
        <div class="text-weight-bold text-subtitle1" style="line-height: 1;">Notifications</div>
        <q-btn v-if="unreadCount > 0" flat dense size="11px" color="teal-6" label="Mark all as read"
          @click="markAllRead" class="text-weight-bold" />
      </div>

      <q-list class="q-py-xs">
        <q-item v-for="notif in notifications" :key="notif.id" clickable v-ripple
          :class="notif.unread ? 'bg-teal-1' : ''" @click="notif.unread = false" class="q-pa-md transition-bg">
          <q-item-section avatar>
            <q-avatar :color="notif.color" text-color="white" size="40px" font-size="20px">
              <Icon :icon="notif.icon" width="20" height="20" />
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-weight-bold" style="font-size: 13px; line-height: 1.3;">{{ notif.title
              }}</q-item-label>
            <q-item-label caption class="text-grey-8 q-mt-xs" style="font-size: 11px; line-height: 1.4;">{{
              notif.message }}</q-item-label>
            <q-item-label caption class="text-grey-5 q-mt-xs" style="font-size: 10px; font-weight: 600;">{{ notif.time
              }}</q-item-label>
          </q-item-section>

          <q-item-section side v-if="notif.unread" class="justify-center">
            <div class="unread-dot bg-red-5"></div>
          </q-item-section>
        </q-item>

        <q-item v-if="notifications.length === 0" class="q-pa-lg flex flex-center">
          <div class="text-grey-5 text-center">
            <Icon icon="mdi:bell-off-outline" width="40" height="40" class="q-mb-sm" />
            <div style="font-size: 12px; font-weight: 600;">You're all caught up!</div>
          </div>
        </q-item>
      </q-list>

      <div class="q-pa-sm text-center border-top bg-white sticky-bottom">
        <q-btn flat dense color="teal-7" label="View All Notifications" class="full-width text-weight-bold"
          style="font-size: 12px;" />
      </div>
    </q-menu>

  </q-btn>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const notifications = ref([
  { id: 1, title: 'New Registration Pending', message: 'Pedro Santos applied as a Landlord for Sunrise Boarding House.', time: '10 min ago', icon: 'mdi:person-add', color: 'teal-5', unread: true },
  { id: 2, title: 'Urgent Grievance Filed', message: 'TKT-0038: Student reported unauthorized room entry.', time: '1 hr ago', icon: 'mdi:alert-circle', color: 'red-5', unread: true },
  { id: 3, title: 'Property Verified', message: 'Maharlika Student Hub has been successfully verified.', time: '3 hrs ago', icon: 'mdi:verified', color: 'blue-5', unread: false },
  { id: 4, title: 'System Update', message: 'Server maintenance scheduled for tonight at 12:00 AM.', time: '1 day ago', icon: 'mdi:cog', color: 'grey-7', unread: false },
  { id: 5, title: 'Payment Alert', message: 'New rent threshold data has been compiled for May.', time: '2 days ago', icon: 'mdi:credit-card', color: 'orange-5', unread: false }
]);

const unreadCount = computed(() => notifications.value.filter(n => n.unread).length);

function markAllRead() {
  notifications.value.forEach(n => n.unread = false);
}
</script>

<style scoped>
.border-bottom {
  border-bottom: 1px solid #f0f0f0;
}

.border-top {
  border-top: 1px solid #f0f0f0;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(244, 67, 54, 0.4);
}

.sticky-top {
  position: sticky;
  top: 0;
}

.sticky-bottom {
  position: sticky;
  bottom: 0;
}

.transition-bg {
  transition: background-color 0.3s ease;
}
</style>
