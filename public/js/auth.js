(async function () {
  await ATP.ready;
  if (ATP.user) { location.replace('/cuenta'); return; }

  const tabs = document.querySelectorAll('.tabs button');
  const forms = { login: document.getElementById('form-login'), register: document.getElementById('form-register') };
  const msg = document.getElementById('msg');
  const next = new URLSearchParams(location.search).get('next');
  // Solo se permiten rutas internas para evitar redirecciones a sitios externos
  const dest = next && /^\/[a-z0-9\-_/]*$/i.test(next) ? next : '/cuenta';

  function show(which) {
    tabs.forEach((t) => { const on = t.dataset.tab === which; t.classList.toggle('on', on); t.setAttribute('aria-selected', on); });
    forms.login.hidden = which !== 'login';
    forms.register.hidden = which !== 'register';
    msg.hidden = true;
  }
  tabs.forEach((t) => t.addEventListener('click', () => show(t.dataset.tab)));
  if (location.hash === '#registro') show('register');

  function bind(form, path, build) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type=submit]');
      btn.disabled = true; msg.hidden = true;
      try {
        await ATP.api(path, { method: 'POST', body: build(new FormData(form)) });
        location.href = dest;
      } catch (err) {
        msg.textContent = err.message; msg.className = 'msg error'; msg.hidden = false;
        btn.disabled = false;
      }
    });
  }
  bind(forms.login, '/auth/login', (d) => ({ email: d.get('email'), password: d.get('password') }));
  bind(forms.register, '/auth/register', (d) => {
    if (d.get('password') !== d.get('password2')) throw new Error('Las contraseñas no coinciden.');
    return { name: d.get('name'), email: d.get('email'), password: d.get('password') };
  });
})();
