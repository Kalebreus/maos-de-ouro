import { services, contact, formatPrice } from './config.js';

const PROFILE_KEY = 'maos-de-ouro:profile:v1';
const BOOKINGS_KEY = 'maos-de-ouro:bookings:v1';
const ZONE = 'America/Sao_Paulo';
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function todayInSaoPaulo(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (type) => parts.find((part) => part.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function timeMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function dateLabel(date) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: ZONE }).format(new Date(`${date}T12:00:00-03:00`));
}

function clockMinutes(now) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  return Number(parts.find((part) => part.type === 'hour').value) * 60 + Number(parts.find((part) => part.type === 'minute').value);
}

export function buildTimeSlots(date, duration, bookings = [], now = new Date()) {
  if (!DATE_PATTERN.test(date) || date < todayInSaoPaulo(now)) return [];
  const dayDate = new Date(`${date}T12:00:00-03:00`);
  if (Number.isNaN(dayDate.getTime()) || todayInSaoPaulo(dayDate) !== date || !Number.isFinite(duration) || duration <= 0) return [];
  const day = dayDate.getUTCDay();
  if (day === 0 || day === 1) return [];
  const slots = [];
  for (let minute = 9 * 60; minute + duration <= 19 * 60; minute += 30) {
    const time = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
    const past = date === todayInSaoPaulo(now) && minute <= clockMinutes(now);
    const overlap = bookings.some((booking) => {
      if (booking.date !== date) return false;
      const otherStart = timeMinutes(booking.time);
      const otherDuration = services.find((service) => service.id === booking.serviceId)?.duration || booking.duration || 45;
      return minute < otherStart + otherDuration && minute + duration > otherStart;
    });
    slots.push({ time, available: !past && !overlap });
  }
  return slots;
}

function validName(value) {
  return (value.match(/\p{L}/gu) || []).length >= 2;
}

export function normalizeBookingPhone(value) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) digits = digits.slice(2);
  return digits;
}

export function validBookingPhone(value) {
  return /^[1-9]{2}(?:9\d{8}|[2-5]\d{7})$/.test(normalizeBookingPhone(value));
}

