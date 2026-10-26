/* Set both values to connect this browser app to your Supabase project. */
const PALMA_SUPABASE = {
  url: 'https://fuxbiyqyizxeyogkwffe.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1eGJpeXF5aXp4ZXlvZ2t3ZmZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNDQ3OTEsImV4cCI6MjEwODYyMDc5MX0.AoDhyFcGpf9Nor6Cb6fWbcI09H3fuxHe2eE2N8FPJrc'
};

const today = new Date();
const localDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const currentMonth = localDate(today).slice(0, 7);
const demoCollectedBaseline = 624200000;
const demoRoomRevenueBaseline = 842600000;
const dayOffset = (offset) => {
  const date = new Date(today);
  date.setDate(date.getDate() + offset);
  return localDate(date);
};
const money = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(amount || 0));
const shortMoney = (amount) => {
  const value = Number(amount || 0);
  if (value >= 1000000) return `Rp ${(value / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
  return money(value);
};
const dateLabel = (date) => date ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${date}T00:00:00`)) : '-';
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const initials = (name) => String(name || '?').trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
const randomSuffix = () => Math.random().toString(36).slice(2, 6).toUpperCase();
const roomTypes = [
  { id: 'standard', name: 'Standard Room', rate: 500000, icon: 'bed-single', note: 'Nyaman dan esensial' },
  { id: 'superior', name: 'Superior Room', rate: 750000, icon: 'bed-double', note: 'Ruang lebih lega' },
  { id: 'deluxe', name: 'Deluxe Room', rate: 1000000, icon: 'sparkles', note: 'Kenyamanan premium' },
  { id: 'suite', name: 'Suite Room', rate: 2500000, icon: 'panels-top-left', note: 'Ruang dan privasi ekstra' },
  { id: 'presidential', name: 'Presidential Suite', rate: 15000000, icon: 'crown', note: 'Pengalaman paling istimewa' }
];
const demoAccounts = [
  { id: 'demo-account-1101', code: '1101', name: 'Kas dan Bank', account_type: 'asset', is_active: true },
  { id: 'demo-account-1201', code: '1201', name: 'Piutang Usaha', account_type: 'asset', is_active: true },
  { id: 'demo-account-2101', code: '2101', name: 'Pajak Keluaran', account_type: 'liability', is_active: true },
  { id: 'demo-account-4101', code: '4101', name: 'Pendapatan Kamar', account_type: 'revenue', is_active: true }
];

const invoices = [
  { id: 'demo-1', invoice_number: 'INV-2609-031', bill_to_name: 'Nusantara Travel Group', bill_to_email: 'finance@nusantaratravel.id', room_type: 'Presidential Suite', nights: 2, room_rate: 15000000, issued_at: dayOffset(-18), due_at: dayOffset(-5), total_amount: 33300000, paid_amount: 0, balance_due: 33300000, lifecycle_status: 'issued', guest_id: null, company_id: 'company-1' },
  { id: 'demo-2', invoice_number: 'INV-2609-028', bill_to_name: 'Ayu Kartika', bill_to_email: 'ayu.k@example.com', room_type: 'Deluxe Room', nights: 3, room_rate: 1000000, issued_at: dayOffset(-16), due_at: dayOffset(-1), total_amount: 3330000, paid_amount: 1110000, balance_due: 2220000, lifecycle_status: 'issued', guest_id: 'guest-2', company_id: null },
  { id: 'demo-3', invoice_number: 'INV-2609-036', bill_to_name: 'PT Cakrawala Digital', bill_to_email: 'ap@cakrawala.co.id', room_type: 'Suite Room', nights: 2, room_rate: 2500000, issued_at: dayOffset(-8), due_at: dayOffset(3), total_amount: 5550000, paid_amount: 0, balance_due: 5550000, lifecycle_status: 'issued', guest_id: null, company_id: 'company-3' },
  { id: 'demo-4', invoice_number: 'INV-2609-034', bill_to_name: 'Bima Pratama', bill_to_email: 'bima.p@example.com', room_type: 'Deluxe Room', nights: 2, room_rate: 1000000, issued_at: dayOffset(-7), due_at: dayOffset(5), total_amount: 2220000, paid_amount: 0, balance_due: 2220000, lifecycle_status: 'issued', guest_id: 'guest-4', company_id: null },
  { id: 'demo-5', invoice_number: 'INV-2609-023', bill_to_name: 'Samudra Event Partners', bill_to_email: 'billing@samudraevent.id', room_type: 'Superior Room', nights: 4, room_rate: 750000, issued_at: dayOffset(-20), due_at: dayOffset(12), total_amount: 3330000, paid_amount: 0, balance_due: 3330000, lifecycle_status: 'issued', guest_id: null, company_id: 'company-5' },
  { id: 'demo-6', invoice_number: 'INV-2609-039', bill_to_name: 'Made Wibawa', bill_to_email: 'made.w@example.com', room_type: 'Standard Room', nights: 3, room_rate: 500000, issued_at: dayOffset(-3), due_at: dayOffset(18), total_amount: 1665000, paid_amount: 0, balance_due: 1665000, lifecycle_status: 'issued', guest_id: 'guest-6', company_id: null },
  { id: 'demo-7', invoice_number: 'INV-2609-019', bill_to_name: 'PT Arunika Wellness', bill_to_email: 'finance@arunika.co.id', room_type: 'Presidential Suite', nights: 1, room_rate: 15000000, issued_at: dayOffset(-24), due_at: dayOffset(25), total_amount: 16650000, paid_amount: 0, balance_due: 16650000, lifecycle_status: 'issued', guest_id: null, company_id: 'company-7' }
];
let payments = [
  { id: 'pay-1', receipt_number: 'RCPT-2609-118', received_at: dayOffset(-1), method: 'bank_transfer', amount: 42800000, customer: 'PT Lintas Bahari', invoice_number: 'INV-2609-022' },
  { id: 'pay-2', receipt_number: 'RCPT-2609-117', received_at: dayOffset(-2), method: 'card', amount: 18750000, customer: 'Raka Pranoto', invoice_number: 'INV-2609-030' },
  { id: 'pay-3', receipt_number: 'RCPT-2609-116', received_at: dayOffset(-3), method: 'bank_transfer', amount: 35600000, customer: 'PT Langit Pagi', invoice_number: 'INV-2609-018' },
  { id: 'pay-4', receipt_number: 'RCPT-2609-115', received_at: dayOffset(-4), method: 'cash', amount: 4250000, customer: 'Dewi Saraswati', invoice_number: 'INV-2609-026' },
  { id: 'pay-5', receipt_number: 'RCPT-2609-114', received_at: dayOffset(-5), method: 'virtual_account', amount: 22800000, customer: 'PT Cakrawala Digital', invoice_number: 'INV-2609-013' },
  { id: 'pay-6', receipt_number: 'RCPT-2609-113', received_at: dayOffset(-15), method: 'bank_transfer', amount: 1110000, customer: 'Ayu Kartika', invoice_number: 'INV-2609-028' }
];
let refunds = [];
const demoInvoiceRecords = invoices.map((invoice) => ({ ...invoice }));
const demoPaymentRecords = payments.map((payment) => ({ ...payment }));

let supabaseClient = null;
let currentUser = null;
let activeProperty = null;
let currentRole = null;
let chartAccounts = [...demoAccounts];
let revenueAccounts = chartAccounts.filter((account) => account.code === '4101');
let journalReportRows = [];
let currentView = 'overview';
let currentPeriod = 30;
let activeModal = null;
let recentlyCreatedInvoiceId = null;
let roomRevenueAmount = 0;
let roomRevenueByDate = new Map();
let toastTimer;

const elements = {
  modal: document.querySelector('#modal-backdrop'),
  dialogTitle: document.querySelector('#dialog-title'),
  dialogKicker: document.querySelector('#dialog-kicker'),
  dialogFields: document.querySelector('#dialog-fields'),
  dialogError: document.querySelector('#dialog-error'),
  form: document.querySelector('#transaction-form'),
  toast: document.querySelector('#toast'),
  allInvoices: document.querySelector('#all-invoices'),
  priorityInvoices: document.querySelector('#priority-invoices'),
  paymentsTable: document.querySelector('#payments-table')
};

function invoiceStatus(invoice) {
  if (invoice.lifecycle_status === 'void') return 'void';
  if (Number(invoice.balance_due) <= 0) return 'paid';
  if (invoice.due_at < dayOffset(0)) return 'overdue';
  if (Number(invoice.paid_amount) > 0) return 'partial';
  return 'open';
}

