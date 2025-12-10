// ===================================================================
// SIMPLIFIED CLASS-BASED ACCESS CONTROL
// Uses CSS classes instead of inline styles
// ===================================================================

console.log('🔐 CLASS-BASED ACCESS CONTROL LOADED');

// Add CSS for hiding
const style = document.createElement('style');
style.textContent = `
    .hms-hidden {
        display: none !important;
    }
`;
document.head.appendChild(style);

// Cache for permissions
let permissionsCache = null;
let currentUserRole = null;

/**
 * Get Supabase client
 */
async function getSupabaseClient() {
    if (typeof supabase !== 'undefined' && supabase && typeof supabase.from === 'function') {
        return supabase;
    }
    
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        return supabaseClient;
    }
    
    const SUPABASE_URL = 'https://yglehirjsxaxvrpfbvse.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnbGVoaXJqc3hheHZycGZidnNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjA4MDU0MCwiZXhwIjoyMDc3NjU2NTQwfQ.Gkvs5_Upf0WVnuC7BM9rOyGI2GyaR1Ar4tYMXoIa_g8';
    
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

/**
 * Load permissions
 */
async function loadUserPermissions(userRole) {
    console.log('📥 Loading permissions for role:', userRole);
    
    try {
        const client = await getSupabaseClient();
        
        const { data, error } = await client
            .from('role_permissions')
            .select('*')
            .eq('role', userRole);
        
        if (error) {
            console.error('❌ Error loading permissions:', error);
            return null;
        }
        
        console.log('✅ Loaded', data.length, 'permissions for', userRole);
        
        const permissions = {};
        data.forEach(perm => {
            permissions[perm.page] = {
                can_view: perm.can_view,
                can_edit: perm.can_edit,
                can_delete: perm.can_delete
            };
        });
        
        return permissions;
        
    } catch (error) {
        console.error('❌ Exception loading permissions:', error);
        return null;
    }
}

/**
 * Map filename to page name
 */
function getPageName(href) {
    if (href.startsWith('http://') || href.startsWith('https://')) {
        if (!href.includes('timasarahotel.com')) {
            return null;
        }
    }
    
    let filename = href.split('/').pop().split('?')[0].split('#')[0];
    
    if (!filename || filename === '') {
        return null;
    }
    
    filename = filename.replace('.html', '').replace('admin-', '');
    
    const mappings = {
        'reservations-calendar': 'reservations',
        'calendar': 'reservations',
        'index': 'dashboard',
        '': 'dashboard'
    };
    
    return mappings[filename] || filename;
}

/**
 * Check page access
 */
async function checkPageAccess() {
    console.log('🔍 === CHECKING PAGE ACCESS ===');
    
    const currentUser = JSON.parse(localStorage.getItem('hms_user'));
    
    if (!currentUser) {
        console.warn('⚠️ No user logged in - redirecting to login');
        window.location.href = 'admin-login.html';
        return false;
    }
    
    console.log('👤 Current user:', currentUser.name || currentUser.full_name, '| Role:', currentUser.role);
    
    const currentPage = window.location.pathname.split('/').pop();
    console.log('📄 Current page:', currentPage);
    
    if (currentPage === 'admin-login.html' || currentPage === 'index.html' || currentPage === '') {
        console.log('✅ Public page - access granted');
        return true;
    }
    
    if (!permissionsCache || currentUserRole !== currentUser.role) {
        permissionsCache = await loadUserPermissions(currentUser.role);
        currentUserRole = currentUser.role;
    }
    
    if (!permissionsCache) {
        console.error('❌ Could not load permissions - allowing access by default');
        return true;
    }
    
    const pageName = getPageName(currentPage);
    console.log('🗂️ Page name:', pageName);
    
    const pagePerms = permissionsCache[pageName];
    
    if (!pagePerms) {
        console.warn('⚠️ Page not in permissions table - allowing access by default');
        return true;
    }
    
    if (pagePerms.can_view) {
        console.log('✅ ACCESS GRANTED:', pageName, 'for role:', currentUser.role);
        window.currentPagePermissions = pagePerms;
        return true;
    }
    
    console.warn('❌ ACCESS DENIED:', pageName, 'for role:', currentUser.role);
    alert(`Access Denied!\n\nYou don't have permission to access this page.\n\nRole: ${currentUser.role}\nPage: ${pageName}`);
    
    if (pageName === 'dashboard') {
        localStorage.removeItem('hms_user');
        window.location.href = 'admin-login.html';
    } else {
        window.location.href = 'admin-dashboard.html';
    }
    
    return false;
}

/**
 * Filter menu - CLASS-BASED APPROACH
 */
