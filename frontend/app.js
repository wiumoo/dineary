/* No build step or API key required. Replace this sample catalog with an API later. */
const restaurants = [
  { id: 'r1', name: '소담한 상', area: '성수', category: '한식', description: '제철 재료로 차려낸, 정갈한 한 상', price: 13000, rating: 4.7, count: 128, solo: true, tags: ['혼밥', '정갈한 한식'], menu: [['제철 솥밥', 13000], ['고등어 구이 정식', 16000]], address: '서울 성동구 샘플길 12', hours: '11:00–21:00 · 월요일 휴무', color: '#e5e9d9', dish: 'rice', pin: [77, 50] },
  { id: 'r2', name: '오후의 파스타', area: '연남', category: '양식', description: '느긋한 오후와 잘 어울리는 생면 파스타', price: 19000, rating: 4.8, count: 96, solo: false, tags: ['데이트', '생면 파스타'], menu: [['바질 생면 파스타', 19000], ['토마토 라구', 21000]], address: '서울 마포구 샘플길 24', hours: '12:00–21:00 · 화요일 휴무', color: '#f0e3d3', dish: 'pasta', pin: [22, 32] },
  { id: 'r3', name: '스시 모리', area: '성수', category: '일식', description: '한 점마다 담긴 계절의 맛', price: 22000, rating: 4.6, count: 84, solo: true, tags: ['혼밥', '카운터석'], menu: [['모둠 초밥 10점', 22000], ['연어 덮밥', 17000]], address: '서울 성동구 샘플길 36', hours: '11:30–21:00 · 일요일 휴무', color: '#dce7e5', dish: 'sushi', pin: [82, 72] },
  { id: 'r4', name: '온기 국수', area: '을지로', category: '한식', description: '오래 끓인 국물, 든든하게 채우는 한 그릇', price: 10000, rating: 4.5, count: 213, solo: true, tags: ['혼밥', '든든한 점심'], menu: [['온기 쌀국수', 10000], ['들기름 비빔국수', 11000]], address: '서울 중구 샘플길 48', hours: '11:00–20:00 · 토요일 휴무', color: '#ede1d5', dish: 'noodles', pin: [49, 30] },
  { id: 'r5', name: '버터와 오후', area: '연남', category: '카페', description: '갓 구운 빵과 커피가 기다리는 작은 쉼표', price: 6500, rating: 4.7, count: 67, solo: true, tags: ['디저트', '조용한 공간'], menu: [['플랫 화이트', 6500], ['버터 팬케이크', 12000]], address: '서울 마포구 샘플길 60', hours: '10:00–20:00 · 수요일 휴무', color: '#e8dfd1', dish: 'pancake', pin: [24, 56] },
  { id: 'r6', name: '작은 화로', area: '을지로', category: '일식', description: '숯불 향과 함께 마무리하는 오늘', price: 18000, rating: 4.4, count: 112, solo: false, tags: ['저녁 약속', '숯불구이'], menu: [['숯불 닭꼬치 모둠', 18000], ['구운 주먹밥', 7000]], address: '서울 중구 샘플길 72', hours: '17:00–23:00 · 월요일 휴무', color: '#e2e1d7', dish: 'skewers', pin: [55, 57] }
];

const $ = (selector) => document.querySelector(selector);
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const money = (value) => value.toLocaleString('ko-KR') + '원';
const today = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };
const userStorageKey = () => `dineary-prototype-v1:user:${DinearyAuth.user.id}`;
const state = { view: 'explore', category: '전체', query: '', region: '', solo: false, sort: 'recommended', active: null };
let saved = [], reviews = [], bookings = [];
let toastTimer;

