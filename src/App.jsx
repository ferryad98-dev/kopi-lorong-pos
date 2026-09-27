import React, { useState, useEffect } from 'react';

// Data Menu Bawaan (Hanya dipakai jika memori HP masih kosong)
const INITIAL_MENU = [
  { id: 'k1', name: 'Tubruk Hitam', category: 'Kopi', price: 7000, stock: '' },
  { id: 'k2', name: 'Tubruk Susu', category: 'Kopi', price: 8000, stock: '' },
  { id: 'k3', name: 'Tubruk Jahe', category: 'Kopi', price: 10000, stock: '' },
  { id: 'k4', name: 'Kopi Hitam Racik', category: 'Kopi', price: 6000, stock: '' },
  { id: 'k5', name: 'Kopi Susu Racik', category: 'Kopi', price: 7000, stock: '' },
  { id: 't1', name: 'Wedang Jahe', category: 'Tradisional', price: 7000, stock: '' },
  { id: 't2', name: 'Wedang Jahe Sereh', category: 'Tradisional', price: 8000, stock: '' },
  { id: 't3', name: 'Susu Jahe', category: 'Tradisional', price: 7000, stock: '' },
  { id: 't4', name: 'Susu Jahe Sereh', category: 'Tradisional', price: 8000, stock: '' },
  { id: 't5', name: 'Jeruk', category: 'Tradisional', price: 5000, stock: '' },
  { id: 't6', name: 'Teh Manis / Tawar', category: 'Tradisional', price: 4000, stock: '' },
  { id: 's1', name: 'Kapal Api', category: 'Sachet', price: 5000, stock: '' },
  { id: 's2', name: 'Goodday', category: 'Sachet', price: 5000, stock: '' },
  { id: 's3', name: 'TOP Coffee', category: 'Sachet', price: 5000, stock: '' },
  { id: 's4', name: 'Luwak White Koffie', category: 'Sachet', price: 5000, stock: '' },
  { id: 's5', name: 'Indomilk', category: 'Sachet', price: 5000, stock: '' },
  { id: 's6', name: 'Milo', category: 'Sachet', price: 5000, stock: '' },
  { id: 's7', name: 'Nutrisari', category: 'Sachet', price: 5000, stock: '' },
  { id: 's8', name: 'Joshua', category: 'Sachet', price: 10000, stock: '' },
  { id: 'm1', name: 'Indomie Goreng', category: 'Makanan', price: 5000, stock: '' },
  { id: 'm2', name: 'Indomie Rebus', category: 'Makanan', price: 5000, stock: '' },
  { id: 'm3', name: '+ Nasi', category: 'Makanan', price: 3000, stock: '' },
  { id: 'm4', name: '+ Telur', category: 'Makanan', price: 3000, stock: '' },
  { id: 'm5', name: '+ Sosis', category: 'Makanan', price: 3000, stock: '' },
  { id: 'm6', name: '+ Bakso', category: 'Makanan', price: 3000, stock: '' },
];

// URL GOOGLE APPS SCRIPT (SUDAH DIPERBARUI)
const URL_SHEET = 'https://script.google.com/macros/s/AKfycbzqe6pUMq-vIL0O8FD4BMbCBgMAPMKprEf3vQs6pOq8V18Or1ZPRFwKcUMdtRnG4qJk/exec';

// Pembaca localStorage yang aman (app tidak crash walau data tersimpan rusak/korup)
function loadJSON(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    console.warn('Data lokal rusak, dipakai bawaan:', key, e);
    return fallback;
  }
}

