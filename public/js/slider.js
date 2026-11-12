/* Slider de portada (versión mejorada del slider original: bucle, puntos, autoplay y swipe) */
(function () {
  const slides = [
    { img: '/img/modelo-1.jpg', pos: 'center 4%', title: 'Verano con color', text: 'Kimonos, denim y accesorios para los días de sol.', link: '/productos?category=Mujer', cta: 'Ver colección mujer' },
    { img: '/img/modelo-2.jpg', pos: 'center 8%', title: 'Elegancia diaria', text: 'Blusas y jeans que van de la oficina a la cena.', link: '/productos?q=blusa', cta: 'Ver blusas' },
    { img: '/img/modelo-3.jpg', pos: 'center 18%', title: 'Comodidad en turquesa', text: 'Tejidos suaves y tonos que hacen la diferencia.', link: '/productos?q=sueter', cta: 'Ver suéteres' }
  ];
  const root = document.getElementById('slider_items');
  if (!root) return;

  const track = root.querySelector('.slides');
  const dots = root.querySelector('.dots');
  let index = 0, timer;

  slides.forEach((s, i) => {
    const el = document.createElement('div');
    el.className = 'slide';
    el.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
    const img = document.createElement('img');
    img.src = s.img; img.alt = s.title; img.style.objectPosition = s.pos;
    if (i > 0) img.loading = 'lazy';
    const txt = document.createElement('div');
    txt.className = 'slide-text';
    const h = document.createElement('h2'); h.textContent = s.title;
    const p = document.createElement('p'); p.textContent = s.text;
    const a = document.createElement('a'); a.className = 'btn'; a.href = s.link; a.textContent = s.cta;
    txt.append(h, p, a);
    el.append(img, txt);
    track.appendChild(el);

    const d = document.createElement('button');
    d.type = 'button'; d.setAttribute('aria-label', 'Ir a la imagen ' + (i + 1));
    d.addEventListener('click', () => { go(i); restart(); });
    dots.appendChild(d);
  });

  function go(i) {
    index = (i + slides.length) % slides.length; // bucle en ambos sentidos
    track.style.transform = `translateX(-${index * 100}%)`;
    [...track.children].forEach((s, k) => s.setAttribute('aria-hidden', k === index ? 'false' : 'true'));
    [...dots.children].forEach((d, k) => d.classList.toggle('on', k === index));
  }
  const restart = () => { clearInterval(timer); if (!matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(() => go(index + 1), 5500); };

  root.querySelector('.prev').addEventListener('click', () => { go(index - 1); restart(); });
  root.querySelector('.next').addEventListener('click', () => { go(index + 1); restart(); });
  root.addEventListener('mouseenter', () => clearInterval(timer));
  root.addEventListener('mouseleave', restart);

  let x0 = null;
  root.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  root.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 45) { go(index + (dx < 0 ? 1 : -1)); restart(); }
    x0 = null;
  });

  go(0); restart();
})();