function loadUserData() {
  saved = []; reviews = []; bookings = [];
  if (!DinearyAuth.user) return;
  try {
  const stored = JSON.parse(localStorage.getItem(userStorageKey()) || '{}');
  const known = (id) => restaurants.some((r) => r.id === id);
  saved = Array.isArray(stored.saved) ? [...new Set(stored.saved.filter(known))] : [];
  reviews = Array.isArray(stored.reviews) ? stored.reviews.filter((r) => r && known(r.restaurantId) && typeof r.id === 'string' && typeof r.text === 'string' && typeof r.date === 'string' && Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5) : [];
  bookings = Array.isArray(stored.bookings) ? stored.bookings.filter((b) => b && known(b.restaurantId) && typeof b.id === 'string' && typeof b.date === 'string' && typeof b.time === 'string' && Number.isInteger(b.people) && b.people >= 1 && b.people <= 4) : [];
  } catch { /* Unavailable or malformed storage falls back to this session. */ }
}
loadUserData();

function requireLogin(callback = null) {
  if (DinearyAuth.user) return true;
  DinearyAuth.open('login', callback);
  return false;
}

function notify(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2800);
}

function persist(message) {
  if (!DinearyAuth.user) return;
  try { localStorage.setItem(userStorageKey(), JSON.stringify({ saved, reviews, bookings })); notify(message); }
  catch { notify('저장 공간을 사용할 수 없어 이번 화면에서만 유지됩니다.'); }
}

function stats(restaurant) {
  const own = reviews.filter((r) => r.restaurantId === restaurant.id);
  return { rating: ((restaurant.rating * restaurant.count + own.reduce((sum, r) => sum + r.rating, 0)) / (restaurant.count + own.length)).toFixed(1), count: restaurant.count + own.length };
}

// Local vector illustrations keep the prototype usable without external requests.
function foodArt(r) {
  let food = '';
  if (r.dish === 'rice') food = '<circle cx="180" cy="100" r="54" fill="#c8a475"/><circle cx="180" cy="100" r="47" fill="#fff5d8"/><path d="M146 80Q168 61 194 72L206 92L171 105Z" fill="#67815a"/><path d="M153 118L188 83L208 104L173 139Z" fill="#b47545"/><path d="M153 118L188 83M161 124L196 89M168 131L203 97" stroke="#edb46b" stroke-width="5"/><circle cx="168" cy="93" r="18" fill="#fffdf4"/><circle cx="168" cy="93" r="10" fill="#e8b34b"/><path d="M189 119L202 112M184 127L195 124" stroke="#45674a" stroke-width="4"/>';
  if (r.dish === 'pasta' || r.dish === 'noodles') {
    food = `<circle cx="180" cy="100" r="52" fill="${r.dish === 'pasta' ? '#b6bd74' : '#cfa770'}"/>`;
    food += Array.from({ length: 8 }, (_, i) => `<path d="M${147 + i * 6} 72C${216 - i * 4} 62 ${128 + i * 3} 136 ${192 + i * 2} 128" fill="none" stroke="${r.dish === 'pasta' ? '#e4d797' : '#f7e3ba'}" stroke-width="5" stroke-linecap="round"/>`).join('');
    food += '<path d="M167 84Q138 52 153 55Q181 55 178 88Q191 52 205 61Q210 81 178 92" fill="#47764e"/><circle cx="150" cy="112" r="9" fill="#be5941"/><circle cx="207" cy="102" r="8" fill="#be5941"/>';
  }
  if (r.dish === 'sushi') food = [0, 1, 2, 3, 4, 5].map((i) => `<g transform="translate(${139 + (i % 3) * 32} ${74 + Math.floor(i / 3) * 40}) rotate(-12)"><rect width="27" height="33" rx="10" fill="#eee9d8"/><rect y="-3" width="27" height="24" rx="6" fill="${i % 2 ? '#d89782' : '#e99e69'}"/><path d="M5 0L12 19M15 0L23 19" stroke="#f7d5bd" stroke-width="3"/></g>`).join('');
  if (r.dish === 'pancake') food = '<ellipse cx="180" cy="121" rx="49" ry="24" fill="#ab7540"/><ellipse cx="180" cy="113" rx="49" ry="24" fill="#edc683"/><ellipse cx="180" cy="105" rx="49" ry="24" fill="#b98143"/><ellipse cx="180" cy="97" rx="49" ry="24" fill="#edc683"/><ellipse cx="180" cy="89" rx="49" ry="24" fill="#d69a4e"/><path d="M150 82Q183 66 208 87L193 105L167 111Z" fill="#ad6c31"/><path d="M171 76L191 79L188 93L168 88Z" fill="#f6df91"/><circle cx="217" cy="127" r="7" fill="#505870"/><circle cx="204" cy="137" r="6" fill="#505870"/>';
  if (r.dish === 'skewers') food = [0, 1, 2].map((i) => `<g transform="translate(${150 + i * 26} 58) rotate(17)"><path d="M0 0V103" stroke="#b99156" stroke-width="3"/>${[0, 1, 2, 3].map((j) => `<rect x="-9" y="${j * 18}" width="19" height="15" rx="4" fill="${j % 2 ? '#788353' : '#b77942'}"/><path d="M-6 ${j * 18 + 4}L6 ${j * 18 + 8}" stroke="#694b2f" stroke-width="2"/>`).join('')}</g>`).join('');
  return `<svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${escapeHTML(r.name)} 메뉴 일러스트" xmlns="http://www.w3.org/2000/svg"><rect width="360" height="200" fill="${r.color}"/><path d="M0 150L360 15V0H0Z" fill="#ffffff" opacity=".16"/><path d="M285 0L310 200M303 0L328 200" stroke="#fff" opacity=".3" stroke-width="7"/><ellipse cx="182" cy="110" rx="83" ry="72" fill="#24392a" opacity=".09"/><circle cx="180" cy="100" r="73" fill="#fcfaf2"/><circle cx="180" cy="100" r="61" fill="none" stroke="#e4e1d5" stroke-width="2"/>${food}<g stroke="#826e50" stroke-width="4" stroke-linecap="round"><path d="M284 53L265 153"/><path d="M293 55L275 156"/></g><circle cx="57" cy="43" r="24" fill="#fff" opacity=".75"/><circle cx="57" cy="43" r="17" fill="#9d8b5d" opacity=".6"/></svg>`;
}

