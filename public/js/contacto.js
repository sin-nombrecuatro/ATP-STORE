(async function () {
  await ATP.ready;
  const form = document.getElementById('contact-form');
  const msg = document.getElementById('msg');
  if (ATP.user) { form.elements.name.value = ATP.user.name; form.elements.email.value = ATP.user.email; }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const btn = form.querySelector('button[type=submit]'); btn.disabled = true;
    try {
      await ATP.api('/contact', { method: 'POST', body: { name: d.get('name'), email: d.get('email'), message: d.get('message') } });
      msg.textContent = '¡Mensaje enviado! Te responderemos pronto.'; msg.className = 'msg ok';
      form.elements.message.value = '';
    } catch (err) { msg.textContent = err.message; msg.className = 'msg error'; }
    msg.hidden = false; btn.disabled = false;
  });
})();
