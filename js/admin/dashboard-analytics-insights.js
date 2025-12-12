// ===================================================================
// DASHBOARD ANALYTICS INSIGHTS (CORRECTED - Uses guest_charges)
// Exposes functions globally for compatibility
// ===================================================================

console.log('📊 Loading Dashboard Analytics Insights...');

// Wait for page to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInsights);
} else {
    initInsights();
}

function initInsights() {
    // Wait for supabase to be available
    setTimeout(() => {
        console.log('🔄 Starting insights load...');
        loadDashboardInsights();
    }, 1000);
}

// Main loader function
async function loadDashboardInsights() {
    try {
        console.log('📥 Fetching dashboard insights...');
        
        await Promise.all([
            loadGuestInsights(),
            loadTopSellingItems()
        ]);
        
        console.log('✅ Dashboard insights loaded successfully');
    } catch (error) {
        console.error('❌ Error loading dashboard insights:', error);
    }
}

// ===================================================================
// GUEST INSIGHTS
// ===================================================================

async function loadGuestInsights() {
    try {
        console.log('👥 Loading guest insights...');
        
        // Check if supabase is available
        if (typeof supabase === 'undefined') {
            console.warn('⚠️ Supabase not yet available, retrying...');
            setTimeout(loadGuestInsights, 1000);
            return;
        }
        
        // Fetch all bookings
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error fetching bookings:', error);
            throw error;
        }
        
        console.log('📥 Loaded', bookings.length, 'bookings');
        
        // Calculate metrics
        const guestEmails = {};
        let totalNights = 0;
        
        bookings.forEach(booking => {
            const email = booking.guest_email;
            if (email) {
                guestEmails[email] = (guestEmails[email] || 0) + 1;
            }
            
            // Calculate nights
            const checkIn = new Date(booking.check_in_date);
            const checkOut = new Date(booking.check_out_date);
            const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
            if (nights > 0) {
                totalNights += nights;
            }
        });
        
        // New vs Returning Guests
        const emailCounts = Object.values(guestEmails);
        const newGuests = emailCounts.filter(count => count === 1).length;
        const returningGuests = emailCounts.filter(count => count > 1).length;
        
        // Average Stay Duration
        const avgStay = bookings.length > 0 ? (totalNights / bookings.length).toFixed(1) : 0;
        
        // Update UI
        const newGuestsEl = document.getElementById('newGuestsCount');
        const returningGuestsEl = document.getElementById('returningGuestsCount');
        const avgStayEl = document.getElementById('avgStayDuration');
        
        if (newGuestsEl) newGuestsEl.textContent = newGuests;
        if (returningGuestsEl) returningGuestsEl.textContent = returningGuests;
        if (avgStayEl) avgStayEl.textContent = `${avgStay} nights`;
        
        console.log('✅ Guest insights updated:', { newGuests, returningGuests, avgStay });
        
    } catch (error) {
        console.error('❌ Error loading guest insights:', error);
        
        // Show error in UI
        const newGuestsEl = document.getElementById('newGuestsCount');
        const returningGuestsEl = document.getElementById('returningGuestsCount');
        const avgStayEl = document.getElementById('avgStayDuration');
        
        if (newGuestsEl) newGuestsEl.textContent = 'Error';
        if (returningGuestsEl) returningGuestsEl.textContent = 'Error';
        if (avgStayEl) avgStayEl.textContent = 'Error';
    }
}

// ===================================================================
// TOP SELLING ITEMS (Using guest_charges table like Analytics page)
// ===================================================================

async function loadTopSellingItems() {
    try {
        console.log('🏆 Loading top selling items...');
        
        // Check if supabase is available
        if (typeof supabase === 'undefined') {
            console.warn('⚠️ Supabase not yet available, retrying...');
            setTimeout(loadTopSellingItems, 1000);
            return;
        }
        
        const container = document.getElementById('topSellingItems');
        if (!container) {
            console.warn('⚠️ topSellingItems container not found');
            return;
        }
        
        // Fetch guest charges (F&B data) - SAME AS ANALYTICS PAGE
        const { data: charges, error } = await supabase
            .from('guest_charges')
            .select('*')
            .order('charge_date', { ascending: false });
        
        if (error) {
            console.error('Error fetching guest charges:', error);
            throw error;
        }
        
        console.log('📥 Loaded', charges.length, 'guest charges');
        
        if (charges.length === 0) {
            container.innerHTML = `
                <p style="text-align: center; color: #94a3b8; padding: 30px; font-size: 14px;">
                    📊 No F&B sales data available yet
                </p>
            `;
            return;
        }
        
        // Group by item and calculate totals (SAME LOGIC AS ANALYTICS PAGE)
        const items = {};
        
        charges.forEach(charge => {
            const itemName = charge.item_description;
            const category = charge.category || 'Restaurant';
            
            if (itemName && itemName.trim()) {
                if (!items[itemName]) {
                    items[itemName] = {
                        name: itemName,
                        quantity: 0,
                        revenue: 0,
                        category: category
                    };
                }
                items[itemName].quantity += parseInt(charge.quantity || 1);
                items[itemName].revenue += parseFloat(charge.total_amount || 0);
            }
        });
        
        // Convert to array and sort by revenue
        const topItems = Object.values(items)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);
        
        if (topItems.length === 0) {
            container.innerHTML = `
                <p style="text-align: center; color: #94a3b8; padding: 30px; font-size: 14px;">
                    📊 No items found in sales data
                </p>
            `;
            return;
        }
        
        // Display items with beautiful styling
        container.innerHTML = topItems.map((item, index) => `
            <div class="top-item" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 14px 16px;
                margin-bottom: 10px;
                background: ${index < 3 ? '#fffbeb' : '#f9fafb'};
                border-radius: 10px;
                border-left: 4px solid ${index < 3 ? '#f59e0b' : '#e5e7eb'};
                transition: all 0.2s ease;
                cursor: default;
            " onmouseenter="this.style.transform='translateX(5px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)';" 
               onmouseleave="this.style.transform='translateX(0)'; this.style.boxShadow='none';">
                <div style="display: flex; align-items: center; gap: 14px; flex: 1;">
                    <span style="
                        font-weight: 700;
                        font-size: 15px;
                        color: ${index < 3 ? '#f59e0b' : '#9ca3af'};
                        min-width: 28px;
                    ">#${index + 1}</span>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #1f2937; font-size: 14px; margin-bottom: 3px;">
                            ${item.name}
                        </div>
                        <div style="font-size: 12px; color: #6b7280;">
                            ${item.category} • ${item.quantity} sold
                        </div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 700; color: #059669; font-size: 15px;">
                        ₵${item.revenue.toFixed(2)}
                    </div>
                </div>
            </div>
        `).join('');
        
        console.log('✅ Top selling items updated:', topItems.length, 'items');
        
    } catch (error) {
        console.error('❌ Error loading top selling items:', error);
        
        const container = document.getElementById('topSellingItems');
        if (container) {
            container.innerHTML = `
                <p style="text-align: center; color: #ef4444; padding: 30px; font-size: 14px;">
                    ❌ Error loading sales data
                </p>
            `;
        }
    }
}

// Expose functions globally for compatibility
window.loadGuestInsights = loadGuestInsights;
window.loadTopSellingItems = loadTopSellingItems;
window.loadDashboardInsights = loadDashboardInsights;

console.log('✅ Dashboard insights functions ready');