const bookmarkIcon = '<svg viewBox="0 0 20 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 3h12v18l-6-4-6 4Z" stroke-linejoin="round"/></svg>';
function card(r) {
  const s = stats(r), isSaved = saved.includes(r.id);
  return `<article class="restaurant-card"><button class="card-open" data-open="${r.id}" aria-label="${r.name} 상세 보기"><span class="food-image">${foodArt(r)}</span><div class="card-meta">${r.area} · ${r.category}</div><div class="card-title-row"><h3>${r.name}</h3><span class="rating"><i>★</i> ${s.rating} <small>(${s.count})</small></span></div><p class="card-description">${r.description}</p><div class="card-bottom">${r.tags.map((t) => `<span class="tag">${t}</span>`).join('')}<span class="card-price">${money(r.price)}부터</span></div></button><button class="save-button" data-save="${r.id}" aria-label="${r.name} ${isSaved ? '저장 해제' : '저장'}" aria-pressed="${isSaved}">${bookmarkIcon}</button></article>`;
}

function results() {
  const query = state.query.toLowerCase().replace(/\s+/g, '');
  return restaurants.filter((r) => (state.view !== 'saved' || saved.includes(r.id)) && (!state.region || r.area === state.region) && (state.category === '전체' || r.category === state.category) && (!state.solo || r.solo) && (!query || [r.name, r.area, r.category, ...r.menu.map((m) => m[0]), ...r.tags].join('').replace(/\s+/g, '').toLowerCase().includes(query)))
    .sort((a, b) => state.sort === 'rating' ? Number(stats(b).rating) - Number(stats(a).rating) : state.sort === 'price' ? a.price - b.price : state.sort === 'reviews' ? stats(b).count - stats(a).count : 0);
}