function statusMarkup(invoice) {
  const status = invoiceStatus(invoice);
  const labels = { overdue: 'Terlambat', partial: 'Sebagian', open: 'Belum dibayar', paid: 'Lunas', void: 'Dibatalkan' };
  return `<span class="status-pill status-${status}">${labels[status]}</span>`;
}

function customerMarkup(invoice) {
  const tone = Math.abs(String(invoice.bill_to_name || '').length) % 4;
  const type = invoice.company_id ? 'Korporat' : 'Tamu';
  return `<div class="customer-cell"><span class="customer-initials tone-${tone}">${escapeHtml(initials(invoice.bill_to_name))}</span><span><span class="customer-name">${escapeHtml(invoice.bill_to_name)}</span><small class="customer-type">${type}</small></span></div>`;
}

function sortedInvoices() {
  return [...invoices].sort((left, right) => String(left.due_at).localeCompare(String(right.due_at)));
}

function renderInvoiceRow(invoice, compact = false) {
  const invoiceLabel = `<span class="invoice-number">${escapeHtml(invoice.invoice_number)}</span>${invoice.room_type ? `<small class="invoice-detail">${escapeHtml(invoice.room_type)} · ${Number(invoice.nights)} malam</small>` : ''}`;
  const paymentAction = canRecordTransactions() && invoice.lifecycle_status === 'issued' && Number(invoice.balance_due) > 0
    ? `<button class="row-action pay-invoice" data-id="${escapeHtml(invoice.id)}" aria-label="Catat pembayaran untuk ${escapeHtml(invoice.invoice_number)}"><i data-lucide="${compact ? 'arrow-up-right' : 'ellipsis'}"></i></button>`
    : '';
  const cancelAction = !compact && canCancelInvoices() && invoice.lifecycle_status === 'issued'
    ? `<button class="row-action cancel-invoice" data-id="${escapeHtml(invoice.id)}" aria-label="Batalkan faktur ${escapeHtml(invoice.invoice_number)}" title="Batalkan faktur"><i data-lucide="ban"></i></button>`
    : '';
  const rowActions = `<span class="invoice-row-actions">${paymentAction}${cancelAction}</span>`;
  const visibleBalance = invoice.lifecycle_status === 'void' ? 0 : Number(invoice.balance_due || 0);
  if (compact) {
    return `<tr><td>${customerMarkup(invoice)}</td><td>${invoiceLabel}</td><td>${dateLabel(invoice.due_at)}</td><td>${statusMarkup(invoice)}</td><td class="amount-cell">${money(visibleBalance)}</td><td>${rowActions}</td></tr>`;
  }
  return `<tr><td>${customerMarkup(invoice)}</td><td>${invoiceLabel}</td><td>${dateLabel(invoice.issued_at)}</td><td>${dateLabel(invoice.due_at)}</td><td>${statusMarkup(invoice)}</td><td class="amount-cell">${money(invoice.total_amount)}</td><td class="amount-cell">${money(visibleBalance)}</td><td>${rowActions}</td></tr>`;
}

function canRecordTransactions() {
  return !currentUser || ['owner', 'manager', 'accountant'].includes(currentRole);
}

function canCancelInvoices() {
  return !currentUser || ['owner', 'manager'].includes(currentRole);
}

function updateActionPermissions() {
  document.querySelector('#new-invoice-button').hidden = !['overview', 'invoices'].includes(currentView) || !canRecordTransactions();
  document.querySelector('#new-payment-button').hidden = currentView !== 'payments' || !canRecordTransactions();
}

function updateMetrics() {
  const openInvoices = invoices.filter((invoice) => invoice.lifecycle_status === 'issued' && Number(invoice.balance_due) > 0);
  const outstanding = openInvoices.reduce((sum, invoice) => sum + Number(invoice.balance_due), 0);
  const overdue = openInvoices.filter((invoice) => invoice.due_at < dayOffset(0)).reduce((sum, invoice) => sum + Number(invoice.balance_due), 0);
  const revenue = supabaseClient && currentUser
    ? roomRevenueAmount
    : demoRoomRevenueBaseline + invoices
      .filter((invoice) => invoice.is_demo_entry && invoice.lifecycle_status === 'issued' && invoice.issued_at?.slice(0, 7) === currentMonth)
      .reduce((sum, invoice) => sum + Number(invoice.room_revenue || 0), 0);
  const received = payments
    .filter((payment) => payment.received_at?.slice(0, 7) === currentMonth)
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  const refunded = refunds
    .filter((refund) => refund.refunded_at?.slice(0, 7) === currentMonth)
    .reduce((sum, refund) => sum + Number(refund.amount), 0);
  const collected = received - refunded;
  const displayRevenue = revenue;
  const demoCollected = demoCollectedBaseline + payments
    .filter((payment) => payment.is_demo_entry && payment.received_at?.slice(0, 7) === currentMonth)
    .reduce((sum, payment) => sum + Number(payment.amount), 0)
    - refunds.filter((refund) => refund.is_demo_entry && refund.refunded_at?.slice(0, 7) === currentMonth)
      .reduce((sum, refund) => sum + Number(refund.amount), 0);
  const displayCollected = supabaseClient && currentUser ? collected : demoCollected;
  document.querySelector('#metric-revenue').textContent = shortMoney(displayRevenue);
  document.querySelector('#metric-receivables').textContent = shortMoney(outstanding);
  document.querySelector('#metric-collected').textContent = shortMoney(displayCollected);
  document.querySelector('#metric-invoice-count').textContent = `${openInvoices.length} faktur`;
  document.querySelector('#metric-overdue').textContent = `${shortMoney(overdue)} telah jatuh tempo`;
  document.querySelector('#metric-average').textContent = shortMoney(displayRevenue / 386);
  document.querySelector('#aging-total').textContent = shortMoney(outstanding);
  document.querySelector('#chart-total').textContent = shortMoney(displayRevenue);
  document.querySelector('#payments-month-total').textContent = shortMoney(displayCollected);
  document.querySelector('#revenue-page-total').textContent = shortMoney(displayRevenue);
  document.querySelector('#revenue-month-label').textContent = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(today).toUpperCase();
  document.querySelector('#nav-open-count').textContent = openInvoices.length;
  document.querySelector('#invoice-table-count').textContent = `${invoices.length} faktur`;
  document.querySelector('#invoice-total-footer').textContent = `${shortMoney(outstanding)} belum tertagih`;
  renderAging(openInvoices);
  renderRevenueCategories(displayRevenue);
}

function renderAging(openInvoices) {
  const buckets = [
    { label: 'Belum jatuh tempo', color: '#d9e2d8', value: 0 },
    { label: '1–30 hari', color: '#8da58a', value: 0 },
    { label: '31–60 hari', color: '#dbb65b', value: 0 },
    { label: '> 60 hari', color: '#d77860', value: 0 }
  ];
  for (const invoice of openInvoices) {
    const daysLate = Math.floor((new Date(`${dayOffset(0)}T00:00:00`) - new Date(`${invoice.due_at}T00:00:00`)) / 86400000);
    const bucket = daysLate <= 0 ? 0 : daysLate <= 30 ? 1 : daysLate <= 60 ? 2 : 3;
    buckets[bucket].value += Number(invoice.balance_due);
  }
  const total = buckets.reduce((sum, bucket) => sum + bucket.value, 0);
  document.querySelector('.donut-center strong').textContent = openInvoices.length;
  let cursor = 0;
  const stops = buckets.map((bucket) => {
    const end = total ? cursor + bucket.value / total * 360 : 90;
    const stop = `${bucket.color} ${cursor}deg ${end}deg`;
    cursor = end;
    return stop;
  });
  document.querySelector('#aging-donut').style.background = total > 0
    ? `conic-gradient(${stops.join(', ')})`
    : '#e7eee8';
  document.querySelector('#aging-legend').innerHTML = buckets.map((bucket) => `<div class="aging-row"><i style="background:${bucket.color}"></i><span>${bucket.label}</span><strong>${shortMoney(bucket.value)}</strong></div>`).join('');
}

