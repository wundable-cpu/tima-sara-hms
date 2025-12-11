// ===================================================================
// ULTRA-SIMPLE ROLE-BASED ACCESS CONTROL
// No conflicts, no complexity
// ===================================================================

(function() {
    'use strict';
    
    console.log('🔐 Simple Access Control Loaded');
    
    // Add hiding CSS
    const style = document.createElement('style');
    style.id = 'hms-access-style';
    style.textContent = '.hms-hidden { display: none !important; }';
    document.head.appendChild(style);
    
    // Supabase config
    const SUPABASE_URL = 'https://yglehirjsxaxvrpfbvse.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnbGVoaXJqc3hheHZycGZidnNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjA4MDU0MCwiZXhwIjoyMDc3NjU2NTQwfQ.Gkvs5_Upf0WVnuC7BM9rOyGI2GyaR1Ar4tYMXoIa_g8';
    
    // Page mappings
    const PAGE_MAP = {
        'admin-dashboard.html': 'dashboard',
        'admin-reservations.html': 'reservations',
        'admin-guests.html': 'guests',
        'admin-rooms.html': 'rooms',
        'admin-housekeeping.html': 'housekeeping',
        'admin-pos.html': 'pos',
        'admin-menu.html': 'menu',
        'admin-analytics.html': 'analytics',
        'admin-reports.html': 'reports',
        'admin-invoices.html': 'invoices',
        'admin-communications.html': 'communications',
        'admin-whatsapp.html': 'whatsapp',
        'admin-sms.html': 'sms',
        'admin-settings.html': 'settings',
        '#': 'dashboard'
    };
    
    // Get current user
    function getCurrentUser() {
        const userStr = localStorage.getItem('hms_user');
        return userStr ? JSON.parse(userStr) : null;
    }
    
    // Get page name from href
    function getPageName(href) {
        if (!href || href === '') return null;
        const filename = href.split('/').pop().split('?')[0].split('#')[0];
        return PAGE_MAP[filename] || filename.replace('admin-', '').replace('.html', '');
    }
    
    // Load permissions
    async function loadPermissions(role) {
        try {
            const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            const { data, error } = await client
                .from('role_permissions')
                .select('*')
                .eq('role', role);
            
            if (error) {
                console.error('Permission load error:', error);
                return {};
            }
            
            const perms = {};
            data.forEach(p => {
                perms[p.page] = p.can_view;
            });
            
            console.log('✅ Loaded permissions:', Object.keys(perms).length, 'pages');
            return perms;
        } catch (e) {
            console.error('Permission exception:', e);
            return {};
        }
    }
    
    // Filter menu
    async function filterMenu() {
        const user = getCurrentUser();
        if (!user) {
            console.log('⚠️ No user - skipping filter');
            return;
        }
        
        console.log('🔍 Filtering for:', user.role);
        
        const permissions = await loadPermissions(user.role);
        
        // Find all nav items
        const links = document.querySelectorAll('.nav-item, .sidebar-nav a');
        console.log('📋 Found', links.length, 'links');
        
        let shown = 0;
        let hidden = 0;
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            const pageName = getPageName(href);
            
            if (!pageName) return;
            
            const canView = permissions[pageName];
            
            if (canView === undefined || canView === true) {
                // Show item
                link.classList.remove('hms-hidden');
                shown++;
                console.log('  ✅', pageName);
            } else {
                // Hide item
                link.classList.add('hms-hidden');
                hidden++;
                console.log('  🚫', pageName);
            }
        });
        
        console.log('📊 Done: Shown', shown, '| Hidden', hidden);
    }
    
    // Run when ready
    function init() {
        // Wait for page load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', run);
        } else {
            run();
        }
    }
    
    function run() {
        console.log('🚀 Running access control');
        
        // Wait a bit for everything to load
        setTimeout(() => {
            filterMenu();
        }, 500);
        
        // Also filter when sidebar opens
        const sidebarEl = document.querySelector('.sidebar');
        if (sidebarEl) {
            // Watch for class changes
            const observer = new MutationObserver(() => {
                if (sidebarEl.classList.contains('active')) {
                    console.log('📂 Sidebar opened - filtering');
                    setTimeout(filterMenu, 100);
                }
            });
            
            observer.observe(sidebarEl, { attributes: true, attributeFilter: ['class'] });
        }
    }
    
    // Start
    init();
    
})();