function render() {
  $('#saved-count').textContent = saved.length;
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === state.view);
    if (button.dataset.view === state.view) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
  });
  $('#page-title').textContent = { explore: '오늘은 어디서 잘 먹을까요?', saved: '다음 한 끼를 모아두었어요.', mine: '맛있는 순간, 나의 기록.' }[state.view];
  $('#page-description').textContent = { explore: '골목의 작은 식당부터, 다시 찾고 싶은 한 접시까지.', saved: '가보고 싶은 곳도, 다시 가고 싶은 곳도 여기에.', mine: '직접 남긴 리뷰와 예약 체험 내역을 확인해 보세요.' }[state.view];
  $('#discovery').hidden = state.view === 'mine';
  $('#my-records').hidden = state.view !== 'mine';
  if (state.view === 'mine') { renderRecords(); return; }
  const list = results();
  $('#result-count').textContent = `${list.length}곳`;
  $('#restaurant-list').innerHTML = list.length ? list.map(card).join('') : `<div class="empty"><h3>${state.view === 'saved' && !saved.length ? '아직 저장한 가게가 없어요' : '조건에 맞는 가게가 없어요'}</h3><p>${state.view === 'saved' && !saved.length ? '마음에 드는 가게의 저장 버튼을 눌러보세요.' : '다른 검색어를 입력하거나 필터를 초기화해 보세요.'}</p><button class="secondary" data-reset>${state.view === 'saved' && !saved.length ? '가게 발견하기' : '필터 초기화'}</button></div>`;
  $('#map-pins').innerHTML = list.map((r) => `<button class="map-pin" style="left:${r.pin[0]}%;top:${r.pin[1]}%" data-open="${r.id}" aria-label="지도에서 ${r.name} 상세 보기">${money(r.price)}</button>`).join('');
}

