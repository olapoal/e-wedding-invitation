// assets/js/invitation.js
// Logika Interaktif & Render Undangan Pernikahan (Audio, Amplop, Countdown, RSVP, Copy No. Rekening)

class WeddingInvitationEngine {
    constructor(data, options = {}) {
        this.data = data || {};
        this.options = options;
        this.audio = null;
        this.isPlaying = false;
        this.countdownInterval = null;

        this.init();
    }

    init() {
        this.renderAll();
        this.setupAudio();
        this.setupGuestName();
        this.setupCountdown();
        this.setupEventListeners();
    }

    // Render data ke seluruh elemen DOM
    renderAll() {
        const d = this.data;
        if (!d) return;

        // Apply theme class to root
        const root = document.querySelector('.invitation-root') || document.body;
        const validThemes = ['theme-emerald', 'theme-blush', 'theme-midnight', 'theme-rustic', 'theme-islamic', 'theme-monochrome', 'theme-batik'];
        validThemes.forEach(t => root.classList.remove(t));
        root.classList.add(d.themeId || 'theme-emerald');

        // 1. Cover
        this.setText('[data-inv="cover-title"]', d.cover?.title || 'The Wedding Of');
        this.setText('[data-inv="cover-couplename"]', `${d.groom?.nickname || 'Groom'} & ${d.bride?.nickname || 'Bride'}`);
        this.setText('[data-inv="cover-date"]', d.cover?.dateText || 'Save Our Date');
        this.setText('[data-inv="cover-open-btn"]', d.cover?.openBtnText || 'Buka Undangan');

        // 2. Hero Section
        this.setText('[data-inv="hero-couplename"]', `${d.groom?.nickname || 'Groom'} & ${d.bride?.nickname || 'Bride'}`);
        this.setText('[data-inv="hero-date"]', d.cover?.dateText || 'Save Our Date');

        // 3. Quotes
        this.setText('[data-inv="quote-text"]', d.quote?.text || '');
        this.setText('[data-inv="quote-source"]', d.quote?.source || '');

        // 4. Groom Profile
        this.setImg('[data-inv="groom-photo"]', d.groom?.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600');
        this.setText('[data-inv="groom-nickname"]', d.groom?.nickname || 'Groom');
        this.setText('[data-inv="groom-fullname"]', d.groom?.fullName || '');
        this.setText('[data-inv="groom-parents"]', d.groom?.parents || '');
        this.setLink('[data-inv="groom-ig"]', d.groom?.instagram ? `https://instagram.com/${d.groom.instagram.replace('@', '')}` : '', `@${d.groom?.instagram || ''}`);

        // 5. Bride Profile
        this.setImg('[data-inv="bride-photo"]', d.bride?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600');
        this.setText('[data-inv="bride-nickname"]', d.bride?.nickname || 'Bride');
        this.setText('[data-inv="bride-fullname"]', d.bride?.fullName || '');
        this.setText('[data-inv="bride-parents"]', d.bride?.parents || '');
        this.setLink('[data-inv="bride-ig"]', d.bride?.instagram ? `https://instagram.com/${d.bride.instagram.replace('@', '')}` : '', `@${d.bride?.instagram || ''}`);

        // 6. Events (Akad & Resepsi)
        if (d.events) {
            // Akad
            this.setText('[data-inv="akad-title"]', d.events.akad?.title || 'Akad Nikah');
            this.setText('[data-inv="akad-date"]', d.events.akad?.date || '');
            this.setText('[data-inv="akad-time"]', d.events.akad?.time || '');
            this.setText('[data-inv="akad-venue"]', d.events.akad?.venue || '');
            this.setText('[data-inv="akad-address"]', d.events.akad?.address || '');
            const akadMapLink = d.events.akad?.mapLink || 'https://maps.google.com';
            this.setLink('[data-inv="akad-map-btn"]', akadMapLink);
            const akadQuery = `${d.events.akad?.venue || ''} ${d.events.akad?.address || ''}`.trim();
            this.setLink('[data-inv="akad-waze-btn"]', this.getWazeUrl(akadMapLink, akadQuery));

            // Akad Embed Map
            const akadMapWrapper = document.getElementById('akadMapWrapper');
            const akadMapIframe = document.getElementById('akadMapIframe');
            if (akadMapWrapper && akadMapIframe) {
                if (d.events.akad?.showEmbedMap !== false && (akadMapLink || akadQuery)) {
                    akadMapWrapper.style.display = 'block';
                    akadMapIframe.src = this.getGoogleMapsEmbedUrl(akadMapLink, akadQuery);
                } else {
                    akadMapWrapper.style.display = 'none';
                    akadMapIframe.src = '';
                }
            }

            // Resepsi
            this.setText('[data-inv="resepsi-title"]', d.events.resepsi?.title || 'Resepsi');
            this.setText('[data-inv="resepsi-date"]', d.events.resepsi?.date || '');
            this.setText('[data-inv="resepsi-time"]', d.events.resepsi?.time || '');
            this.setText('[data-inv="resepsi-venue"]', d.events.resepsi?.venue || '');
            this.setText('[data-inv="resepsi-address"]', d.events.resepsi?.address || '');
            const resepsiMapLink = d.events.resepsi?.mapLink || 'https://maps.google.com';
            this.setLink('[data-inv="resepsi-map-btn"]', resepsiMapLink);
            const resepsiQuery = `${d.events.resepsi?.venue || ''} ${d.events.resepsi?.address || ''}`.trim();
            this.setLink('[data-inv="resepsi-waze-btn"]', this.getWazeUrl(resepsiMapLink, resepsiQuery));

            // Resepsi Embed Map
            const resepsiMapWrapper = document.getElementById('resepsiMapWrapper');
            const resepsiMapIframe = document.getElementById('resepsiMapIframe');
            if (resepsiMapWrapper && resepsiMapIframe) {
                if (d.events.resepsi?.showEmbedMap !== false && (resepsiMapLink || resepsiQuery)) {
                    resepsiMapWrapper.style.display = 'block';
                    resepsiMapIframe.src = this.getGoogleMapsEmbedUrl(resepsiMapLink, resepsiQuery);
                } else {
                    resepsiMapWrapper.style.display = 'none';
                    resepsiMapIframe.src = '';
                }
            }

            // Calendar Link Button
            this.setupCalendarBtn();
        }

        // 7. Love Story
        this.renderStory(d.story || []);

        // 8. Gallery
        this.renderGallery(d.gallery || []);

        // 9. Video Trailer
        const videoWrapper = document.getElementById('invitationVideoContainer');
        const videoIframe = document.getElementById('invitationVideoIframe');
        if (videoWrapper && videoIframe) {
            if (d.videoUrl && d.videoUrl.trim()) {
                videoWrapper.style.display = 'block';
                videoIframe.src = this.formatYoutubeUrl(d.videoUrl);
            } else {
                videoWrapper.style.display = 'none';
                videoIframe.src = '';
            }
        }

        // 10. Digital Gift / Rekening
        this.renderGifts(d.gifts || [], d.physicalGift);

        // 11. Footer
        this.setText('[data-inv="footer-couplename"]', `${d.groom?.nickname || 'Groom'} & ${d.bride?.nickname || 'Bride'}`);
    }

    setText(selector, text) {
        const els = document.querySelectorAll(selector);
        els.forEach(el => { el.textContent = text || ''; });
    }

    setImg(selector, src) {
        const els = document.querySelectorAll(selector);
        els.forEach(el => { if (src) el.src = src; });
    }

    setLink(selector, href, text) {
        const els = document.querySelectorAll(selector);
        els.forEach(el => {
            if (href) {
                el.href = href;
                el.style.display = 'inline-flex';
                if (text) el.textContent = text;
            } else {
                el.style.display = 'none';
            }
        });
    }

    formatYoutubeUrl(url) {
        if (!url) return '';
        if (url.includes('embed/')) return url;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
    }

    getGoogleMapsEmbedUrl(mapLink, fallbackQuery) {
        let query = (fallbackQuery || '').trim();
        if (mapLink && mapLink.trim()) {
            try {
                const url = new URL(mapLink);
                if (url.searchParams.has('q')) {
                    query = url.searchParams.get('q');
                } else if (url.searchParams.has('query')) {
                    query = url.searchParams.get('query');
                } else if (url.pathname.includes('/place/')) {
                    const match = url.pathname.match(/\/place\/([^\/]+)/);
                    if (match && match[1]) {
                        query = decodeURIComponent(match[1].replace(/\+/g, ' '));
                    }
                }
            } catch (e) {
                query = mapLink.trim();
            }
        }
        if (!query) query = 'Jakarta';
        return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }

    getWazeUrl(mapLink, fallbackQuery) {
        let query = (fallbackQuery || '').trim();
        if (mapLink && mapLink.trim()) {
            try {
                const url = new URL(mapLink);
                if (url.searchParams.has('q')) {
                    query = url.searchParams.get('q');
                } else if (url.searchParams.has('query')) {
                    query = url.searchParams.get('query');
                }
            } catch (e) {
                query = mapLink.trim();
            }
        }
        if (!query) query = 'Jakarta';
        return `https://waze.com/ul?q=${encodeURIComponent(query)}&navigate=yes`;
    }

    // Render Timeline Kisah Cinta
    renderStory(stories) {
        const container = document.getElementById('invitationStoryContainer');
        if (!container) return;

        if (!stories || stories.length === 0) {
            container.parentElement.style.display = 'none';
            return;
        }
        container.parentElement.style.display = 'block';
        container.innerHTML = stories.map(s => `
            <div class="story-item">
                <div class="story-badge">${this.escapeHtml(s.year || '')}</div>
                <div class="story-box">
                    <h4 class="story-title">${this.escapeHtml(s.title || '')}</h4>
                    <p class="story-desc">${this.escapeHtml(s.desc || '')}</p>
                </div>
            </div>
        `).join('');
    }

    // Render Galeri Foto
    renderGallery(images) {
        const container = document.getElementById('invitationGalleryGrid');
        if (!container) return;

        if (!images || images.length === 0) {
            container.parentElement.style.display = 'none';
            return;
        }
        container.parentElement.style.display = 'block';
        container.innerHTML = images.map((img, idx) => `
            <div class="gallery-item" onclick="window.invitationEngine.openLightbox('${img}')">
                <img src="${img}" alt="Wedding Gallery Photo ${idx + 1}" loading="lazy">
            </div>
        `).join('');
    }

    // Render Amplop Digital & Kado
    renderGifts(banks, physicalGift) {
        const container = document.getElementById('invitationGiftsContainer');
        if (!container) return;

        let html = '';
        if (banks && banks.length > 0) {
            html += banks.map(b => `
                <div class="gift-card">
                    <span class="gift-bank-badge">BANK ${this.escapeHtml(b.bank || 'TRANSFER')}</span>
                    <div class="gift-account-number" id="acc-${b.accountNumber}">${this.escapeHtml(b.accountNumber || '')}</div>
                    <div class="gift-holder-name">a.n ${this.escapeHtml(b.accountName || '')}</div>
                    <button type="button" class="btn-copy-account" onclick="window.invitationEngine.copyToClipboard('${b.accountNumber}', this)">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        <span>Salin No. Rekening</span>
                    </button>
                </div>
            `).join('');
        }

        if (physicalGift && physicalGift.address && physicalGift.address.trim()) {
            html += `
                <div class="gift-card" style="margin-top: 16px;">
                    <span class="gift-bank-badge">KIRIM KADO FISIK</span>
                    <div style="font-weight: 700; font-size: 1rem; margin-top: 4px;">Penerima: ${this.escapeHtml(physicalGift.recipient || 'Mempelai')}</div>
                    <div style="font-size: 0.85rem; color: var(--theme-text-muted); margin-bottom: 8px;">No. HP: ${this.escapeHtml(physicalGift.phone || '-')}</div>
                    <p style="font-size: 0.88rem; line-height: 1.5; margin-bottom: 14px;">${this.escapeHtml(physicalGift.address)}</p>
                    <button type="button" class="btn-copy-account" onclick="window.invitationEngine.copyToClipboard('${this.escapeHtml(physicalGift.address)}', this, 'Alamat Berhasil Disalin!')">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        <span>Salin Alamat Kirim</span>
                    </button>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    // Personalization: Guest Name from Query Param ?to=...
    setupGuestName() {
        const urlParams = new URLSearchParams(window.location.search);
        let guestName = urlParams.get('to') || urlParams.get('u') || urlParams.get('kpd') || urlParams.get('nama') || 'Tamu Undangan';
        guestName = guestName.replace(/\+/g, ' ').trim();

        const guestEls = document.querySelectorAll('[data-inv="guest-name"]');
        guestEls.forEach(el => {
            el.textContent = guestName;
        });

        // Auto-fill in RSVP name input if empty
        const rsvpNameInput = document.getElementById('rsvpGuestName');
        if (rsvpNameInput && guestName !== 'Tamu Undangan' && !rsvpNameInput.value) {
            rsvpNameInput.value = guestName;
        }
    }

    // Audio Background Player
    setupAudio() {
        const musicUrl = this.data.musicUrl || MUSIC_PRESETS[0].url;
        if (!this.audio) {
            this.audio = new Audio(musicUrl);
            this.audio.loop = true;
        } else {
            this.audio.src = musicUrl;
        }

        const musicBtn = document.getElementById('floatingMusicBtn');
        if (musicBtn) {
            musicBtn.onclick = () => this.toggleAudio();
        }
    }

    playAudio() {
        if (!this.audio) return;
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.updateMusicBtnState(true);
        }).catch(err => {
            console.warn("Audio autoplay blocked or user interacted required:", err.message);
        });
    }

    pauseAudio() {
        if (!this.audio) return;
        this.audio.pause();
        this.isPlaying = false;
        this.updateMusicBtnState(false);
    }

    toggleAudio() {
        if (this.isPlaying) {
            this.pauseAudio();
        } else {
            this.playAudio();
        }
    }

    updateMusicBtnState(playing) {
        const btn = document.getElementById('floatingMusicBtn');
        if (!btn) return;
        if (playing) {
            btn.classList.add('playing');
            btn.innerHTML = `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`;
        } else {
            btn.classList.remove('playing');
            btn.innerHTML = `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M4.27 3L3 4.27l9 9v.28c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4v-1.73l4 4 1.27-1.27L4.27 3zM14 7h4V3h-6v5.18l2 2V7z"/></svg>`;
        }
    }

    // Buka Undangan (Cover Flip / Fade)
    openInvitation() {
        const cover = document.getElementById('invitationCover');
        if (cover) {
            cover.classList.add('opened');
            // Play background music saat amplop dibuka (compliant dengan browser autoplay policy!)
            this.playAudio();
            // Scroll sedikit agar halus
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // Live Countdown Timer
    setupCountdown() {
        if (this.countdownInterval) clearInterval(this.countdownInterval);

        const targetStr = this.data.events?.countdownDate || "2026-10-24T08:00";
        const targetDate = new Date(targetStr).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            const daysEl = document.getElementById('countDays');
            const hoursEl = document.getElementById('countHours');
            const minutesEl = document.getElementById('countMinutes');
            const secondsEl = document.getElementById('countSeconds');

            if (distance < 0) {
                if (daysEl) daysEl.textContent = '00';
                if (hoursEl) hoursEl.textContent = '00';
                if (minutesEl) minutesEl.textContent = '00';
                if (secondsEl) secondsEl.textContent = '00';
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
            if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
            if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
            if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
        };

        updateTimer();
        this.countdownInterval = setInterval(updateTimer, 1000);
    }

    // Google Calendar Link Generator
    setupCalendarBtn() {
        const btn = document.getElementById('btnAddCalendar');
        if (!btn) return;

        const d = this.data;
        const targetStr = d.events?.countdownDate || "2026-10-24T08:00";
        const startDate = new Date(targetStr);
        const endDate = new Date(startDate.getTime() + (4 * 60 * 60 * 1000)); // +4 jam

        const formatGCalDate = (date) => {
            return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
        };

        const title = encodeURIComponent(`The Wedding of ${d.groom?.nickname || 'Groom'} & ${d.bride?.nickname || 'Bride'}`);
        const details = encodeURIComponent(`Pernikahan ${d.groom?.fullName || ''} dan ${d.bride?.fullName || ''}.\nMohon doa restu Anda.`);
        const location = encodeURIComponent(d.events?.akad?.venue || d.events?.resepsi?.venue || 'Lokasi Acara');
        const dates = `${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`;

        btn.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
        btn.target = '_blank';
    }

    // Copy to clipboard with visual feedback
    copyToClipboard(text, btnElement, successMsg = 'Tersalin!') {
        navigator.clipboard.writeText(text).then(() => {
            const originalHTML = btnElement.innerHTML;
            btnElement.innerHTML = `
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                <span>${successMsg}</span>
            `;
            setTimeout(() => {
                btnElement.innerHTML = originalHTML;
            }, 2500);
        }).catch(err => {
            alert('Gagal menyalin otomatis: ' + text);
        });
    }

    // Lightbox Photo Zoom
    openLightbox(imgSrc) {
        let modal = document.getElementById('galleryLightboxModal');
        let img = document.getElementById('lightboxImg');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'galleryLightboxModal';
            modal.className = 'lightbox-modal';
            modal.innerHTML = `
                <button class="lightbox-close" onclick="window.invitationEngine.closeLightbox()">&times;</button>
                <img id="lightboxImg" class="lightbox-img" src="" alt="Zoom Photo">
            `;
            document.body.appendChild(modal);
            img = document.getElementById('lightboxImg');
            modal.onclick = (e) => {
                if (e.target === modal) this.closeLightbox();
            };
        }
        img.src = imgSrc;
        modal.classList.add('active');
    }

    closeLightbox() {
        const modal = document.getElementById('galleryLightboxModal');
        if (modal) modal.classList.remove('active');
    }

    // RSVP & Wishes submission
    submitRSVP(e) {
        if (e) e.preventDefault();
        const nameInput = document.getElementById('rsvpGuestName');
        const attendanceSelect = document.getElementById('rsvpAttendance');
        const countSelect = document.getElementById('rsvpGuestsCount');
        const msgInput = document.getElementById('rsvpMessage');

        const name = (nameInput?.value || '').trim();
        const attendance = attendanceSelect?.value || 'Hadir';
        const count = countSelect?.value || '1';
        const msg = (msgInput?.value || '').trim();

        if (!name || !msg) {
            alert('Silakan lengkapi nama dan ucapan Anda.');
            return;
        }

        const newWish = {
            name: name,
            attendance: attendance,
            count: count,
            message: msg,
            date: 'Baru saja'
        };

        this.appendWishToWall(newWish);

        // Kirim ke backend jika dalam mode live online
        const slug = this.options.slug || new URLSearchParams(window.location.search).get('slug') || '';
        if (slug) {
            fetch('/api/submit-rsvp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug, name, attendance, guestsCount: count, message: msg })
            }).catch(e => console.warn('RSVP live sync notice:', e));
        }

        // Reset form
        if (msgInput) msgInput.value = '';
        alert('Terima kasih! Doa dan ucapan Anda telah tersampaikan.');
    }

    appendWishToWall(wish) {
        const wall = document.getElementById('invitationWishesWall');
        if (!wall) return;

        const wishEl = document.createElement('div');
        wishEl.className = 'wish-item';
        wishEl.innerHTML = `
            <div class="wish-author">
                <span>${this.escapeHtml(wish.name)}</span>
                <span class="wish-attendance-badge">${this.escapeHtml(wish.attendance)}</span>
            </div>
            <div class="wish-date">${wish.date || 'Baru saja'}</div>
            <div class="wish-text">${this.escapeHtml(wish.message)}</div>
        `;

        wall.insertBefore(wishEl, wall.firstChild);
    }

    setupEventListeners() {
        const openBtn = document.getElementById('btnOpenInvitation');
        if (openBtn) {
            openBtn.onclick = () => this.openInvitation();
        }

        const rsvpForm = document.getElementById('invitationRsvpForm');
        if (rsvpForm) {
            rsvpForm.onsubmit = (e) => this.submitRSVP(e);
        }
    }

    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// Global initialization helper
window.initWeddingInvitation = function(data, options) {
    window.invitationEngine = new WeddingInvitationEngine(data, options);
    return window.invitationEngine;
};
