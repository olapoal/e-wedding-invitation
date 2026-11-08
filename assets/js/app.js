// assets/js/app.js
// Logika Inti Generator E-Wedding Invitation, Sinkronisasi Live Preview, Lisensi Lynk.id & Token Trakteer

class WeddingApp {
    constructor() {
        this.currentData = null;
        this.currentUser = {
            email: localStorage.getItem('wedding_user_email') || '',
            tokens: parseInt(localStorage.getItem('wedding_user_tokens') || '0', 10),
            name: localStorage.getItem('wedding_user_name') || '',
            orderId: localStorage.getItem('wedding_user_order_id') || '',
            isLoggedIn: false
        };
        this.previewFrame = null;
        this.previewMode = 'mobile'; // 'mobile' | 'desktop'
        this.demoTimer = null;
        this.demoEndTime = null;
        this.isDemoMode = false;

        // WhatsApp Automation & Guest Manager State
        this.guestList = JSON.parse(localStorage.getItem('wedding_guests_list') || '[]');
        this.waTemplate = localStorage.getItem('wedding_wa_template') || this.getDefaultWaTemplate('formal');

        this.init();
    }

    async init() {
        this.previewFrame = document.getElementById('previewIframe');
        this.loadSavedData();
        this.bindEvents();
        this.renderThemeCards();
        this.populateForm();
        this.checkAuthStatus();
        this.initWaSystem();
        this.syncToPreview();
    }

    // 1. Data Initialization & Storage
    loadSavedData() {
        const saved = localStorage.getItem('wedding_draft_data');
        if (saved) {
            try {
                this.currentData = JSON.parse(saved);
            } catch (e) {
                this.currentData = JSON.parse(JSON.stringify(WEDDING_PRESETS["theme-emerald"]));
            }
        } else {
            this.currentData = JSON.parse(JSON.stringify(WEDDING_PRESETS["theme-emerald"]));
        }
    }

    saveDraft() {
        localStorage.setItem('wedding_draft_data', JSON.stringify(this.currentData));
        this.showToast('Draft berhasil disimpan!');
    }

    // 2. Authentication & Lynk.id Gate
    async checkAuthStatus() {
        const storedEmail = localStorage.getItem('wedding_user_email');
        // Jika pembeli resmi (bukan akun demo)
        if (storedEmail && storedEmail !== 'demo.pengantin@gmail.com') {
            try {
                const res = await fetch('/api/verify-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: storedEmail })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.valid) {
                        this.setUserSession(data.email, data.tokens, data.name, data.orderId);
                        this.hideLockScreen();
                        return;
                    }
                }
            } catch (e) {
                console.warn("Offline or verify API notice, using local cache:", e);
                if (this.currentUser.email && this.currentUser.email !== 'demo.pengantin@gmail.com') {
                    this.setUserSession(this.currentUser.email, this.currentUser.tokens, this.currentUser.name, this.currentUser.orderId);
                    this.hideLockScreen();
                    return;
                }
            }
        }

        // Cek apakah ada sesi Demo 2 Menit yang sedang berjalan
        const isDemoActive = sessionStorage.getItem('wedding_demo_active') === 'true';
        const demoEndTime = parseInt(sessionStorage.getItem('wedding_demo_end_time') || '0', 10);
        const remainingMs = demoEndTime - Date.now();

        if (isDemoActive && remainingMs > 0) {
            this.resumeDemoMode(demoEndTime);
            this.hideLockScreen();
            return;
        } else if (sessionStorage.getItem('wedding_demo_expired') === 'true' || (demoEndTime > 0 && remainingMs <= 0)) {
            this.onDemoExpired(true);
            return;
        }