function renderChart() {
  const chartArea = document.querySelector('#revenue-chart');
  const chartLabels = document.querySelector('.chart-x-labels');
  if (supabaseClient && currentUser) {
    const rangeDays = currentPeriod;
    const bucketCount = currentPeriod === 7 ? 7 : 6;
    const bucketSize = Math.ceil(rangeDays / bucketCount);
    const buckets = Array.from({ length: bucketCount }, (_, index) => {
      const startOffset = -(rangeDays - 1) + index * bucketSize;
      const endOffset = Math.min(0, startOffset + bucketSize - 1);
      let roomRevenue = 0;
      let collected = 0;
      for (let offset = startOffset; offset <= endOffset; offset += 1) {
        const date = new Date(today);
        date.setDate(date.getDate() + offset);
        const key = localDate(date);
        roomRevenue += Number(roomRevenueByDate.get(key) || 0);
        collected += payments
          .filter((payment) => payment.received_at === key)
          .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
          - refunds.filter((refund) => refund.refunded_at === key)
            .reduce((sum, refund) => sum + Number(refund.amount || 0), 0);
      }
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + endOffset);
      return { roomRevenue, collected, label: new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(endDate) };
    });
    const revenueTotal = buckets.reduce((sum, bucket) => sum + bucket.roomRevenue, 0);
    const maxValue = Math.max(...buckets.flatMap((bucket) => [bucket.roomRevenue, bucket.collected]));
    document.querySelector('#chart-total').textContent = shortMoney(revenueTotal);
    chartLabels.innerHTML = buckets.map((bucket) => `<span>${bucket.label}</span>`).join('');
    chartArea.classList.toggle('chart-empty-state', maxValue === 0);
    if (maxValue === 0) {
      chartArea.innerHTML = '<div class="chart-empty">Belum ada pendapatan atau penerimaan pada periode ini.</div>';
      return;
    }
    chartArea.innerHTML = buckets.map((bucket) => {
      const revenueHeight = bucket.roomRevenue > 0 ? Math.max(5, bucket.roomRevenue / maxValue * 100) : 0;
      const collectedHeight = bucket.collected > 0 ? Math.max(5, bucket.collected / maxValue * 100) : 0;
      return `<div class="chart-group"><span class="chart-bar revenue${revenueHeight ? '' : ' is-empty'}" style="height:${revenueHeight}%" title="Pendapatan kamar ${money(bucket.roomRevenue)}"></span><span class="chart-bar collected${collectedHeight ? '' : ' is-empty'}" style="height:${collectedHeight}%" title="Penerimaan ${money(bucket.collected)}"></span></div>`;
    }).join('');
    return;
  }

  const dayCount = currentPeriod === 7 ? 7 : currentPeriod === 90 ? 18 : 14;
  const revenueFactor = currentPeriod === 7 ? .21 : currentPeriod === 90 ? 2.8 : 1;
  const bars = Array.from({ length: dayCount }, (_, index) => {
    const wave = (Math.sin(index * 1.7 + 1.2) + 1) / 2;
    const rise = .35 + (index / dayCount) * .4;
    const revenueHeight = Math.round(30 + wave * 42 + rise * 22);
    const collectedHeight = Math.max(13, Math.round(revenueHeight * (.43 + ((index * 13) % 34) / 100)));
    return `<div class="chart-group"><span class="chart-bar revenue" style="height:${revenueHeight}%" title="Pendapatan ${money(38000000 * revenueFactor * revenueHeight / 100)}"></span><span class="chart-bar collected" style="height:${collectedHeight}%" title="Penerimaan ${money(30000000 * revenueFactor * collectedHeight / 100)}"></span></div>`;
  });
  chartArea.classList.remove('chart-empty-state');
  chartArea.innerHTML = bars.join('');
  const periods = { 7: ['21 Sep', '22 Sep', '23 Sep', '24 Sep', '25 Sep', '26 Sep', '27 Sep'], 30: ['01 Sep', '06 Sep', '11 Sep', '16 Sep', '21 Sep', '27 Sep'], 90: ['30 Jun', '15 Jul', '30 Jul', '14 Agu', '29 Agu', '27 Sep'] };
  chartLabels.innerHTML = periods[currentPeriod].map((label) => `<span>${label}</span>`).join('');
}

function renderRevenueCategories(revenue) {
  document.querySelector('#category-breakdown').innerHTML = `<article class="category-item"><div class="category-head"><i class="category-color" style="background:#355f4c"></i>Pendapatan kamar</div><strong>${shortMoney(revenue)}</strong><small>100% dari pendapatan yang ditampilkan · sebelum pajak</small><div class="category-track"><span style="width:100%;background:#355f4c"></span></div></article>`;
  document.querySelector('#journal-list').innerHTML = `<div class="journal-row"><span class="journal-mark"><i data-lucide="bed-double"></i></span><span class="journal-copy"><strong>Pendapatan kamar</strong><small>4101 · Akomodasi <span>·</span> ${escapeHtml(document.querySelector('#revenue-month-label').textContent)}</small></span><span class="journal-amount">${money(revenue)}</span><span class="journal-state">Diposting</span></div>`;
  refreshIcons();
}

function renderPayments() {
  const transactions = [
    ...payments.map((payment) => ({ ...payment, is_refund: false })),
    ...refunds.map((refund) => ({
      ...refund,
      receipt_number: refund.refund_number,
      amount: -Number(refund.amount),
      is_refund: true
    }))
  ].sort((left, right) => String(right.received_at || right.refunded_at).localeCompare(String(left.received_at || left.refunded_at)));
  const rows = transactions.map((payment) => {
    const methodLabels = { cash: 'Tunai', card: 'Kartu', bank_transfer: 'Transfer bank', virtual_account: 'Virtual account', other: 'Lainnya' };
    const icons = { cash: 'banknote', card: 'credit-card', bank_transfer: 'landmark', virtual_account: 'arrow-left-right', other: 'wallet' };
    const transactionDate = payment.received_at || payment.refunded_at;
    return `<tr><td>${dateLabel(transactionDate)}</td><td class="invoice-number">${escapeHtml(payment.receipt_number)}${payment.is_refund ? '<small class="invoice-detail">Refund</small>' : ''}</td><td><span class="customer-name">${escapeHtml(payment.customer || payment.bill_to_name || 'Penerimaan belum dialokasikan')}</span></td><td><span class="method-label"><i data-lucide="${payment.is_refund ? 'undo-2' : icons[payment.method] || 'wallet'}"></i>${payment.is_refund ? `Refund · ${methodLabels[payment.method] || payment.method}` : methodLabels[payment.method] || payment.method}</span></td><td class="invoice-number">${escapeHtml(payment.invoice_number || '—')}</td><td class="amount-cell">${money(payment.amount)}</td></tr>`;
  }).join('');
  elements.paymentsTable.innerHTML = rows || '<tr><td class="empty-row" colspan="6">Belum ada penerimaan tercatat.</td></tr>';
}

function renderInvoices() {
  const sorted = [...invoices].sort((left, right) => {
    if (left.id === recentlyCreatedInvoiceId) return -1;
    if (right.id === recentlyCreatedInvoiceId) return 1;
    return String(right.issued_at).localeCompare(String(left.issued_at)) || String(left.due_at).localeCompare(String(right.due_at));
  });
  const search = document.querySelector('#invoice-search').value.trim().toLowerCase();
  const filter = document.querySelector('#invoice-filter').value;
  const filtered = sorted.filter((invoice) => {
    const matchesSearch = `${invoice.bill_to_name} ${invoice.invoice_number}`.toLowerCase().includes(search);
    const status = invoiceStatus(invoice);
    const matchesFilter = filter === 'all' || status === filter || (filter === 'open' && status === 'overdue');
    return matchesSearch && matchesFilter;
  });
  elements.allInvoices.innerHTML = filtered.map((invoice) => renderInvoiceRow(invoice)).join('') || '<tr><td class="empty-row" colspan="8">Tidak ada faktur yang cocok dengan pencarian.</td></tr>';
  const priority = sortedInvoices().filter((invoice) => invoice.lifecycle_status === 'issued' && Number(invoice.balance_due) > 0).slice(0, 5);
  elements.priorityInvoices.innerHTML = priority.map((invoice) => renderInvoiceRow(invoice, true)).join('') || '<tr><td class="empty-row" colspan="6">Tidak ada piutang terbuka.</td></tr>';
  renderPayments();
  refreshIcons();
}

function renderAll() {
  updateMetrics();
  renderInvoices();
  renderJournalReport();
  renderChart();
}

