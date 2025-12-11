// ===================================================================
// SIMPLE PAGE-LEVEL ACCESS CONTROL
// Show all menu items, handle access at page level
// ===================================================================

(function() {
    'use strict';
    
    console.log('🔐 Page-Level Access Control Active');
    
    // Supabase config
    const SUPABASE_URL = 'https://yglehirjsxaxvrpfbvse.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnbGVoaXJqc3hheHZycGZidnNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjA4MDU0MCwiZXhwIjoyMDc3NjU2NTQwfQ.Gkvs5_Upf0WVnuC7BM9rOyGI2GyaR1Ar4tYMXoIa_g8';
    
    async function checkPageAccess() {
        const currentUser = JSON.parse(localStorage.getItem('hms_user'));
        
        if (!currentUser) {
            console.log('⚠️ No user - redirecting to login');
            window.location.href = 'admin-login.html';
            return;
        }
        
        const currentPage = window.location.pathname.split('/').pop();
        console.log('📄 Page:', currentPage, '| User:', currentUser.name, '| Role:', currentUser.role);
        
        if (currentPage === 'admin-login.html' || currentPage === 'admin-dashboard.html') {
            console.log('✅ Public page - access granted');
            return;
        }
        
        try {
            const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            
            const pageName = currentPage.replace('admin-', '').replace('.html', '');
            
            const { data, error } = await client
                .from('role_permissions')
                .select('can_view')
                .eq('role', currentUser.role)
                .eq('page', pageName)
                .single();
            
            if (error || !data || !data.can_view) {
                console.warn('❌ ACCESS DENIED');
                
                // Show nice error message
                showAccessDenied(currentUser.role, pageName);
                
                // Redirect after 2 seconds
                setTimeout(() => {
                    window.location.href = 'admin-dashboard.html';
                }, 2000);
                
                return;
            }
            
            console.log('✅ ACCESS GRANTED');
            
        } catch (e) {
            console.error('Access check error:', e);
        }
    }
    
    function showAccessDenied(role, page) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;
        
        overlay.innerHTML = `
            <div style="
                background: white;
                padding: 40px;
                border-radius: 12px;
                text-align: center;
                max-width: 500px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            ">
                <div style="font-size: 60px; margin-bottom: 20px;">🔒</div>
                <h2 style="color: #d32f2f; margin: 0 0 15px 0;">Access Denied</h2>
                <p style="color: #666; margin: 0 0 10px 0;">
                    You don't have permission to access the <strong>${page}</strong> page.
                </p>
                <p style="color: #999; font-size: 14px; margin: 0 0 25px 0;">
                    Your role: <strong>${role}</strong>
                </p>
                <p style="color: #666; font-size: 14px;">
                    Redirecting to dashboard...
                </p>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }
    
    // Run check on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkPageAccess);
    } else {
        checkPageAccess();
    }
    
})();