        // Tampilkan Lock Screen jika belum login
        this.showLockScreen();
    }

    setUserSession(email, tokens, name, orderId) {
        // Hentikan timer demo jika ada
        if (this.demoTimer) {
            clearInterval(this.demoTimer);
            this.demoTimer = null;
        }
        this.isDemoMode = false;
        sessionStorage.removeItem('wedding_demo_active');
        sessionStorage.removeItem('wedding_demo_end_time');
        sessionStorage.removeItem('wedding_demo_expired');

        const demoPill = document.getElementById('demoCountdownPill');
        if (demoPill) demoPill.style.display = 'none';

        const expiredNotice = document.getElementById('demoExpiredNotice');
        if (expiredNotice) expiredNotice.style.display = 'none';

        this.currentUser = {
            email: email,
            tokens: typeof tokens === 'number' ? tokens : 1,
            name: name || email,
            orderId: orderId || '-',
            isLoggedIn: true
        };

        localStorage.setItem('wedding_user_email', this.currentUser.email);
        localStorage.setItem('wedding_user_tokens', this.currentUser.tokens);
        localStorage.setItem('wedding_user_name', this.currentUser.name);
        localStorage.setItem('wedding_user_order_id', this.currentUser.orderId);

        // Update UI Badges
        const licenseBadge = document.getElementById('userLicenseBadge');
        const licenseText = document.getElementById('userLicenseEmailText');
        if (licenseBadge) {
            if (licenseText) {
                licenseText.textContent = `Lisensi: ${this.currentUser.email}`;
            } else {
                licenseBadge.textContent = `● Lisensi: ${this.currentUser.email}`;
            }
            licenseBadge.style.display = 'inline-flex';
        }

        this.updateTokenUI();
    }

    updateTokenUI() {
        const tokenBadge = document.getElementById('tokenCountText');
        if (tokenBadge) {
            if (this.isDemoMode) {
                tokenBadge.textContent = '0 Token (Demo)';
            } else {
                tokenBadge.textContent = `${this.currentUser.tokens} Token`;
            }
        }
    }

    showLockScreen() {
        const modal = document.getElementById('lockScreenModal');
        if (modal) modal.classList.add('active');
    }

    hideLockScreen() {
        const modal = document.getElementById('lockScreenModal');
        if (modal) modal.classList.remove('active');
    }

    async handleVerifyEmail(emailInput) {
        const email = emailInput.trim().toLowerCase();
        if (!email || !email.includes('@')) {
            alert('Silakan masukkan format email yang valid.');
            return;
        }

        const btn = document.getElementById('btnSubmitVerifyEmail');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Memverifikasi...';
        }

        try {
            const res = await fetch('/api/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();
            if (data.valid) {
                this.setUserSession(data.email, data.tokens, data.name, data.orderId);
                this.hideLockScreen();
                this.showToast(`Selamat datang, ${data.name}! Akses aplikasi terbuka.`);
            } else {
                alert(data.message || 'Email belum terdaftar di Lynk.id. Pastikan Anda telah menyelesaikan pembayaran di https://lynk.id/olapoal.');
            }
        } catch (err) {
            console.warn("Verify error, fallback:", err);
            alert('Gagal menghubungi server lisensi. Jika sedang menguji coba secara offline, gunakan tombol "Coba Mode Demo (2 Menit)" di bawah.');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Buka Akses Aplikasi';
            }
        }
    }

    // ========================================================
    // MODE DEMO 2 MENIT DENGAN LIVE COUNTDOWN TIMER
    // ========================================================
    startDemoMode(durationSeconds = 120) {
        this.isDemoMode = true;
        this.demoEndTime = Date.now() + (durationSeconds * 1000);

        sessionStorage.setItem('wedding_demo_active', 'true');
        sessionStorage.setItem('wedding_demo_end_time', String(this.demoEndTime));
        sessionStorage.removeItem('wedding_demo_expired');

        // Mode demo 2 menit dengan 0 token
        this.currentUser = {
            email: 'demo.pengantin@gmail.com',
            tokens: 0,
            name: 'Demo Pengantin',
            orderId: 'DEMO-2MIN',
            isLoggedIn: true
        };

        // UI Updates
        const licenseBadge = document.getElementById('userLicenseBadge');
        if (licenseBadge) licenseBadge.style.display = 'none';

        const expiredNotice = document.getElementById('demoExpiredNotice');
        if (expiredNotice) expiredNotice.style.display = 'none';

        this.updateTokenUI();
        this.hideLockScreen();

        // Mulai live countdown
        this.tickDemoCountdown();
        if (this.demoTimer) clearInterval(this.demoTimer);
        this.demoTimer = setInterval(() => this.tickDemoCountdown(), 1000);

        this.showToast('⏱️ Mode Demo 2 Menit Dimulai! Timer countdown berjalan di navbar atas.');
    }

    resumeDemoMode(demoEndTime) {
        this.isDemoMode = true;
        this.demoEndTime = demoEndTime;

        this.currentUser = {
            email: 'demo.pengantin@gmail.com',
            tokens: 0,
            name: 'Demo Pengantin',
            orderId: 'DEMO-2MIN',
            isLoggedIn: true
        };

        const licenseBadge = document.getElementById('userLicenseBadge');
        if (licenseBadge) licenseBadge.style.display = 'none';

        this.updateTokenUI();

        this.tickDemoCountdown();
        if (this.demoTimer) clearInterval(this.demoTimer);
        this.demoTimer = setInterval(() => this.tickDemoCountdown(), 1000);
    }

    tickDemoCountdown() {
        const remainingMs = this.demoEndTime - Date.now();
        const countdownPill = document.getElementById('demoCountdownPill');
        const timeDisplay = document.getElementById('demoCountdownTime');

        if (remainingMs <= 0) {
            this.onDemoExpired();
            return;
        }

        const totalSec = Math.ceil(remainingMs / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        if (timeDisplay) timeDisplay.textContent = timeStr;
        if (countdownPill) {
            countdownPill.style.display = 'inline-flex';
            // Efek berkedip merah jika tersisa 30 detik atau kurang
            if (totalSec <= 30) {
                countdownPill.classList.add('critical');
            } else {
                countdownPill.classList.remove('critical');
            }
        }
    }

    onDemoExpired(silent = false) {
        if (this.demoTimer) {
            clearInterval(this.demoTimer);
            this.demoTimer = null;
        }

        sessionStorage.removeItem('wedding_demo_active');
        sessionStorage.setItem('wedding_demo_expired', 'true');
        this.isDemoMode = false;

        this.currentUser = {
            email: '',
            tokens: 0,
            name: '',
            orderId: '',
            isLoggedIn: false
        };

        const countdownPill = document.getElementById('demoCountdownPill');
        if (countdownPill) countdownPill.style.display = 'none';

        this.updateTokenUI();

        // Tampilkan Banner Notifikasi Waktu Demo Habis di Modal
        const expiredNotice = document.getElementById('demoExpiredNotice');
        if (expiredNotice) expiredNotice.style.display = 'block';

        const btnDemo = document.getElementById('btnDemoMode');
        if (btnDemo) {
            btnDemo.textContent = '⏱️ Ulangi Demo 2 Menit';
        }

        this.showLockScreen();

        if (!silent) {
            this.showToast('⚠️ Waktu Demo 2 Menit Telah Habis! Masukkan email Lynk.id untuk lanjut.');
        }
    }

    // 3. Render Tema & Sinkronisasi Form
    renderThemeCards() {
        const container = document.getElementById('themeCardsContainer');
        if (!container) return;

        const themes = [
            { id: 'theme-emerald', name: 'Royal Emerald & Gold', colors: ['#09261e', '#d4af37', '#f3e5ab'] },
            { id: 'theme-blush', name: 'Blush Floral Romance', colors: ['#fff5f7', '#c25975', '#d88398'] },
            { id: 'theme-midnight', name: 'Midnight Starlight Navy', colors: ['#0b1325', '#ffd700', '#79a6d2'] },
            { id: 'theme-rustic', name: 'Rustic Terracotta Boho', colors: ['#f9f5f0', '#c15c3d', '#758153'] },
            { id: 'theme-islamic', name: 'Islamic Arabesque Syar\'i', colors: ['#0f2b23', '#e0b034', '#85c2a8'] },
            { id: 'theme-monochrome', name: 'Minimalist Editorial Luxe', colors: ['#fcfbf9', '#1a1a1a', '#767676'] },
            { id: 'theme-batik', name: 'Nusantara Jawa Klasik', colors: ['#2b1810', '#d4af37', '#d99f6b'] }
        ];

        container.innerHTML = themes.map(t => `
            <div class="theme-card ${this.currentData.themeId === t.id ? 'active' : ''}" data-theme-id="${t.id}" onclick="window.app.selectTheme('${t.id}')">
                <div class="theme-badge-active">✓</div>
                <div class="theme-preview-palette">
                    ${t.colors.map(c => `<div class="palette-color" style="background: ${c};"></div>`).join('')}
                </div>
                <div class="theme-title">${t.name}</div>
            </div>
        `).join('');
    }

    selectTheme(themeId) {
        this.currentData.themeId = themeId;
        // Optionally update preset texts if user wishes, or just update colors
        this.renderThemeCards();
        this.syncToPreview();
    }

    loadPresetData(themeId) {
        if (!WEDDING_PRESETS[themeId]) return;
        if (confirm(`Apakah Anda ingin memuat seluruh contoh teks dan layout untuk tema '${WEDDING_PRESETS[themeId].themeName}'? Data inputan saat ini akan diganti.`)) {
            this.currentData = JSON.parse(JSON.stringify(WEDDING_PRESETS[themeId]));
            this.populateForm();
            this.renderThemeCards();
            this.syncToPreview();
            this.showToast('Contoh data tema berhasil dimuat!');
        }
    }

    // Mengisi form input dari state currentData
    populateForm() {
        const d = this.currentData;
        if (!d) return;

        // Cover & Quotes
        this.setVal('inputCoverTitle', d.cover?.title);
        this.setVal('inputCoverDate', d.cover?.dateText);
        this.setVal('inputCoverOpenBtn', d.cover?.openBtnText);
        this.setVal('inputQuoteText', d.quote?.text);
        this.setVal('inputQuoteSource', d.quote?.source);

        // Groom
        this.setVal('inputGroomNickname', d.groom?.nickname);
        this.setVal('inputGroomFullName', d.groom?.fullName);
        this.setVal('inputGroomParents', d.groom?.parents);
        this.setVal('inputGroomIg', d.groom?.instagram);
        this.setVal('inputGroomPhoto', d.groom?.photo);

        // Bride
        this.setVal('inputBrideNickname', d.bride?.nickname);
        this.setVal('inputBrideFullName', d.bride?.fullName);
        this.setVal('inputBrideParents', d.bride?.parents);
        this.setVal('inputBrideIg', d.bride?.instagram);
        this.setVal('inputBridePhoto', d.bride?.photo);

        // Events
        this.setVal('inputCountdownDate', d.events?.countdownDate);
        this.setVal('inputAkadTitle', d.events?.akad?.title);
        this.setVal('inputAkadDate', d.events?.akad?.date);
        this.setVal('inputAkadTime', d.events?.akad?.time);
        this.setVal('inputAkadVenue', d.events?.akad?.venue);
        this.setVal('inputAkadAddress', d.events?.akad?.address);
        this.setVal('inputAkadMap', d.events?.akad?.mapLink);
        const akadEmbedEl = document.getElementById('inputAkadShowEmbed');
        if (akadEmbedEl) akadEmbedEl.checked = d.events?.akad?.showEmbedMap !== false;

        this.setVal('inputResepsiTitle', d.events?.resepsi?.title);
        this.setVal('inputResepsiDate', d.events?.resepsi?.date);
        this.setVal('inputResepsiTime', d.events?.resepsi?.time);
        this.setVal('inputResepsiVenue', d.events?.resepsi?.venue);
        this.setVal('inputResepsiAddress', d.events?.resepsi?.address);
        this.setVal('inputResepsiMap', d.events?.resepsi?.mapLink);
        const resepsiEmbedEl = document.getElementById('inputResepsiShowEmbed');
        if (resepsiEmbedEl) resepsiEmbedEl.checked = d.events?.resepsi?.showEmbedMap !== false;

        // Music & Video
        this.setVal('inputMusicUrl', d.musicUrl);
        this.setVal('inputVideoUrl', d.videoUrl);

        // Dynamic Lists
        this.renderMilestonesForm();
        this.renderGalleryForm();
        this.renderGiftsForm();
    }

    setVal(id, val) {
        const el = document.getElementById(id);
        if (el && val !== undefined) el.value = val;
    }

    // Mengambil data terkini dari input form ke currentData
    updateStateFromForm() {
        const d = this.currentData;

        // Cover
        d.cover = d.cover || {};
        d.cover.title = document.getElementById('inputCoverTitle')?.value || '';
        d.cover.dateText = document.getElementById('inputCoverDate')?.value || '';
        d.cover.openBtnText = document.getElementById('inputCoverOpenBtn')?.value || '';

        // Quotes
        d.quote = d.quote || {};
        d.quote.text = document.getElementById('inputQuoteText')?.value || '';
        d.quote.source = document.getElementById('inputQuoteSource')?.value || '';

        // Groom
        d.groom = d.groom || {};
        d.groom.nickname = document.getElementById('inputGroomNickname')?.value || '';
        d.groom.fullName = document.getElementById('inputGroomFullName')?.value || '';
        d.groom.parents = document.getElementById('inputGroomParents')?.value || '';
        d.groom.instagram = document.getElementById('inputGroomIg')?.value || '';
        d.groom.photo = document.getElementById('inputGroomPhoto')?.value || '';

        // Bride
        d.bride = d.bride || {};
        d.bride.nickname = document.getElementById('inputBrideNickname')?.value || '';
        d.bride.fullName = document.getElementById('inputBrideFullName')?.value || '';
        d.bride.parents = document.getElementById('inputBrideParents')?.value || '';
        d.bride.instagram = document.getElementById('inputBrideIg')?.value || '';
        d.bride.photo = document.getElementById('inputBridePhoto')?.value || '';

        // Events
        d.events = d.events || {};
        d.events.countdownDate = document.getElementById('inputCountdownDate')?.value || '';
        
        d.events.akad = d.events.akad || {};
        d.events.akad.title = document.getElementById('inputAkadTitle')?.value || '';
        d.events.akad.date = document.getElementById('inputAkadDate')?.value || '';
        d.events.akad.time = document.getElementById('inputAkadTime')?.value || '';
        d.events.akad.venue = document.getElementById('inputAkadVenue')?.value || '';
        d.events.akad.address = document.getElementById('inputAkadAddress')?.value || '';
        d.events.akad.mapLink = document.getElementById('inputAkadMap')?.value || '';
        d.events.akad.showEmbedMap = document.getElementById('inputAkadShowEmbed') ? document.getElementById('inputAkadShowEmbed').checked : true;

        d.events.resepsi = d.events.resepsi || {};
        d.events.resepsi.title = document.getElementById('inputResepsiTitle')?.value || '';
        d.events.resepsi.date = document.getElementById('inputResepsiDate')?.value || '';
        d.events.resepsi.time = document.getElementById('inputResepsiTime')?.value || '';
        d.events.resepsi.venue = document.getElementById('inputResepsiVenue')?.value || '';
        d.events.resepsi.address = document.getElementById('inputResepsiAddress')?.value || '';
        d.events.resepsi.mapLink = document.getElementById('inputResepsiMap')?.value || '';
        d.events.resepsi.showEmbedMap = document.getElementById('inputResepsiShowEmbed') ? document.getElementById('inputResepsiShowEmbed').checked : true;

        // Music & Video
        d.musicUrl = document.getElementById('inputMusicUrl')?.value || '';
        d.videoUrl = document.getElementById('inputVideoUrl')?.value || '';

        // Sync to live preview immediately
        this.syncToPreview();
    }

    // Google Maps & Waze Helper Testing
    testMapLink(eventKey, type) {
        const d = this.currentData.events?.[eventKey] || {};
        const mapInput = document.getElementById(eventKey === 'akad' ? 'inputAkadMap' : 'inputResepsiMap');
        const mapLink = mapInput?.value || d.mapLink || '';
        const venue = (document.getElementById(eventKey === 'akad' ? 'inputAkadVenue' : 'inputResepsiVenue')?.value || d.venue || '').trim();
        const address = (document.getElementById(eventKey === 'akad' ? 'inputAkadAddress' : 'inputResepsiAddress')?.value || d.address || '').trim();
        const query = (venue + ' ' + address).trim() || 'Jakarta';

        if (type === 'gmaps') {
            if (mapLink && mapLink.trim()) {
                window.open(mapLink, '_blank');
            } else {
                window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
            }
        } else if (type === 'waze') {
            window.open(`https://waze.com/ul?q=${encodeURIComponent(query)}&navigate=yes`, '_blank');
        }
    }

    searchLocationOnMap(eventKey) {
        const venue = (document.getElementById(eventKey === 'akad' ? 'inputAkadVenue' : 'inputResepsiVenue')?.value || '').trim();
        const address = (document.getElementById(eventKey === 'akad' ? 'inputAkadAddress' : 'inputResepsiAddress')?.value || '').trim();
        const query = (venue + ' ' + address).trim();
        const targetUrl = query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : 'https://www.google.com/maps';
        window.open(targetUrl, '_blank');
        this.showToast('🔍 Silakan cari tempat di Google Maps, lalu salin tautannya ke kolom input.');
    }

    // 4. Live Preview Sync via postMessage
    syncToPreview() {
        if (this.previewFrame && this.previewFrame.contentWindow) {
            this.previewFrame.contentWindow.postMessage({
                type: 'SYNC_INVITATION_DATA',
                payload: this.currentData
            }, '*');
        }
    }

    switchPreviewMode(mode) {
        this.previewMode = mode;
        const wrapper = document.getElementById('previewViewportWrapper');
        const btnMobile = document.getElementById('btnViewMobile');
        const btnDesktop = document.getElementById('btnViewDesktop');

        if (mode === 'desktop') {
            wrapper.classList.add('desktop-mode');
            btnDesktop.classList.add('active');
            btnMobile.classList.remove('active');
        } else {
            wrapper.classList.remove('desktop-mode');
            btnMobile.classList.add('active');
            btnDesktop.classList.remove('active');
        }
    }

    reloadPreview() {
        if (this.previewFrame) {
            this.previewFrame.src = 'invitation.html?preview=1&t=' + Date.now();
            setTimeout(() => this.syncToPreview(), 500);
        }
    }

    openPreviewNewTab() {
        // Simpan data terkini ke localStorage agar tab baru bisa langsung baca
        localStorage.setItem('wedding_draft_data', JSON.stringify(this.currentData));
        window.open('invitation.html?preview=1', '_blank');
    }

    // 5. Dynamic Form Lists (Milestones, Gifts, Gallery)
    renderMilestonesForm() {
        const container = document.getElementById('storyMilestonesList');
        if (!container) return;

        const stories = this.currentData.story || [];
        container.innerHTML = stories.map((s, idx) => `
            <div class="dynamic-item-card">
                <button type="button" class="btn-remove-item" onclick="window.app.removeMilestone(${idx})" title="Hapus Milestone">&times;</button>
                <div class="form-row">
                    <div class="form-group" style="margin-bottom: 8px;">
                        <label class="form-label">Tahun</label>
                        <input type="text" class="form-control" value="${s.year || ''}" oninput="window.app.updateMilestone(${idx}, 'year', this.value)">
                    </div>
                    <div class="form-group" style="margin-bottom: 8px;">
                        <label class="form-label">Judul Momen</label>
                        <input type="text" class="form-control" value="${s.title || ''}" oninput="window.app.updateMilestone(${idx}, 'title', this.value)">
                    </div>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label">Cerita Singkat</label>
                    <textarea class="form-control" rows="2" oninput="window.app.updateMilestone(${idx}, 'desc', this.value)">${s.desc || ''}</textarea>
                </div>
            </div>
        `).join('');
    }

    addMilestone() {
        this.currentData.story = this.currentData.story || [];
        this.currentData.story.push({ year: '2026', title: 'Momen Bahagia', desc: 'Tuliskan momen indah Anda di sini...' });
        this.renderMilestonesForm();
        this.syncToPreview();
    }

    updateMilestone(idx, field, val) {
        if (this.currentData.story && this.currentData.story[idx]) {
            this.currentData.story[idx][field] = val;
            this.syncToPreview();
        }
    }

    removeMilestone(idx) {
        if (this.currentData.story) {
            this.currentData.story.splice(idx, 1);
            this.renderMilestonesForm();
            this.syncToPreview();
        }
    }

    // Gallery Form
    renderGalleryForm() {
        const container = document.getElementById('galleryUrlsList');
        if (!container) return;

        const gallery = this.currentData.gallery || [];
        container.innerHTML = gallery.map((url, idx) => `
            <div class="dynamic-item-card" style="padding: 12px;">
                <button type="button" class="btn-remove-item" onclick="window.app.removeGalleryImage(${idx})" title="Hapus Foto">&times;</button>
                <label class="form-label">URL Foto ${idx + 1}</label>
                <input type="url" class="form-control" value="${url}" placeholder="https://..." oninput="window.app.updateGalleryImage(${idx}, this.value)">
            </div>
        `).join('');
    }

    addGalleryImage() {
        this.currentData.gallery = this.currentData.gallery || [];
        this.currentData.gallery.push("https://images.unsplash.com/photo-1519741497674-611481863552?w=800");
        this.renderGalleryForm();
        this.syncToPreview();
    }

    updateGalleryImage(idx, val) {
        if (this.currentData.gallery) {
            this.currentData.gallery[idx] = val;
            this.syncToPreview();
        }
    }

    removeGalleryImage(idx) {
        if (this.currentData.gallery) {
            this.currentData.gallery.splice(idx, 1);
            this.renderGalleryForm();
            this.syncToPreview();
        }
    }

    // Gifts Form
    renderGiftsForm() {
        const container = document.getElementById('bankAccountsList');
        if (!container) return;

        const gifts = this.currentData.gifts || [];
        container.innerHTML = gifts.map((g, idx) => `
            <div class="dynamic-item-card">
                <button type="button" class="btn-remove-item" onclick="window.app.removeGift(${idx})" title="Hapus Rekening">&times;</button>
                <div class="form-row">
                    <div class="form-group" style="margin-bottom: 8px;">
                        <label class="form-label">Nama Bank</label>
                        <input type="text" class="form-control" value="${g.bank || ''}" placeholder="BCA / Mandiri / BRI" oninput="window.app.updateGift(${idx}, 'bank', this.value)">
                    </div>
                    <div class="form-group" style="margin-bottom: 8px;">
                        <label class="form-label">Nomor Rekening</label>
                        <input type="text" class="form-control" value="${g.accountNumber || ''}" placeholder="123456789" oninput="window.app.updateGift(${idx}, 'accountNumber', this.value)">
                    </div>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label">Atas Nama (Pemilik Rekening)</label>
                    <input type="text" class="form-control" value="${g.accountName || ''}" placeholder="Nama Pemilik" oninput="window.app.updateGift(${idx}, 'accountName', this.value)">
                </div>
            </div>
        `).join('');

        // Physical gift address
        this.setVal('inputPhysicalRecipient', this.currentData.physicalGift?.recipient);
        this.setVal('inputPhysicalPhone', this.currentData.physicalGift?.phone);
        this.setVal('inputPhysicalAddress', this.currentData.physicalGift?.address);
    }

    addGift() {
        this.currentData.gifts = this.currentData.gifts || [];
        this.currentData.gifts.push({ bank: 'BCA', accountNumber: '', accountName: '' });
        this.renderGiftsForm();
        this.syncToPreview();
    }

    updateGift(idx, field, val) {
        if (this.currentData.gifts && this.currentData.gifts[idx]) {
            this.currentData.gifts[idx][field] = val;
            this.syncToPreview();
        }
    }

    removeGift(idx) {
        if (this.currentData.gifts) {
            this.currentData.gifts.splice(idx, 1);
            this.renderGiftsForm();
            this.syncToPreview();
        }
    }

    updatePhysicalGift() {
        this.currentData.physicalGift = {
            recipient: document.getElementById('inputPhysicalRecipient')?.value || '',
            phone: document.getElementById('inputPhysicalPhone')?.value || '',
            address: document.getElementById('inputPhysicalAddress')?.value || ''
        };
        this.syncToPreview();
    }

    // 6. Token Publish Confirmation & Workflow
    handlePublishClick() {
        // Cek login
        if (!this.currentUser.isLoggedIn) {
            this.showLockScreen();
            return;
        }

        // Cek sisa token
        if (this.currentUser.tokens < 1) {
            this.openTopupModal('Token Publikasi Anda Habis (0 Token). Silakan beli lisensi di Lynk.id (https://lynk.id/olapoal) atau top-up via Trakteer.');
            return;
        }

        // Generate default slug preview
        const groom = (this.currentData.groom?.nickname || 'groom').toLowerCase().replace(/[^a-z0-9]/g, '');
        const bride = (this.currentData.bride?.nickname || 'bride').toLowerCase().replace(/[^a-z0-9]/g, '');
        const defaultSlug = `${groom}-${bride}`;

        const slugInput = document.getElementById('inputPublishSlug');
        if (slugInput && !slugInput.value) {
            slugInput.value = defaultSlug;
        }

        // Update modal info
        const tokenNowEl = document.getElementById('modalConfirmTokenCurrent');
        const tokenAfterEl = document.getElementById('modalConfirmTokenAfter');
        if (tokenNowEl) tokenNowEl.textContent = `${this.currentUser.tokens} Token`;
        if (tokenAfterEl) tokenAfterEl.textContent = `${this.currentUser.tokens - 1} Token`;

        // Tampilkan Modal Konfirmasi
        const modal = document.getElementById('confirmPublishModal');
        if (modal) modal.classList.add('active');
    }

    async executePublish() {
        const slugInput = document.getElementById('inputPublishSlug');
        const slug = (slugInput?.value || '').trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');

        if (!slug) {
            alert('Tautan slug undangan tidak boleh kosong.');
            return;
        }

        const btn = document.getElementById('btnConfirmPublishSubmit');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Mempublikasikan...';
        }

        try {
            const res = await fetch('/api/publish-invitation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: this.currentUser.email,
                    slug: slug,
                    invitationData: this.currentData
                })
            });

            const result = await res.json();

            if (result.success) {
                // Potong token lokal & update session
                this.currentUser.tokens = result.remainingTokens;
                localStorage.setItem('wedding_user_tokens', this.currentUser.tokens);
                this.updateTokenUI();

                // Tutup konfirmasi modal
                document.getElementById('confirmPublishModal')?.classList.remove('active');

                // Tampilkan Modal Berhasil Publish
                this.showPublishSuccessModal(result.slug, result.fullUrl || `${window.location.origin}/invitation.html?slug=${result.slug}`);
            } else if (result.needTopup) {
                alert(result.message);
                document.getElementById('confirmPublishModal')?.classList.remove('active');
                this.openTopupModal();
            } else {
                alert(result.message || 'Gagal mempublikasikan undangan.');
            }

        } catch (err) {
            console.warn("Publish API error (offline fallback mode):", err);
            // Mode Offline / Demo Publish:
            this.currentUser.tokens = Math.max(0, this.currentUser.tokens - 1);
            localStorage.setItem('wedding_user_tokens', this.currentUser.tokens);
            this.updateTokenUI();

            document.getElementById('confirmPublishModal')?.classList.remove('active');
            this.showPublishSuccessModal(slug, `${window.location.origin}/invitation.html?slug=${slug}`);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Ya, Publish Sekarang (-1 Token)';
            }
        }
    }

    showPublishSuccessModal(slug, fullUrl) {
        const modal = document.getElementById('publishSuccessModal');
        const urlInput = document.getElementById('publishedUrlInput');
        const openLink = document.getElementById('btnOpenPublishedUrl');

        if (urlInput) urlInput.value = fullUrl;
        if (openLink) openLink.href = fullUrl;

        if (modal) modal.classList.add('active');
    }

    // 7. Trakteer Token Top-Up & Auto-Verification ("Pikirkan Caranya")
    openTopupModal(customNotice) {
        const noticeEl = document.getElementById('topupModalNotice');
        if (noticeEl) {
            if (customNotice) {
                noticeEl.textContent = customNotice;
                noticeEl.style.display = 'block';
            } else {
                noticeEl.style.display = 'none';
            }
        }

        const userEmailDisplay = document.getElementById('topupUserEmailDisplay');
        if (userEmailDisplay) {
            userEmailDisplay.textContent = this.currentUser.email || 'Email Anda';
        }

        const modal = document.getElementById('topupTokenModal');
        if (modal) modal.classList.add('active');
    }

    async checkTrakteerPayment() {
        const email = this.currentUser.email;
        const orderIdInput = document.getElementById('inputTrakteerOrderId');
        const orderId = (orderIdInput?.value || '').trim();

        const btn = document.getElementById('btnCheckTrakteer');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Memeriksa Pembayaran...';
        }

        try {
            const res = await fetch('/api/verify-trakteer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, order_id: orderId })
            });

            const data = await res.json();
            if (data.success && data.claimed) {
                // Token berhasil ditambah!
                this.currentUser.tokens = data.tokens;
                localStorage.setItem('wedding_user_tokens', this.currentUser.tokens);
                this.updateTokenUI();

                alert(`🎉 ${data.message}`);
                document.getElementById('topupTokenModal')?.classList.remove('active');
            } else {
                alert(data.message || 'Pembayaran belum terdeteksi. Harap pastikan Anda telah menyelesaikan pembayaran di Trakteer dan menuliskan email Anda.');
            }
        } catch (e) {
            console.warn("Trakteer verify error:", e);
            alert('Tidak dapat menghubungi server verifikasi. Jika Anda telah membayar, silakan hubungi admin atau periksa kembali koneksi.');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Cek Status Pembayaran Trakteer';
            }
        }
    }

    // ========================================================
    // 8. ADVANCED WHATSAPP AUTOMATION & GUEST MANAGER
    // ========================================================
    getDefaultWaTemplate(type) {
        if (type === 'islamic') {
            return `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
                `Kepada Yth. Bapak/Ibu/Saudara/i {nama_tamu},\n\n` +
                `Bismillahirrohmanirrohim. Dengan memohon rahmat dan ridho Allah Subhanahu Wa Ta'ala, kami mengundang Anda untuk hadir dalam hari bahagia pernikahan kami:\n\n` +
                `*{mempelai}*\n\n` +
                `📅 {tanggal_acara}\n` +
                `📍 {lokasi_acara}\n\n` +
                `Detail rangkaian acara, rute peta, dan konfirmasi kehadiran dapat diakses melalui link undangan digital berikut:\n` +
                `{link_undangan}\n\n` +
                `Doa restu dari Bapak/Ibu/Saudara/i merupakan karunia terindah bagi lembaran baru hidup kami.\n\n` +
                `Wassalamu'alaikum Warahmatullahi Wabarakatuh.\n` +
                `{mempelai}`;
        } else if (type === 'casual') {
            return `Halo {nama_tamu}! 👋✨\n\n` +
                `Kabar bahagia buat kita semua! Kami mengundang kamu untuk hadir dan merayakan hari pernikahan kami:\n\n` +
                `*{mempelai}*\n\n` +
                `📅 {tanggal_acara}\n` +
                `📍 {lokasi_acara}\n\n` +
                `Yuk buka link undangan digital di bawah ini untuk melihat detail acara, panduan rute & konfirmasi kehadiran:\n` +
                `{link_undangan}\n\n` +
                `Kehadiran dan doa restumu adalah kebahagiaan terbesar buat kami. Sampai jumpa di hari H ya! 🎉🥂`;
        } else {
            // formal / default
            return `Kepada Yth. Bapak/Ibu/Saudara/i {nama_tamu},\n\n` +
                `Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri momen istimewa pernikahan kami:\n\n` +
                `*{mempelai}*\n\n` +
                `📅 {tanggal_acara}\n` +
                `📍 {lokasi_acara}\n\n` +
                `Berikut tautan undangan pernikahan digital kami untuk informasi lengkap rute acara & konfirmasi kehadiran (RSVP):\n` +
                `{link_undangan}\n\n` +
                `Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.\n\n` +
                `Terima kasih.\n` +
                `Salam hangat,\n` +
                `{mempelai}`;
        }
    }

    initWaSystem() {
        const textarea = document.getElementById('waMessageTemplateTextarea');
        if (textarea) {
            textarea.value = this.waTemplate;
        }
        this.renderGuestList();
    }

    applyWaPreset(type) {
        this.waTemplate = this.getDefaultWaTemplate(type);
        const textarea = document.getElementById('waMessageTemplateTextarea');
        if (textarea) textarea.value = this.waTemplate;

        // Active pill button styling
        ['btnPresetFormal', 'btnPresetIslamic', 'btnPresetCasual'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.classList.remove('active');
        });
        const activeBtn = document.getElementById(
            type === 'islamic' ? 'btnPresetIslamic' : (type === 'casual' ? 'btnPresetCasual' : 'btnPresetFormal')
        );
        if (activeBtn) activeBtn.classList.add('active');

        this.saveWaTemplate();
        this.showToast(`Template pesan ${type} diterapkan!`);
    }

    insertWaTag(tag) {
        const textarea = document.getElementById('waMessageTemplateTextarea');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        textarea.value = text.substring(0, start) + tag + text.substring(end);
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + tag.length;
        this.saveWaTemplate();
    }

    saveWaTemplate() {
        const textarea = document.getElementById('waMessageTemplateTextarea');
        if (textarea) {
            this.waTemplate = textarea.value;
            localStorage.setItem('wedding_wa_template', this.waTemplate);
            this.renderGuestList();
        }
    }

    normalizePhoneNumber(phone) {
        if (!phone) return '';
        let cleaned = phone.replace(/[^0-9]/g, '');
        if (cleaned.startsWith('0')) {
            cleaned = '62' + cleaned.slice(1);
        } else if (cleaned.startsWith('8')) {
            cleaned = '62' + cleaned;
        }
        return cleaned;
    }

    getBaseInvitationUrl() {
        const publishedSlug = localStorage.getItem('wedding_published_slug');
        if (publishedSlug) {
            return `${window.location.origin}/invitation.html?slug=${publishedSlug}`;
        }
        return `${window.location.origin}/invitation.html`;
    }

    generateGuestUrl(guestName) {
        const base = this.getBaseInvitationUrl();
        const sep = base.includes('?') ? '&' : '?';
        return `${base}${sep}to=${encodeURIComponent(guestName)}`;
    }

    buildGuestMessage(guestName, guestUrl) {
        const groom = this.currentData.groom?.nickname || 'Groom';
        const bride = this.currentData.bride?.nickname || 'Bride';
        const couple = `${groom} & ${bride}`;
        const eventDate = this.currentData.events?.akad?.date || this.currentData.events?.resepsi?.date || 'Sabtu, 24 Oktober 2026';
        const venue = this.currentData.events?.resepsi?.venue || this.currentData.events?.akad?.venue || 'Gedung Pernikahan';

        let msg = this.waTemplate || this.getDefaultWaTemplate('formal');
        msg = msg.replace(/\{nama_tamu\}/g, guestName || 'Bapak/Ibu/Saudara/i');
        msg = msg.replace(/\{link_undangan\}/g, guestUrl);
        msg = msg.replace(/\{mempelai\}/g, couple);
        msg = msg.replace(/\{tanggal_acara\}/g, eventDate);
        msg = msg.replace(/\{lokasi_acara\}/g, venue);
        return msg;
    }

    addSingleGuest() {
        const nameInput = document.getElementById('quickGuestName');
        const phoneInput = document.getElementById('quickGuestPhone');
        const name = (nameInput?.value || '').trim();
        const phoneRaw = (phoneInput?.value || '').trim();

        if (!name) {
            alert('Nama tamu di undangan tidak boleh kosong.');
            nameInput?.focus();
            return;
        }

        const phone = this.normalizePhoneNumber(phoneRaw);
        this.guestList.unshift({
            id: 'g_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            name: name,
            phone: phone,
            sent: false,
            createdAt: Date.now()
        });

        localStorage.setItem('wedding_guests_list', JSON.stringify(this.guestList));
        if (nameInput) nameInput.value = '';
        if (phoneInput) phoneInput.value = '';

        this.renderGuestList();
        this.showToast(`✅ Tamu "${name}" berhasil ditambahkan!`);
    }

    importBulkGuests() {
        const textarea = document.getElementById('guestNamesTextarea');
        const rawText = (textarea?.value || '').trim();
        if (!rawText) {
            alert('Masukkan daftar nama dan nomor WhatsApp tamu terlebih dahulu.');
            return;
        }

        const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        let addedCount = 0;

        lines.forEach(line => {
            let name = '';
            let rawPhone = '';

            // Cek delimiter pemisah: tab, koma, semicolon, strip
            if (line.includes('\t')) {
                const parts = line.split('\t');
                name = parts[0].trim();
                rawPhone = parts.slice(1).join(' ').trim();
            } else if (line.includes(',')) {
                const parts = line.split(',');
                name = parts[0].trim();
                rawPhone = parts.slice(1).join(' ').trim();
            } else if (line.includes(';')) {
                const parts = line.split(';');
                name = parts[0].trim();
                rawPhone = parts.slice(1).join(' ').trim();
            } else if (line.includes(' - ')) {
                const parts = line.split(' - ');
                name = parts[0].trim();
                rawPhone = parts.slice(1).join(' ').trim();
            } else {
                name = line.trim();
            }

            if (name) {
                const phone = this.normalizePhoneNumber(rawPhone);
                this.guestList.push({
                    id: 'g_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                    name: name,
                    phone: phone,
                    sent: false,
                    createdAt: Date.now()
                });
                addedCount++;
            }
        });

        localStorage.setItem('wedding_guests_list', JSON.stringify(this.guestList));
        if (textarea) textarea.value = '';

        this.renderGuestList();
        this.showToast(`⚡ Berhasil menambahkan ${addedCount} tamu!`);
    }

    // Alias for legacy button
    generateGuestLinks() {
        this.importBulkGuests();
    }

    toggleGuestSent(id) {
        const guest = this.guestList.find(g => g.id === id);
        if (guest) {
            guest.sent = !guest.sent;
            localStorage.setItem('wedding_guests_list', JSON.stringify(this.guestList));
            this.renderGuestList();
        }
    }

    deleteGuest(id) {
        this.guestList = this.guestList.filter(g => g.id !== id);
        localStorage.setItem('wedding_guests_list', JSON.stringify(this.guestList));
        this.renderGuestList();
        this.showToast('Tamu dihapus dari daftar.');
    }

    clearAllGuests() {
        if (this.guestList.length === 0) return;
        if (confirm('Yakin ingin mengosongkan seluruh daftar tamu undangan?')) {
            this.guestList = [];
            localStorage.setItem('wedding_guests_list', JSON.stringify(this.guestList));
            this.renderGuestList();
            this.showToast('Daftar tamu telah dikosongkan.');
        }
    }

    copyAllGuestLinks() {
        if (this.guestList.length === 0) {
            alert('Belum ada tamu dalam daftar.');
            return;
        }

        const lines = this.guestList.map((g, idx) => {
            const url = this.generateGuestUrl(g.name);
            return `${idx + 1}. ${g.name}${g.phone ? ' (' + g.phone + ')' : ''} : ${url}`;
        });

        navigator.clipboard.writeText(lines.join('\n\n')).then(() => {
            this.showToast(`📋 Berhasil menyalin ${this.guestList.length} link tamu!`);
        });
    }

    copyGuestFullMessage(guestName, guestUrl) {
        const msg = this.buildGuestMessage(guestName, guestUrl);
        navigator.clipboard.writeText(msg).then(() => {
            this.showToast(`📋 Seluruh teks pesan undangan untuk "${guestName}" berhasil disalin!`);
        });
    }

    onWaSendClick(id) {
        const guest = this.guestList.find(g => g.id === id);
        if (guest && !guest.sent) {
            guest.sent = true;
            localStorage.setItem('wedding_guests_list', JSON.stringify(this.guestList));
            this.renderGuestList();
        }
    }

    renderGuestList() {
        const container = document.getElementById('generatedGuestLinksContainer');
        const totalEl = document.getElementById('totalGuestsCount');
        const sentEl = document.getElementById('sentGuestsCount');
        const unsentEl = document.getElementById('unsentGuestsCount');

        const total = this.guestList.length;
        const sentCount = this.guestList.filter(g => g.sent).length;
        const unsentCount = total - sentCount;

        if (totalEl) totalEl.textContent = total;
        if (sentEl) sentEl.textContent = sentCount;
        if (unsentEl) unsentEl.textContent = unsentCount;

        if (!container) return;

        if (total === 0) {
            container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 24px 0;">Belum ada tamu undangan. Masukkan nama & nomor WhatsApp di atas.</p>`;
            return;
        }

        container.innerHTML = this.guestList.map((guest, idx) => {
            const guestUrl = this.generateGuestUrl(guest.name);
            const message = this.buildGuestMessage(guest.name, guestUrl);
            const encodedMessage = encodeURIComponent(message);
            const waSendUrl = guest.phone 
                ? `https://api.whatsapp.com/send?phone=${guest.phone}&text=${encodedMessage}`
                : `https://api.whatsapp.com/send?text=${encodedMessage}`;

            return `
                <div class="dynamic-item-card" style="padding: 14px; margin-bottom: 12px; border-left: 3px solid ${guest.sent ? '#22c55e' : 'var(--primary)'};">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                        <div>
                            <span style="font-weight: 700; font-size: 0.94rem; color: #ffffff;">${idx + 1}. ${guest.name}</span>
                            ${guest.phone ? `<span style="font-size: 0.76rem; background: rgba(37,211,102,0.12); color: #4ade80; border: 1px solid rgba(37,211,102,0.3); padding: 2px 7px; border-radius: 10px; margin-left: 6px; font-family: monospace;">📱 +${guest.phone}</span>` : `<span style="font-size: 0.74rem; color: var(--text-muted); margin-left: 6px;">(Tanpa No WA)</span>`}
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="guest-status-pill ${guest.sent ? 'sent' : 'pending'}" onclick="window.app.toggleGuestSent('${guest.id}')" title="Klik untuk mengubah status">
                                ${guest.sent ? '✓ Sudah Dikirim' : '⚪ Belum Dikirim'}
                            </span>
                            <button type="button" style="background: none; border: none; color: #ef4444; font-size: 0.8rem; cursor: pointer; padding: 2px 4px;" onclick="window.app.deleteGuest('${guest.id}')" title="Hapus Tamu">✕</button>
                        </div>
                    </div>

                    <div style="font-size: 0.76rem; color: var(--text-muted); word-break: break-all; margin-bottom: 10px; background: rgba(0,0,0,0.25); padding: 5px 8px; border-radius: 6px;">
                        🔗 <strong>Link:</strong> ${guestUrl}
                    </div>

                    <!-- Action Buttons -->
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <a href="${waSendUrl}" target="_blank" class="btn-wa-send" onclick="window.app.onWaSendClick('${guest.id}')">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 20.15C10.57 20.15 9.12 19.75 7.85 19L7.55 18.82L4.43 19.64L5.26 16.6L5.06 16.29C4.24 14.98 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.68 12.05 3.68C14.25 3.68 16.31 4.54 17.87 6.1C19.42 7.66 20.28 9.72 20.27 11.92C20.27 16.46 16.59 20.15 12.05 20.15Z"/></svg>
                            <span>Kirim WhatsApp Sekarang</span>
                        </a>
                        <button type="button" class="btn-sm-action" onclick="window.app.copyGuestFullMessage('${guest.name.replace(/'/g, "\\'")}', '${guestUrl}')" title="Salin seluruh isi pesan WhatsApp">
                            📋 Salin Pesan
                        </button>
                        <button type="button" class="btn-sm-action" onclick="navigator.clipboard.writeText('${guestUrl}'); window.app.showToast('Link tamu disalin!');" title="Salin link undangan tamu">
                            🔗 Salin Link
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 9. Export Standalone HTML (Bisa di-hosting sendiri atau dibuka offline!)
    async exportStandaloneHtml() {
        try {
            const dataJson = JSON.stringify(this.currentData, null, 2);
            let templateHtml = '';
            try {
                const res = await fetch('invitation.html');
                if (res.ok) {
                    templateHtml = await res.text();
                }
            } catch (e) {
                console.warn('Could not fetch invitation.html directly:', e);
            }

            let finalHtml = '';
            if (templateHtml) {
                const scriptTag = `<script>\nwindow.EXPORTED_INVITATION_DATA = ${dataJson};\n<\/script>\n</head>`;
                finalHtml = templateHtml.replace('</head>', scriptTag);
            } else {
                finalHtml = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>The Wedding of ${this.currentData.groom?.nickname || 'Groom'} & ${this.currentData.bride?.nickname || 'Bride'}</title>
    <link rel="stylesheet" href="assets/css/invitation-themes.css">
    <script>window.EXPORTED_INVITATION_DATA = ${dataJson};<\/script>
</head>
<body class="invitation-root ${this.currentData.themeId || 'theme-emerald'}">
    <script>window.location.href = 'invitation.html';<\/script>
</body>
</html>`;
            }

            const blob = new Blob([finalHtml], { type: 'text/html' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            const groom = (this.currentData.groom?.nickname || 'Groom').replace(/\s+/g, '-');
            const bride = (this.currentData.bride?.nickname || 'Bride').replace(/\s+/g, '-');
            a.download = `undangan-${groom}-${bride}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            this.showToast('📥 File undangan HTML mandiri berhasil didownload!');
        } catch (err) {
            console.error('Export error:', err);
            this.showToast('⚠️ Terjadi kendala saat mengekspor HTML.');
        }
    }

    // Utility: Toast feedback
    showToast(message) {
        let toast = document.getElementById('appToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'appToast';
            toast.style.cssText = `
                position: fixed;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%);
                background: #10b981;
                color: #ffffff;
                padding: 12px 24px;
                border-radius: 30px;
                font-weight: 600;
                font-size: 0.9rem;
                box-shadow: 0 10px 25px rgba(0,0,0,0.4);
                z-index: 100000;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.opacity = '1';
        toast.style.display = 'block';

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => { toast.style.display = 'none'; }, 300);
        }, 3000);
    }

    // Event Listeners Binding
    bindEvents() {
        // Tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                document.querySelectorAll('.tab-section-content').forEach(sec => {
                    sec.classList.remove('active');
                });
                const targetSection = document.getElementById(`tab-${targetTab}`);
                if (targetSection) targetSection.classList.add('active');
            });
        });

        // Form auto-sync inputs
        const scrollPane = document.getElementById('editorScrollArea');
        if (scrollPane) {
            scrollPane.addEventListener('input', () => this.updateStateFromForm());
            scrollPane.addEventListener('change', () => this.updateStateFromForm());
        }

        // Preview device switchers
        document.getElementById('btnViewMobile')?.addEventListener('click', () => this.switchPreviewMode('mobile'));
        document.getElementById('btnViewDesktop')?.addEventListener('click', () => this.switchPreviewMode('desktop'));
        document.getElementById('btnRefreshPreview')?.addEventListener('click', () => this.reloadPreview());
        document.getElementById('btnPreviewNewTab')?.addEventListener('click', () => this.openPreviewNewTab());

        // Publish buttons
        document.getElementById('btnTriggerPublish')?.addEventListener('click', () => this.handlePublishClick());
        document.getElementById('btnConfirmPublishSubmit')?.addEventListener('click', () => this.executePublish());
        document.getElementById('btnSaveDraft')?.addEventListener('click', () => this.saveDraft());
        document.getElementById('btnExportHtml')?.addEventListener('click', () => this.exportStandaloneHtml());

        // Token Topup
        document.getElementById('tokenPillBtn')?.addEventListener('click', () => this.openTopupModal());
        document.getElementById('btnCheckTrakteer')?.addEventListener('click', () => this.checkTrakteerPayment());

        // Lock Screen
        document.getElementById('formVerifyEmail')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleVerifyEmail(document.getElementById('inputBuyerEmail').value);
        });
        document.getElementById('btnDemoMode')?.addEventListener('click', () => this.startDemoMode());

        // Guest Links
        document.getElementById('btnGenerateGuestLinks')?.addEventListener('click', () => this.generateGuestLinks());

        // Modal Closers
        document.querySelectorAll('.modal-close-trigger').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.modal-backdrop:not(#lockScreenModal)').forEach(m => m.classList.remove('active'));
            });
        });
    }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
    window.app = new WeddingApp();
});
