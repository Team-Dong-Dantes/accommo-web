// The Accommodation Hub's three tables: their columns, and how a permit
// column reads and sorts. The page sorts with these; each table renders them.
import { REQUIRED_PERMITS, requiredPermitState, type PermitState } from '@/utils/permitExpiry'

// Male and Female sit beside Total rather than under it, so a reviewer can scan
// one column down the page. That costs width, hence the tighter percentages on
// the two identity columns — both already truncate with an ellipsis.
export const overviewColumns = [
  // Only Accommodation is left flexible, so it takes every pixel the sized
  // columns do not. See the column-sizing block in DataTable.vue.
  { name: 'accommodation', align: 'left', label: 'Accommodation', field: 'name', headerClasses: 'col-title' },
  { name: 'landlord', align: 'left', label: 'Landlord/Landlady', field: 'landlord', headerClasses: 'col-person' },
  { name: 'rooms', align: 'center', label: 'No. of Rooms', field: 'totalRooms', headerClasses: 'num-cell col-num-wide col-split' },
  { name: 'floors', align: 'center', label: 'No. of Stories', field: 'floors', headerClasses: 'num-cell col-num-wide' },
  // Total, Male and Female used to be three separate columns of plain digits.
  // One column now: the total leads, with a male/female breakdown in the same
  // mars/venus icon + colour pairing PropertyDetail.vue already uses for this
  // accommodation's gender split, so the table and its own detail drawer read
  // as the same visual language rather than two different ones.
  { name: 'occupants', align: 'center', label: 'Boarders', field: 'totalStudents', headerClasses: 'num-cell col-occupants' },
  { name: 'status', align: 'left', label: 'Status', field: 'status', headerClasses: 'col-badge-wide' },
]

// Sorting a permit column puts the ones needing attention first.
const PERMIT_ORDER: PermitState[] = ['expired', 'missing', 'expiring', 'valid']
const permitRank = (key: string) => (row: any) => PERMIT_ORDER.indexOf(permitStatus(row, key))

export const complianceColumns = [
  { name: 'accommodation', align: 'left', label: 'Accommodation', field: 'name', headerClasses: 'col-title' },
  { name: 'fire', align: 'center', label: 'Fire Safety Certificate', field: 'fire', sortValue: permitRank('fire'), headerClasses: 'col-badge col-split' },
  { name: 'business', align: 'center', label: 'Business Permit', field: 'business', sortValue: permitRank('business'), headerClasses: 'col-badge' },
  { name: 'sanitary', align: 'center', label: 'Sanitary Permit', field: 'sanitary', sortValue: permitRank('sanitary'), headerClasses: 'col-badge' },
  { name: 'building', align: 'center', label: 'Building Permit', field: 'building', sortValue: permitRank('building'), headerClasses: 'col-badge' },
]

export const performanceColumns = [
  // Sized rather than flexible: this column carries an avatar, the name and the
  // phone number underneath it.
  { name: 'accommodation', align: 'left', label: 'Accommodation', field: 'name', headerClasses: 'col-title' },
  { name: 'landlord', align: 'left', label: 'Landlord/Landlady', field: 'landlord', headerClasses: 'col-person' },
  // `rating` is display text ("4.5", or "—" when unrated).
  { name: 'rating', align: 'left', label: 'Rating', field: 'rating', sortValue: (r: any) => parseFloat(r.rating), headerClasses: 'col-num-wide col-split' },
  { name: 'response', align: 'left', label: 'Response', field: 'responseRate', headerClasses: 'col-num-wide' },
  { name: 'occupancy', align: 'center', label: 'Occupancy', field: 'totalStudents', headerClasses: 'num-cell col-badge' },
]

// The required permits, one Compliance column each; the list and the matching
// live in utils/permitExpiry, shared with the renewal report.
export const requiredPermits = REQUIRED_PERMITS.map((p) => p.key)
export const permitStatus = (prop: any, requiredType: string): PermitState => requiredPermitState(prop.permits, requiredType)