function resetFilters() {
  Object.assign(state, { category: '전체', query: '', region: '', solo: false, sort: 'recommended' });
  $('#query').value = ''; $('#region').value = ''; $('#solo').checked = false; $('#sort').value = 'recommended';
  document.querySelectorAll('[data-category]').forEach((button) => { const selected = button.dataset.category === '전체'; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', selected); });
}

function detail(r) {
  const s = stats(r), own = reviews.filter((review) => review.restaurantId === r.id);
  $('#detail-content').innerHTML = `<div class="detail-cover">${foodArt(r)}</div><div class="detail-body"><span class="subtle">${r.area} · ${r.category} · 가상의 음식점</span><div class="detail-top"><h2 id="detail-title">${r.name}</h2><button class="secondary" data-detail-save="${r.id}" aria-pressed="${saved.includes(r.id)}">${saved.includes(r.id) ? '저장됨 ✓' : '가게 저장'}</button></div><p class="detail-subtitle">${r.description} &nbsp; <span class="rating"><i>★</i> ${s.rating} <small>리뷰 ${s.count}개</small></span></p><div class="detail-facts"><span>주소 &nbsp; ${r.address}</span><span>영업 &nbsp; ${r.hours}</span><span>편의 &nbsp; ${r.tags.join(', ')}</span><span>안내 &nbsp; 메뉴·가격은 모두 예시입니다</span></div><div class="detail-columns"><section><h3>대표 메뉴</h3>${r.menu.map(([name, price]) => `<div class="menu-row"><span>${name}</span><strong>${money(price)}</strong></div>`).join('')}</section><section><h3>예약 체험</h3><form id="booking-form"><label class="form-field">날짜<input name="date" type="date" min="${today()}" value="${today()}" required></label><div class="form-pair"><label class="form-field">시간<select name="time">${(r.id === 'r6' ? ['17:00', '18:00', '19:00'] : ['12:00', '13:00', '18:00']).map((time) => `<option>${time}</option>`).join('')}</select></label><label class="form-field">인원<select name="people"><option value="1">1명</option><option value="2" selected>2명</option><option value="3">3명</option><option value="4">4명</option></select></label></div><button class="primary" type="submit">예약 체험하기</button><p class="form-note">실제 가게로 전달되지 않는 샘플 예약입니다.<br>예약 가능 시간과 휴무일은 연동되지 않습니다.</p></form></section></div><section class="reviews-section"><h3>방문한 사람들의 이야기</h3><div id="review-list">${own.map(reviewMarkup).join('')}<article class="review-item"><div class="review-header"><strong>동네산책</strong><span class="rating"><i>★</i> ${r.rating}</span><span class="subtle">샘플 리뷰</span></div><p>${r.solo ? '혼자 방문해도 편안한 분위기였어요. 다음에도 들르고 싶어요.' : '친구와 천천히 식사하기 좋았어요. 다음에는 다른 메뉴도 먹어보려고요.'}</p></article></div><form id="review-form" class="review-form"><h3>나의 한 끼 기록하기</h3><div class="form-pair"><label class="form-field">별점<select name="rating"><option value="5">★ 5 · 정말 좋았어요</option><option value="4">★ 4 · 좋았어요</option><option value="3">★ 3 · 괜찮았어요</option><option value="2">★ 2 · 아쉬웠어요</option><option value="1">★ 1 · 별로였어요</option></select></label><label class="form-field">방문일<input name="date" type="date" max="${today()}" value="${today()}" required></label></div><label class="form-field">리뷰<textarea name="text" minlength="5" maxlength="500" required placeholder="음식과 공간은 어땠나요? 5자 이상 남겨주세요."></textarea></label><button class="primary" type="submit">리뷰 등록</button><p class="form-note">내 리뷰는 이 브라우저에만 저장됩니다.</p></form></section></div>`;
}

function reviewMarkup(review) {
  return `<article class="review-item"><div class="review-header"><strong>나</strong><span class="rating"><i>★</i> ${review.rating}</span><time>${escapeHTML(review.date)}</time><button class="text-button" data-delete-review="${escapeHTML(review.id)}">삭제</button></div><p>${escapeHTML(review.text)}</p></article>`;
}

function openDetail(id) {
  const r = restaurants.find((restaurant) => restaurant.id === id);
  if (!r) return;
  state.active = id; detail(r);
  $('#detail-dialog').showModal(); $('#detail-dialog').scrollTop = 0;
}

function toggleSave(id) {
  if (!requireLogin(() => toggleSave(id))) return;
  saved = saved.includes(id) ? saved.filter((value) => value !== id) : [...saved, id];
  persist(saved.includes(id) ? '다음에 가볼 곳에 저장했어요.' : '저장한 곳에서 제외했어요.');
  render();
  const detailButton = $('[data-detail-save]');
  if (detailButton && detailButton.dataset.detailSave === id) { detailButton.textContent = saved.includes(id) ? '저장됨 ✓' : '가게 저장'; detailButton.setAttribute('aria-pressed', saved.includes(id)); }
}

function renderRecords() {
  $('#my-records').innerHTML = `<div class="records-grid"><section class="records-column"><h2>나의 리뷰 <span class="subtle">${reviews.length}개</span></h2>${reviews.length ? reviews.map((review) => { const r = restaurants.find((item) => item.id === review.restaurantId); return `<article class="record"><h3>${r.name}</h3>${reviewMarkup(review)}<button class="secondary" data-open="${r.id}">가게 보기</button></article>`; }).join('') : '<div class="empty"><h3>첫 한 끼를 기록해 보세요</h3><p>가게 상세 화면에서 리뷰를 남길 수 있어요.</p><button class="secondary" data-view="explore">가게 발견하기</button></div>'}</section><section class="records-column"><h2>예약 체험 내역 <span class="subtle">${bookings.length}개</span></h2>${bookings.length ? bookings.map((booking) => { const r = restaurants.find((item) => item.id === booking.restaurantId); return `<article class="record"><h3>${r.name}</h3><span class="tag">체험 예약</span><p>${escapeHTML(booking.date)} ${escapeHTML(booking.time)} · ${booking.people}명</p><div class="record-actions"><button class="secondary" data-open="${r.id}">가게 보기</button><button class="secondary" data-cancel="${escapeHTML(booking.id)}">예약 취소</button></div></article>`; }).join('') : '<div class="empty"><h3>아직 예약한 곳이 없어요</h3><p>마음에 드는 가게에서 예약을 체험해 보세요.</p></div>'}</section></div>`;
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.view) {
    const navigate = () => { state.view = button.dataset.view; resetFilters(); render(); };
    if (button.dataset.view !== 'explore' && !requireLogin(navigate)) return;
    navigate();
  }
  else if (button.dataset.category) {
    state.category = button.dataset.category;
    document.querySelectorAll('[data-category]').forEach((chip) => { const selected = chip === button; chip.classList.toggle('selected', selected); chip.setAttribute('aria-pressed', selected); });
    render();
  } else if (button.dataset.open) openDetail(button.dataset.open);
  else if (button.dataset.save || button.dataset.detailSave) toggleSave(button.dataset.save || button.dataset.detailSave);
  else if (button.hasAttribute('data-reset')) { if (state.view === 'saved' && !saved.length) state.view = 'explore'; resetFilters(); render(); }
  else if (button.dataset.deleteReview) {
    if (!requireLogin()) return;
    reviews = reviews.filter((review) => review.id !== button.dataset.deleteReview); persist('리뷰를 삭제했어요.'); render();
    if ($('#detail-dialog').open) { detail(restaurants.find((r) => r.id === state.active)); $('#review-form textarea').focus(); }
  } else if (button.dataset.cancel) {
    if (!requireLogin()) return;
    bookings = bookings.filter((booking) => booking.id !== button.dataset.cancel); persist('체험 예약을 취소했어요.'); render();
  }
});

