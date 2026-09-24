// Throwaway: mounts the user and room records with real rows for screenshots.
import { createApp, h } from 'vue'
import { Quasar } from 'quasar'
import 'quasar/dist/quasar.css'
import '@/css/app.css'
import { addCollection } from '@iconify/vue/offline'
import lucideIcons from '@iconify-json/lucide/icons.json'
addCollection(lucideIcons as never)
import UserRecord from '@/features/drawer/user/UserRecord.vue'
import RoomRecord from '@/features/drawer/room/RoomRecord.vue'
import { buildUserPreview } from '@/features/users/userPreview'

const pay = (month: string, status: string) => ({ id: month, lease_id: 'l1', accommodation_id: 'a1', month, amount: 3500, status, method: 'gcash', paid_at: status === 'paid' ? month : null })

const student = buildUserPreview({
  selectedUser: {
    name: 'Kristine Manalo', email: 'stu.kristine.manalo@isu.edu.ph', contact: '+639198371936', role: 'student', status: 'Verified',
    statusStyle: { tone: 'success' }, joined: 'Sep 20, 2026', initials: 'KM', avatarUrl: '', sex: 'F',
  },
  userDetail: { college: 'College of Computing Studies, Information and Communication Technology', program: 'BS in Computer Science', year_level: 2, student_id: '20-7751' },
  housing: { placed: true, accommodationId: 'a1', accommodationName: 'Casa Pascua Boarding House', room: 'Room 307', landlordName: 'Deann Samuel Blanza', moveIn: '2026-06-22', address: 'Purok 5, Silauan Sur, Echague' },
  boardingHistory: [], accommodationRows: [], userReviews: [],
  leases: [], payments: [pay('2026-06-01', 'paid'), pay('2026-07-01', 'paid'), pay('2026-08-01', 'paid'), pay('2026-09-01', 'overdue')],
})

const landlord = buildUserPreview({
  selectedUser: {
    name: 'Rosalinda Bagtas', email: 'rosalinda.bagtas@gmail.com', contact: '+639000000000', role: 'landlord', status: 'Verified',
    statusStyle: { tone: 'success' }, joined: 'Oct 2, 2025', initials: 'RB', avatarUrl: '', sex: 'F',
  },
  userDetail: { response_rate: 92, avg_response_minutes: 156 },
  housing: null, boardingHistory: [], userReviews: [],
  accommodationRows: [
    { id: 'a1', name: 'Centro Student Hub', status: 'accredited', room_type: null, total_rooms: 6, rating_avg: 4.23, reviews_count: 13, address: 'Purok 4, Centro East', barangay: 'Centro East', city: 'Echague', rooms: [{ capacity: 13, current_pax: 13 }] },
    { id: 'a2', name: 'Plaza Student Residences', status: 'accredited', room_type: null, total_rooms: 8, rating_avg: 5, reviews_count: 1, address: 'Purok 2, San Fabian', barangay: 'San Fabian', city: 'Echague', rooms: [{ capacity: 16, current_pax: 0 }] },
  ],
  campusResponseRate: 88,
})

const room = {
  kind: 'room', title: 'Room Preview', name: 'Quad', avatar: '',
  occupants: [
    { id: 'u1', name: 'Juan Dela Cruz', initials: 'JD', gender: 'male', since: '2026-06-01', status: 'active' },
    { id: 'u2', name: 'Mark Santos', initials: 'MS', gender: 'male', since: '2026-06-15', status: 'active' },
    { id: 'u3', name: 'Paolo Reyes', initials: 'PR', gender: 'male', since: '2026-07-01', status: 'active' },
  ],
  photos: [],
  facilities: [{ id: 'f1', type: 'aircon', label: 'Air-con', icon: 'lucide:air-vent' }],
  roomOverview: {
    coverUrl: '', title: 'Room 304', typeLabel: 'Quad', accommodation: { id: 'a1', name: 'Casa Pascua Boarding House' }, floor: 2, capacity: 4,
    status: 'available', statusLabel: 'Available', rent: 3500, rentBasis: 'person', advanceMonths: 1, depositMonths: 1,
    landlord: { id: 'l1', name: 'Deann Samuel Blanza', title: 'Landlord', contact: '+639763126760', initials: 'DB' },
  },
}

const q = new URLSearchParams(location.search)
const which = q.get('r') ?? 'student'
const loading = q.has('loading')
const App = {
  render: () =>
    h('div', { style: 'width:1240px;height:760px;padding:20px;box-sizing:border-box;background:rgba(11,20,18,.55)' }, [
      which === 'room'
        ? h(RoomRecord, { preview: room as never, loading })
        : h(UserRecord, { preview: which === 'landlord' ? landlord : student, loading, managementActions: [{ label: 'Suspend Account', action: 'suspend', danger: true }] }),
    ]),
}
createApp(App).use(Quasar, {}).mount('#app')
