const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

document.documentElement.classList.add("js-ready");

const body = document.body;
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = body.classList.toggle("nav-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
  });

  nav.addEventListener("click", (event) => {
    if (event.target.matches("a")) {
      body.classList.remove("nav-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Открыть меню");
    }
  });
}

const reveals = document.querySelectorAll("[data-reveal]");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.14 }
  );

  reveals.forEach((item) => revealObserver.observe(item));
} else {
  reveals.forEach((item) => item.classList.add("is-visible"));
}

const counters = document.querySelectorAll("[data-count]");

const animateCounter = (node) => {
  const target = Number(node.dataset.count || 0);
  if (reducedMotion) {
    node.textContent = target;
    return;
  }
  const start = performance.now();
  const duration = 900;

  const tick = (now) => {
    const progress = clamp((now - start) / duration);
    const value = Math.round(target * (1 - Math.pow(1 - progress, 3)));
    node.textContent = value;
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
};

if ("IntersectionObserver" in window) {
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.4 }
  );

  counters.forEach((counter) => counterObserver.observe(counter));
} else {
  counters.forEach(animateCounter);
}

const brandButtons = document.querySelectorAll("[data-brand-filter]");
const brandCards = document.querySelectorAll("[data-brand]");

brandButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.brandFilter;
    brandButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });
    brandCards.forEach((card) => {
      const tags = (card.dataset.brand || "").split(" ");
      card.classList.toggle("is-hidden", filter !== "all" && !tags.includes(filter));
    });
  });
});

const stackSection = document.querySelector("[data-stack-section]");
const stackSteps = Array.from(document.querySelectorAll("[data-stack-steps] article"));

const updateCompanyStack = () => {
  if (!stackSection || !stackSteps.length) return;
  const rect = stackSection.getBoundingClientRect();
  const scrollable = Math.max(1, rect.height - window.innerHeight);
  const progress = clamp(-rect.top / scrollable);
  document.documentElement.style.setProperty("--stack-progress", progress.toFixed(3));
  const index = Math.min(stackSteps.length - 1, Math.floor(progress * stackSteps.length));
  stackSteps.forEach((step, stepIndex) => step.classList.toggle("is-active", stepIndex === index));
};

window.addEventListener("scroll", updateCompanyStack, { passive: true });
window.addEventListener("resize", updateCompanyStack);
updateCompanyStack();

const updateBottomGlow = () => {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  body.classList.toggle("is-at-bottom", maxScroll > 0 && window.scrollY >= maxScroll - 16);
};

window.addEventListener("scroll", updateBottomGlow, { passive: true });
window.addEventListener("resize", updateBottomGlow);
updateBottomGlow();

const forms = document.querySelectorAll("[data-contact-form]");

forms.forEach((form) => {
  form.addEventListener("submit", (event) => {
    if (!form.reportValidity()) return;
    event.preventDefault();
    const note = form.querySelector("[data-form-note]");
    const type = new FormData(form).get("type") || "обращение";
    if (!note) return;
    note.classList.add("is-success");
    note.textContent = `Заявка "${type}" сформирована. После подключения рабочего обработчика форма будет отправлять обращения в коммерческий контур; срочный контакт: +7 (499) 277-15-77.`;
  });
});

document.querySelectorAll("[data-copy-link]").forEach((button) => {
  button.addEventListener("click", async () => {
    const note = button.parentElement?.querySelector("[data-copy-note]");
    if (note) note.textContent = "Ссылка скопирована.";
    const card = button.closest("[data-feed-item]");
    const target =
      card?.querySelector("h2 a[href]")?.href ||
      card?.querySelector(".post-media[href], .feed-card-media[href]")?.href ||
      card?.querySelector("a[href]")?.href ||
      window.location.href;
    try {
      await navigator.clipboard.writeText(target);
    } catch {
      if (note) note.textContent = target;
    }
  });
});

document.querySelectorAll("[data-post-expand]").forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest("[data-feed-item]");
    if (!card) return;
    const isExpanded = card.classList.toggle("is-expanded");
    button.textContent = isExpanded ? "Свернуть" : "Показать полностью";
  });
});

const getStoredJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "") || fallback;
  } catch {
    return fallback;
  }
};