function buildDemoJournalRows() {
  const accountNames = new Map(demoAccounts.map((account) => [account.code, account.name]));
  const rows = [];
  for (const invoice of invoices.filter((item) => ['issued', 'void'].includes(item.lifecycle_status))) {
    const subtotal = Number(invoice.room_revenue ?? (Number(invoice.room_rate) * Number(invoice.nights)));
    const total = Number(invoice.total_amount || 0);
    const tax = Math.max(0, total - subtotal);
    const source = `${invoice.paid_on_issue ? 'Faktur lunas' : 'Faktur'} ${invoice.invoice_number} · ${invoice.bill_to_name}`;
    const debitCode = invoice.paid_on_issue ? '1101' : '1201';
    const type = invoice.paid_on_issue ? 'KAS' : 'FAKTUR';
    rows.push({ entry_id: invoice.id, date: invoice.issued_at, type, source, code: debitCode, account: accountNames.get(debitCode), debit: total, credit: 0 });
    rows.push({ entry_id: invoice.id, date: invoice.issued_at, type, source, code: '4101', account: accountNames.get('4101'), debit: 0, credit: subtotal });
    if (tax > 0) rows.push({ entry_id: invoice.id, date: invoice.issued_at, type, source, code: '2101', account: accountNames.get('2101'), debit: 0, credit: tax });

    if (invoice.lifecycle_status === 'void') {
      const reversalSource = `Pembatalan faktur ${invoice.invoice_number} · ${invoice.void_reason || 'Pembatalan'}`;
      const reversalDate = invoice.voided_at || dayOffset(0);
      const reversalId = `${invoice.id}-void`;
      rows.push({ entry_id: reversalId, date: reversalDate, type: 'VOID', source: reversalSource, code: '4101', account: accountNames.get('4101'), debit: subtotal, credit: 0 });
      if (tax > 0) rows.push({ entry_id: reversalId, date: reversalDate, type: 'VOID', source: reversalSource, code: '2101', account: accountNames.get('2101'), debit: tax, credit: 0 });
      const reversalCreditCode = '1201';
      rows.push({ entry_id: reversalId, date: reversalDate, type: 'VOID', source: reversalSource, code: reversalCreditCode, account: accountNames.get(reversalCreditCode), debit: 0, credit: total });

      for (const refund of payments.filter((payment) => payment.invoice_number === invoice.invoice_number)) {
        const refundSource = `Refund ${refund.receipt_number} · ${invoice.invoice_number}`;
        const refundId = `${invoice.id}-refund-${refund.id}`;
        rows.push({ entry_id: refundId, date: reversalDate, type: 'REFUND', source: refundSource, code: '1201', account: accountNames.get('1201'), debit: Number(refund.amount), credit: 0 });
        rows.push({ entry_id: refundId, date: reversalDate, type: 'REFUND', source: refundSource, code: '1101', account: accountNames.get('1101'), debit: 0, credit: Number(refund.amount) });
      }
    }
  }
  for (const payment of payments) {
    if (invoices.some((invoice) => invoice.paid_on_issue && invoice.invoice_number === payment.invoice_number)) continue;
    const source = `Penerimaan ${payment.receipt_number} · ${payment.customer || 'Pelanggan'}${payment.invoice_number ? ` · ${payment.invoice_number}` : ''}`;
    rows.push({ entry_id: payment.id, date: payment.received_at, type: 'KAS', source, code: '1101', account: accountNames.get('1101'), debit: Number(payment.amount), credit: 0 });
    rows.push({ entry_id: payment.id, date: payment.received_at, type: 'KAS', source, code: '1201', account: accountNames.get('1201'), debit: 0, credit: Number(payment.amount) });
  }
  return rows;
}

function groupedJournalTransactions(selectedCode = 'all') {
  const groups = new Map();
  const sourceRows = supabaseClient && currentUser ? journalReportRows : buildDemoJournalRows();
  for (const row of sourceRows) {
    const key = row.entry_id || `${row.date}:${row.type}:${row.source}`;
    if (!groups.has(key)) groups.set(key, { id: key, date: row.date, type: row.type, source: row.source, lines: [] });
    groups.get(key).lines.push(row);
  }
  return [...groups.values()]
    .filter((group) => selectedCode === 'all' || group.lines.some((line) => line.code === selectedCode))
    .sort((left, right) => String(right.date).localeCompare(String(left.date)) || String(left.source).localeCompare(String(right.source)));
}

function renderJournalReport() {
  const selectedCode = document.querySelector('#journal-account-filter').value;
  const transactions = groupedJournalTransactions(selectedCode);
  const dateText = (value) => value ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' }).format(new Date(`${value}T00:00:00`)) : '-';
  const debitTotal = transactions.reduce((sum, transaction) => sum + transaction.lines.reduce((lineSum, line) => lineSum + Number(line.debit || 0), 0), 0);
  const creditTotal = transactions.reduce((sum, transaction) => sum + transaction.lines.reduce((lineSum, line) => lineSum + Number(line.credit || 0), 0), 0);
  document.querySelector('#journal-source').textContent = supabaseClient && currentUser ? 'Supabase' : 'Data demo';
  document.querySelector('#journal-row-count').textContent = `${transactions.length} transaksi`;
  document.querySelector('#journal-total-debit').textContent = money(debitTotal);
  document.querySelector('#journal-total-credit').textContent = money(creditTotal);
  document.querySelector('#journal-report-rows').innerHTML = transactions.map((transaction) => {
    const debitLines = transaction.lines.filter((line) => Number(line.debit) > 0);
    const creditLines = transaction.lines.filter((line) => Number(line.credit) > 0);
    const journalTypeClass = transaction.type === 'KAS' ? 'journal-type-cash' : transaction.type === 'VOID' ? 'journal-type-void' : transaction.type === 'REFUND' ? 'journal-type-refund' : 'journal-type-invoice';
    const accountBreakdown = [...transaction.lines].sort((left, right) => String(left.code).localeCompare(String(right.code), 'id', { numeric: true }))
      .map((line) => `<span>${escapeHtml(line.account)}${line.code ? ` (${escapeHtml(line.code)})` : ''}</span>`).join('');
    const sideMarkup = (lines) => lines.map((line) => `<div class="journal-side-line"><span>${escapeHtml(line.account)}</span><strong>${money(line.debit || line.credit)}</strong></div>`).join('') || '<span class="journal-empty-side">–</span>';
    return `<tr><td class="journal-date">${dateText(transaction.date)}</td><td><span class="journal-type ${journalTypeClass}">${escapeHtml(transaction.type)}</span></td><td class="journal-description"><strong>${escapeHtml(transaction.source)}</strong><div class="journal-account-breakdown">${accountBreakdown}</div></td><td class="journal-currency"><div class="journal-side-lines">${sideMarkup(debitLines)}</div></td><td class="journal-currency"><div class="journal-side-lines">${sideMarkup(creditLines)}</div></td></tr>`;
  }).join('') || '<tr><td class="empty-row" colspan="5">Belum ada jurnal untuk akun ini.</td></tr>';
  refreshIcons();
}

function refreshIcons() {
  if (window.lucide?.createIcons) window.lucide.createIcons();
}

function showToast(message) {
  const toast = elements.toast;
  toast.querySelector('span').textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
}