async function filterMenuByRole() {
    console.log('🔍 === FILTERING MENU (CLASS-BASED) ===');
    
    const currentUser = JSON.parse(localStorage.getItem('hms_user'));
    
    if (!currentUser) {
        console.log('⚠️ No user - skipping menu filter');
        return;
    }
    
    console.log('👤 Filtering menu for role:', currentUser.role);
    
    if (!permissionsCache || currentUserRole !== currentUser.role) {
        permissionsCache = await loadUserPermissions(currentUser.role);
        currentUserRole = currentUser.role;
    }
    
    if (!permissionsCache) {
        console.error('❌ Could not load permissions - showing all menu items');
        return;
    }
    
    console.log('📋 User has access to', Object.keys(permissionsCache).length, 'pages');
    
    // Find all menu items - focus on nav-item class
    const allLinks = document.querySelectorAll('.nav-item, .sidebar-nav a, .sidebar a, .menu a, nav a');
    console.log('🔗 Found', allLinks.length, 'menu links');
    
    if (allLinks.length === 0) {
        console.warn('⚠️ NO MENU LINKS FOUND!');
        return;
    }
    
    let hiddenCount = 0;
    let visibleCount = 0;
    
    allLinks.forEach((link, index) => {
        const href = link.getAttribute('href');
        if (!href || href === '#' || href === '') {
            return;
        }
        
        const pageName = getPageName(href);
        
        if (pageName === null) {
            visibleCount++;
            console.log(`   ℹ️ External link - keeping visible`);
            return;
        }
        
        if (permissionsCache[pageName] === undefined) {
            visibleCount++;
            console.log(`   ⚠️ ${pageName} - not in permissions - showing by default`);
            link.classList.remove('hms-hidden');
            return;
        }
        
        const hasPermission = permissionsCache[pageName]?.can_view;
        
        if (hasPermission) {
            visibleCount++;
            console.log(`   ✅ ${pageName} - VISIBLE`);
            link.classList.remove('hms-hidden');
        } else {
            hiddenCount++;
            console.log(`   🚫 ${pageName} - HIDING`);
            link.classList.add('hms-hidden');
        }
    });
    
    console.log('📊 Menu filtering complete:');
    console.log('   Visible:', visibleCount);
    console.log('   Hidden:', hiddenCount);
    console.log('💡 Use hamburger menu to open sidebar and see filtered items');
}

/**
 * Filter action buttons
 */
function filterActionButtons() {
    if (!window.currentPagePermissions) {
        return;
    }
    
    const perms = window.currentPagePermissions;
    
    if (!perms.can_edit) {
        const editButtons = document.querySelectorAll('.btn-edit, [data-action="edit"], .edit-btn');
        editButtons.forEach(btn => btn.classList.add('hms-hidden'));
    }
    
    if (!perms.can_delete) {
        const deleteButtons = document.querySelectorAll('.btn-delete, [data-action="delete"], .delete-btn');
        deleteButtons.forEach(btn => btn.classList.add('hms-hidden'));
    }
    
    console.log('✅ Action buttons filtered');
}

/**
 * Initialize - with retry logic
 */
async function initializeAccessControl() {
    console.log('🚀 === INITIALIZING ACCESS CONTROL ===');
    
    const hasAccess = await checkPageAccess();
    
    if (hasAccess) {
        let attempts = 0;
        const maxAttempts = 10;
        
        const waitAndFilter = async () => {
            attempts++;
            
            const menuExists = document.querySelectorAll('.nav-item, .sidebar-nav a').length > 0;
            
            if (menuExists) {
                console.log('✅ Menu found - filtering now');
                await filterMenuByRole();
                filterActionButtons();
            } else if (attempts < maxAttempts) {
                console.log(`⏳ Menu not found - retry ${attempts}/${maxAttempts}`);
                setTimeout(waitAndFilter, 300);
            } else {
                console.warn('⚠️ Menu not found after 10 attempts');
            }
        };
        
        setTimeout(waitAndFilter, 200);
    }
    
    console.log('✅ Access control initialized');
    console.log('═══════════════════════════════════════\n');
}

// Run on load
document.addEventListener('DOMContentLoaded', initializeAccessControl);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAccessControl);
} else {
    initializeAccessControl();
}

// Force show EVERYTHING
const sidebar = document.querySelector('.sidebar');
const nav = document.querySelector('.sidebar-nav');
const items = document.querySelectorAll('.nav-item');

sidebar.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: fixed !important; left: 0 !important; top: 0 !important; width: 250px !important; height: 100vh !important; transform: none !important;';

nav.style.cssText = 'display: flex !important; flex-direction: column !important; visibility: visible !important; opacity: 1 !important; height: auto !important; max-height: none !important; overflow: visible !important;';

items.forEach(item => {
    item.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important; position: relative !important; height: auto !important;';
});

console.log('FORCED EVERYTHING VISIBLE - Check sidebar NOW!');