document.querySelectorAll(".post-vote").forEach((vote, voteIndex) => {
  const score = vote.querySelector("strong");
  const buttons = Array.from(vote.querySelectorAll("button"));
  if (!score || buttons.length < 2) return;
  const storageKey = `agVote:${vote.closest("[data-feed-item]")?.querySelector("h2")?.textContent?.trim() || voteIndex}`;
  const initial = Number(score.textContent.trim()) || 0;
  let state = getStoredJson(storageKey, { value: initial, direction: 0 });

  const render = () => {
    score.textContent = state.value;
    vote.classList.toggle("has-voted", state.direction !== 0);
    buttons[0].classList.toggle("is-active", state.direction === 1);
    buttons[1].classList.toggle("is-active", state.direction === -1);
    buttons[0].setAttribute("aria-pressed", String(state.direction === 1));
    buttons[1].setAttribute("aria-pressed", String(state.direction === -1));
  };

  const setDirection = (direction) => {
    const nextDirection = state.direction === direction ? 0 : direction;
    state.value += nextDirection - state.direction;
    state.direction = nextDirection;
    localStorage.setItem(storageKey, JSON.stringify(state));
    render();
  };

  buttons[0].addEventListener("click", () => setDirection(1));
  buttons[1].addEventListener("click", () => setDirection(-1));
  render();
});

document.querySelectorAll(".post-reactions button").forEach((button, reactionIndex) => {
  const cardTitle = button.closest("[data-feed-item]")?.querySelector("h2")?.textContent?.trim() || "post";
  const storageKey = `agReaction:${cardTitle}:${reactionIndex}`;
  const original = button.textContent.trim();
  const match = original.match(/^(.*?)(\d+)?$/);
  const label = (match?.[1] || original).trim();
  const initialCount = Number(match?.[2] || 0);
  let active = localStorage.getItem(storageKey) === "1";
  let count = initialCount + (active ? 1 : 0);

  const render = () => {
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
    button.textContent = initialCount ? `${label} ${count}` : label;
  };

  button.addEventListener("click", () => {
    active = !active;
    count += active ? 1 : -1;
    localStorage.setItem(storageKey, active ? "1" : "0");
    render();
  });
  render();
});

document.querySelectorAll("[data-user-login]").forEach((form) => {
  const loginInput = form.querySelector('input[type="text"]');
  const passwordInput = form.querySelector('input[type="password"]');
  const status = form.querySelector("[data-user-login-status]");
  const submit = form.querySelector('button[type="submit"]');
  const storageKey = "agPublicUser";

  const render = () => {
    const user = localStorage.getItem(storageKey);
    form.classList.toggle("is-authorized", Boolean(user));
    if (status) {
      status.textContent = user
        ? `Вы вошли как ${user}. Сохраненные материалы и реакции активны.`
        : "Обычный профиль для сохраненных материалов и персональной ленты.";
    }
    if (submit) submit.textContent = user ? "Выйти" : "Войти";
    if (loginInput) loginInput.disabled = Boolean(user);
    if (passwordInput) passwordInput.disabled = Boolean(user);
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const currentUser = localStorage.getItem(storageKey);
    if (currentUser) {
      localStorage.removeItem(storageKey);
      if (loginInput) loginInput.value = "";
      if (passwordInput) passwordInput.value = "";
      render();
      return;
    }
    const login = loginInput?.value.trim();
    if (!login) {
      if (status) status.textContent = "Введите логин.";
      loginInput?.focus();
      return;
    }
    localStorage.setItem(storageKey, login);
    render();
  });

  render();
});

document.querySelectorAll("[data-print]").forEach((button) => {
  button.addEventListener("click", () => window.print());
});

document.querySelectorAll("[data-feed-filters]").forEach((filterWrap) => {
  const buttons = Array.from(filterWrap.querySelectorAll("[data-feed-filter]"));
  const items = Array.from(document.querySelectorAll("[data-feed-item]"));
  if (!buttons.length || !items.length) return;

  const setFilter = (filter) => {
    buttons.forEach((button) => {
      const isActive = button.dataset.feedFilter === filter;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    items.forEach((item) => {
      const types = (item.dataset.feedType || "").split(/\s+/);
      item.classList.toggle("is-hidden", filter !== "all" && !types.includes(filter));
    });
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => setFilter(button.dataset.feedFilter || "all"));
  });
});