function showModal(type, invoiceId = null) {
  if ((type === 'invoice' || type === 'payment') && !canRecordTransactions()) {
    showToast('Peran Anda hanya dapat melihat data transaksi.');
    return;
  }
  if (type === 'void' && !canCancelInvoices()) {
    showToast('Hanya owner atau manager yang dapat membatalkan faktur.');
    return;
  }
  activeModal = type;
  elements.dialogError.textContent = '';
  elements.form.dataset.type = type;
  if (type === 'invoice') {
    elements.dialogKicker.textContent = 'PENJUALAN KREDIT';
    elements.dialogTitle.textContent = 'Buat faktur baru';
    elements.dialogFields.innerHTML = `
      <div class="form-field"><label for="bill-type">Jenis pelanggan</label><select id="bill-type" name="billType"><option value="company">Korporat</option><option value="guest">Tamu individu</option></select></div>
      <div class="form-field"><label for="invoice-due">Jatuh tempo</label><input id="invoice-due" name="dueAt" type="date" value="${dayOffset(14)}" required></div>
      <div class="form-field full"><label for="bill-name">Nama pelanggan</label><input id="bill-name" name="billName" autocomplete="organization" placeholder="Nama perusahaan atau tamu" required></div>
      <div class="form-field full"><label for="bill-email">Email penagihan</label><input id="bill-email" name="billEmail" type="email" placeholder="finance@perusahaan.co.id"></div>
      <fieldset class="room-picker form-field full"><legend>Pilih jenis kamar</legend><div class="room-options">${roomTypes.map((room, index) => `<button class="room-option${index === 0 ? ' selected' : ''}" type="button" data-room-id="${room.id}" aria-pressed="${index === 0}" aria-label="${room.name}, ${money(room.rate)} per malam"><span class="room-option-top"><i data-lucide="${room.icon}"></i><span class="room-option-check"><i data-lucide="check"></i></span></span><strong>${room.name}</strong><small>${room.note}</small><span class="room-rate">${money(room.rate)}<small> / malam</small></span></button>`).join('')}</div></fieldset>
      <div class="form-field"><label for="room-nights">Jumlah malam</label><input id="room-nights" name="nights" type="number" min="1" step="1" value="1" required></div>
      <div class="form-field"><label for="invoice-amount">Subtotal kamar (Rp)</label><input id="invoice-amount" name="amount" type="number" min="1" step="1" value="500000" readonly required></div>
      <div class="form-field"><label for="invoice-tax">Pajak (%)</label><input id="invoice-tax" name="taxRate" type="number" min="0" max="100" step="0.1" value="11"></div>
      <div class="form-field full"><label class="checkbox-field" for="invoice-paid-now"><input id="invoice-paid-now" name="paidNow" type="checkbox"><span>Langsung lunas</span></label></div>
      <div class="form-field full" id="invoice-payment-method-field" hidden><label for="invoice-payment-method">Metode pembayaran</label><select id="invoice-payment-method" name="paymentMethod"><option value="bank_transfer">Transfer bank</option><option value="card">Kartu</option><option value="cash">Tunai</option><option value="virtual_account">Virtual account</option><option value="other">Lainnya</option></select></div>`;
    elements.form.querySelector('#submit-transaction span').textContent = 'Terbitkan faktur';
    elements.dialogFields.querySelectorAll('.room-option').forEach((button) => button.addEventListener('click', () => selectRoomType(button.dataset.roomId)));
    elements.dialogFields.querySelector('#room-nights').addEventListener('input', updateRoomSubtotal);
    selectRoomType(roomTypes[0].id);
    elements.dialogFields.querySelector('#invoice-paid-now').addEventListener('change', (event) => {
      elements.dialogFields.querySelector('#invoice-payment-method-field').hidden = !event.target.checked;
    });
  } else if (type === 'payment') {
    const open = sortedInvoices().filter((invoice) => invoice.lifecycle_status === 'issued' && Number(invoice.balance_due) > 0);
    const selected = invoiceId ? open.find((invoice) => invoice.id === invoiceId) : open[0];
    if (invoiceId && !selected) {
      showToast('Faktur ini sudah lunas dan tidak memiliki sisa tagihan.');
      return;
    }
    const options = open.map((invoice) => `<option value="${escapeHtml(invoice.id)}" data-balance="${Number(invoice.balance_due)}">${escapeHtml(invoice.invoice_number)} · ${escapeHtml(invoice.bill_to_name)} · sisa ${money(invoice.balance_due)}</option>`).join('');
    elements.dialogKicker.textContent = 'PENERIMAAN KAS';
    elements.dialogTitle.textContent = 'Catat penerimaan';
    elements.dialogFields.innerHTML = `<div class="form-field full"><label for="payment-invoice">Alokasikan ke faktur</label><select id="payment-invoice" name="invoiceId" required>${options}</select></div><div class="form-field"><label for="payment-amount">Jumlah diterima (Rp)</label><input id="payment-amount" name="amount" type="number" min="1" step="1" value="${selected ? Number(selected.balance_due) : ''}" required></div><div class="form-field"><label for="payment-date">Tanggal penerimaan</label><input id="payment-date" name="receivedAt" type="date" value="${dayOffset(0)}" required></div><div class="form-field"><label for="payment-method">Metode pembayaran</label><select id="payment-method" name="method"><option value="bank_transfer">Transfer bank</option><option value="card">Kartu</option><option value="cash">Tunai</option><option value="virtual_account">Virtual account</option><option value="other">Lainnya</option></select></div><div class="form-field"><label for="payment-reference">Referensi transaksi</label><input id="payment-reference" name="reference" placeholder="No. referensi / berita transfer"></div>`;
    elements.form.querySelector('#submit-transaction span').textContent = 'Simpan penerimaan';
    elements.form.querySelector('#payment-invoice').value = selected?.id || '';
    elements.form.querySelector('#payment-invoice').addEventListener('change', updatePaymentAmount);
  } else if (type === 'void') {
    const invoice = invoices.find((item) => item.id === invoiceId && item.lifecycle_status === 'issued');
    if (!invoice) {
      showToast('Hanya faktur terbit yang dapat dibatalkan.');
      return;
    }
    const hasPayments = Number(invoice.paid_amount || 0) > 0;
    elements.dialogKicker.textContent = 'PEMBATALAN FAKTUR';
    elements.dialogTitle.textContent = `Batalkan ${invoice.invoice_number}`;
    elements.dialogFields.innerHTML = `<div class="void-warning form-field full"><strong>${escapeHtml(invoice.bill_to_name)}</strong><span>Total faktur ${money(invoice.total_amount)} · sudah dibayar ${money(invoice.paid_amount || 0)}</span><small>Pembatalan membuat jurnal pembalik dan faktur tidak lagi dihitung sebagai piutang.</small></div><div class="form-field full"><label for="void-reason">Alasan pembatalan</label><input id="void-reason" name="reason" type="text" minlength="5" maxlength="250" placeholder="Contoh: Faktur dibuat untuk reservasi yang dibatalkan" required></div>${hasPayments ? '<div class="form-field full"><label class="checkbox-field refund-confirmation" for="refund-confirmed"><input id="refund-confirmed" name="refundConfirmed" type="checkbox" required><span>Saya sudah mengembalikan dana yang diterima melalui metode pembayaran asal.</span></label></div>' : ''}`;
    elements.form.dataset.invoiceId = invoice.id;
    elements.form.querySelector('#submit-transaction span').textContent = hasPayments ? 'Batalkan & catat refund' : 'Batalkan faktur';
  } else {
    elements.dialogKicker.textContent = 'AKSES HOTEL';
    elements.dialogTitle.textContent = currentUser ? 'Akun terhubung' : 'Masuk ke Palma Ledger';
    elements.dialogFields.innerHTML = currentUser ? `<div class="form-field full"><label>Sesi aktif</label><input value="${escapeHtml(currentUser.email || '')}" readonly></div>` : `<div class="form-field full"><label for="auth-email">Email</label><input id="auth-email" name="email" type="email" autocomplete="email" placeholder="nama@hotel.com" required></div><div class="form-field full"><label for="auth-password">Kata sandi</label><input id="auth-password" name="password" type="password" autocomplete="current-password" required></div>`;
    elements.form.querySelector('#submit-transaction span').textContent = currentUser ? 'Keluar' : 'Masuk';
  }
  elements.modal.hidden = false;
  document.body.style.overflow = 'hidden';
  refreshIcons();
  elements.dialogFields.querySelector('input, select')?.focus();
}

function closeModal() {
  elements.modal.hidden = true;
  document.body.style.overflow = '';
  activeModal = null;
}

function updatePaymentAmount() {
  const select = document.querySelector('#payment-invoice');
  const amount = document.querySelector('#payment-amount');
  if (select && amount) amount.value = select.selectedOptions[0]?.dataset.balance || '';
}

