const PROFILE_KEY = 'maos-de-ouro:profile:v1';
const BOOKINGS_KEY = 'maos-de-ouro:bookings:v1';

export function normalizePhone(value) {
  let digits = String(value ?? '').replace(/\D/g, '');
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) digits = digits.slice(2);
  return digits;
}

export function validPhone(value) {
  const digits = normalizePhone(value);
  return /^[1-9]{2}(?:[2-5]\d{7}|9\d{8})$/.test(digits);
}

function displayPhone(value) {
  const digits = normalizePhone(value);
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return value;
}

export function initProfile() {
  const form = document.getElementById('profile-form');
  if (!form) return;
  const inputs = {
    name: document.getElementById('profile-name'),
    phone: document.getElementById('profile-phone'),
    email: document.getElementById('profile-email'),
    consent: document.getElementById('profile-consent'),
  };
  const status = document.getElementById('profile-status');
  const submit = document.getElementById('profile-submit');
  const deleteButton = document.getElementById('profile-delete');
  const confirmation = document.getElementById('profile-delete-confirm');
  const success = document.getElementById('profile-success');
  let saved = false;
  let hasBookings = false;

  function announce(message, error = false) {
    status.textContent = message;
    status.classList.toggle('is-error', error);
  }

  function fieldError(key, message) {
    document.getElementById(`profile-${key}-error`).textContent = message;
    inputs[key].setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function setSaved(value) {
    saved = value;
    deleteButton.hidden = !value && !hasBookings;
    deleteButton.textContent = value ? 'Apagar meus dados' : 'Apagar dados deste navegador';
    submit.replaceChildren(document.createTextNode(value ? 'Atualizar meus dados ↗' : 'Salvar meus dados ↗'));
  }

  function refreshBookings() {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    try {
      const bookings = JSON.parse(raw || 'null');
      hasBookings = Array.isArray(bookings) && bookings.length > 0;
    } catch {
      // Keep cleanup available even when older local data is unreadable.
      hasBookings = raw !== null;
    }
    setSaved(saved);
  }

  try {
    refreshBookings();
  } catch {
    announce('O navegador bloqueou o acesso aos dados locais. Você pode preencher o formulário, mas talvez não seja possível salvar.', true);
  }

  try {
    const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
    if (profile && typeof profile.name === 'string' && typeof profile.phone === 'string') {
      inputs.name.value = profile.name;
      inputs.phone.value = displayPhone(profile.phone);
      inputs.email.value = typeof profile.email === 'string' ? profile.email : '';
      inputs.consent.checked = true;
      setSaved(true);
      announce('Seus dados estão salvos neste navegador. Você pode atualizá-los abaixo.');
    }
  } catch {
    announce('Não foi possível ler os dados locais. Você pode preencher novamente; se o navegador bloquear o armazenamento, nenhum cadastro será salvo.', true);
  }

  for (const [key, input] of Object.entries(inputs)) {
    input.addEventListener(key === 'consent' ? 'change' : 'input', () => {
      fieldError(key, '');
      success.hidden = true;
      confirmation.hidden = true;
      if (saved) announce('Alterações ainda não salvas. Use “Atualizar meus dados” para guardar.');
      else announce('');
    });
  }

  inputs.phone.addEventListener('blur', () => {
    if (validPhone(inputs.phone.value)) inputs.phone.value = displayPhone(inputs.phone.value);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = inputs.name.value.trim().replace(/\s+/g, ' ');
    const phone = inputs.phone.value.trim();
    const email = inputs.email.value.trim();
    const errors = {
      name: (name.match(/\p{L}/gu) || []).length < 2 ? 'Informe seu nome com pelo menos 2 letras.' : '',
      phone: validPhone(phone) ? '' : 'Informe um telefone válido com DDD, por exemplo (11) 99999-9999.',
      email: email && !inputs.email.validity.valid ? 'Informe um e-mail válido ou deixe este campo vazio.' : '',
      consent: inputs.consent.checked ? '' : 'Marque a opção para guardar seus dados neste navegador.',
    };
    Object.entries(errors).forEach(([key, message]) => fieldError(key, message));
    const invalid = Object.keys(errors).find((key) => errors[key]);
    if (invalid) {
      announce('Revise os campos indicados antes de salvar.', true);
      inputs[invalid].focus();
      return;
    }
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify({ name, phone: normalizePhone(phone), email }));
      inputs.name.value = name;
      inputs.phone.value = displayPhone(phone);
      setSaved(true);
      confirmation.hidden = true;
      success.hidden = false;
      announce('Cadastro de demonstração salvo neste navegador. Nenhum dado foi enviado à barbearia.');
    } catch {
      success.hidden = true;
      announce('O navegador não permitiu salvar seus dados. Libere o armazenamento local e tente novamente, ou continue diretamente para o agendamento.', true);
    }
  });

  deleteButton.addEventListener('click', () => {
    confirmation.hidden = false;
    document.getElementById('profile-delete-no').focus();
  });

  document.getElementById('profile-delete-no').addEventListener('click', () => {
    confirmation.hidden = true;
    deleteButton.focus();
  });

  document.getElementById('profile-delete-yes').addEventListener('click', () => {
    try {
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem(BOOKINGS_KEY);
      form.reset();
      Object.keys(inputs).forEach((key) => fieldError(key, ''));
      hasBookings = false;
      setSaved(false);
      confirmation.hidden = true;
      success.hidden = true;
      announce('Cadastro e agendamentos de demonstração apagados deste navegador. Mensagens já enviadas pelo WhatsApp permanecem na conversa.');
      inputs.name.focus();
    } catch {
      announce('Não foi possível apagar os dados. Tente novamente ou use as configurações do navegador para limpar os dados deste site.', true);
    }
  });

  window.addEventListener('storage', (event) => {
    if (event.key !== PROFILE_KEY && event.key !== BOOKINGS_KEY && event.key !== null) return;
    try {
      refreshBookings();
      if (event.key === PROFILE_KEY || event.key === null) {
        const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
        if (profile && typeof profile.name === 'string' && typeof profile.phone === 'string') {
          inputs.name.value = profile.name;
          inputs.phone.value = displayPhone(profile.phone);
          inputs.email.value = typeof profile.email === 'string' ? profile.email : '';
          inputs.consent.checked = true;
          setSaved(true);
        } else {
          form.reset();
          setSaved(false);
        }
        success.hidden = true;
        confirmation.hidden = true;
        Object.keys(inputs).forEach((key) => fieldError(key, ''));
      }
      announce('Os dados deste navegador foram atualizados em outra aba.');
    } catch {
      announce('Não foi possível atualizar os dados locais alterados em outra aba. Recarregue a página para tentar novamente.', true);
    }
  });
}