document.querySelectorAll("[data-feed-carousel]").forEach((carousel) => {
  const slides = Array.from(carousel.querySelectorAll("[data-feed-slide]"));
  const dotsWrap = carousel.querySelector("[data-feed-carousel-dots]");
  const prev = carousel.querySelector("[data-feed-carousel-prev]");
  const next = carousel.querySelector("[data-feed-carousel-next]");
  let index = slides.findIndex((slide) => slide.classList.contains("is-active"));
  if (index < 0) index = 0;

  const dots = slides.map((_, dotIndex) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Показать баннер ${dotIndex + 1}`);
    dot.addEventListener("click", () => setSlide(dotIndex));
    dotsWrap?.append(dot);
    return dot;
  });

  const setSlide = (nextIndex) => {
    index = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === index);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === index);
      dot.setAttribute("aria-current", dotIndex === index ? "true" : "false");
    });
  };

  prev?.addEventListener("click", () => setSlide(index - 1));
  next?.addEventListener("click", () => setSlide(index + 1));
  setSlide(index);

  if (!reducedMotion && slides.length > 1) {
    let timer = window.setInterval(() => setSlide(index + 1), 6200);
    carousel.addEventListener("pointerenter", () => window.clearInterval(timer));
    carousel.addEventListener("pointerleave", () => {
      timer = window.setInterval(() => setSlide(index + 1), 6200);
    });
  }
});

document.querySelectorAll("[data-news-carousel]").forEach((carousel) => {
  const slides = Array.from(carousel.querySelectorAll(".spotlight-slide"));
  const dotsWrap = carousel.querySelector("[data-carousel-dots]");
  const prev = carousel.querySelector("[data-carousel-prev]");
  const next = carousel.querySelector("[data-carousel-next]");
  let index = slides.findIndex((slide) => slide.classList.contains("is-active"));
  if (index < 0) index = 0;

  const dots = slides.map((_, dotIndex) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Показать материал ${dotIndex + 1}`);
    dot.addEventListener("click", () => setSlide(dotIndex));
    dotsWrap?.append(dot);
    return dot;
  });

  const setSlide = (nextIndex) => {
    index = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === index);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === index);
      dot.setAttribute("aria-current", dotIndex === index ? "true" : "false");
    });
  };

  prev?.addEventListener("click", () => setSlide(index - 1));
  next?.addEventListener("click", () => setSlide(index + 1));
  setSlide(index);

  if (!reducedMotion && slides.length > 1) {
    let timer = window.setInterval(() => setSlide(index + 1), 6500);
    carousel.addEventListener("pointerenter", () => window.clearInterval(timer));
    carousel.addEventListener("pointerleave", () => {
      timer = window.setInterval(() => setSlide(index + 1), 6500);
    });
  }
});

document.querySelectorAll("[data-auth-form]").forEach((form) => {
  const shell = document.querySelector("[data-portal-shell]");
  const greeting = document.querySelector("[data-portal-greeting]");
  const roleButtons = Array.from(form.querySelectorAll("[data-role-choice]"));
  let role = "partner";

  roleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      role = button.dataset.roleChoice || "partner";
      roleButtons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      });
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = new FormData(form).get("email") || "user@alleya-group.ru";
    const roleLabel = role === "manager" ? "менеджера" : "B2B-партнера";
    const roleDataset = role === "manager" ? "managerText" : "partnerText";
    shell?.classList.remove("is-locked");
    if (greeting) {
      greeting.textContent = `Вход выполнен для ${roleLabel}: ${email}. Ниже доступны акции, отгрузки, прайсы и новости закрытого контура.`;
    }
    document.querySelectorAll("[data-role-title], [data-role-text]").forEach((node) => {
      if (node.dataset[roleDataset]) node.textContent = node.dataset[roleDataset];
    });
    shell?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  });
});

document.querySelectorAll("[data-logout]").forEach((button) => {
  button.addEventListener("click", () => {
    const shell = document.querySelector("[data-portal-shell]");
    shell?.classList.add("is-locked");
    document.querySelector("[data-auth-form]")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  });
});

document.querySelectorAll("[data-atmosphere]").forEach((canvas) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const points = [];
  const count = 52;

  const resize = () => {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    points.length = 0;
    for (let i = 0; i < count; i += 1) {
      points.push({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.5 + 0.7
      });
    }
  };

  const draw = () => {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    points.forEach((point, index) => {
      point.x += point.vx;
      point.y += point.vy;
      if (point.x < 0 || point.x > rect.width) point.vx *= -1;
      if (point.y < 0 || point.y > rect.height) point.vy *= -1;

      ctx.beginPath();
      ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.36)";
      ctx.fill();

      for (let otherIndex = index + 1; otherIndex < points.length; otherIndex += 1) {
        const other = points[otherIndex];
        const distance = Math.hypot(point.x - other.x, point.y - other.y);
        if (distance < 150) {
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `rgba(0,166,200,${0.13 * (1 - distance / 150)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    });

    if (!reducedMotion) requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener("resize", resize);
  draw();
});