export default function App() {
  // === STATE DATABASE (MEMORI HP / LOCAL STORAGE) ===
  const [menuItems, setMenuItems] = useState(() => loadJSON('kl_menu', INITIAL_MENU));
  const [transactions, setTransactions] = useState(() => loadJSON('kl_tx', []));
  const [receiptConfig, setReceiptConfig] = useState(() => loadJSON('kl_receipt', {
    address: 'Jalan Pengayoman 117',
    wifiSsid: 'KOPI LORONG',
    wifiPass: 'kopimanis',
    socialMedia: 'IG: @kopilorongmalang',
    footerMessage: '* Terima Kasih *'
  }));

  // AUTO-SAVE SETIAP ADA PERUBAHAN
  useEffect(() => { localStorage.setItem('kl_menu', JSON.stringify(menuItems)); }, [menuItems]);
  useEffect(() => { localStorage.setItem('kl_tx', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('kl_receipt', JSON.stringify(receiptConfig)); }, [receiptConfig]);

  // === STATE UI & KASIR ===
  const [viewMode, setViewMode] = useState('pos'); // 'pos' atau 'dashboard'
  const [dashboardTab, setDashboardTab] = useState('menu'); // 'menu', 'stock', 'report', 'receipt'
  
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Semua');
  
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('select'); // 'select' atau 'cash'
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  
  // Custom states untuk notifikasi dan konfirmasi hapus
  const [syncStatus, setSyncStatus] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  // === DERIVED DATA ===
  const categories = ['Semua', ...new Set(menuItems.map(item => item.category))];
  const filteredMenu = activeCategory === 'Semua' ? menuItems : menuItems.filter(m => m.category === activeCategory);
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // === FUNGSI KASIR (POS) ===
  const addToCart = (item) => {
    if (item.stock !== '' && parseInt(item.stock) <= 0) return; // Stok habis
    
    const existingItem = cart.find(c => c.id === item.id);
    const currentQty = existingItem ? existingItem.qty : 0;
    
    if (item.stock !== '' && currentQty >= parseInt(item.stock)) return; // Melebihi stok

    if (existingItem) {
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
  };

  const updateCartQty = (id, delta) => {
    const item = cart.find(c => c.id === id);
    if (!item) return;
    const newQty = item.qty + delta;
    if (newQty <= 0) {
      setCart(cart.filter(c => c.id !== id));
    } else {
      // Cek stok sebelum tambah
      const menuItem = menuItems.find(m => m.id === id);
      if (delta > 0 && menuItem && menuItem.stock !== '' && newQty > parseInt(menuItem.stock)) return;
      setCart(cart.map(c => c.id === id ? { ...c, qty: newQty } : c));
    }
  };

  const startCheckout = (method) => {
    setPaymentMethod(method);
    if (method === 'CASH') {
      setCheckoutStep('cash');
      setCashAmount(cartTotal.toString()); // Set default ke uang pas
    } else {
      finalizeTransaction('QRIS', 0, 0);
    }
  };

  const handleCashSubmit = () => {
    const cash = parseInt(cashAmount.replace(/\D/g, '')) || 0;
    if (cash >= cartTotal) {
      finalizeTransaction('CASH', cash, cash - cartTotal);
    }
  };

  const finalizeTransaction = async (method, cash, change) => {
    const txId = `KL-${Math.floor(100000 + Math.random() * 900000)}`;
    const txDate = new Date();

    const newTx = {
      id: txId,
      timestamp: txDate.toISOString(),
      displayDate: txDate.toLocaleString('id-ID'),
      items: cart,
      total: cartTotal,
      method: method,
      cash: cash,
      change: change
    };

    // 1. Potong Stok Menu
    let updatedMenu = [...menuItems];
    cart.forEach(cartItem => {
       const idx = updatedMenu.findIndex(m => m.id === cartItem.id);
       if (idx !== -1 && updatedMenu[idx].stock !== '') {
          updatedMenu[idx].stock = Math.max(0, parseInt(updatedMenu[idx].stock) - cartItem.qty).toString();
       }
    });
    setMenuItems(updatedMenu);

    // 2. Simpan Transaksi ke Memori HP
    setTransactions([newTx, ...transactions]);

    // 3. Kirim ke Google Sheets
    // CATATAN: mode 'no-cors' = request tetap terkirim, tapi respons tidak bisa dibaca.
    // Content-Type sengaja text/plain karena pada mode no-cors browser menolak
    // header application/json (header-nya dibuang diam-diam oleh browser).
    try {
      await fetch(URL_SHEET, {
        method: 'POST',
        mode: 'no-cors', // Penting agar tidak terblokir Google CORS
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          timestamp: txDate.toLocaleString('id-ID'),
          iso: txDate.toISOString(), // waktu presisi untuk sorting & backup
          orderId: txId,
          total: cartTotal,
          paymentMethod: method,
          itemsString: cart.map(i => `${i.qty}x ${i.name}`).join(", ")
        })
      });
    } catch(e) { console.error("Koneksi gagal ke Spreadsheet", e); }

    // 4. Print Thermal & Reset
    setTimeout(() => {
       window.print();
       setCart([]);
       setShowCheckout(false);
       setCheckoutStep('select');
       setPaymentMethod('');
       setCashAmount('');
    }, 300);
  };

  // Tarik transaksi dari Google Sheets, lalu GABUNGKAN dengan transaksi lokal
  // (yang belum sempat terunggah tidak hilang, tidak ada yang dobel)
  const handleSyncData = async () => {
    setSyncStatus('Menarik data...');
    try {
      const res = await fetch(URL_SHEET);
      const data = await res.json();
      if (data && data.status === 'ok' && Array.isArray(data.transactions)) {
        const localIds = new Set(transactions.map(t => t.id));
        const fromServer = data.transactions
          .filter(t => t.id && !localIds.has(t.id))
          .map(t => ({ ...t, total: Number(t.total) || 0 }));

        const merged = [...transactions, ...fromServer].sort((a, b) => {
          const ta = a.ts || Date.parse(a.timestamp) || 0;
          const tb = b.ts || Date.parse(b.timestamp) || 0;
          return tb - ta; // terbaru di atas
        });

        setTransactions(merged);
        setSyncStatus(fromServer.length > 0
          ? `Berhasil ✓ (+${fromServer.length} dari web)`
          : 'Berhasil ✓ (sudah sinkron)');
      } else {
        setSyncStatus('Gagal ✕ (respon server tidak dikenal)');
      }
    } catch (e) {
      console.error(e);
      setSyncStatus('Gagal ✕ (cek deployment Apps Script)');
    }
    setTimeout(() => setSyncStatus(''), 3000);
  };

  const handleMenuChange = (id, field, value) => {
    setMenuItems(menuItems.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const moveMenu = (index, direction) => {
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === menuItems.length - 1) return;
    const newMenu = [...menuItems];
    const temp = newMenu[index];
    newMenu[index] = newMenu[index + direction];
    newMenu[index + direction] = temp;
    setMenuItems(newMenu);
  };

  const addMenu = () => {
    setMenuItems([...menuItems, { id: 'm'+Date.now(), name: 'Menu Baru', category: 'Lainnya', price: 0, stock: '' }]);
  };

  const deleteMenu = (id) => {
    setMenuItems(menuItems.filter(m => m.id !== id));
    setItemToDelete(null);
  };

  const handleReceiptChange = (field, value) => {
    setReceiptConfig({...receiptConfig, [field]: value});
  };

  const resetDailyData = () => {
    setTransactions([]);
    setConfirmReset(false);
  };

  return (
    <div className="app-root flex flex-col h-screen bg-gray-50 text-gray-800 font-sans">
      
      {/* =======================================
          STYLING UNTUK PRINTER THERMAL 58MM
          (FIX: .print-block sekarang benar-benar
           muncul saat print — sebelumnya class ini
           tidak pernah didefinisikan, sehingga
           struk tercetak BLANK karena Tailwind
           class "hidden" tidak pernah di-override)
      ======================================= */}
      <style>{`
        @media print {
          @page { margin: 0; size: 58mm auto; }
          html, body { width: 58mm; margin: 0; padding: 2mm; background-color: white; color: black; }
          .app-root { height: auto !important; min-height: 0 !important; overflow: visible !important; }
          .print-hidden { display: none !important; }
          .print-block { display: block !important; }
        }
      `}</style>

      {/* HEADER UTAMA */}
      <header className="bg-[#2b1b17] text-white p-4 shadow-md flex items-center justify-between z-10 print-hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-[#2b1b17]">KL</div>
          <h1 className="text-xl font-bold tracking-wider">KOPI LORONG</h1>
        </div>
        <button 
          onClick={() => setViewMode(viewMode === 'pos' ? 'dashboard' : 'pos')}
          className="bg-white/20 px-4 py-2 rounded-lg text-sm font-bold border border-white/30 hover:bg-white/30 transition-colors"
        >
          {viewMode === 'pos' ? '⚙️ Dashboard' : '← Mode Kasir'}
        </button>
      </header>

      {/* =======================================
          MODE KASIR (POS)
      ======================================= */}
      {viewMode === 'pos' && (
        <>
          {/* TAB KATEGORI */}
          <div className="bg-white border-b overflow-x-auto print-hidden scrollbar-hide">
            <div className="flex p-2 gap-2 w-max">
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-[#8b5a2b] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* GRID MENU */}
          <main className="flex-1 overflow-y-auto p-3 pb-40 print-hidden">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredMenu.map(item => {
                const isOutOfStock = item.stock !== '' && parseInt(item.stock) <= 0;
                return (
                  <button 
                    key={item.id} 
                    onClick={() => addToCart(item)}
                    disabled={isOutOfStock}
                    className={`relative p-3 rounded-xl shadow-sm border flex flex-col items-start text-left transition-all ${isOutOfStock ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-white border-gray-200 hover:border-[#8b5a2b] active:bg-[#f3e5d8] active:scale-95'}`}
                  >
                    <span className="text-[10px] font-bold text-[#8b5a2b] mb-1 uppercase tracking-wide bg-orange-50 px-2 py-0.5 rounded">{item.category}</span>
                    <span className="text-sm font-bold mb-2 leading-tight">{item.name}</span>
                    <div className="mt-auto flex justify-between w-full items-end">
                      <span className="text-sm font-mono text-gray-700">Rp {item.price.toLocaleString('id-ID')}</span>
                      {item.stock !== '' && (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 rounded">Sisa: {item.stock}</span>
                      )}
                    </div>
                    {isOutOfStock && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] rounded-xl">
                        <span className="bg-red-500 text-white font-bold px-3 py-1 rounded border-2 border-red-700 transform -rotate-12 text-sm shadow-md">HABIS</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </main>

          {/* KERANJANG (CART) BAWAH */}
          {cart.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)] print-hidden z-20">
              <div className="max-h-[30vh] overflow-y-auto mb-3 space-y-2 pr-2">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border">
                    <div className="flex-1 truncate pr-2">
                      <div className="font-bold text-sm truncate">{item.name}</div>
                      <div className="text-xs text-gray-500">Rp {(item.price * item.qty).toLocaleString('id-ID')}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateCartQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white border rounded shadow-sm font-bold text-lg hover:bg-gray-100">-</button>
                      <span className="w-4 text-center font-bold">{item.qty}</span>
                      <button onClick={() => updateCartQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-white border rounded shadow-sm font-bold text-lg hover:bg-gray-100">+</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-500 font-bold">Total ({cart.reduce((s, i) => s + i.qty, 0)} item)</span>
                <span className="text-xl font-black text-[#8b5a2b]">Rp {cartTotal.toLocaleString('id-ID')}</span>
              </div>
              <button 
                onClick={() => setShowCheckout(true)}
                className="w-full bg-[#2b1b17] hover:bg-[#1a100d] text-white py-3.5 rounded-xl font-bold text-lg active:scale-[0.98] transition-transform shadow-lg"
              >
                LANJUT PEMBAYARAN
              </button>
            </div>
          )}
        </>
      )}

      {/* =======================================
          MODE DASHBOARD (KELOLA DATA)
      ======================================= */}
      {viewMode === 'dashboard' && (
        <div className="flex-1 flex flex-col bg-gray-100 print-hidden overflow-hidden">
          {/* Dashboard Tabs */}
          <div className="bg-white border-b flex overflow-x-auto shadow-sm">
            {[
              { id: 'menu', label: '📋 Daftar Menu' },
              { id: 'stock', label: '📦 Kelola Stok' },
              { id: 'report', label: '📊 Laporan Harian' },
              { id: 'receipt', label: '🖨️ Seting Struk' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setDashboardTab(tab.id)}
                className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${dashboardTab === tab.id ? 'border-[#8b5a2b] text-[#8b5a2b]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            
            {/* TAB: DAFTAR MENU */}
            {dashboardTab === 'menu' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 flex justify-between items-center border-b">
                  <h3 className="font-bold">Daftar Harga & Menu</h3>
                  <button onClick={addMenu} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm hover:bg-green-700">+ Menu Baru</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="p-3">Nama Menu</th>
                        <th className="p-3">Kategori</th>
                        <th className="p-3">Harga (Rp)</th>
                        <th className="p-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuItems.map((item, index) => (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="p-2"><input type="text" value={item.name} onChange={(e) => handleMenuChange(item.id, 'name', e.target.value)} className="w-full p-2 border rounded focus:ring-1 focus:ring-[#8b5a2b] bg-white"/></td>
                          <td className="p-2"><input type="text" value={item.category} onChange={(e) => handleMenuChange(item.id, 'category', e.target.value)} className="w-full p-2 border rounded focus:ring-1 focus:ring-[#8b5a2b] bg-white"/></td>
                          <td className="p-2"><input type="number" value={item.price} onChange={(e) => handleMenuChange(item.id, 'price', parseInt(e.target.value)||0)} className="w-24 p-2 border rounded focus:ring-1 focus:ring-[#8b5a2b] bg-white"/></td>
                          <td className="p-2">
                            <div className="flex justify-center items-center gap-1">
                              <button onClick={() => moveMenu(index, -1)} className="p-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors">↑</button>
                              <button onClick={() => moveMenu(index, 1)} className="p-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors">↓</button>
                              
                              {/* Custom Delete Confirm Box */}
                              {itemToDelete === item.id ? (
                                <div className="flex gap-1 items-center ml-2 border bg-red-50 p-1 rounded">
                                  <button onClick={() => deleteMenu(item.id)} className="px-2 py-1 bg-red-600 text-white font-bold rounded text-xs">Yakin?</button>
                                  <button onClick={() => setItemToDelete(null)} className="px-2 py-1 bg-gray-400 text-white font-bold rounded text-xs">Batal</button>
                                </div>
                              ) : (
                                <button onClick={() => setItemToDelete(item.id)} className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded transition-colors">✕</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: KELOLA STOK */}
            {dashboardTab === 'stock' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 max-w-2xl mx-auto">
                <div className="mb-4">
                  <h3 className="font-bold text-lg">Kelola Stok Menu</h3>
                  <p className="text-xs text-gray-500">Kosongkan kotak angka jika menu tidak perlu dihitung stoknya (selalu ada).</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {menuItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                      <div>
                        <div className="font-bold text-sm">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.category}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500">SISA:</span>
                        <input 
                          type="number" 
                          placeholder="~"
                          value={item.stock}
                          onChange={(e) => handleMenuChange(item.id, 'stock', e.target.value)}
                          className="w-16 p-2 border border-gray-300 rounded-md text-center font-bold focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: LAPORAN HARIAN */}
            {dashboardTab === 'report' && (
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col justify-center items-center">
                    <span className="text-sm font-bold text-gray-500 mb-1">TOTAL OMZET</span>
                    <span className="text-2xl font-black text-green-600">Rp {transactions.reduce((sum, tx) => sum + tx.total, 0).toLocaleString('id-ID')}</span>
                    <span className="text-xs text-gray-400 mt-1">{transactions.length} Transaksi</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col justify-center items-center">
                    <div className="w-full flex justify-between text-sm mb-2"><span className="font-bold text-gray-600">💵 CASH:</span> <span>Rp {transactions.filter(t=>t.method==='CASH').reduce((s,t)=>s+t.total,0).toLocaleString('id-ID')}</span></div>
                    <div className="w-full flex justify-between text-sm border-t pt-2"><span className="font-bold text-gray-600">📱 QRIS:</span> <span>Rp {transactions.filter(t=>t.method==='QRIS').reduce((s,t)=>s+t.total,0).toLocaleString('id-ID')}</span></div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="p-4 bg-gray-50 flex flex-wrap gap-2 justify-between items-center border-b">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold">Riwayat Transaksi Hari Ini</h3>
                      <button onClick={handleSyncData} className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold rounded-lg transition-colors">
                        <span>🔄 Sinkron dari Web</span>
                      </button>
                      {syncStatus && <span className="text-xs text-blue-600 font-semibold">{syncStatus}</span>}
                    </div>
                    
                    {/* Custom Konfirmasi Hapus Data Laporan */}
                    {confirmReset ? (
                      <div className="flex gap-2 bg-red-50 p-1 rounded-lg border">
                         <span className="text-xs font-bold text-red-600 flex items-center px-2">Hapus?</span>
                         <button onClick={resetDailyData} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold">Ya</button>
                         <button onClick={() => setConfirmReset(false)} className="text-xs bg-gray-400 text-white px-3 py-1.5 rounded-lg font-bold">Batal</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmReset(true)} className="text-xs bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1.5 rounded-lg font-bold transition-colors">Reset / Kosongkan</button>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 border-b text-gray-500">
                        <tr><th className="p-3">Waktu</th><th className="p-3">Order ID</th><th className="p-3">Metode</th><th className="p-3">Total (Rp)</th></tr>
                      </thead>
                      <tbody>
                        {transactions.length === 0 ? <tr><td colSpan="4" className="p-4 text-center text-gray-500">Belum ada transaksi</td></tr> : 
                          transactions.map(tx => (
                            <tr key={tx.id} className="border-b hover:bg-gray-50 transition-colors">
                              <td className="p-3 text-xs">{tx.displayDate || tx.timestamp}</td>
                              <td className="p-3 text-xs font-mono">{tx.id}</td>
                              <td className="p-3"><span className={`px-2 py-1 text-[10px] font-bold rounded ${tx.method === 'CASH' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{tx.method}</span></td>
                              <td className="p-3 font-bold">{tx.total.toLocaleString('id-ID')}</td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SETING STRUK */}
            {dashboardTab === 'receipt' && (
              <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border p-5">
                <h3 className="font-bold text-lg mb-4 text-center">Desain Struk Thermal</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Alamat Kedai / Cabang</label>
                    <input type="text" value={receiptConfig.address} onChange={(e) => handleReceiptChange('address', e.target.value)} className="w-full p-2 border rounded-md focus:ring-1 focus:ring-[#8b5a2b] bg-gray-50 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">WIFI SSID</label>
                      <input type="text" value={receiptConfig.wifiSsid} onChange={(e) => handleReceiptChange('wifiSsid', e.target.value)} className="w-full p-2 border rounded-md focus:ring-1 focus:ring-[#8b5a2b] bg-gray-50 text-sm" placeholder="Kosongkan jika tidak ada" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">WIFI Password</label>
                      <input type="text" value={receiptConfig.wifiPass} onChange={(e) => handleReceiptChange('wifiPass', e.target.value)} className="w-full p-2 border rounded-md focus:ring-1 focus:ring-[#8b5a2b] bg-gray-50 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Sosial Media</label>
                    <input type="text" value={receiptConfig.socialMedia} onChange={(e) => handleReceiptChange('socialMedia', e.target.value)} className="w-full p-2 border rounded-md focus:ring-1 focus:ring-[#8b5a2b] bg-gray-50 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Pesan Penutup</label>
                    <input type="text" value={receiptConfig.footerMessage} onChange={(e) => handleReceiptChange('footerMessage', e.target.value)} className="w-full p-2 border rounded-md focus:ring-1 focus:ring-[#8b5a2b] bg-gray-50 text-sm" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =======================================
          MODAL CHECKOUT (PEMBAYARAN)
      ======================================= */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 print-hidden">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header Modal */}
            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
              <div>
                <h2 className="font-bold text-lg leading-tight">Total Tagihan</h2>
                <div className="text-2xl font-black text-[#8b5a2b]">Rp {cartTotal.toLocaleString('id-ID')}</div>
              </div>
              <button onClick={() => setShowCheckout(false)} className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600 hover:bg-gray-300 transition-colors">✕</button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto">
              {/* STEP 1: PILIH METODE */}
              {checkoutStep === 'select' && (
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => startCheckout('CASH')} className="flex flex-col items-center justify-center gap-3 bg-white hover:bg-green-50 text-green-700 border-2 border-green-200 hover:border-green-500 p-6 rounded-xl transition-all shadow-sm">
                    <span className="text-3xl">💵</span><span className="font-black text-lg">CASH</span>
                  </button>
                  <button onClick={() => startCheckout('QRIS')} className="flex flex-col items-center justify-center gap-3 bg-white hover:bg-blue-50 text-blue-700 border-2 border-blue-200 hover:border-blue-500 p-6 rounded-xl transition-all shadow-sm">
                    <span className="text-3xl">📱</span><span className="font-black text-lg">QRIS</span>
                  </button>
                </div>
              )}

              {/* STEP 2: INPUT UANG CASH */}
              {checkoutStep === 'cash' && (
                <div className="space-y-4">
                  <div className="text-center font-bold text-gray-500 mb-2">Uang Diterima:</div>
                  <input 
                    type="text" 
                    value={cashAmount} 
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="w-full text-center text-3xl font-black p-4 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none bg-gray-50"
                    placeholder="0"
                  />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button onClick={() => setCashAmount(cartTotal.toString())} className="bg-gray-100 p-3 rounded-lg font-bold text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors">Uang Pas</button>
                    <button onClick={() => setCashAmount('100000')} className="bg-gray-100 p-3 rounded-lg font-bold text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors">100.000</button>
                    <button onClick={() => setCashAmount('50000')} className="bg-gray-100 p-3 rounded-lg font-bold text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors">50.000</button>
                    <button onClick={() => setCashAmount('20000')} className="bg-gray-100 p-3 rounded-lg font-bold text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors">20.000</button>
                  </div>

                  {/* Kalkulator Kembalian */}
                  <div className="mt-6 p-4 rounded-xl text-center bg-gray-50 border">
                    <div className="text-sm font-bold text-gray-500 mb-1">Kembalian</div>
                    <div className={`text-2xl font-black ${(parseInt(cashAmount.replace(/\D/g, ''))||0) >= cartTotal ? 'text-green-600' : 'text-red-500'}`}>
                      {((parseInt(cashAmount.replace(/\D/g, ''))||0) - cartTotal) >= 0 ? `Rp ${((parseInt(cashAmount.replace(/\D/g, ''))||0) - cartTotal).toLocaleString('id-ID')}` : 'Uang Kurang'}
                    </div>
                  </div>

                  <button 
                    onClick={handleCashSubmit}
                    disabled={(parseInt(cashAmount.replace(/\D/g, ''))||0) < cartTotal}
                    className="w-full bg-green-600 disabled:bg-gray-300 text-white py-4 rounded-xl font-bold text-lg active:scale-95 transition-all mt-4 shadow-md"
                  >
                    SELESAIKAN & CETAK STRUK
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =======================================
          TEMPLATE PRINT THERMAL 58MM
          (Hanya muncul di kertas saat print)
      ======================================= */}
      <div className="hidden print-block font-mono text-[12px] leading-tight text-black w-full">
        {/* Header Struk */}
        <div className="text-center mb-3">
          <h2 className="font-bold text-[16px] tracking-widest leading-none mb-1">KOPI LORONG</h2>
          <p className="text-[10px]">{receiptConfig.address}</p>
          <p className="text-[10px]">{new Date().toLocaleString('id-ID')}</p>
        </div>
        
        <div className="border-b border-dashed border-black mb-2 pb-1"></div>

        {/* Item Pesanan */}
        <div className="mb-2">
          {cart.map((item, idx) => (
            <div key={idx} className="mb-1">
              <div className="w-full truncate">{item.name}</div>
              <div className="flex justify-between">
                <span>{item.qty} x {(item.price).toLocaleString('id-ID')}</span>
                <span>{(item.price * item.qty).toLocaleString('id-ID')}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-black pt-2 mb-2"></div>

        {/* Total & Pembayaran */}
        <div className="font-bold flex justify-between mb-1">
          <span>TOTAL</span>
          <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>Tipe Bayar</span>
          <span>{paymentMethod}</span>
        </div>

        {paymentMethod === 'CASH' && (
           <>
            <div className="flex justify-between">
              <span>Tunai</span>
              <span>Rp {(parseInt(cashAmount.replace(/\D/g, ''))||0).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between font-bold mt-1">
              <span>Kembali</span>
              <span>Rp {((parseInt(cashAmount.replace(/\D/g, ''))||0) - cartTotal).toLocaleString('id-ID')}</span>
            </div>
           </>
        )}

        <div className="border-t border-dashed border-black pt-2 mt-2"></div>

        {/* Footer Struk */}
        <div className="text-center mt-3 text-[10px]">
          <p className="font-bold mb-2">{receiptConfig.footerMessage}</p>
          {receiptConfig.wifiSsid && (
            <div className="mb-1">
              <p>WIFI: {receiptConfig.wifiSsid}</p>
              <p>Pass: {receiptConfig.wifiPass}</p>
            </div>
          )}
          {receiptConfig.socialMedia && (
            <p className="mt-2">{receiptConfig.socialMedia}</p>
          )}
          <p className="mt-2 text-white">.</p> {/* Spacer bawah kertas supaya putusnya pas */}
        </div>
      </div>

    </div>
  );
}
