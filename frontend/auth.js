/* Local prototype only. Real authentication must be implemented on the server. */
(() => {
  const accountsKey = 'dineary-accounts-v1';
  const sessionKey = 'dineary-session-v1';
  const iterations = 210000;
  const dialog = document.querySelector('#auth-dialog');
  const form = document.querySelector('#auth-form');
  const fields = form.elements;
  let currentUser = null;
  let mode = 'login';
  let busy = false;
  let afterLogin = null;

  function readAccounts() {
    const accounts = JSON.parse(localStorage.getItem(accountsKey) || '[]');
    if (!Array.isArray(accounts)) throw new Error('invalid storage');
    return accounts;
  }

  try {
    const id = sessionStorage.getItem(sessionKey);
    const account = readAccounts().find((entry) => entry.id === id);
    if (account) currentUser = { id: account.id, nickname: account.nickname, email: account.email };
  } catch { /* An unavailable session starts signed out. */ }

  function renderAccount() {
    const menu = document.querySelector('#account-menu');
    menu.replaceChildren();
    if (currentUser) {
      const name = document.createElement('span');
      name.className = 'account-name';
      name.textContent = `${currentUser.nickname}님`;
      name.title = currentUser.email;
      const logout = document.createElement('button');
      logout.className = 'secondary';
      logout.textContent = '로그아웃';
      logout.addEventListener('click', () => {
        try { sessionStorage.removeItem(sessionKey); }
        catch { showError('로그아웃을 완료하지 못했어요. 브라우저 저장 설정을 확인해 주세요.'); return; }
        currentUser = null;
        renderAccount();
        window.dispatchEvent(new Event('dineary:auth-change'));
      });
      menu.append(name, logout);
    } else {
      for (const [value, label, className] of [['login', '로그인', 'secondary'], ['signup', '회원가입', 'primary']]) {
        const button = document.createElement('button');
        button.className = className;
        button.textContent = label;
        button.addEventListener('click', () => open(value));
        menu.append(button);
      }
    }
  }

  function showError(message) {
    document.querySelector('#auth-error').textContent = message;
  }

  function setMode(nextMode) {
    mode = nextMode;
    const signup = mode === 'signup';
    document.querySelector('#auth-title').textContent = signup ? '나의 맛집 기록을 시작해요' : '다시 만나 반가워요';
    document.querySelector('#auth-description').textContent = signup ? '계정을 만들고 마음에 드는 한 끼를 모아보세요.' : '로그인하고 나만의 맛집 기록을 이어가세요.';
    for (const [name, id] of [['nickname', 'nickname-field'], ['confirm', 'confirm-field']]) {
      document.querySelector(`#${id}`).hidden = !signup;
      fields[name].disabled = !signup;
      fields[name].required = signup;
    }
    fields.password.minLength = signup ? 8 : 1;
    fields.password.autocomplete = signup ? 'new-password' : 'current-password';
    fields.password.placeholder = signup ? '8자 이상 입력해 주세요' : '';
    fields.password.value = '';
    fields.confirm.value = '';
    document.querySelector('#auth-submit').textContent = signup ? '가입하고 시작하기' : '로그인';
    document.querySelector('#auth-switch-label').textContent = signup ? '이미 계정이 있나요?' : '아직 계정이 없나요?';
    document.querySelector('#auth-switch').textContent = signup ? '로그인' : '회원가입';
    showError('');
  }

  function open(nextMode = 'login', callback = null) {
    afterLogin = callback;
    form.reset();
    setMode(nextMode);
    if (!dialog.open) dialog.showModal();
    (mode === 'signup' ? fields.nickname : fields.email).focus();
  }

  async function passwordHash(password, salt) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: Uint8Array.from(salt), iterations, hash: 'SHA-256' }, key, 256);
    return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    showError('');
    const email = fields.email.value.trim().toLowerCase();
    const password = fields.password.value;
    const nickname = fields.nickname.value.trim();
    if (mode === 'signup' && nickname.length < 2) { showError('닉네임을 공백 제외 2자 이상 입력해 주세요.'); fields.nickname.focus(); return; }
    if (mode === 'signup' && password !== fields.confirm.value) { showError('비밀번호가 일치하지 않아요.'); fields.confirm.focus(); return; }
    if (!crypto.subtle) { showError('회원 기능은 http://127.0.0.1:5173에서 이용해 주세요.'); return; }
    busy = true;
    for (const id of ['auth-submit', 'auth-switch', 'close-auth']) document.getElementById(id).disabled = true;
    document.querySelector('#auth-submit').textContent = '확인 중…';
    try {
      let accounts = readAccounts();
      let account = accounts.find((entry) => entry.email === email);
      if (mode === 'signup') {
        if (account) { showError('이미 가입한 이메일이에요. 로그인해 주세요.'); return; }
        const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)));
        const hash = await passwordHash(password, salt);
        // Read again after hashing, so another registration is not overwritten.
        accounts = readAccounts();
        if (accounts.some((entry) => entry.email === email)) { showError('이미 가입한 이메일이에요. 로그인해 주세요.'); return; }
        account = { id: crypto.randomUUID(), nickname, email, salt, hash };
        localStorage.setItem(accountsKey, JSON.stringify([...accounts, account]));
      } else if (!account || await passwordHash(password, account.salt) !== account.hash) {
        showError('이메일 또는 비밀번호를 확인해 주세요.');
        return;
      }
      sessionStorage.setItem(sessionKey, account.id);
      currentUser = { id: account.id, nickname: account.nickname, email: account.email };
      const callback = afterLogin;
      afterLogin = null;
      dialog.close();
      renderAccount();
      window.dispatchEvent(new Event('dineary:auth-change'));
      if (callback) callback();
    } catch {
      showError('계정을 저장하거나 불러오지 못했어요. 브라우저 저장 설정을 확인하고 다시 시도해 주세요.');
    } finally {
      busy = false;
      for (const id of ['auth-submit', 'auth-switch', 'close-auth']) document.getElementById(id).disabled = false;
      document.querySelector('#auth-submit').textContent = mode === 'signup' ? '가입하고 시작하기' : '로그인';
    }
  });

  document.querySelector('#auth-switch').addEventListener('click', () => { setMode(mode === 'login' ? 'signup' : 'login'); (mode === 'signup' ? fields.nickname : fields.email).focus(); });
  document.querySelector('#close-auth').addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', (event) => { if (busy) event.preventDefault(); });
  dialog.addEventListener('close', () => { form.reset(); showError(''); afterLogin = null; });
  window.DinearyAuth = { get user() { return currentUser; }, open };
  renderAccount();
})();