function selectRoomType(roomId) {
  const room = roomTypes.find((item) => item.id === roomId);
  if (!room) return;
  document.querySelectorAll('.room-option').forEach((button) => {
    const selected = button.dataset.roomId === roomId;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  updateRoomSubtotal();
}

function updateRoomSubtotal() {
  const selectedId = document.querySelector('.room-option.selected')?.dataset.roomId;
  const room = roomTypes.find((item) => item.id === selectedId);
  const nights = Number(document.querySelector('#room-nights')?.value);
  const subtotal = document.querySelector('#invoice-amount');
  if (!room || !subtotal) return;
  subtotal.value = nights > 0 ? room.rate * nights : '';
}

async function createInvoice(formData) {
  if (!canRecordTransactions()) throw new Error('Peran Anda tidak diizinkan membuat faktur.');
  const name = formData.get('billName').trim();
  const type = formData.get('billType');
  const room = roomTypes.find((item) => item.id === document.querySelector('.room-option.selected')?.dataset.roomId);
  const nights = Number(formData.get('nights'));
  const beforeTax = Number(formData.get('amount'));
  const rate = Number(formData.get('taxRate')) / 100;
  const paidNow = formData.get('paidNow') === 'on';
  const paymentMethod = formData.get('paymentMethod') || 'bank_transfer';
  if (!name || !room || !Number.isInteger(nights) || nights < 1 || beforeTax <= 0 || !Number.isFinite(rate) || rate < 0 || rate > 1) throw new Error('Pilih jenis kamar, isi nama pelanggan, dan pastikan jumlah malam serta pajak valid.');
  const subtotal = Math.round(beforeTax * 100) / 100;
  const taxAmount = Math.round(subtotal * rate * 100) / 100;
  const invoiceTotal = Math.round((subtotal + taxAmount) * 100) / 100;
  const invoice = {
    id: `demo-${Date.now()}`,
    invoice_number: `INV-${dayOffset(0).slice(2).replaceAll('-', '')}-${randomSuffix()}`,
    bill_to_name: name,
    bill_to_email: formData.get('billEmail').trim() || null,
    issued_at: dayOffset(0),
    due_at: formData.get('dueAt'),
    total_amount: invoiceTotal,
    paid_amount: paidNow ? invoiceTotal : 0,
    balance_due: paidNow ? 0 : invoiceTotal,
    paid_on_issue: paidNow,
    room_revenue: subtotal,
    room_type: room.name,
    nights,
    room_rate: room.rate,
    is_demo_entry: !(supabaseClient && currentUser),
    lifecycle_status: 'issued',
    guest_id: type === 'guest' ? 'demo-guest' : null,
    company_id: type === 'company' ? 'demo-company' : null
  };
  if (supabaseClient && currentUser) {
    if (!revenueAccounts.length) throw new Error('Akun pendapatan kamar 4101 belum ditemukan. Tambahkan akun tersebut di Supabase sebelum menerbitkan faktur.');
    let customerId;
    const customerTable = type === 'company' ? 'companies' : 'guests';
    const customerRecord = type === 'company'
      ? { property_id: activeProperty.id, legal_name: name, billing_email: invoice.bill_to_email }
      : { property_id: activeProperty.id, full_name: name, email: invoice.bill_to_email };
    const customerResult = await supabaseClient.from(customerTable).insert(customerRecord).select('id').single();
    if (customerResult.error) throw customerResult.error;
    customerId = customerResult.data.id;
    const invoiceRecord = {
      property_id: activeProperty.id,
      [type === 'company' ? 'company_id' : 'guest_id']: customerId,
      invoice_number: invoice.invoice_number,
      issued_at: invoice.issued_at,
      due_at: invoice.due_at,
      currency: activeProperty.currency || 'IDR',
      status: 'draft',
      bill_to_name: name,
      bill_to_email: invoice.bill_to_email
    };
    const invoiceResult = await supabaseClient.from('invoices').insert(invoiceRecord).select('id').single();
    if (invoiceResult.error) throw invoiceResult.error;
    invoice.id = invoiceResult.data.id;
    const lineResult = await supabaseClient.from('invoice_items').insert({
      property_id: activeProperty.id,
      invoice_id: invoiceResult.data.id,
      revenue_account_id: revenueAccounts[0].id,
      description: `${room.name} · ${nights} malam`,
      quantity: nights,
      unit_price: room.rate,
      tax_rate: rate
    });
    if (lineResult.error) throw lineResult.error;
    if (paidNow) {
      const paymentResult = await supabaseClient.rpc('issue_paid_invoice', {
        p_invoice_id: invoiceResult.data.id,
        p_method: paymentMethod,
        p_reference: null
      });
      if (paymentResult.error) {
        throw new Error(`Faktur lunas belum dapat diterbitkan: ${paymentResult.error.message}`);
      }
    } else {
      const issueResult = await supabaseClient.rpc('issue_invoice', { p_invoice_id: invoiceResult.data.id });
      if (issueResult.error) throw issueResult.error;
    }
    await loadPropertyData();
  } else {
    invoices.unshift(invoice);
    if (paidNow) {
      payments.unshift({
        id: `payment-${Date.now()}`,
        receipt_number: `RCPT-${dayOffset(0).slice(2).replaceAll('-', '')}-${randomSuffix()}`,
        received_at: dayOffset(0),
        method: paymentMethod,
        amount: invoiceTotal,
        customer: invoice.bill_to_name,
        invoice_number: invoice.invoice_number,
        is_demo_entry: true
      });
    }
    renderAll();
  }
  closeModal();
  navigate('invoices');
  recentlyCreatedInvoiceId = invoice.id;
  document.querySelector('#invoice-filter').value = 'all';
  document.querySelector('#invoice-search').value = '';
  renderInvoices();
  showToast(`Faktur ${invoice.invoice_number} berhasil diterbitkan.`);
}

async function recordPayment(formData) {
  if (!canRecordTransactions()) throw new Error('Peran Anda tidak diizinkan mencatat penerimaan.');
  const invoice = invoices.find((item) => item.id === formData.get('invoiceId'));
  const amount = Number(formData.get('amount'));
  if (!invoice || invoice.lifecycle_status !== 'issued' || amount <= 0 || amount > Number(invoice.balance_due)) throw new Error('Pilih faktur terbit dengan sisa tagihan yang valid.');
  const payment = {
    id: `payment-${Date.now()}`,
    receipt_number: `RCPT-${dayOffset(0).slice(2).replaceAll('-', '')}-${randomSuffix()}`,
    received_at: formData.get('receivedAt'),
    method: formData.get('method'),
    amount,
    customer: invoice.bill_to_name,
    invoice_number: invoice.invoice_number,
    is_demo_entry: !(supabaseClient && currentUser)
  };
  if (supabaseClient && currentUser) {
    const paymentResult = await supabaseClient.rpc('receive_payment', {
      p_property_id: activeProperty.id,
      p_invoice_id: invoice.id,
      p_amount: amount,
      p_method: payment.method,
      p_received_at: payment.received_at,
      p_reference: formData.get('reference').trim() || null
    });
    if (paymentResult.error) throw paymentResult.error;
    await loadPropertyData();
  } else {
    payments.unshift(payment);
    invoice.paid_amount = Number(invoice.paid_amount) + amount;
    invoice.balance_due = Math.max(0, Number(invoice.total_amount) - Number(invoice.paid_amount));
    renderAll();
  }
  closeModal();
  showToast(`Penerimaan ${money(amount)} berhasil dicatat.`);
}

async function cancelInvoice(formData) {
  if (!canCancelInvoices()) throw new Error('Hanya owner atau manager yang dapat membatalkan faktur.');
  const invoice = invoices.find((item) => item.id === elements.form.dataset.invoiceId && item.lifecycle_status === 'issued');
  const reason = String(formData.get('reason') || '').trim();
  if (!invoice) throw new Error('Faktur tidak lagi tersedia atau sudah dibatalkan.');
  if (reason.length < 5) throw new Error('Alasan pembatalan minimal 5 karakter.');
  if (Number(invoice.paid_amount || 0) > 0 && formData.get('refundConfirmed') !== 'on') {
    throw new Error('Konfirmasi bahwa seluruh pembayaran sudah dikembalikan terlebih dahulu.');
  }
  const relatedPayments = payments.filter((payment) => payment.invoice_number === invoice.invoice_number);
  const recordedPayments = relatedPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  if (Number(invoice.paid_amount || 0) > recordedPayments + 0.01) {
    throw new Error('Rincian pembayaran faktur belum lengkap. Muat ulang data atau periksa alokasi pembayaran sebelum membatalkan.');
  }
  if (supabaseClient && currentUser) {
    const { error } = await supabaseClient.rpc('void_invoice', { p_invoice_id: invoice.id, p_reason: reason });
    if (error) throw error;
    await loadPropertyData();
  } else {
    invoice.lifecycle_status = 'void';
    invoice.void_reason = reason;
    invoice.voided_at = dayOffset(0);
    for (const payment of relatedPayments) {
      refunds.unshift({
        id: `demo-refund-${Date.now()}-${payment.id}`,
        refund_number: `RFND-${dayOffset(0).slice(2).replaceAll('-', '')}-${randomSuffix()}`,
        payment_id: payment.id,
        invoice_id: invoice.id,
        refunded_at: dayOffset(0),
        method: payment.method,
        amount: Number(payment.amount),
        customer: invoice.bill_to_name,
        invoice_number: invoice.invoice_number,
        reason,
        is_demo_entry: true
      });
    }
    renderAll();
  }
  closeModal();
  showToast(`Faktur ${invoice.invoice_number} dibatalkan dan jurnal pembalik dicatat.`);
}

async function submitAuth(formData) {
  if (!supabaseClient) throw new Error('Isi URL dan anon key Supabase di app.js terlebih dahulu.');
  if (currentUser) {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    restoreDemoMode();
    closeModal();
    showToast('Anda telah keluar dari akun Supabase.');
    return;
  }
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email: formData.get('email'), password: formData.get('password') });
  if (error) throw error;
  currentUser = data.user;
  await loadPropertyData();
  closeModal();
  showToast('Berhasil terhubung ke Supabase.');
}

