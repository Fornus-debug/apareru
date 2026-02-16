(function () {
  "use strict";

  // --- UI Elements Interface ---
  const UI = {
    header: document.querySelector('.site-header'),
    cartBtn: document.getElementById('cart-toggle'),
    minicart: document.getElementById('minicart'),
    minicartItems: document.getElementById('minicart-items'),
    minicartFooter: document.getElementById('minicart-footer'),
    minicartTotal: document.getElementById('minicart-total'),
    cartBadge: document.getElementById('cartBadgeCount'),
    hamburger: document.querySelector('.hamburger'),
    drawer: document.getElementById('mobile-drawer'),
    drawerClose: document.querySelector('.drawer-close'),
    overlay: document.querySelector('.overlay'),
    toast: document.getElementById('toast'),
    addCartBtns: document.querySelectorAll('.add-cart')
  };

  // --- Data Management ---
  let cart = JSON.parse(localStorage.getItem('fornus_cart') || '[]');
  let favs = JSON.parse(localStorage.getItem('fornus_favs') || '[]'); // お気に入りデータ

  const saveCart = () => localStorage.setItem('fornus_cart', JSON.stringify(cart));
  const saveFavs = () => localStorage.setItem('fornus_favs', JSON.stringify(favs));

  const updateCartUI = () => {
    if (!UI.minicartItems) return;

    if (cart.length === 0) {
      UI.minicartItems.innerHTML = `
        <div style="text-align:center; padding: 40px 0;">
          <p style="font-size:13px; color:#666;">カートは空です</p>
          <a href="plp.html" style="text-decoration:underline; font-size:12px; margin-top:12px; display:inline-block; opacity:0.8;">新作をチェック</a>
        </div>
      `;
      if (UI.minicartFooter) UI.minicartFooter.style.display = 'none';
      if (UI.cartBadge) UI.cartBadge.textContent = '0';
    } else {
      let html = '';
      let total = 0;
      let totalQty = 0;
      cart.forEach((item) => {
        html += `
          <div class="cart-item">
            <img src="${item.image}" class="cart-item-img" alt="${item.name}" onerror="this.src='images/placeholder.png'">
            <div class="cart-item-info">
              <div class="cart-item-name">${item.name}</div>
              <div class="cart-item-price">¥${item.price.toLocaleString()} × ${item.qty}</div>
            </div>
          </div>
        `;
        total += item.price * item.qty;
        totalQty += item.qty;
      });
      UI.minicartItems.innerHTML = html;
      if (UI.minicartFooter) UI.minicartFooter.style.display = 'block';
      if (UI.minicartTotal) UI.minicartTotal.textContent = `¥${total.toLocaleString()}`;
      if (UI.cartBadge) UI.cartBadge.textContent = String(totalQty);
    }
    saveCart();
  };

  const updateFavUI = () => {
    const favCountEl = document.querySelector('.fav-count');
    if (favCountEl) {
      favCountEl.textContent = String(favs.length);
    }

    // 全てのお気に入りボタン（カードおよび詳細ページ）の見た目を同期
    document.querySelectorAll('.card-fav, .fav-btn-pdp').forEach(btn => {
      const id = btn.dataset.id;
      if (favs.includes(id)) {
        btn.classList.add('active');
        const svg = btn.querySelector('svg');
        if (svg) svg.setAttribute('fill', 'currentColor');
      } else {
        btn.classList.remove('active');
        const svg = btn.querySelector('svg');
        if (svg) svg.setAttribute('fill', 'none');
      }
    });
    saveFavs();
  };

  // --- Actions ---
  let isToggling = false;
  const toggleLock = (ms = 200) => {
    isToggling = true;
    setTimeout(() => { isToggling = false; }, ms);
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.qty += product.qty || 1;
    } else {
      cart.push({ ...product, qty: product.qty || 1 });
    }
    updateCartUI();
    toggleMinicart(true);
    showToast(`${product.name} をカートに追加しました`);
  };

  const toggleFavorite = (productId, productName) => {
    const index = favs.indexOf(productId);
    if (index > -1) {
      favs.splice(index, 1);
      showToast(`${productName || 'アイテム'} をお気に入りから削除しました`);
    } else {
      favs.push(productId);
      showToast(`${productName || 'アイテム'} をお気に入りに追加しました`);
    }
    updateFavUI();
  };

  const toggleMinicart = (forceState) => {
    if (!UI.minicart || !UI.cartBtn || isToggling) return;
    const isOpening = typeof forceState === 'boolean' ? forceState : !UI.minicart.classList.contains('active');

    if (!forceState) toggleLock();

    UI.minicart.classList.toggle('active', isOpening);
    UI.cartBtn.setAttribute('aria-expanded', String(isOpening));

    if (isOpening) {
      toggleDrawer(false);
      UI.overlay?.classList.add('active');
    } else {
      if (!UI.drawer || UI.drawer.getAttribute('aria-hidden') === 'true') {
        UI.overlay?.classList.remove('active');
      }
    }
  };

  const toggleDrawer = (forceState) => {
    if (!UI.drawer || isToggling) return;
    const isOpening = typeof forceState === 'boolean' ? forceState : UI.drawer.getAttribute('aria-hidden') === 'true';

    if (isOpening) toggleLock();

    UI.drawer.setAttribute('aria-hidden', String(!isOpening));
    UI.overlay?.classList.toggle('active', isOpening);
    document.body.classList.toggle('no-scroll', isOpening);

    if (UI.hamburger) UI.hamburger.setAttribute('aria-expanded', String(isOpening));
    if (isOpening) toggleMinicart(false);
  };

  const showToast = (msg) => {
    if (!UI.toast) return;
    UI.toast.textContent = msg;
    UI.toast.classList.add('show');
    clearTimeout(UI.toast._timer);
    UI.toast._timer = setTimeout(() => UI.toast.classList.remove('show'), 2500);
  };

  // --- Exposed API (for Console Testing) ---
  window.FornusCart = {
    add: (p) => {
      addToCart({
        id: p.id || String(Date.now()),
        name: p.name || 'Mode Item',
        price: p.price || 12000,
        image: p.image || 'images/products/tailored-shirt.png'
      });
    },
    remove: (id) => {
      cart = cart.filter(item => item.id !== id);
      updateCartUI();
    },
    clear: () => {
      cart = [];
      updateCartUI();
      showToast('カートを空にしました');
    }
  };

  window.FornusFavs = {
    toggle: (id, name) => toggleFavorite(id, name),
    clear: () => {
      favs = [];
      updateFavUI();
    }
  };

  // --- Listeners ---
  document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    updateFavUI();

    // Minicart toggle
    UI.cartBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMinicart();
    });

    // Drawer toggle
    UI.hamburger?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDrawer(true);
    });

    UI.drawerClose?.addEventListener('click', () => toggleDrawer(false));
    UI.overlay?.addEventListener('click', () => {
      toggleMinicart(false);
      toggleDrawer(false);
    });

    // ESC close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        toggleMinicart(false);
        toggleDrawer(false);
        UI.toast?.classList.remove('show');
      }
    });

    // Scroll effect
    window.addEventListener('scroll', () => {
      if (window.scrollY > 80) {
        UI.header?.classList.add('scrolled');
      } else {
        UI.header?.classList.remove('scrolled');
      }
    });

    // Image fallback (Infinite loop guard)
    document.querySelectorAll('img').forEach(img => {
      img.onerror = function () {
        this.onerror = null;
        if (!this.src.includes('images/placeholder.png')) {
          this.src = 'images/placeholder.png';
        }
      };
    });

    // PDP Quantity Stepper (if exists)
    document.querySelectorAll('.qty-btn').forEach(btn => btn.addEventListener('click', () => {
      const input = document.querySelector('.qty-input');
      if (!input) return;
      const step = parseInt(btn.dataset.step) || 0;
      let val = (parseInt(input.value) || 1) + step;
      if (val < 1) val = 1;
      input.value = val;
    }));

    // お気に入りボタンのクリックイベント（委譲または全スキャン）
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.card-fav, .fav-btn-pdp');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.dataset.id;
        const name = btn.dataset.name || 'アイテム';
        toggleFavorite(id, name);
      }
    });

    // URL Parameter based Navigation Highlighting (Gold Glow)
    const urlParams = new URLSearchParams(window.location.search);
    const currentCat = urlParams.get('cat');
    if (currentCat) {
      document.querySelectorAll('.nav-desktop a, .drawer-nav a').forEach(link => {
        if (link.getAttribute('href').includes(`cat=${currentCat}`)) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    } else if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
      // TOPページの場合は全ナビのアクティブを外す（または特定の設定に）
      document.querySelectorAll('.nav-desktop a, .drawer-nav a').forEach(link => link.classList.remove('active'));
    }
  });

})();
