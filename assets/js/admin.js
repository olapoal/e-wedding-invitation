// assets/js/admin.js
// Panel Pengelolaan Lisensi, Pengguna, Saldo Token & Undangan E-Wedding

class WeddingAdminPanel {
    constructor() {
        this.adminKey = sessionStorage.getItem('wedding_admin_key') || '';
        this.buyers = [];
        this.invitations = [];
        this.stats = { totalUsers: 0, totalTokensActive: 0, totalPublished: 0 };

        this.init();
    }

    init() {
        this.bindEvents();
        if (this.adminKey) {
            this.showDashboard();
            this.fetchData();
        } else {
            this.showLogin();
        }
    }

    bindEvents() {
        // Login form
        document.getElementById('adminLoginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const pass = document.getElementById('inputAdminPassword').value.trim();
            this.login(pass);
        });

        // Logout
        document.getElementById('btnAdminLogout')?.addEventListener('click', () => this.logout());

        // Add buyer modal submit
        document.getElementById('formAddBuyerModal')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddBuyer();
        });

        // Change password form submit
        document.getElementById('formChangePassword')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleChangePassword();
        });
    }

    showLogin() {
        document.getElementById('adminLoginSection').style.display = 'flex';
        document.getElementById('adminDashboardSection').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('adminLoginSection').style.display = 'none';
        document.getElementById('adminDashboardSection').style.display = 'block';
    }

    async login(pass) {
        const errorEl = document.getElementById('adminLoginError');
        if (errorEl) errorEl.style.display = 'none';

        try {
            const res = await fetch('/api/admin-manage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': pass
                },
                body: JSON.stringify({ action: 'list' })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                this.adminKey = pass;
                sessionStorage.setItem('wedding_admin_key', pass);
                this.buyers = data.buyers || [];
                this.showDashboard();
                this.renderBuyers();
                this.fetchStats();
                this.fetchInvitations();
            } else {
                if (errorEl) {
                    errorEl.textContent = data.message || 'Password Admin salah.';
                    errorEl.style.display = 'block';
                }
            }
        } catch (err) {
            // Offline demo admin fallback
            if (pass === 'admin12345') {
                this.adminKey = pass;
                sessionStorage.setItem('wedding_admin_key', pass);
                this.buyers = [
                    { email: 'olapoal.artgallery@gmail.com', name: 'Master Admin', tokens: 9999, publishedCount: 3, created_at: new Date().toISOString() },
                    { email: 'demo.pengantin@gmail.com', name: 'Demo Pengantin', tokens: 5, publishedCount: 1, created_at: new Date().toISOString() }
                ];
                this.showDashboard();
                this.renderBuyers();
                this.renderStats();
            } else {
                if (errorEl) {
                    errorEl.textContent = 'Gagal login. Periksa password Anda (default: admin12345).';
                    errorEl.style.display = 'block';
                }
            }
        }
    }

    logout() {
        this.adminKey = '';
        sessionStorage.removeItem('wedding_admin_key');
        this.showLogin();
    }

    async fetchData() {
        try {
            const res = await fetch('/api/admin-manage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': this.adminKey
                },
                body: JSON.stringify({ action: 'list' })
            });
            const data = await res.json();
            if (data.success) {
                this.buyers = data.buyers || [];
                this.renderBuyers();
            }
        } catch (e) {
            console.warn("fetchData notice:", e);
        }
    }

    async fetchStats() {
        try {
            const res = await fetch('/api/admin-manage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': this.adminKey
                },
                body: JSON.stringify({ action: 'get_stats' })
            });
            const data = await res.json();
            if (data.success) {
                this.stats = data.stats;
                this.renderStats();
            }
        } catch (e) {
            this.renderStats();
        }
    }

    async fetchInvitations() {
        try {
            const res = await fetch('/api/admin-manage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': this.adminKey
                },
                body: JSON.stringify({ action: 'list_invitations' })
            });
            const data = await res.json();
            if (data.success) {
                this.invitations = data.invitations || [];
                this.renderInvitations();
            }
        } catch (e) {}
    }

    renderStats() {
        let totalTokens = 0;
        let totalPub = 0;
        this.buyers.forEach(b => {
            totalTokens += (b.tokens || 0);
            totalPub += (b.publishedCount || 0);
        });

        const usersCountEl = document.getElementById('statTotalUsers');
        const tokensCountEl = document.getElementById('statTotalTokens');
        const pubCountEl = document.getElementById('statTotalPublished');

        if (usersCountEl) usersCountEl.textContent = this.buyers.length;
        if (tokensCountEl) tokensCountEl.textContent = totalTokens;
        if (pubCountEl) pubCountEl.textContent = totalPub;
    }

    renderBuyers() {
        const tbody = document.getElementById('buyersTableBody');
        if (!tbody) return;

        if (this.buyers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">Belum ada data pengguna lisensi terdaftar.</td></tr>';
            return;
        }

        tbody.innerHTML = this.buyers.map((b, idx) => `
            <tr>
                <td style="color: var(--text-muted);">${idx + 1}</td>
                <td>
                    <div style="font-weight: 700; color: #fff;">${this.escapeHtml(b.name || '-')}</div>
                    <div style="font-size: 0.8rem; color: #38bdf8;">${this.escapeHtml(b.email || '')}</div>
                </td>
                <td>
                    <span style="display: inline-flex; align-items: center; gap: 6px; background: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.4); color: #fbbf24; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 0.82rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#F59E0B" stroke="#D97706" stroke-width="1.5"/><circle cx="12" cy="12" r="7" stroke="#FDE68A" stroke-width="1" stroke-dasharray="2 2"/></svg>
                        ${b.tokens || 0} Token
                    </span>
                </td>
                <td>${b.publishedCount || (b.publishedSlugs ? b.publishedSlugs.length : 0)} Publikasi</td>
                <td style="font-size: 0.8rem; color: var(--text-muted);">${this.formatDate(b.created_at)}</td>
                <td>
                    <div style="display: flex; gap: 6px;">
                        <button type="button" class="btn-table-action" style="background: rgba(16, 185, 129, 0.2); color: #34d399;" onclick="window.adminPanel.modifyTokens('${b.email}', 1)" title="Tambah 1 Token">+1</button>
                        <button type="button" class="btn-table-action" style="background: rgba(251, 191, 36, 0.2); color: #fbbf24;" onclick="window.adminPanel.modifyTokens('${b.email}', 5)" title="Tambah 5 Token">+5</button>
                        <button type="button" class="btn-table-action" style="background: rgba(239, 68, 68, 0.2); color: #f87171;" onclick="window.adminPanel.modifyTokens('${b.email}', -1)" title="Kurangi 1 Token">-1</button>
                        <button type="button" class="btn-table-action" style="background: rgba(255, 255, 255, 0.1);" onclick="window.adminPanel.promptSetTokens('${b.email}', ${b.tokens || 0})" title="Atur Saldo Token">Set</button>
                    </div>
                </td>
            </tr>
        `).join('');

        this.renderStats();
    }

    renderInvitations() {
        const container = document.getElementById('invitationsListContainer');
        if (!container) return;

        if (this.invitations.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem; padding: 16px;">Belum ada undangan yang dipublish secara online.</p>';
            return;
        }

        container.innerHTML = this.invitations.map(inv => `
            <div class="dynamic-item-card" style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px;">
                <div>
                    <h4 style="color: #fff; font-size: 0.95rem;">Slug: <span style="color: #34d399;">/i/${this.escapeHtml(inv.slug)}</span></h4>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Pemilik: ${this.escapeHtml(inv.ownerEmail || '-')} &bull; Dilihat: ${inv.viewsCount || 0}x</p>
                </div>
                <div style="display: flex; gap: 8px;">
                    <a href="/invitation.html?slug=${encodeURIComponent(inv.slug)}" target="_blank" class="btn-navbar" style="padding: 6px 12px; font-size: 0.8rem;">
                        🌐 Lihat
                    </a>
                </div>
            </div>
        `).join('');
    }

    async modifyTokens(email, amount) {
        try {
            const res = await fetch('/api/admin-manage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': this.adminKey
                },
                body: JSON.stringify({ action: 'add_tokens', email, amount })
            });
            const data = await res.json();
            if (data.success) {
                const buyer = this.buyers.find(b => b.email === email);
                if (buyer) buyer.tokens = data.tokens;
                this.renderBuyers();
            } else {
                alert(data.message);
            }
        } catch (e) {
            // Local fallback
            const buyer = this.buyers.find(b => b.email === email);
            if (buyer) {
                buyer.tokens = Math.max(0, (buyer.tokens || 0) + amount);
                this.renderBuyers();
            }
        }
    }

    promptSetTokens(email, currentVal) {
        const input = prompt(`Masukkan jumlah saldo token baru untuk ${email}:`, currentVal);
        if (input !== null && !isNaN(parseInt(input, 10))) {
            const newAmount = parseInt(input, 10);
            fetch('/api/admin-manage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': this.adminKey
                },
                body: JSON.stringify({ action: 'set_tokens', email, amount: newAmount })
            }).then(r => r.json()).then(data => {
                const buyer = this.buyers.find(b => b.email === email);
                if (buyer) buyer.tokens = newAmount;
                this.renderBuyers();
            }).catch(() => {
                const buyer = this.buyers.find(b => b.email === email);
                if (buyer) {
                    buyer.tokens = newAmount;
                    this.renderBuyers();
                }
            });
        }
    }

    async handleAddBuyer() {
        const email = document.getElementById('inputAddBuyerEmail').value.trim();
        const name = document.getElementById('inputAddBuyerName').value.trim();
        const tokens = parseInt(document.getElementById('inputAddBuyerTokens').value || 1, 10);

        try {
            const res = await fetch('/api/admin-manage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': this.adminKey
                },
                body: JSON.stringify({ action: 'add_buyer', email, name, tokens })
            });
            const data = await res.json();
            if (data.success) {
                this.buyers.push({ email, name, tokens, created_at: new Date().toISOString() });
                this.renderBuyers();
                document.getElementById('addBuyerModal')?.classList.remove('active');
                alert(`Pengguna ${email} berhasil didaftarkan dengan ${tokens} token.`);
            } else {
                alert(data.message);
            }
        } catch (e) {
            this.buyers.push({ email, name, tokens, created_at: new Date().toISOString() });
            this.renderBuyers();
            document.getElementById('addBuyerModal')?.classList.remove('active');
            alert(`Mode Demo: Pengguna ${email} ditambahkan.`);
        }
    }

    async handleChangePassword() {
        const newPass = document.getElementById('inputNewAdminPassword').value.trim();
        if (!newPass) return;

        try {
            const res = await fetch('/api/admin-manage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': this.adminKey
                },
                body: JSON.stringify({ action: 'change_password', new_password: newPass })
            });
            const data = await res.json();
            if (data.success) {
                this.adminKey = newPass;
                sessionStorage.setItem('wedding_admin_key', newPass);
                alert('Password Admin berhasil diubah!');
                document.getElementById('changePassModal')?.classList.remove('active');
            } else {
                alert(data.message);
            }
        } catch (e) {
            alert('Gagal menghubungi server.');
        }
    }

    formatDate(iso) {
        if (!iso) return '-';
        try {
            const d = new Date(iso);
            return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (e) {
            return iso;
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

window.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new WeddingAdminPanel();
});