function restoreDemoMode() {
  currentUser = null;
  activeProperty = null;
  currentRole = null;
  invoices.splice(0, invoices.length, ...demoInvoiceRecords.map((invoice) => ({ ...invoice })));
  payments.splice(0, payments.length, ...demoPaymentRecords.map((payment) => ({ ...payment })));
  refunds.splice(0, refunds.length);
  chartAccounts = [...demoAccounts];
  revenueAccounts = chartAccounts.filter((account) => account.code === '4101');
  journalReportRows = [];
  roomRevenueAmount = 0;
  roomRevenueByDate = new Map();
  recentlyCreatedInvoiceId = null;
  document.querySelector('#invoice-search').value = '';
  document.querySelector('#invoice-filter').value = 'all';
  document.querySelector('#journal-account-filter').value = 'all';
  document.querySelector('#property-name').textContent = 'Palma Resort';
  document.querySelector('#hotel-breadcrumb').textContent = 'Palma Resort';
  document.querySelector('#user-label').textContent = 'Admin';
  document.querySelector('#auth-label').textContent = 'Mode demo';
  document.querySelector('#auth-icon').setAttribute('data-lucide', 'log-in');
  document.querySelector('#sync-label').textContent = 'Demo data';
  document.querySelector('#sync-status').classList.remove('connected');
  updateActionPermissions();
  document.querySelector('#connection-state-title').textContent = 'Demo lokal aktif';
  document.querySelector('#connection-state-copy').textContent = 'Data tersimpan hanya selama sesi browser ini.';
  renderAll();
  refreshIcons();
}

async function loadPropertyData() {
  const { data: propertyRows, error: propertyError } = await supabaseClient.from('properties').select('id,name,code,currency').order('created_at').limit(1);
  if (propertyError) throw propertyError;
  if (!propertyRows?.length) throw new Error('Akun ini belum terdaftar sebagai anggota hotel. Tambahkan hotel dan property_members melalui SQL Editor.');
  activeProperty = propertyRows[0];
  const { data: membership, error: membershipError } = await supabaseClient
    .from('property_members')
    .select('role')
    .eq('property_id', activeProperty.id)
    .eq('user_id', currentUser.id)
    .single();
  if (membershipError) throw membershipError;
  currentRole = membership.role;
  const [invoiceResult, paymentResult, allocationResult, accountResult, invoiceItemsResult, journalEntryResult, journalLineResult, refundResult] = await Promise.all([
    supabaseClient.from('invoice_balances').select('*').eq('property_id', activeProperty.id).order('issued_at', { ascending: false }),
    supabaseClient.from('payments').select('*').eq('property_id', activeProperty.id).order('received_at', { ascending: false }),
    supabaseClient.from('payment_allocations').select('payment_id,invoice_id,amount').eq('property_id', activeProperty.id),
    supabaseClient.from('accounts').select('id,code,name,account_type,is_active').eq('property_id', activeProperty.id).eq('is_active', true),
    supabaseClient.from('invoice_items').select('invoice_id,revenue_account_id,subtotal').eq('property_id', activeProperty.id),
    supabaseClient.from('journal_entries').select('id,entry_number,entry_date,description,source_invoice_id,source_payment_id,source_refund_id,reversal_of_invoice_id').eq('property_id', activeProperty.id).eq('status', 'posted').order('entry_date', { ascending: false }),
    supabaseClient.from('journal_lines').select('journal_entry_id,account_id,description,debit,credit').eq('property_id', activeProperty.id),
    supabaseClient.from('payment_refunds').select('id,refund_number,payment_id,invoice_id,refunded_at,method,amount,reason').eq('property_id', activeProperty.id).order('refunded_at', { ascending: false })
  ]);
  for (const result of [invoiceResult, paymentResult, allocationResult, accountResult, invoiceItemsResult, journalEntryResult, journalLineResult, refundResult]) if (result.error) throw result.error;
  invoices.splice(0, invoices.length, ...(invoiceResult.data || []).map((row) => ({ ...row, id: row.id, paid_amount: Number(row.paid_amount), balance_due: Number(row.balance_due), total_amount: Number(row.total_amount) })));
  const invoiceLookup = new Map(invoices.map((invoice) => [invoice.id, invoice]));
  const allAccounts = accountResult.data || [];
  chartAccounts = allAccounts.filter((account) => ['1201', '4101'].includes(account.code));
  revenueAccounts = chartAccounts.filter((account) => account.account_type === 'revenue' && account.code === '4101');
  const roomRevenueAccountId = revenueAccounts[0]?.id;
  roomRevenueAmount = (invoiceItemsResult.data || []).reduce((sum, item) => {
    const invoice = invoiceLookup.get(item.invoice_id);
    if (item.revenue_account_id !== roomRevenueAccountId || invoice?.lifecycle_status !== 'issued' || invoice.issued_at?.slice(0, 7) !== currentMonth) return sum;
    return sum + Number(item.subtotal);
  }, 0);
  roomRevenueByDate = new Map();
  for (const item of invoiceItemsResult.data || []) {
    const invoice = invoiceLookup.get(item.invoice_id);
    if (item.revenue_account_id !== roomRevenueAccountId || invoice?.lifecycle_status !== 'issued' || !invoice.issued_at) continue;
    roomRevenueByDate.set(invoice.issued_at, Number(roomRevenueByDate.get(invoice.issued_at) || 0) + Number(item.subtotal));
  }
  const journalEntryLookup = new Map((journalEntryResult.data || []).map((entry) => [entry.id, entry]));
  const accountLookup = new Map(allAccounts.map((account) => [account.id, account]));
  journalReportRows = (journalLineResult.data || []).flatMap((line) => {
    const entry = journalEntryLookup.get(line.journal_entry_id);
    if (!entry) return [];
    const account = accountLookup.get(line.account_id);
    return [{
      entry_id: entry.id,
      date: entry.entry_date,
      type: entry.source_refund_id ? 'REFUND' : entry.reversal_of_invoice_id ? 'VOID' : entry.source_payment_id ? 'KAS' : 'FAKTUR',
      source: entry.description,
      code: account?.code || '',
      account: account?.name || line.description || 'Akun',
      debit: Number(line.debit || 0),
      credit: Number(line.credit || 0)
    }];
  });
  const allocationLookup = new Map();
  for (const allocation of allocationResult.data || []) {
    const allocations = allocationLookup.get(allocation.payment_id) || [];
    allocations.push(allocation);
    allocationLookup.set(allocation.payment_id, allocations);
  }
  payments.splice(0, payments.length, ...(paymentResult.data || []).map((row) => {
    const relatedInvoices = (allocationLookup.get(row.id) || []).map((allocation) => invoiceLookup.get(allocation.invoice_id)).filter(Boolean);
    return {
      ...row,
      customer: relatedInvoices.map((invoice) => invoice.bill_to_name).join(', ') || 'Penerimaan belum dialokasikan',
      invoice_number: relatedInvoices.map((invoice) => invoice.invoice_number).join(', ') || null
    };
  }));
  refunds.splice(0, refunds.length, ...(refundResult.data || []).map((row) => {
    const invoice = invoiceLookup.get(row.invoice_id);
    return { ...row, amount: Number(row.amount), customer: invoice?.bill_to_name || 'Pelanggan', invoice_number: invoice?.invoice_number || null };
  }));
  document.querySelector('#property-name').textContent = activeProperty.name;
  document.querySelector('#hotel-breadcrumb').textContent = activeProperty.name;
  document.querySelector('#user-label').textContent = currentUser.email?.split('@')[0] || 'Pengguna';
  document.querySelector('#auth-label').textContent = `Terhubung · ${currentRole}`;
  document.querySelector('#auth-icon').setAttribute('data-lucide', 'log-out');
  document.querySelector('#sync-label').textContent = 'Tersinkron';
  document.querySelector('#sync-status').classList.add('connected');
  updateActionPermissions();
  document.querySelector('#connection-state-title').textContent = `Terhubung · ${activeProperty.name}`;
  document.querySelector('#connection-state-copy').textContent = 'Data dimuat dari project Supabase aktif.';
  document.querySelector('#last-sync').textContent = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date());
  renderAll();
  refreshIcons();
}

