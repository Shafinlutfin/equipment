/* ==========================================================================
   EZ3 FOOTBALL ACADEMY EQUIPMENT TRACKER - APPLICATION LOGIC (app.js)
   ========================================================================== */

// --- STATE MANAGEMENT & INITIAL DATA SEED ---
const INITIAL_INVENTORY = [
  { id: '1', name: 'ISL Ball', category: 'Balls', total_count: 10 },
  { id: '2', name: 'Normal Ball', category: 'Balls', total_count: 15 },
  { id: '3', name: 'Markers', category: 'Markers & Cones', total_count: 50 },
  { id: '4', name: 'Cone', category: 'Markers & Cones', total_count: 30 },
  { id: '5', name: 'Balancing Ball', category: 'Gym & Agility', total_count: 10 },
  { id: '6', name: 'Bosu Ball', category: 'Gym & Agility', total_count: 5 },
  { id: '7', name: 'Small Hurdles', category: 'Gym & Agility', total_count: 12 },
  { id: '8', name: 'Medium Hurdles', category: 'Gym & Agility', total_count: 12 },
  { id: '9', name: 'Gym Ball', category: 'Gym & Agility', total_count: 6 }
];

const DEFAULT_STAFF = [
  { id: 'staff-1', name: 'Coach Alex', role: 'Head Coach', avatar: 'CA' },
  { id: 'staff-2', name: 'Coach Rahul', role: 'Assistant Coach', avatar: 'CR' },
  { id: 'staff-3', name: 'Staff John', role: 'Equipment Mgr', avatar: 'SJ' },
  { id: 'staff-4', name: 'Coach David', role: 'Fitness Trainer', avatar: 'CD' }
];

// App State
let state = {
  currentTab: 'inventory',
  activeCategory: 'All',
  inventory: [],
  sessions: [],
  staffMembers: [],
  selectedSlot: 'Morning',
  selectedStaff: 'Coach Alex',
  sessionDraft: {}, // { item_id: count }
  sessionMode: 'CHECKOUT', // 'CHECKOUT' or 'RETURN'
  historyMode: 'SINGLE', // 'SINGLE' or 'ALL'
  historyDate: getTodayDateString(),
  modalCount: 10
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  initStorage();
  initDatePickers();
  renderAllViews();
});

function getTodayDateString() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function initStorage() {
  // Load or seed inventory
  const localInv = localStorage.getItem('ez3_inventory');
  if (localInv) {
    state.inventory = JSON.parse(localInv);
  } else {
    state.inventory = [...INITIAL_INVENTORY];
    saveInventory();
  }

  // Load or seed staff roster
  const localStaff = localStorage.getItem('ez3_staff');
  if (localStaff) {
    state.staffMembers = JSON.parse(localStaff);
  } else {
    state.staffMembers = [...DEFAULT_STAFF];
    saveStaff();
  }
  if (state.staffMembers.length > 0) {
    state.selectedStaff = state.staffMembers[0].name;
  }

  // Load or seed session history logs (pre-seeded with 30-day analytics data)
  const localSessions = localStorage.getItem('ez3_sessions');
  if (localSessions) {
    state.sessions = JSON.parse(localSessions);
  } else {
    state.sessions = seedHistoricalSessions();
    saveSessions();
  }
}

function saveInventory() {
  localStorage.setItem('ez3_inventory', JSON.stringify(state.inventory));
}

function saveStaff() {
  localStorage.setItem('ez3_staff', JSON.stringify(state.staffMembers));
}

function saveSessions() {
  localStorage.setItem('ez3_sessions', JSON.stringify(state.sessions));
}

function seedHistoricalSessions() {
  const today = new Date();
  const logs = [];

  // Seed sample session with discrepancy 2 days ago
  const date2 = new Date(today);
  date2.setDate(today.getDate() - 2);
  const date2Str = date2.toISOString().split('T')[0];

  logs.push({
    id: 'log-hist-1',
    log_date: date2Str,
    session_type: 'Evening',
    logged_by: 'Staff John',
    items_taken: { '4': 20, '1': 6 }, // 20 Cones, 6 ISL Balls
    items_returned: { '4': 17, '1': 6 }, // 17 returned, 3 Cones missing
    missing_items: { '4': 3 },
    status: 'COMPLETED',
    has_discrepancy: true,
    created_at: new Date(date2.setHours(18, 30)).toISOString()
  });

  // Seed sample session 5 days ago
  const date5 = new Date(today);
  date5.setDate(today.getDate() - 5);
  const date5Str = date5.toISOString().split('T')[0];

  logs.push({
    id: 'log-hist-2',
    log_date: date5Str,
    session_type: 'Morning',
    logged_by: 'Coach Alex',
    items_taken: { '1': 5, '3': 30 },
    items_returned: { '1': 4, '3': 30 }, // 1 ISL Ball missing
    missing_items: { '1': 1 },
    status: 'COMPLETED',
    has_discrepancy: true,
    created_at: new Date(date5.setHours(8, 0)).toISOString()
  });

  return logs;
}

