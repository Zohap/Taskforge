document.addEventListener('DOMContentLoaded', () => {
  // Theme toggle (dark/light)
  const themeToggle = document.getElementById('themeToggle');
  const iconDark = document.getElementById('themeIconDark');
  const iconLight = document.getElementById('themeIconLight');

  function syncThemeIcon() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (iconDark && iconLight) {
      iconDark.classList.toggle('d-none', isDark);
      iconLight.classList.toggle('d-none', !isDark);
    }
  }
  syncThemeIcon();

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('taskforge-theme', next);
      syncThemeIcon();
    });
  }

  // Mobile sidebar toggle
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');

  if (toggle && sidebar && backdrop) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('show');
      backdrop.classList.toggle('show');
    });
    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('show');
      backdrop.classList.remove('show');
    });
  }

  // Confirm before destructive actions (delete forms/buttons)
  document.querySelectorAll('[data-confirm]').forEach((el) => {
    el.addEventListener('submit', (e) => {
      const msg = el.getAttribute('data-confirm') || 'Are you sure?';
      if (!window.confirm(msg)) e.preventDefault();
    });
  });

  // Auto-submit filter forms on select change
  document.querySelectorAll('[data-auto-submit]').forEach((el) => {
    el.addEventListener('change', () => el.closest('form').submit());
  });

  // Auto-dismiss flash alerts after 5s
  document.querySelectorAll('.alert').forEach((alert) => {
    setTimeout(() => {
      const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
      if (bsAlert) bsAlert.close();
    }, 6000);
  });
});
document.querySelectorAll(".progress-fill").forEach(bar => {
    bar.style.width = bar.dataset.width + "%";
});