function navigate(view) {
  currentView = view;
  document.querySelectorAll('.view-panel').forEach((panel) => panel.classList.toggle('active', panel.id === `view-${view}`));
  document.querySelectorAll('.nav-link').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  const labels = { overview: 'Ringkasan', invoices: 'Faktur & Piutang', payments: 'Penerimaan', revenue: 'Pendapatan', accounts: 'Buku Jurnal Umum', settings: 'Pengaturan' };
  const subtitles = {
    overview: 'Ini gambaran kesehatan finansial hotel Anda.',
    invoices: 'Pantau saldo terbuka dan tindak lanjuti tagihan pelanggan.',
    payments: 'Catat penerimaan kas dan alokasikan ke faktur yang tepat.',
    revenue: 'Lihat pendapatan kamar yang telah diakui, sebelum pajak.',
    accounts: 'Rekap transaksi debit dan kredit hotel.',
    settings: 'Kelola koneksi dan akses data hotel.'
  };
  document.querySelector('#breadcrumb-current').textContent = labels[view];
  document.querySelector('#page-title').textContent = view === 'overview' ? 'Selamat pagi, Admin.' : labels[view];
  document.querySelector('#page-subtitle').textContent = subtitles[view];
  document.querySelector('#export-button').hidden = !['overview', 'invoices'].includes(view);
  updateActionPermissions();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function exportInvoices() {
  const statusLabels = { overdue: 'Terlambat', partial: 'Dibayar sebagian', open: 'Belum dibayar', paid: 'Lunas', void: 'Dibatalkan' };
  const headers = [
    'Nomor Faktur', 'Nama Pelanggan', 'Segmen', 'Jenis Kamar', 'Jumlah Malam',
    'Tarif per Malam (IDR)', 'Tanggal Terbit', 'Jatuh Tempo', 'Status',
    'Subtotal Kamar (IDR)', 'Pajak (IDR)', 'Total Faktur (IDR)',
    'Sudah Dibayar (IDR)', 'Sisa Piutang (IDR)'
  ];
  const quoteText = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const numberCell = (value) => Number.isFinite(Number(value)) && value !== '' && value !== null ? String(Number(value)) : '';
  const rows = sortedInvoices().map((invoice) => {
    const subtotal = Number(invoice.room_revenue ?? (Number(invoice.room_rate) * Number(invoice.nights)));
    const hasRoomSubtotal = Number.isFinite(subtotal) && subtotal > 0;
    const total = Number(invoice.total_amount || 0);
    const paid = Number(invoice.paid_amount || 0);
    const row = [
      invoice.invoice_number,
      invoice.bill_to_name,
      invoice.company_id ? 'Korporat' : 'Tamu',
      invoice.room_type || '',
      invoice.nights ?? '',
      invoice.room_rate ?? '',
      invoice.issued_at || '',
      invoice.due_at || '',
      statusLabels[invoiceStatus(invoice)],
      hasRoomSubtotal ? subtotal : '',
      hasRoomSubtotal ? Math.max(0, total - subtotal) : '',
      total,
      paid,
      invoice.lifecycle_status === 'void' ? 0 : Number(invoice.balance_due || 0)
    ];
    return row.map((value, index) => [4, 5, 9, 10, 11, 12, 13].includes(index)
      ? numberCell(value)
      : quoteText(value));
  });
  const csv = ['sep=,', headers.map(quoteText).join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
  link.download = `palma-faktur-${dayOffset(0)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function exportJournal() {
  const selectedCode = document.querySelector('#journal-account-filter').value;
  const transactions = groupedJournalTransactions(selectedCode);
  const quoteText = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const headers = ['Tanggal', 'Tipe', 'Transaksi', 'Akun Debit', 'Debit (IDR)', 'Akun Kredit', 'Kredit (IDR)'];
  const dataRows = transactions.map((transaction) => {
    const debitLines = transaction.lines.filter((line) => Number(line.debit) > 0);
    const creditLines = transaction.lines.filter((line) => Number(line.credit) > 0);
    const debitNames = debitLines.map((line) => `${line.account}${line.code ? ` (${line.code})` : ''}`).join(' + ');
    const creditNames = creditLines.map((line) => `${line.account}${line.code ? ` (${line.code})` : ''}`).join(' + ');
    const debit = debitLines.reduce((sum, line) => sum + Number(line.debit), 0);
    const credit = creditLines.reduce((sum, line) => sum + Number(line.credit), 0);
    return [transaction.date, transaction.type, transaction.source, debitNames, debit, creditNames, credit]
      .map((value, index) => [4, 6].includes(index) ? String(value) : quoteText(value));
  });
  const csv = ['sep=,', headers.map(quoteText).join(','), ...dataRows.map((row) => row.join(','))].join('\r\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
  link.download = `palma-jurnal-umum-${dayOffset(0)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

document.querySelectorAll('.nav-link').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.view)));
document.querySelectorAll('[data-goto]').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.goto)));
document.querySelector('#new-invoice-button').addEventListener('click', () => showModal('invoice'));
document.querySelector('#new-payment-button').addEventListener('click', () => showModal('payment'));
const openAuthDialog = () => showModal('auth');
document.querySelector('#auth-button').addEventListener('click', openAuthDialog);
document.querySelector('#topbar-auth-button').addEventListener('click', openAuthDialog);
document.querySelector('#help-button').addEventListener('click', () => showToast('Gunakan mode demo untuk mencoba faktur dan penerimaan.'));
document.querySelector('#export-button').addEventListener('click', exportInvoices);
document.querySelector('#invoice-export').addEventListener('click', exportInvoices);
document.querySelector('#invoice-search').addEventListener('input', renderInvoices);
document.querySelector('#invoice-filter').addEventListener('change', renderInvoices);
document.querySelector('#journal-account-filter').addEventListener('change', renderJournalReport);
document.querySelector('#journal-print').addEventListener('click', () => window.print());
document.querySelector('#journal-export').addEventListener('click', exportJournal);
document.querySelectorAll('.period-option').forEach((button) => button.addEventListener('click', () => {
  currentPeriod = Number(button.dataset.period);
  document.querySelectorAll('.period-option').forEach((option) => option.classList.toggle('active', option === button));
  renderChart();
}));
elements.allInvoices.addEventListener('click', (event) => {
  const cancelButton = event.target.closest('.cancel-invoice');
  const payButton = event.target.closest('.pay-invoice');
  if (cancelButton) showModal('void', cancelButton.dataset.id);
  else if (payButton) showModal('payment', payButton.dataset.id);
});
elements.priorityInvoices.addEventListener('click', (event) => {
  const button = event.target.closest('.pay-invoice');
  if (button) showModal('payment', button.dataset.id);
});
document.querySelector('#close-modal').addEventListener('click', closeModal);
document.querySelector('#cancel-modal').addEventListener('click', closeModal);
elements.modal.addEventListener('click', (event) => { if (event.target === elements.modal) closeModal(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !elements.modal.hidden) closeModal(); });
elements.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = document.querySelector('#submit-transaction');
  submitButton.disabled = true;
  elements.dialogError.textContent = '';
  try {
    const formData = new FormData(elements.form);
    if (activeModal === 'invoice') await createInvoice(formData);
    else if (activeModal === 'payment') await recordPayment(formData);
    else if (activeModal === 'void') await cancelInvoice(formData);
    else await submitAuth(formData);
  } catch (error) {
    elements.dialogError.textContent = error.message || 'Transaksi belum dapat disimpan.';
  } finally {
    submitButton.disabled = false;
  }
});
document.querySelector('#today-label').textContent = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(today).toUpperCase();

async function initializeSupabase() {
  if (!PALMA_SUPABASE.url || !PALMA_SUPABASE.anonKey || !window.supabase?.createClient) {
    document.querySelector('#sync-label').textContent = 'Demo data';
    renderAll();
    return;
  }
  supabaseClient = window.supabase.createClient(PALMA_SUPABASE.url, PALMA_SUPABASE.anonKey);
  document.querySelector('#sync-label').textContent = 'Perlu masuk';
  document.querySelector('#connection-state-title').textContent = 'Supabase siap dikonfigurasi';
  document.querySelector('#connection-state-copy').textContent = 'Masuk menggunakan akun Supabase Auth Anda.';
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    showToast(error.message);
    renderAll();
    return;
  }
  if (data.session?.user) {
    currentUser = data.session.user;
    try { await loadPropertyData(); } catch (loadError) { showToast(loadError.message); }
  }
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    if (!session?.user && currentUser) {
      restoreDemoMode();
    }
  });
  renderAll();
}

renderChart();
renderAll();
refreshIcons();
initializeSupabase();