function initDatePickers() {
  const picker = document.getElementById('history-date-picker');
  if (picker) {
    picker.value = state.historyDate;
  }
}

// --- RENDER ROUTER ---
function renderAllViews() {
  renderCategoryCounts();
  renderInventoryGrid();
  renderAnalyticsWidget();
  renderStaffAvatars();
  initSessionState();
  renderSessionForm();
  renderHistoryView();
  updateActiveSessionDots();
}

// --- NAVIGATION & TABS ---
function switchTab(tabName) {
  state.currentTab = tabName;
  
  // Update desktop sidebar buttons
  document.querySelectorAll('.desktop-sidebar .nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Update mobile bottom nav buttons
  document.querySelectorAll('.mobile-bottom-nav .mobile-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Update tab content displays
  document.querySelectorAll('.tab-content').forEach(section => {
    section.classList.toggle('active', section.id === `tab-${tabName}`);
  });

  // Re-render target tab specifics
  if (tabName === 'inventory') {
    renderInventoryGrid();
    renderAnalyticsWidget();
  } else if (tabName === 'session') {
    initSessionState();
    renderSessionForm();
  } else if (tabName === 'history') {
    renderHistoryView();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- TAB 1: TOTAL INVENTORY ---
function filterCategory(categoryName) {
  state.activeCategory = categoryName;
  
  document.querySelectorAll('.cat-pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.cat === categoryName);
  });

  renderInventoryGrid();
}

function renderCategoryCounts() {
  const counts = { All: 0, Balls: 0, 'Markers & Cones': 0, 'Gym & Agility': 0 };
  
  state.inventory.forEach(item => {
    counts.All += 1;
    if (counts[item.category] !== undefined) {
      counts[item.category] += 1;
    }
  });

  const catAll = document.getElementById('cat-count-all');
  const catBalls = document.getElementById('cat-count-balls');
  const catMarkers = document.getElementById('cat-count-markers');
  const catGym = document.getElementById('cat-count-gym');

  if (catAll) catAll.textContent = counts.All;
  if (catBalls) catBalls.textContent = counts.Balls;
  if (catMarkers) catMarkers.textContent = counts['Markers & Cones'];
  if (catGym) catGym.textContent = counts['Gym & Agility'];
}

function renderInventoryGrid() {
  const container = document.getElementById('inventory-grid');
  if (!container) return;

  const filtered = state.inventory.filter(item => {
    if (state.activeCategory === 'All') return true;
    return item.category === state.activeCategory;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box">
        <i data-lucide="package-open" style="width:48px;height:48px;color:#9CA3AF;"></i>
        <p>No equipment found in this category.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = filtered.map(item => `
    <div class="equipment-card">
      <div>
        <div class="eq-top">
          <span class="eq-category-tag">${escapeHtml(item.category)}</span>
          <span class="eq-stock-badge">${item.total_count} IN STOCK</span>
        </div>
        <h3 class="eq-title">${escapeHtml(item.name)}</h3>
      </div>

      <div class="eq-stepper-row">
        <button class="stepper-btn" onclick="adjustItemStock('${item.id}', -1)" title="Decrease Stock">-</button>
        <span class="eq-count-display">${item.total_count}</span>
        <button class="stepper-btn" onclick="adjustItemStock('${item.id}', 1)" title="Increase Stock">+</button>
        <button class="stepper-btn chip-btn" onclick="adjustItemStock('${item.id}', 5)" title="Add 5 items">+5</button>
      </div>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

function adjustItemStock(itemId, delta) {
  const item = state.inventory.find(i => i.id === itemId);
  if (!item) return;

  item.total_count = Math.max(0, item.total_count + delta);
  saveInventory();
  renderInventoryGrid();
  renderCategoryCounts();
  showToast(`Updated ${item.name} stock to ${item.total_count}`);
}

function renderAnalyticsWidget() {
  // Compute 30-day statistics
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let totalItemsLost = 0;
  const itemLossMap = {}; // name -> count
  const catLossMap = { 'Balls': 0, 'Markers & Cones': 0, 'Gym & Agility': 0, 'General': 0 };

  state.sessions.forEach(sess => {
    const sessDate = new Date(sess.log_date);
    if (sessDate >= thirtyDaysAgo && sess.has_discrepancy && sess.missing_items) {
      Object.entries(sess.missing_items).forEach(([itemId, missingQty]) => {
        totalItemsLost += missingQty;
        const invItem = state.inventory.find(i => i.id === itemId);
        const name = invItem ? invItem.name : 'Equipment';
        const cat = invItem ? invItem.category : 'General';

        itemLossMap[name] = (itemLossMap[name] || 0) + missingQty;
        if (catLossMap[cat] !== undefined) {
          catLossMap[cat] += missingQty;
        } else {
          catLossMap['General'] += missingQty;
        }
      });
    }
  });

  // Find most lost item
  let mostLostName = 'None';
  let maxLossCount = 0;
  Object.entries(itemLossMap).forEach(([name, count]) => {
    if (count > maxLossCount) {
      maxLossCount = count;
      mostLostName = `${name} (${count})`;
    }
  });

  // Update DOM metrics
  const totalLostEl = document.getElementById('metric-total-lost');
  const mostLostEl = document.getElementById('metric-most-lost');
  const lossRateEl = document.getElementById('metric-loss-rate');
  const barsContainer = document.getElementById('loss-chart-bars');

  if (totalLostEl) totalLostEl.textContent = totalItemsLost;
  if (mostLostEl) mostLostEl.textContent = mostLostName;
  if (lossRateEl) {
    // Arbitrary benchmark: 100% - (lost / total_stock)*100
    const totalMasterStock = state.inventory.reduce((acc, curr) => acc + curr.total_count, 0);
    const recoveryRate = totalMasterStock > 0 ? Math.max(0, 100 - Math.round((totalItemsLost / totalMasterStock) * 100)) : 100;
    lossRateEl.textContent = `${recoveryRate}%`;
  }

  if (barsContainer) {
    const maxCatVal = Math.max(1, ...Object.values(catLossMap));
    barsContainer.innerHTML = Object.entries(catLossMap).map(([cat, count]) => {
      const pct = Math.round((count / maxCatVal) * 100);
      return `
        <div class="chart-bar-item">
          <div class="bar-meta">
            <span>${escapeHtml(cat)}</span>
            <span>${count} lost</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill ${count > 0 ? 'highlight' : ''}" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  }
}

// --- TAB 2: DAILY SESSION LOG ---
function selectSessionSlot(slot) {
  state.selectedSlot = slot;
  document.getElementById('slot-morning').classList.toggle('active', slot === 'Morning');
  document.getElementById('slot-evening').classList.toggle('active', slot === 'Evening');
  
  initSessionState();
  renderSessionForm();
}

function getAvatarInitials(name) {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function renderStaffAvatars() {
  const container = document.getElementById('staff-avatars-list');
  if (!container) return;

  container.innerHTML = state.staffMembers.map(staff => `
    <button type="button" class="staff-avatar-btn ${state.selectedStaff === staff.name ? 'active' : ''}" onclick="selectStaff('${escapeHtml(staff.name)}')">
      <div class="staff-img">${staff.avatar || getAvatarInitials(staff.name)}</div>
      <div style="text-align:left;">
        <span class="staff-name">${escapeHtml(staff.name)}</span>
      </div>
    </button>
  `).join('');
}

function selectStaff(staffName) {
  state.selectedStaff = staffName;
  renderStaffAvatars();
}

// --- MANAGE STAFF MODAL LOGIC ---
function openManageStaffModal() {
  renderStaffManageList();
  const modal = document.getElementById('manage-staff-modal');
  if (modal) modal.classList.add('open');
}

function closeManageStaffModal() {
  const modal = document.getElementById('manage-staff-modal');
  if (modal) modal.classList.remove('open');
}

function renderStaffManageList() {
  const container = document.getElementById('staff-manage-list');
  if (!container) return;

  container.innerHTML = state.staffMembers.map(staff => `
    <div class="staff-edit-item-row" data-id="${staff.id}">
      <div class="staff-avatar-circle">${staff.avatar || getAvatarInitials(staff.name)}</div>
      <div class="staff-edit-inputs">
        <input type="text" class="name-input" value="${escapeHtml(staff.name)}" placeholder="Coach Name" onchange="updateStaffTempName('${staff.id}', this.value)">
        <input type="text" class="role-input" value="${escapeHtml(staff.role || 'Coach')}" placeholder="Role" onchange="updateStaffTempRole('${staff.id}', this.value)">
      </div>
      <button type="button" class="delete-staff-btn" onclick="deleteStaffMember('${staff.id}')" title="Delete Staff Member">
        <i data-lucide="trash-2"></i>
      </button>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

function updateStaffTempName(id, newName) {
  const staff = state.staffMembers.find(s => s.id === id);
  if (staff && newName.trim()) {
    const oldName = staff.name;
    staff.name = newName.trim();
    staff.avatar = getAvatarInitials(staff.name);
    if (state.selectedStaff === oldName) {
      state.selectedStaff = staff.name;
    }
  }
}

function updateStaffTempRole(id, newRole) {
  const staff = state.staffMembers.find(s => s.id === id);
  if (staff) {
    staff.role = newRole.trim() || 'Coach';
  }
}

function addNewStaffMember() {
  const nameInput = document.getElementById('new-staff-name');
  const roleInput = document.getElementById('new-staff-role');

  if (!nameInput || !nameInput.value.trim()) {
    showToast('Please enter a staff/coach name!');
    return;
  }

  const name = nameInput.value.trim();
  const role = roleInput ? (roleInput.value.trim() || 'Coach') : 'Coach';
  const newStaff = {
    id: `staff-${Date.now()}`,
    name: name,
    role: role,
    avatar: getAvatarInitials(name)
  };

  state.staffMembers.push(newStaff);
  nameInput.value = '';
  if (roleInput) roleInput.value = '';

  renderStaffManageList();
  showToast(`Added ${newStaff.name} to list.`);
}

function deleteStaffMember(id) {
  if (state.staffMembers.length <= 1) {
    showToast('At least 1 coach/staff member must remain!');
    return;
  }

  const staff = state.staffMembers.find(s => s.id === id);
  state.staffMembers = state.staffMembers.filter(s => s.id !== id);

  if (state.selectedStaff === (staff ? staff.name : '')) {
    state.selectedStaff = state.staffMembers[0].name;
  }

  renderStaffManageList();
  showToast('Removed staff member.');
}

function saveStaffChanges() {
  saveStaff();
  renderStaffAvatars();
  closeManageStaffModal();
  showToast('Saved coach & staff roster changes!');
}

function initSessionState() {
  const today = getTodayDateString();
  const activeSess = state.sessions.find(s => s.log_date === today && s.session_type === state.selectedSlot && s.status === 'ACTIVE');

  if (activeSess) {
    state.sessionMode = 'RETURN';
    state.sessionDraft = { ...activeSess.items_taken };
    if (activeSess.logged_by) state.selectedStaff = activeSess.logged_by;
  } else {
    state.sessionMode = 'CHECKOUT';
    state.sessionDraft = {};
  }
}

function renderSessionForm() {
  renderStaffAvatars();

  const titleEl = document.getElementById('session-items-title');
  const subEl = document.getElementById('session-items-subtitle');
  const modeBadge = document.getElementById('session-mode-badge');
  const bannerTitle = document.getElementById('banner-status-title');
  const bannerDesc = document.getElementById('banner-status-desc');
  const bannerIcon = document.getElementById('banner-status-icon');
  const submitLabel = document.getElementById('submit-btn-label');
  const stickyCount = document.getElementById('sticky-count-text');
  const stickySub = document.getElementById('sticky-subtext');

  const today = getTodayDateString();
  const activeSess = state.sessions.find(s => s.log_date === today && s.session_type === state.selectedSlot && s.status === 'ACTIVE');

  if (state.sessionMode === 'CHECKOUT') {
    if (titleEl) titleEl.textContent = `Checkout Checklist (${state.selectedSlot} Slot)`;
    if (subEl) subEl.textContent = 'Specify how many items staff are taking out to the pitch.';
    if (modeBadge) {
      modeBadge.textContent = 'CHECKOUT MODE';
      modeBadge.className = 'session-mode-badge';
    }

    if (bannerTitle) bannerTitle.textContent = 'Ready for Checkout';
    if (bannerDesc) bannerDesc.textContent = `Logging as ${state.selectedStaff} for ${state.selectedSlot} Session.`;
    if (bannerIcon) bannerIcon.innerHTML = `<i data-lucide="play-circle"></i>`;
    if (submitLabel) submitLabel.textContent = 'CHECK OUT GEAR';

  } else {
    // RETURN MODE
    if (titleEl) titleEl.textContent = `Return Checklist (${state.selectedSlot} Slot)`;
    if (subEl) subEl.textContent = 'Verify items brought back from the pitch. Tap "-" if gear was misplaced.';
    if (modeBadge) {
      modeBadge.textContent = 'RETURN MODE';
      modeBadge.className = 'session-mode-badge return';
    }

    if (bannerTitle) bannerTitle.textContent = `Session ACTIVE (${activeSess ? activeSess.logged_by : ''})`;
    if (bannerDesc) bannerDesc.textContent = 'Gear currently out on pitch. Complete return when session finishes.';
    if (bannerIcon) bannerIcon.innerHTML = `<i data-lucide="alert-circle"></i>`;
    if (submitLabel) submitLabel.textContent = 'COMPLETE RETURN';
  }

  // Render Item List
  const itemsContainer = document.getElementById('session-items-list');
  if (!itemsContainer) return;

  itemsContainer.innerHTML = state.inventory.map(item => {
    const currentVal = state.sessionDraft[item.id] || 0;
    const maxVal = state.sessionMode === 'RETURN' && activeSess ? (activeSess.items_taken[item.id] || 0) : item.total_count;

    if (state.sessionMode === 'RETURN' && maxVal === 0) {
      // Don't render items that weren't checked out in Return mode
      return '';
    }

    return `
      <div class="session-item-row ${currentVal > 0 ? 'has-taken' : ''}">
        <div class="item-left">
          <span class="item-name">${escapeHtml(item.name)}</span>
          <span class="item-meta">Category: ${escapeHtml(item.category)} ${state.sessionMode === 'RETURN' ? `(Taken: ${maxVal})` : `(Stock: ${item.total_count})`}</span>
        </div>

        <div class="item-counter-control">
          <button type="button" class="stepper-btn" onclick="adjustDraftCount('${item.id}', -1)" title="Decrease">-</button>
          <span class="count-val-chip">${currentVal}</span>
          <button type="button" class="stepper-btn" onclick="adjustDraftCount('${item.id}', 1)" title="Increase">+</button>
          ${state.sessionMode === 'CHECKOUT' ? `<button type="button" class="stepper-btn chip-btn" onclick="adjustDraftCount('${item.id}', 5)">+5</button>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Calculate totals for sticky bar
  let totalSelected = 0;
  Object.values(state.sessionDraft).forEach(qty => { totalSelected += qty; });

  if (stickyCount) {
    stickyCount.textContent = `${totalSelected} items ${state.sessionMode === 'CHECKOUT' ? 'checked out' : 'returning'}`;
  }
  if (stickySub) {
    stickySub.textContent = state.sessionMode === 'CHECKOUT' ? `For ${state.selectedSlot} Session by ${state.selectedStaff}` : 'Verify pitch return count';
  }

  if (window.lucide) lucide.createIcons();
}

function adjustDraftCount(itemId, delta) {
  const current = state.sessionDraft[itemId] || 0;
  const item = state.inventory.find(i => i.id === itemId);
  if (!item) return;

  const today = getTodayDateString();
  const activeSess = state.sessions.find(s => s.log_date === today && s.session_type === state.selectedSlot && s.status === 'ACTIVE');

  let maxLimit = item.total_count;
  if (state.sessionMode === 'RETURN' && activeSess) {
    maxLimit = activeSess.items_taken[itemId] || 0;
  }

  const newVal = Math.min(maxLimit, Math.max(0, current + delta));
  if (newVal === 0) {
    delete state.sessionDraft[itemId];
  } else {
    state.sessionDraft[itemId] = newVal;
  }

  renderSessionForm();
}

function handleSessionSubmit() {
  const today = getTodayDateString();
  let activeSessIndex = state.sessions.findIndex(s => s.log_date === today && s.session_type === state.selectedSlot && s.status === 'ACTIVE');

  if (state.sessionMode === 'CHECKOUT') {
    // Verify at least 1 item checked out
    let totalTaken = 0;
    Object.values(state.sessionDraft).forEach(q => totalTaken += q);

    if (totalTaken === 0) {
      showToast('Please select at least 1 equipment item to check out!');
      return;
    }

    const newLog = {
      id: `log-${Date.now()}`,
      log_date: today,
      session_type: state.selectedSlot,
      logged_by: state.selectedStaff,
      items_taken: { ...state.sessionDraft },
      items_returned: null,
      missing_items: null,
      status: 'ACTIVE',
      has_discrepancy: false,
      created_at: new Date().toISOString()
    };

    state.sessions.unshift(newLog);
    saveSessions();
    showToast(`Checked out ${totalTaken} items for ${state.selectedSlot} Session!`);
    
    // Switch to Return mode
    state.sessionMode = 'RETURN';
    renderSessionForm();
    updateActiveSessionDots();

  } else {
    // COMPLETE RETURN & DISCREPANCY CALCULATION
    if (activeSessIndex === -1) {
      showToast('No active session found to complete!');
      return;
    }

    const activeSess = state.sessions[activeSessIndex];
    const itemsTaken = activeSess.items_taken;
    const itemsReturned = { ...state.sessionDraft };

    const missingItems = {};
    let hasDiscrepancy = false;
    let totalMissing = 0;

    Object.entries(itemsTaken).forEach(([itemId, qtyTaken]) => {
      const qtyRet = itemsReturned[itemId] || 0;
      if (qtyRet < qtyTaken) {
        const diff = qtyTaken - qtyRet;
        missingItems[itemId] = diff;
        hasDiscrepancy = true;
        totalMissing += diff;
      }
    });

    // Update active session record
    activeSess.items_returned = itemsReturned;
    activeSess.missing_items = missingItems;
    activeSess.status = 'COMPLETED';
    activeSess.has_discrepancy = hasDiscrepancy;

    saveSessions();
    updateActiveSessionDots();

    if (hasDiscrepancy) {
      showToast(`⚠️ Session completed with ${totalMissing} missing item(s)! Alert generated.`, 'danger');
      switchTab('history');
    } else {
      showToast(`✅ All equipment returned cleanly! Great job ${activeSess.logged_by}.`);
      state.sessionMode = 'CHECKOUT';
      state.sessionDraft = {};
      renderSessionForm();
    }
  }
}

function updateActiveSessionDots() {
  const today = getTodayDateString();
  const hasActive = state.sessions.some(s => s.log_date === today && s.status === 'ACTIVE');

  const dot1 = document.getElementById('active-session-dot');
  const dot2 = document.getElementById('mobile-session-dot');

  if (dot1) dot1.style.display = hasActive ? 'block' : 'none';
  if (dot2) dot2.style.display = hasActive ? 'block' : 'none';
}

// --- TAB 3: DAILY HISTORY & WHATSAPP SHARING ---
function getRelativeDateString(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

function selectQuickDate(quickKey) {
  const chipToday = document.getElementById('chip-today');
  const chipYesterday = document.getElementById('chip-yesterday');
  const chip7days = document.getElementById('chip-7days');
  const chipAll = document.getElementById('chip-all');
  const datePicker = document.getElementById('history-date-picker');

  [chipToday, chipYesterday, chip7days, chipAll].forEach(c => {
    if (c) c.classList.remove('active');
  });

  if (quickKey === 'today') {
    state.historyMode = 'SINGLE';
    state.historyDate = getTodayDateString();
    if (chipToday) chipToday.classList.add('active');
    if (datePicker) datePicker.value = state.historyDate;
  } else if (quickKey === 'yesterday') {
    state.historyMode = 'SINGLE';
    state.historyDate = getRelativeDateString(-1);
    if (chipYesterday) chipYesterday.classList.add('active');
    if (datePicker) datePicker.value = state.historyDate;
  } else if (quickKey === '7days') {
    state.historyMode = 'SINGLE';
    state.historyDate = getRelativeDateString(-7);
    if (chip7days) chip7days.classList.add('active');
    if (datePicker) datePicker.value = state.historyDate;
  } else if (quickKey === 'all') {
    state.historyMode = 'ALL';
    if (chipAll) chipAll.classList.add('active');
  }

  renderHistoryView();
}

function loadHistoryForDate(dateStr) {
  if (!dateStr) return;
  state.historyMode = 'SINGLE';
  state.historyDate = dateStr;

  const todayStr = getTodayDateString();
  const yestStr = getRelativeDateString(-1);
  const days7Str = getRelativeDateString(-7);

  const chipToday = document.getElementById('chip-today');
  const chipYesterday = document.getElementById('chip-yesterday');
  const chip7days = document.getElementById('chip-7days');
  const chipAll = document.getElementById('chip-all');

  [chipToday, chipYesterday, chip7days, chipAll].forEach(c => {
    if (c) c.classList.remove('active');
  });

  if (dateStr === todayStr && chipToday) chipToday.classList.add('active');
  else if (dateStr === yestStr && chipYesterday) chipYesterday.classList.add('active');
  else if (dateStr === days7Str && chip7days) chip7days.classList.add('active');

  renderHistoryView();
}

function renderHistoryView() {
  let daySessions = [];
  let displayTitleDate = state.historyDate;

  if (state.historyMode === 'ALL') {
    daySessions = [...state.sessions];
    displayTitleDate = 'All Historical Pitch Sessions';
  } else {
    daySessions = state.sessions.filter(s => s.log_date === state.historyDate);
  }

  // Sort sessions newest first
  daySessions.sort((a, b) => new Date(b.created_at || b.log_date).getTime() - new Date(a.created_at || a.log_date).getTime());

  // 1. Render Missing Gear Summary Alert Card
  renderMissingSummaryCard(daySessions, displayTitleDate);

  // 2. Render Session Ledger Cards
  const container = document.getElementById('history-sessions-container');
  if (!container) return;

  if (daySessions.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box bento-card" style="grid-column:1/-1;text-align:center;padding:48px;">
        <i data-lucide="calendar-x" style="width:48px;height:48px;color:#9CA3AF;margin-bottom:12px;"></i>
        <h4 style="font-family:var(--font-family-heading);font-size:1.2rem;">No pitch logs found</h4>
        <p style="color:var(--color-text-muted);font-size:0.9rem;">Select a different date from the header calendar or tap 'All Past Logs'.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = daySessions.map(sess => {
    const isCompleted = sess.status === 'COMPLETED';
    const isDiscrepancy = sess.has_discrepancy;

    let statusBadgeClass = 'status-badge-chip active';
    let statusText = 'ACTIVE ON PITCH';
    if (isCompleted) {
      if (isDiscrepancy) {
        statusBadgeClass = 'status-badge-chip discrepancy';
        statusText = 'MISSING GEAR DETECTED';
      } else {
        statusBadgeClass = 'status-badge-chip completed';
        statusText = 'COMPLETED (FULL RETURN)';
      }
    }

    return `
      <div class="ledger-card">
        <div class="ledger-header">
          <div class="ledger-slot-badge">
            <span>${sess.session_type === 'Morning' ? '🌅' : '🌆'}</span>
            <span>${escapeHtml(sess.session_type)} Session</span>
            <span style="font-size:0.8rem;color:var(--color-text-muted);font-weight:600;">(${sess.log_date})</span>
          </div>
          <span class="${statusBadgeClass}">${statusText}</span>
        </div>

        <div class="ledger-meta-row">
          <span><strong>Staff:</strong> ${escapeHtml(sess.logged_by)}</span>
          <span><strong>Logged At:</strong> ${new Date(sess.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div class="ledger-items-table">
          ${Object.entries(sess.items_taken).map(([itemId, qtyTaken]) => {
            const item = state.inventory.find(i => i.id === itemId);
            const itemName = item ? item.name : 'Item';
            const qtyRet = sess.items_returned ? (sess.items_returned[itemId] || 0) : null;
            const missing = sess.missing_items ? (sess.missing_items[itemId] || 0) : 0;

            if (missing > 0) {
              return `
                <div class="table-row-item missing">
                  <span>⚠️ ${escapeHtml(itemName)}</span>
                  <span>Taken: ${qtyTaken} | Returned: ${qtyRet} (MISSING: ${missing})</span>
                </div>
              `;
            }

            return `
              <div class="table-row-item">
                <span>${escapeHtml(itemName)}</span>
                <span>Taken: ${qtyTaken} ${qtyRet !== null ? `| Returned: ${qtyRet}` : ''}</span>
              </div>
            `;
          }).join('')}
        </div>

        ${sess.resolution_note ? `
          <div style="margin-top:12px;font-size:0.8rem;color:var(--color-success);font-weight:700;background:rgba(16,185,129,0.1);padding:8px 12px;border-radius:var(--radius-sm);">
            <span>✅ Note: ${escapeHtml(sess.resolution_note)}</span>
          </div>
        ` : ''}

        ${isDiscrepancy ? `
          <button type="button" class="resolve-gear-action-btn" onclick="openResolveModal('${sess.id}')">
            <i data-lucide="check-check"></i>
            <span>Resolve Found Equipment</span>
          </button>
        ` : ''}
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function renderMissingSummaryCard(daySessions, targetDate) {
  const container = document.getElementById('missing-summary-card');
  if (!container) return;

  // Find all missing items across Morning and Evening for this date
  const missingList = [];
  daySessions.forEach(sess => {
    if (sess.has_discrepancy && sess.missing_items) {
      Object.entries(sess.missing_items).forEach(([itemId, count]) => {
        const item = state.inventory.find(i => i.id === itemId);
        const name = item ? item.name : 'Gear';
        missingList.push(`${count} ${name} (${sess.session_type} - ${sess.logged_by})`);
      });
    }
  });

  if (missingList.length === 0) {
    container.className = 'bento-card missing-summary-card all-clear-card';
    container.innerHTML = `
      <div class="missing-card-header">
        <div class="alert-title-group">
          <i data-lucide="shield-check" style="width:28px;height:28px;color:#121316;"></i>
          <h3>Daily Equipment Status: ALL CLEAR</h3>
        </div>
        <span class="badge-tag lime">NO LOSSES</span>
      </div>
      <p style="font-weight:600;color:var(--color-obsidian);">No missing gear reported for ${targetDate}. All checked-out equipment was returned in full.</p>
    `;
  } else {
    const summaryText = missingList.join(', ');
    const whatsappMsg = buildWhatsAppMessage(targetDate, summaryText, daySessions);

    container.className = 'bento-card missing-summary-card';
    container.innerHTML = `
      <div class="missing-card-header">
        <div class="alert-title-group">
          <i data-lucide="alert-triangle" style="width:28px;height:28px;color:#991B1B;"></i>
          <h3>🚨 TODAY'S MISSING GEAR SUMMARY</h3>
        </div>
        <button class="whatsapp-share-btn" onclick="shareOnWhatsApp('${encodeURIComponent(whatsappMsg)}')">
          <i data-lucide="message-circle"></i>
          <span>Share on WhatsApp</span>
        </button>
      </div>
      <div class="missing-details-text">
        <strong>Incident Summary for ${targetDate}:</strong><br>
        ${summaryText}
      </div>
    `;
  }

  if (window.lucide) lucide.createIcons();
}

function buildWhatsAppMessage(dateStr, summaryText, daySessions) {
  let msg = `⚽ *EZ3 FOOTBALL ACADEMY - EQUIPMENT INCIDENT REPORT*\n`;
  msg += `📅 *Date:* ${dateStr}\n\n`;
  msg += `🚨 *MISSING GEAR SUMMARY:*\n`;
  msg += `${summaryText}\n\n`;
  msg += `📋 *SESSION BREAKDOWN:*\n`;

  daySessions.forEach(sess => {
    msg += `• *${sess.session_type} Session* (${sess.logged_by}): `;
    if (sess.has_discrepancy && sess.missing_items) {
      const sessMissing = Object.entries(sess.missing_items).map(([id, c]) => {
        const item = state.inventory.find(i => i.id === id);
        return `${c} ${item ? item.name : 'Item'}`;
      }).join(', ');
      msg += `⚠️ Missing ${sessMissing}\n`;
    } else {
      msg += `✅ Full Return\n`;
    }
  });

  msg += `\n_Generated via EZ3 Equipment Tracker_`;
  return msg;
}

function shareOnWhatsApp(encodedMsg) {
  const url = `https://wa.me/?text=${encodedMsg}`;
  window.open(url, '_blank');
}

// --- MODAL: ADD NEW ITEM ---
function openAddItemModal() {
  const modal = document.getElementById('add-item-modal');
  if (modal) modal.classList.add('open');
}

function closeAddItemModal() {
  const modal = document.getElementById('add-item-modal');
  if (modal) modal.classList.remove('open');
}

function adjustModalCount(delta) {
  const input = document.getElementById('new-item-count');
  if (!input) return;
  const current = parseInt(input.value) || 0;
  input.value = Math.max(1, current + delta);
}

function handleAddNewItem(e) {
  e.preventDefault();
  const nameInput = document.getElementById('new-item-name');
  const catInput = document.getElementById('new-item-category');
  const countInput = document.getElementById('new-item-count');

  if (!nameInput || !catInput || !countInput) return;

  const newItem = {
    id: `item-${Date.now()}`,
    name: nameInput.value.trim(),
    category: catInput.value,
    total_count: parseInt(countInput.value) || 1
  };

  state.inventory.push(newItem);
  saveInventory();
  renderAllViews();
  closeAddItemModal();

  nameInput.value = '';
  showToast(`Added ${newItem.name} (${newItem.total_count} items) to Inventory!`);
}

// --- UTILS & TOASTS ---
function showToast(message, type = 'normal') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'danger' ? 'danger' : ''}`;
  toast.innerHTML = `
    <i data-lucide="${type === 'danger' ? 'alert-octagon' : 'check-circle-2'}"></i>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

// --- RESOLVE FOUND GEAR MODAL LOGIC ---
let activeResolveSessionId = null;
let resolveDraft = {}; // { itemId: foundQty }

function openResolveModal(sessionId) {
  const sess = state.sessions.find(s => s.id === sessionId);
  if (!sess || !sess.missing_items) return;

  activeResolveSessionId = sessionId;
  resolveDraft = {};

  // Initialize draft with full missing count as default for easy 1-click resolution
  Object.entries(sess.missing_items).forEach(([itemId, missingQty]) => {
    resolveDraft[itemId] = missingQty;
  });

  const subtitle = document.getElementById('resolve-session-subtitle');
  if (subtitle) {
    subtitle.textContent = `Resolving missing equipment for ${sess.session_type} Session (${sess.log_date}).`;
  }

  renderResolveModalContent();

  const modal = document.getElementById('resolve-gear-modal');
  if (modal) modal.classList.add('open');
}

function closeResolveModal() {
  const modal = document.getElementById('resolve-gear-modal');
  if (modal) modal.classList.remove('open');
  activeResolveSessionId = null;
  resolveDraft = {};
}

function renderResolveModalContent() {
  const container = document.getElementById('resolve-items-list');
  if (!container || !activeResolveSessionId) return;

  const sess = state.sessions.find(s => s.id === activeResolveSessionId);
  if (!sess || !sess.missing_items) return;

  container.innerHTML = Object.entries(sess.missing_items).map(([itemId, missingQty]) => {
    const item = state.inventory.find(i => i.id === itemId);
    const itemName = item ? item.name : 'Equipment';
    const foundQty = resolveDraft[itemId] !== undefined ? resolveDraft[itemId] : missingQty;

    return `
      <div class="resolve-item-card">
        <div class="resolve-item-info">
          <h5>${escapeHtml(itemName)}</h5>
          <span>Currently Missing: ${missingQty}</span>
        </div>

        <div class="resolve-stepper-control">
          <button type="button" class="stepper-btn" onclick="adjustResolveCount('${itemId}', -1)">-</button>
          <span class="count-val-chip">${foundQty}</span>
          <button type="button" class="stepper-btn" onclick="adjustResolveCount('${itemId}', 1)">+</button>
          <button type="button" class="mark-all-btn" onclick="markItemAllFound('${itemId}', ${missingQty})">Found All (${missingQty})</button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function adjustResolveCount(itemId, delta) {
  const sess = state.sessions.find(s => s.id === activeResolveSessionId);
  if (!sess || !sess.missing_items) return;

  const maxMissing = sess.missing_items[itemId] || 0;
  const current = resolveDraft[itemId] !== undefined ? resolveDraft[itemId] : maxMissing;
  const newVal = Math.min(maxMissing, Math.max(0, current + delta));

  resolveDraft[itemId] = newVal;
  renderResolveModalContent();
}

function markItemAllFound(itemId, maxMissing) {
  resolveDraft[itemId] = maxMissing;
  renderResolveModalContent();
}

function saveResolveGear() {
  if (!activeResolveSessionId) return;

  const sess = state.sessions.find(s => s.id === activeResolveSessionId);
  if (!sess || !sess.missing_items) return;

  const noteInput = document.getElementById('resolve-note-input');
  const note = noteInput ? noteInput.value.trim() : '';

  let totalRecovered = 0;
  const remainingMissing = {};

  Object.entries(sess.missing_items).forEach(([itemId, missingQty]) => {
    const foundQty = resolveDraft[itemId] !== undefined ? resolveDraft[itemId] : missingQty;
    totalRecovered += foundQty;

    // Update returned count
    if (!sess.items_returned) sess.items_returned = {};
    sess.items_returned[itemId] = (sess.items_returned[itemId] || 0) + foundQty;

    const leftover = missingQty - foundQty;
    if (leftover > 0) {
      remainingMissing[itemId] = leftover;
    }
  });

  if (totalRecovered === 0) {
    showToast('Please specify how many items were recovered!');
    return;
  }

  // Update session missing items & discrepancy flag
  sess.missing_items = Object.keys(remainingMissing).length > 0 ? remainingMissing : null;
  sess.has_discrepancy = Object.keys(remainingMissing).length > 0;
  if (note) {
    sess.resolution_note = note;
  }

  saveSessions();
  renderAllViews();
  closeResolveModal();

  if (noteInput) noteInput.value = '';

  if (!sess.has_discrepancy) {
    showToast(`🎉 All missing gear recovered for ${sess.session_type} Session! Status: COMPLETED.`);
  } else {
    showToast(`Updated! Recovered ${totalRecovered} item(s).`);
  }
}
