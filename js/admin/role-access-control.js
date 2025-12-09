// ===================================================================
// DATABASE-DRIVEN ROLE ACCESS CONTROL
// Reads permissions from role_permissions table in Supabase
// ===================================================================

console.log('🔐 DATABASE-DRIVEN ACCESS CONTROL LOADED');

// Cache for permissions (avoid repeated database calls)
let permissionsCache = null;
let currentUserRole = null;

/**
 * Get Supabase client (reuse existing or create new)
 */
async function getSupabaseClient() {
    if (typeof supabase !== 'undefined' && supabase && typeof supabase.from === 'function') {
        return supabase;
    }
    
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        return supabaseClient;
    }
    
    // Create new client
    const SUPABASE_URL = 'https://yglehirjsxaxvrpfbvse.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnbGVoaXJqc3hheHZycGZidnNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjA4MDU0MCwiZXhwIjoyMDc3NjU2NTQwfQ.Gkvs5_Upf0WVnuC7BM9rOyGI2GyaR1Ar4tYMXoIa_g8';
    
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

/**
 * Load user permissions from database
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
        
        // Convert to easier lookup format
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
 * Map page filenames to database page names
 */
function getPageName(filename) {
    // Remove .html extension
    const name = filename.replace('.html', '').replace('admin-', '');
    
    // Handle special cases
    const mappings = {
        'reservations-calendar': 'reservations',
        'pos': 'pos',
        'menu': 'menu'
    };
    
    return mappings[name] || name;
}

/**
 * Check if current user can access current page
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
    
    // Get current page
    const currentPage = window.location.pathname.split('/').pop();
    console.log('📄 Current page:', currentPage);
    
    // Login page always accessible
    if (currentPage === 'admin-login.html' || currentPage === 'index.html' || currentPage === '') {
        console.log('✅ Public page - access granted');
        return true;
    }
    
    // Load permissions if not cached or role changed
    if (!permissionsCache || currentUserRole !== currentUser.role) {
        permissionsCache = await loadUserPermissions(currentUser.role);
        currentUserRole = currentUser.role;
    }
    
    if (!permissionsCache) {
        console.error('❌ Could not load permissions - allowing access by default');
        return true;
    }
    
    // Map filename to page name
    const pageName = getPageName(currentPage);
    console.log('🗂️ Page name:', pageName);
    
    // Check permissions
    const pagePerms = permissionsCache[pageName];
    
    if (!pagePerms) {
        console.warn('⚠️ Page not in permissions table - allowing access by default');
        return true;
    }
    
    if (pagePerms.can_view) {
        console.log('✅ ACCESS GRANTED:', pageName, 'for role:', currentUser.role);
        
        // Store permissions in global for use by other scripts
        window.currentPagePermissions = pagePerms;
        
        return true;
    }
    
    // Access denied
    console.warn('❌ ACCESS DENIED:', pageName, 'for role:', currentUser.role);
    alert(`Access Denied!\n\nYou don't have permission to access this page.\n\nRole: ${currentUser.role}\nPage: ${pageName}`);
    
    // Redirect to dashboard or login
    if (pageName === 'dashboard') {
        // If even dashboard is denied, logout
        localStorage.removeItem('hms_user');
        window.location.href = 'admin-login.html';
    } else {
        window.location.href = 'admin-dashboard.html';
    }
    
    return false;
}

/**
 * Filter menu items based on permissions
 */
async function filterMenuByRole() {
    console.log('🔍 === FILTERING MENU ===');
    
    const currentUser = JSON.parse(localStorage.getItem('hms_user'));
    
    if (!currentUser) {
        console.log('⚠️ No user - skipping menu filter');
        return;
    }
    
    console.log('👤 Filtering menu for role:', currentUser.role);
    
    // Load permissions if not cached
    if (!permissionsCache || currentUserRole !== currentUser.role) {
        permissionsCache = await loadUserPermissions(currentUser.role);
        currentUserRole = currentUser.role;
    }
    
    if (!permissionsCache) {
        console.error('❌ Could not load permissions - showing all menu items');
        return;
    }
    
    console.log('📋 User has access to', Object.keys(permissionsCache).length, 'pages');
    
    // Find all menu links
    const selectors = [
        '.sidebar a',
        '.menu a',
        'nav a',
        '.menu-item a',
        '.nav-link',
        '.sidebar-link',
        'aside a',
        '.main-menu a'
    ];
    
    const allLinks = document.querySelectorAll(selectors.join(', '));
    console.log('🔗 Found', allLinks.length, 'menu links');
    
    if (allLinks.length === 0) {
        console.warn('⚠️ NO MENU LINKS FOUND! Menu may not be loaded yet.');
        return;
    }
    
    let hiddenCount = 0;
    let visibleCount = 0;
    
    allLinks.forEach((link, index) => {
        const href = link.getAttribute('href');
        if (!href || href === '#' || href === '') {
            return;
        }
        
        // Get filename and convert to page name
        const filename = href.split('/').pop().split('?')[0].split('#')[0];
        const pageName = getPageName(filename);
        
        // Check if user has view permission
        const hasPermission = permissionsCache[pageName]?.can_view;
        
        if (hasPermission) {
            // User can view this page - keep visible
            visibleCount++;
            console.log(`   ✅ ${pageName} - visible`);
        } else {
            // User cannot view - hide it
            hiddenCount++;
            console.log(`   🚫 ${pageName} - hiding`);
            
            link.style.display = 'none';
            
            // Hide parent elements
            const parentLi = link.closest('li');
            if (parentLi) {
                parentLi.style.display = 'none';
            }
            
            const parentMenuItem = link.closest('.menu-item, .nav-item');
            if (parentMenuItem) {
                parentMenuItem.style.display = 'none';
            }
        }
    });
    
    console.log('📊 Menu filtering complete:');
    console.log('   Visible:', visibleCount);
    console.log('   Hidden:', hiddenCount);
}

/**
 * Show/hide action buttons based on permissions
 */
function filterActionButtons() {
    if (!window.currentPagePermissions) {
        return;
    }
    
    const perms = window.currentPagePermissions;
    
    // Hide edit buttons if can't edit
    if (!perms.can_edit) {
        const editButtons = document.querySelectorAll('.btn-edit, [data-action="edit"], .edit-btn');
        editButtons.forEach(btn => btn.style.display = 'none');
    }
    
    // Hide delete buttons if can't delete
    if (!perms.can_delete) {
        const deleteButtons = document.querySelectorAll('.btn-delete, [data-action="delete"], .delete-btn');
        deleteButtons.forEach(btn => btn.style.display = 'none');
    }
    
    console.log('✅ Action buttons filtered:', 
                'Edit:', perms.can_edit ? 'visible' : 'hidden',
                'Delete:', perms.can_delete ? 'visible' : 'hidden');
}

/**
 * Initialize access control
 */
async function initializeAccessControl() {
    console.log('🚀 === INITIALIZING DATABASE-DRIVEN ACCESS CONTROL ===');
    
    // Check page access
    const hasAccess = await checkPageAccess();
    
    if (hasAccess) {
        // Filter menu (wait a bit for menu to load)
        setTimeout(async () => {
            await filterMenuByRole();
            filterActionButtons();
        }, 200);
    }
    
    console.log('✅ Access control initialization complete');
    console.log('═══════════════════════════════════════\n');
}

// Run on page load
document.addEventListener('DOMContentLoaded', initializeAccessControl);

// Also run immediately if DOM already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAccessControl);
} else {
    initializeAccessControl();
}