export function initBooking() {
  const form = document.getElementById('booking-form');
  if (!form) return;
  const $ = (id) => document.getElementById(id);
  const state = { step: 0, serviceId: '', date: '', time: '', style: '', bookings: [], savedId: null, persistent: true };
  const error = $('booking-error');
  const dateInput = $('booking-date');
  const nameInput = $('booking-name');
  const phoneInput = $('booking-phone');
  const storageNote = $('booking-storage-note');
  const params = new URLSearchParams(window.location.search);
  const searchService = params.get('servico');
  if (services.some((service) => service.id === searchService)) state.serviceId = searchService;
  const searchStyle = params.get('corte');
  if (searchStyle) {
    state.style = searchStyle.slice(0, 80);
    state.serviceId = 'corte';
    $('selected-style-note').textContent = `Sua referência de estilo: ${state.style}. O corte será ajustado a você.`;
    $('selected-style-note').hidden = false;
  }

  function serviceSelected() { return services.find((service) => service.id === state.serviceId); }
  function reportStorageIssue() {
    state.persistent = false;
    storageNote.textContent = 'Seu navegador não permite salvar dados agora. Você pode continuar e enviar o resumo pelo WhatsApp; a demonstração ficará apenas nesta página enquanto ela estiver aberta.';
  }
  function loadBookings() {
    try {
      const value = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
      state.bookings = Array.isArray(value) ? value.filter((item) => item && typeof item.id === 'string' && services.some((service) => service.id === item.serviceId) && DATE_PATTERN.test(item.date) && /^\d{2}:\d{2}$/.test(item.time)) : [];
    } catch { reportStorageIssue(); }
  }
  function writeBookings() {
    try { localStorage.setItem(BOOKINGS_KEY, JSON.stringify(state.bookings)); return true; }
    catch { reportStorageIssue(); return false; }
  }
  loadBookings();
  try {
    const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
    if (profile && typeof profile === 'object') {
      nameInput.value = typeof profile.name === 'string' ? profile.name.slice(0, 80) : '';
      phoneInput.value = typeof profile.phone === 'string' ? profile.phone.slice(0, 22) : '';
    }
  } catch { reportStorageIssue(); }

  function dateLimit() {
    dateInput.min = todayInSaoPaulo();
    const end = new Date(`${dateInput.min}T12:00:00-03:00`);
    end.setUTCDate(end.getUTCDate() + 60);
    dateInput.max = todayInSaoPaulo(end);
  }
  dateLimit();

  function setFieldError(id, message, input) {
    $(id).textContent = message;
    if (input) input.setAttribute('aria-invalid', String(Boolean(message)));
  }
  function clearErrors() {
    error.textContent = '';
    ['service-error', 'date-error', 'time-error', 'name-error', 'phone-error', 'consent-error'].forEach((id) => { $(id).textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach((input) => input.removeAttribute('aria-invalid'));
  }
  function fail(message, target) {
    error.textContent = message;
    (target || error).focus();
    return false;
  }

  services.forEach((service) => {
    const label = document.createElement('label');
    label.className = 'choice service-choice';
    const input = document.createElement('input');
    input.type = 'radio'; input.name = 'service'; input.value = service.id;
    input.checked = state.serviceId === service.id;
    const content = document.createElement('span'); content.className = 'choice-content';
    const title = document.createElement('strong'); title.textContent = service.name;
    const description = document.createElement('span'); description.className = 'choice-description'; description.textContent = service.description;
    const meta = document.createElement('span'); meta.className = 'choice-meta'; meta.textContent = `${service.duration} min · ${formatPrice(service.price)}`;
    content.append(title, description, meta); label.append(input, content);
    $('service-options').append(label);
    input.addEventListener('change', () => { state.serviceId = service.id; state.time = ''; clearErrors(); renderTimes(); updateSummary(); });
  });

  function updateSummary() {
    const service = serviceSelected();
    const summary = { service: service?.name || 'A sua escolha', duration: service ? `${service.duration} minutos` : '—', date: state.date ? dateLabel(state.date) : 'Escolha uma data', time: state.time ? `${state.time}h` : '—', price: service ? formatPrice(service.price) : '—' };
    Object.entries(summary).forEach(([key, value]) => { document.querySelector(`[data-summary="${key}"]`).textContent = value; });
  }

  function renderTimes() {
    const container = $('time-options'); container.replaceChildren();
    const service = serviceSelected();
    if (!state.date || !service) { $('time-help').textContent = 'Escolha uma data para ver os horários.'; return; }
    const slots = buildTimeSlots(state.date, service.duration, state.bookings);
    if (!slots.length) {
      $('time-help').textContent = state.date < todayInSaoPaulo() ? 'Escolha uma data a partir de hoje.' : 'Domingo e segunda são dias de pausa na agenda demonstrativa. Escolha de terça a sábado.';
      return;
    }
    const selectedStillAvailable = slots.some((slot) => slot.time === state.time && slot.available);
    if (!selectedStillAvailable) state.time = '';
    $('time-help').textContent = slots.some((slot) => slot.available) ? 'Horários ilustrativos. As opções desativadas já passaram ou estão ocupadas neste navegador.' : 'Não há horários disponíveis nesta data. Escolha outro dia.';
    slots.forEach(({ time, available }) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'time-button'; button.textContent = time;
      button.disabled = !available; button.setAttribute('aria-pressed', String(state.time === time));
      if (!available) button.setAttribute('aria-label', `${time}, indisponível`);
      button.addEventListener('click', () => {
        state.time = time; setFieldError('time-error', ''); error.textContent = '';
        container.querySelectorAll('button').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
        updateSummary();
      });
      container.append(button);
    });
  }

  function validate(step) {
    clearErrors(); dateLimit();
    if (step === 0 && !serviceSelected()) {
      setFieldError('service-error', 'Escolha um serviço para continuar.');
      return fail('Escolha o seu cuidado de hoje.', form.querySelector('[name="service"]'));
    }
    if (step === 1) {
      if (!state.date || state.date < dateInput.min || state.date > dateInput.max) {
        setFieldError('date-error', 'Escolha uma data entre hoje e os próximos 60 dias.', dateInput);
        return fail('Revise a data do seu horário.', dateInput);
      }
      const validSlot = buildTimeSlots(state.date, serviceSelected().duration, state.bookings).some((slot) => slot.time === state.time && slot.available);
      if (!validSlot) {
        setFieldError('time-error', 'Escolha um horário disponível.');
        return fail('Escolha um horário disponível para continuar.', $('time-options').querySelector('button:not(:disabled)') || dateInput);
      }
    }
    if (step === 2) {
      if (!validName(nameInput.value.trim())) { setFieldError('name-error', 'Informe seu nome, com pelo menos duas letras.', nameInput); return fail('Revise seu nome.', nameInput); }
      if (!validBookingPhone(phoneInput.value)) { setFieldError('phone-error', 'Informe um telefone brasileiro válido com DDD, com 10 ou 11 dígitos.', phoneInput); return fail('Revise seu WhatsApp com DDD.', phoneInput); }
      if (!$('booking-consent').checked) { setFieldError('consent-error', 'Autorize o armazenamento local para salvar esta demonstração.'); return fail('Confirme como seus dados serão usados.', $('booking-consent')); }
    }
    return true;
  }

  function renderReview() {
    const service = serviceSelected();
    $('review-name').textContent = nameInput.value.trim(); $('review-phone').textContent = phoneInput.value.trim();
    $('review-service').textContent = `${service.name} · ${service.duration} min`;
    $('review-date').textContent = `${dateLabel(state.date)}, às ${state.time} (Brasília)`;
    $('review-price').textContent = formatPrice(service.price);
    $('review-style-row').hidden = !state.style; $('review-style').textContent = state.style;
  }
  function showStep(step, moveFocus = true) {
    state.step = step;
    document.querySelectorAll('[data-booking-step]').forEach((section) => { section.hidden = Number(section.dataset.bookingStep) !== step; });
    document.querySelectorAll('[data-progress-step]').forEach((item) => {
      const current = Number(item.dataset.progressStep) === step;
      if (current) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
      item.classList.toggle('is-complete', Number(item.dataset.progressStep) < step);
    });
    $('booking-back').hidden = step === 0; $('booking-next').hidden = step === 3; $('booking-save').hidden = step !== 3;
    if (step === 1) renderTimes();
    if (step === 3) renderReview();
    updateSummary();
    if (moveFocus) $(`booking-title-${step}`).focus({ preventScroll: true });
  }
  dateInput.addEventListener('change', () => { state.date = dateInput.value; state.time = ''; clearErrors(); renderTimes(); updateSummary(); });
  $('booking-back').addEventListener('click', () => { clearErrors(); showStep(Math.max(0, state.step - 1)); });
  $('booking-next').addEventListener('click', () => { if (validate(state.step)) showStep(state.step + 1); });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (state.step < 3) { if (validate(state.step)) showStep(state.step + 1); return; }
    loadBookings();
    for (let step = 0; step < 3; step += 1) {
      if (!validate(step)) { showStep(step, false); error.focus(); return; }
    }
    const service = serviceSelected();
    const booking = { id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`, serviceId: service.id, date: state.date, time: state.time, name: nameInput.value.trim(), phone: normalizeBookingPhone(phoneInput.value), style: state.style, duration: service.duration };
    state.bookings.push(booking); const persisted = writeBookings(); state.savedId = booking.id;
    form.hidden = true; document.querySelector('.booking-steps').hidden = true; $('booking-success').hidden = false;
    $('booking-success-title').textContent = persisted ? 'Demonstração salva.' : 'Sua solicitação está pronta.';
    $('booking-success-message').textContent = `${booking.name}, sua escolha é ${service.name.toLowerCase()}, em ${dateLabel(booking.date)}, às ${booking.time} (Brasília). ${persisted ? 'O registro foi salvo neste dispositivo.' : 'Seu navegador não permitiu salvar o registro.'}`;
    const message = `Olá, Mãos de Ouro! Gostaria de consultar um horário.\n\nNome: ${booking.name}\nWhatsApp: ${booking.phone}\nServiço: ${service.name}\nData desejada: ${dateLabel(booking.date)}\nHorário desejado: ${booking.time} (Brasília)${booking.style ? `\nReferência de corte: ${booking.style}` : ''}\n\nVim pelo site demonstrativo. Podem confirmar a disponibilidade e o valor?`;
    $('booking-whatsapp').href = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`;
    $('booking-cancel').hidden = false; $('booking-success-status').textContent = '';
    $('booking-success-title').focus();
  });

  $('booking-cancel').addEventListener('click', () => {
    loadBookings(); state.bookings = state.bookings.filter((booking) => booking.id !== state.savedId);
    const persisted = writeBookings();
    if (!persisted) { $('booking-success-status').textContent = 'Não foi possível atualizar o armazenamento. Apague os dados deste site no navegador para removê-los.'; return; }
    $('booking-success-status').textContent = 'Esta demonstração foi apagada deste dispositivo. Nenhuma solicitação já enviada pelo WhatsApp foi cancelada. Para isso, fale com a barbearia.';
    $('booking-cancel').hidden = true; state.savedId = null;
  });
  $('booking-another').addEventListener('click', () => {
    $('booking-success').hidden = true; form.hidden = false; document.querySelector('.booking-steps').hidden = false;
    state.date = ''; state.time = ''; dateInput.value = ''; $('booking-consent').checked = false; clearErrors(); showStep(0);
  });
  window.addEventListener('storage', (event) => {
    if (event.key === BOOKINGS_KEY) { loadBookings(); renderTimes(); updateSummary(); }
    if (event.key === PROFILE_KEY && !event.newValue) { nameInput.value = ''; phoneInput.value = ''; $('booking-consent').checked = false; }
  });
  showStep(0, false);
}