$('#search-form').addEventListener('submit', (event) => { event.preventDefault(); state.query = $('#query').value.trim(); render(); });
$('#query').addEventListener('input', () => { state.query = $('#query').value.trim(); render(); });
$('#region').addEventListener('change', (event) => { state.region = event.target.value; render(); });
$('#sort').addEventListener('change', (event) => { state.sort = event.target.value; render(); });
$('#solo').addEventListener('change', (event) => { state.solo = event.target.checked; render(); });
$('#close-dialog').addEventListener('click', () => $('#detail-dialog').close());
$('#detail-dialog').addEventListener('click', (event) => { if (event.target === $('#detail-dialog')) { const bounds = event.target.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.target.close(); } });
$('#detail-content').addEventListener('submit', (event) => {
  event.preventDefault();
  if (!requireLogin()) return;
  const data = new FormData(event.target), r = restaurants.find((item) => item.id === state.active);
  if (!r || !event.target.reportValidity()) return;
  if (event.target.id === 'review-form') {
    const text = String(data.get('text')).trim();
    if (text.length < 5) { notify('리뷰 내용을 5자 이상 입력해 주세요.'); return; }
    reviews.unshift({ id: crypto.randomUUID(), restaurantId: r.id, rating: Number(data.get('rating')), date: String(data.get('date')), text });
    persist('나의 한 끼를 기록했어요.'); render(); detail(r); $('#review-form textarea').focus();
  } else if (event.target.id === 'booking-form') {
    const date = String(data.get('date')), time = String(data.get('time')), people = Number(data.get('people'));
    if (new Date(`${date}T${time}:00`) <= new Date()) { notify('현재 시간 이후의 날짜와 시간을 선택해 주세요.'); return; }
    if (bookings.some((b) => b.restaurantId === r.id && b.date === date && b.time === time)) { notify('같은 시간에 이미 체험 예약이 있어요.'); return; }
    bookings.unshift({ id: crypto.randomUUID(), restaurantId: r.id, date, time, people });
    persist('체험 예약을 저장했어요. 나의 기록에서 확인하세요.'); render();
  }
});

window.addEventListener('dineary:auth-change', () => {
  loadUserData();
  if (!DinearyAuth.user) { state.view = 'explore'; resetFilters(); }
  render();
  // Clear the previous user's hidden records as well as the visible page.
  renderRecords();
  if ($('#detail-dialog').open) {
    const drafts = [...$('#detail-content').querySelectorAll('form')].map((form) => [form.id, [...new FormData(form)]]);
    detail(restaurants.find((r) => r.id === state.active));
    if (DinearyAuth.user) {
      for (const [id, entries] of drafts) for (const [name, value] of entries) document.getElementById(id).elements[name].value = value;
    }
  }
  notify(DinearyAuth.user ? `${DinearyAuth.user.nickname}님, 반가워요.` : '로그아웃했어요.');
});

render();
