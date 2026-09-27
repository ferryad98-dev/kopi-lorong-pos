import React, { useState, useEffect, useMemo } from 'react';

// Data Menu Kopi Lorong sesuai gambar
const MENU_DATA = [
  // KOPI
  { id: 'k1', name: 'Tubruk Hitam', category: 'Kopi', price: 7000 },
  { id: 'k2', name: 'Tubruk Susu', category: 'Kopi', price: 8000 },
  { id: 'k3', name: 'Tubruk Jahe', category: 'Kopi', price: 10000 },
  { id: 'k4', name: 'Kopi Hitam Racik', category: 'Kopi', price: 6000 },
  { id: 'k5', name: 'Kopi Susu Racik', category: 'Kopi', price: 7000 },
  // TRADISIONAL
  { id: 't1', name: 'Wedang Jahe', category: 'Tradisional', price: 7000 },
  { id: 't2', name: 'Wedang Jahe Sereh', category: 'Tradisional', price: 8000 },
  { id: 't3', name: 'Susu Jahe', category: 'Tradisional', price: 7000 },
  { id: 't4', name: 'Susu Jahe Sereh', category: 'Tradisional', price: 8000 },
  { id: 't5', name: 'Jeruk', category: 'Tradisional', price: 5000 },
  { id: 't6', name: 'Teh Manis / Tawar', category: 'Tradisional', price: 4000 },
  // SACHET
  { id: 's1', name: 'Kapal Api', category: 'Sachet', price: 5000 },
  { id: 's2', name: 'Goodday', category: 'Sachet', price: 5000 },
  { id: 's3', name: 'TOP Coffee', category: 'Sachet', price: 5000 },
  { id: 's4', name: 'Luwak White Koffie', category: 'Sachet', price: 5000 },
  { id: 's5', name: 'Indomilk', category: 'Sachet', price: 5000 },
  { id: 's6', name: 'Milo', category: 'Sachet', price: 5000 },
  { id: 's7', name: 'Nutrisari', category: 'Sachet', price: 5000 },
  { id: 's8', name: 'Joshua', category: 'Sachet', price: 10000 },
  // MAKANAN
  { id: 'm1', name: 'Indomie Goreng', category: 'Makanan', price: 5000 },
  { id: 'm2', name: 'Indomie Rebus', category: 'Makanan', price: 5000 },
  { id: 'm3', name: '+ Nasi', category: 'Makanan', price: 3000 },
  { id: 'm4', name: '+ Telur', category: 'Makanan', price: 3000 },
  { id: 'm5', name: '+ Sosis', category: 'Makanan', price: 3000 },
  { id: 'm6', name: '+ Bakso', category: 'Makanan', price: 3000 },
];

export default function PosKopiLorong() {
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State baru untuk input nominal uang dan kalkulasi kembalian
  const [checkoutStep, setCheckoutStep] = useState('select'); // 'select' | 'cash'
  const [cashAmount, setCashAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  // State baru untuk Manajemen Menu Dinamis
  const [menuItems, setMenuItems] = useState(MENU_DATA);
  const [viewMode, setViewMode] = useState('pos'); // 'pos' | 'admin_menu' | 'admin_stock' | 'admin_report'
  
  // State baru untuk Riwayat Transaksi & Pendapatan
  const [transactions, setTransactions] = useState([]);

  // State untuk Pengaturan Struk dengan Auto-Save (Local Storage)
  const [receiptConfig, setReceiptConfig] = useState(() => {
    // Cek apakah ada data tersimpan di HP kasir sebelumnya
    if (typeof window !== 'undefined') {
      const savedConfig = localStorage.getItem('kl_receiptConfig');
      if (savedConfig) {
        return JSON.parse(savedConfig);
      }
    }
    // Data default jika belum ada setingan
    return {
      address: 'Jalan Pengayoman 117',
      footerMessage: '* Terima Kasih *',
      wifiSsid: 'KOPI LORONG',
      wifiPass: 'kopimanis',
      socialMedia: 'IG: @kopilorongmalang'
    };
  });

  // Effect untuk Auto-save setiap ada perubahan teks pada pengaturan struk
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kl_receiptConfig', JSON.stringify(receiptConfig));
    }
  }, [receiptConfig]);

  // Mengambil kategori unik otomatis dari menu saat ini
  const CATEGORIES = useMemo(() => {
    const cats = Array.from(new Set(menuItems.map(item => item.category)));
    return ['Semua', ...cats];
  }, [menuItems]);

  // Menyuntikkan CSS khusus untuk printer thermal 58mm
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        @page {
          margin: 0;
          size: 58mm auto;
        }
        body {
          margin: 0;
          padding: 2mm;
          width: 58mm;
          font-family: monospace;
          color: black;
          background: white;
          -webkit-print-color-adjust: exact;
        }
        * {
          box-sizing: border-box;
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const filteredMenu = useMemo(() => {
    if (activeCategory === 'Semua') return menuItems;
    return menuItems.filter(item => item.category === activeCategory);
  }, [activeCategory, menuItems]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === id);
      if (existing.qty > 1) {
        return prev.map(c => c.id === id ? { ...c, qty: c.qty - 1 } : c);
      }
      return prev.filter(c => c.id !== id);
    });
  };

  const totalCart = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  const handlePayment = async (method) => {
    setIsProcessing(true);
    setPaymentMethod(method);
    
    const change = method === 'CASH' ? parseInt(cashAmount || 0) - totalCart : 0;
    
    const orderData = {
      orderId: `KL-${Date.now().toString().slice(-6)}`,
      total: totalCart,
      paymentMethod: method,
      cashGiven: method === 'CASH' ? parseInt(cashAmount || 0) : 0,
      change: change,
      timestamp: new Date().toLocaleString('id-ID'),
      items: cart
    };

    // Simpan ke riwayat transaksi & kurangi stok
    setTransactions(prev => [orderData, ...prev]);
    setMenuItems(prev => prev.map(menu => {
      const cartItem = cart.find(c => c.id === menu.id);
      if (cartItem && menu.stock !== '' && menu.stock !== undefined && menu.stock !== null) {
         return { ...menu, stock: Math.max(0, parseInt(menu.stock) - cartItem.qty).toString() };
      }
      return menu;
    }));

    // SIMULASI PENGIRIMAN DATA KE GOOGLE SHEETS
    console.log("Mengirim data ke Google Sheets:", orderData);
    // Di Vercel nanti, ganti dengan fetch ke Web App URL Google Apps Script Anda:
   await fetch('https://script.google.com/macros/s/AKfycbzqe6pUMq-vIL0O8FD4BMbCBgMAPMKprEf3vQs6pOq8V18Or1ZPRFwKcUMdtRnG4qJk/exec', { 
   method: 'POST', 
   body: JSON.stringify(orderData) 
});
    
    setTimeout(() => {
      setIsProcessing(false);
      setShowCheckout(false);
      setShowSuccess(true);
      
      // Membuka dialog print OS untuk thermal printer
      setTimeout(() => {
        window.print();
        // Reset keranjang dan state pembayaran setelah print
        setCart([]);
        setCheckoutStep('select');
        setCashAmount('');
        setTimeout(() => setShowSuccess(false), 2000);
      }, 500);
      
    }, 1000); // Simulasi delay jaringan
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8f5f0] text-gray-800 font-sans selection:bg-[#4a3020] selection:text-white">
      {/* 
        ========================================
        TAMPILAN UI KASIR (Disembunyikan saat print)
        ========================================
      */}
      <div className="flex-1 flex flex-col overflow-hidden print:hidden">
        {/* HEADER */}
        <header className="bg-[#2C1E16] text-[#F3E5D8] px-4 py-3 shadow-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-[#F3E5D8] flex items-center justify-center font-bold text-lg overflow-hidden bg-[#2C1E16]">
              {/* Logo KL */}
              <svg viewBox="0 0 100 100" className="w-full h-full p-1 fill-current">
                 <path d="M25 20 L40 20 L40 45 L65 20 L85 20 L55 50 L85 80 L65 80 L40 55 L40 80 L25 80 Z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-widest leading-none">KOPI LORONG</h1>
              <p className="text-[10px] text-[#A89078] tracking-widest uppercase mt-1">Point of Sales</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-right">
            <button 
              onClick={() => setViewMode(viewMode === 'pos' ? 'admin_menu' : 'pos')}
              className="bg-[#4a3020] hover:bg-[#382418] text-[#F3E5D8] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-[#a07c5a]/30 shadow-sm"
            >
              {viewMode === 'pos' ? '⚙️ Dashboard' : '← Mode Kasir'}
            </button>
            <div className="text-xs text-[#A89078] hidden sm:block">{new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
          </div>
        </header>

        {viewMode !== 'pos' ? (
          /* TAMPILAN DASHBOARD ADMIN (Tabs) */
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f8f5f0] print:hidden">
            <div className="max-w-4xl mx-auto pb-10">
              
              {/* TAB NAVIGATION */}
              <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar pb-1">
                <button 
                  onClick={() => setViewMode('admin_menu')} 
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${viewMode === 'admin_menu' ? 'bg-[#4a3020] text-white shadow-md' : 'bg-white text-[#7a604a] border border-[#e5dcd3] hover:bg-[#f0eadd]'}`}
                >📝 Kelola Menu</button>
                <button 
                  onClick={() => setViewMode('admin_stock')} 
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${viewMode === 'admin_stock' ? 'bg-[#4a3020] text-white shadow-md' : 'bg-white text-[#7a604a] border border-[#e5dcd3] hover:bg-[#f0eadd]'}`}
                >📦 Kelola Stok</button>
                <button 
                  onClick={() => setViewMode('admin_report')} 
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${viewMode === 'admin_report' ? 'bg-[#4a3020] text-white shadow-md' : 'bg-white text-[#7a604a] border border-[#e5dcd3] hover:bg-[#f0eadd]'}`}
                >📊 Laporan Harian</button>
                <button 
                  onClick={() => setViewMode('admin_receipt')} 
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${viewMode === 'admin_receipt' ? 'bg-[#4a3020] text-white shadow-md' : 'bg-white text-[#7a604a] border border-[#e5dcd3] hover:bg-[#f0eadd]'}`}
                >🖨️ Pengaturan Struk</button>
              </div>

              {/* TAB 1: KELOLA MENU */}
              {viewMode === 'admin_menu' && (
                <div className="animate-in fade-in">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-extrabold text-[#2C1E16]">Kelola Menu</h2>
                      <p className="text-sm text-[#7a604a] mt-1">Edit nama, kategori, dan harga. Perubahan otomatis tersinkron.</p>
                    </div>
                    <button 
                      onClick={() => {
                        const newItem = { id: `new_${Date.now()}`, name: '', category: 'Kopi', price: 0, stock: '' };
                        setMenuItems([newItem, ...menuItems]);
                      }}
                      className="bg-[#2C1E16] text-[#F3E5D8] px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-[#4a3020] transition-colors w-full sm:w-auto"
                    >
                      + Tambah Menu Baru
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-[#e5dcd3] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse whitespace-nowrap min-w-[500px]">
                        <thead>
                          <tr className="bg-[#f0eadd] text-[#7a604a] text-xs sm:text-sm uppercase tracking-wider">
                            <th className="p-3 sm:p-4 font-bold w-1/3">Nama Menu</th>
                            <th className="p-3 sm:p-4 font-bold w-1/4">Kategori</th>
                            <th className="p-3 sm:p-4 font-bold w-1/4">Harga (Rp)</th>
                            <th className="p-3 sm:p-4 font-bold text-center min-w-[120px]">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5dcd3]">
                          {menuItems.map((item, index) => (
                            <tr key={item.id} className="hover:bg-[#f8f5f0]/50 transition-colors focus-within:bg-[#f0eadd]/30">
                              <td className="p-2 sm:p-3">
                                <input 
                                  type="text" 
                                  value={item.name}
                                  onChange={(e) => setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, name: e.target.value } : m))}
                                  className="w-full bg-transparent border-b-2 border-transparent hover:border-[#e5dcd3] focus:border-[#4a3020] focus:outline-none py-1 text-[#2C1E16] font-semibold transition-colors"
                                  placeholder="Ketik Nama Menu"
                                />
                              </td>
                              <td className="p-2 sm:p-3">
                                <input 
                                  type="text" 
                                  value={item.category}
                                  onChange={(e) => setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, category: e.target.value } : m))}
                                  className="w-full bg-transparent border-b-2 border-transparent hover:border-[#e5dcd3] focus:border-[#4a3020] focus:outline-none py-1 text-[#7a604a] text-sm transition-colors"
                                  placeholder="Kategori"
                                />
                              </td>
                              <td className="p-2 sm:p-3">
                                <input 
                                  type="number" 
                                  value={item.price}
                                  onChange={(e) => setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, price: parseInt(e.target.value) || 0 } : m))}
                                  className="w-full bg-transparent border-b-2 border-transparent hover:border-[#e5dcd3] focus:border-[#4a3020] focus:outline-none py-1 text-[#2C1E16] font-mono transition-colors"
                                  placeholder="0"
                                />
                              </td>
                              <td className="p-2 sm:p-3">
                                <div className="flex justify-center items-center gap-1 sm:gap-2">
                                  <button 
                                    onClick={() => {
                                      if (index > 0) {
                                        setMenuItems(prev => {
                                          const newItems = [...prev];
                                          [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
                                          return newItems;
                                        });
                                      }
                                    }}
                                    disabled={index === 0}
                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-[#e5dcd3] text-[#4a3020] hover:bg-[#d5c7b8] disabled:opacity-30 flex items-center justify-center transition-colors font-bold"
                                    title="Geser ke Atas"
                                  >
                                    ↑
                                  </button>
                                  <button 
                                    onClick={() => {
                                      if (index < menuItems.length - 1) {
                                        setMenuItems(prev => {
                                          const newItems = [...prev];
                                          [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
                                          return newItems;
                                        });
                                      }
                                    }}
                                    disabled={index === menuItems.length - 1}
                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-[#e5dcd3] text-[#4a3020] hover:bg-[#d5c7b8] disabled:opacity-30 flex items-center justify-center transition-colors font-bold"
                                    title="Geser ke Bawah"
                                  >
                                    ↓
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setMenuItems(prev => prev.filter(m => m.id !== item.id));
                                      setCart(prev => prev.filter(c => c.id !== item.id)); 
                                    }}
                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-red-50 text-red-500 hover:bg-red-500 hover:text-white font-bold flex items-center justify-center transition-colors"
                                    title="Hapus Menu"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: KELOLA STOK */}
              {viewMode === 'admin_stock' && (
                <div className="animate-in fade-in slide-in-from-right-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-extrabold text-[#2C1E16]">Kelola Stok</h2>
                      <p className="text-sm text-[#7a604a] mt-1">Isi angka untuk membatasi stok. Kosongkan (hapus angkanya) untuk stok tak terbatas.</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-[#e5dcd3] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse whitespace-nowrap min-w-[500px]">
                        <thead>
                          <tr className="bg-[#f0eadd] text-[#7a604a] text-xs sm:text-sm uppercase tracking-wider">
                            <th className="p-3 sm:p-4 font-bold w-1/3">Nama Menu</th>
                            <th className="p-3 sm:p-4 font-bold w-1/4">Kategori</th>
                            <th className="p-3 sm:p-4 font-bold w-1/4">Sisa Stok</th>
                            <th className="p-3 sm:p-4 font-bold text-center w-1/4">Aksi Cepat</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5dcd3]">
                          {menuItems.map((item) => {
                            const isManaged = item.stock !== undefined && item.stock !== null && item.stock !== '';
                            return (
                            <tr key={item.id} className="hover:bg-[#f8f5f0]/50 transition-colors focus-within:bg-[#f0eadd]/30">
                              <td className="p-2 sm:p-4 font-bold text-[#2C1E16]">{item.name}</td>
                              <td className="p-2 sm:p-4 text-sm font-semibold text-[#a07c5a] uppercase">{item.category}</td>
                              <td className="p-2 sm:p-4">
                                <input 
                                  type="number" 
                                  value={isManaged ? item.stock : ''}
                                  onChange={(e) => setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, stock: e.target.value } : m))}
                                  className="w-full max-w-[120px] bg-white border-2 border-[#e5dcd3] focus:border-[#4a3020] rounded-lg py-1.5 px-3 text-[#2C1E16] font-mono font-bold transition-all outline-none"
                                  placeholder="∞ Unlimited"
                                />
                              </td>
                              <td className="p-2 sm:p-4">
                                <div className="flex justify-center gap-2">
                                  <button onClick={() => setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, stock: '0' } : m))} className="px-3 py-1.5 text-xs font-bold bg-red-100 text-red-600 rounded-lg hover:bg-red-500 hover:text-white transition-colors">Stok Habis</button>
                                  <button onClick={() => setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, stock: '' } : m))} className="px-3 py-1.5 text-xs font-bold bg-[#e5dcd3] text-[#4a3020] rounded-lg hover:bg-[#4a3020] hover:text-white transition-colors">Unlimited</button>
                                </div>
                              </td>
                            </tr>
                          )})}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: LAPORAN HARIAN */}
              {viewMode === 'admin_report' && (
                <div className="animate-in fade-in slide-in-from-right-4">
                  <div className="mb-6 flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-extrabold text-[#2C1E16]">Laporan Pendapatan</h2>
                      <p className="text-sm text-[#7a604a] mt-1">Ringkasan transaksi kasir hari ini.</p>
                    </div>
                    {transactions.length > 0 && (
                      <button onClick={() => { if(window.confirm('Yakin ingin mereset/menghapus data hari ini?')) setTransactions([]) }} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1 rounded-md transition-colors">
                        Reset Data
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl border border-[#e5dcd3] shadow-sm flex flex-col justify-between">
                      <div className="text-xs text-[#7a604a] font-bold mb-2 uppercase tracking-wide">Total Pendapatan</div>
                      <div className="text-xl sm:text-2xl font-black text-[#2C1E16]">Rp {transactions.reduce((s, t) => s + t.total, 0).toLocaleString('id-ID')}</div>
                    </div>
                    <div className="bg-[#4a3020]/5 p-4 rounded-xl border border-[#4a3020]/20 shadow-sm flex flex-col justify-between">
                      <div className="text-xs text-[#4a3020] font-bold mb-2 uppercase tracking-wide">Tunai (CASH)</div>
                      <div className="text-xl sm:text-2xl font-black text-[#4a3020]">Rp {transactions.filter(t => t.paymentMethod === 'CASH').reduce((s, t) => s + t.total, 0).toLocaleString('id-ID')}</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-sm flex flex-col justify-between">
                      <div className="text-xs text-blue-700 font-bold mb-2 uppercase tracking-wide">QRIS</div>
                      <div className="text-xl sm:text-2xl font-black text-blue-700">Rp {transactions.filter(t => t.paymentMethod === 'QRIS').reduce((s, t) => s + t.total, 0).toLocaleString('id-ID')}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-[#e5dcd3] shadow-sm flex flex-col justify-between">
                      <div className="text-xs text-[#7a604a] font-bold mb-2 uppercase tracking-wide">Total Order</div>
                      <div className="text-xl sm:text-2xl font-black text-[#2C1E16]">{transactions.length} Trx</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-[#e5dcd3] overflow-hidden">
                    <div className="px-4 py-3 bg-[#f0eadd] border-b border-[#e5dcd3]">
                      <h3 className="font-extrabold text-[#4a3020]">Riwayat Transaksi</h3>
                    </div>
                    <div className="overflow-x-auto">
                      {transactions.length === 0 ? (
                        <div className="p-8 text-center text-[#a07c5a] font-medium flex flex-col items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-20 mb-3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                          Belum ada transaksi tersimpan hari ini.
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                          <thead>
                            <tr className="text-[#7a604a] text-xs uppercase tracking-wider border-b border-[#e5dcd3]">
                              <th className="p-3 sm:p-4 font-bold">Waktu</th>
                              <th className="p-3 sm:p-4 font-bold">Order ID</th>
                              <th className="p-3 sm:p-4 font-bold">Metode</th>
                              <th className="p-3 sm:p-4 font-bold text-right">Total (Rp)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#e5dcd3]">
                            {transactions.map((tx, idx) => (
                              <tr key={idx} className="hover:bg-[#f8f5f0]/50 transition-colors">
                                <td className="p-3 sm:p-4 text-sm text-[#7a604a] font-medium">{tx.timestamp.split(' ')[1] || tx.timestamp}</td>
                                <td className="p-3 sm:p-4 text-sm font-mono font-bold text-[#2C1E16]">{tx.orderId}</td>
                                <td className="p-3 sm:p-4 text-sm font-bold">
                                  <span className={`px-2 py-1 rounded-md text-[10px] uppercase tracking-wider ${tx.paymentMethod === 'CASH' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{tx.paymentMethod}</span>
                                </td>
                                <td className="p-3 sm:p-4 text-sm font-black text-right text-[#4a3020]">{tx.total.toLocaleString('id-ID')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PENGATURAN STRUK */}
              {viewMode === 'admin_receipt' && (
                <div className="animate-in fade-in slide-in-from-right-4">
                  <div className="mb-6">
                    <h2 className="text-2xl font-extrabold text-[#2C1E16]">Pengaturan Struk</h2>
                    <p className="text-sm text-[#7a604a] mt-1">Sesuaikan informasi toko yang akan dicetak pada kertas thermal.</p>
                  </div>
                  
                  <div className="bg-white rounded-2xl shadow-sm border border-[#e5dcd3] p-5 sm:p-6 space-y-4 max-w-2xl">
                    <div>
                      <label className="text-sm font-bold text-[#7a604a] mb-1.5 block">Alamat Kedai</label>
                      <input 
                        type="text" 
                        value={receiptConfig.address}
                        onChange={(e) => setReceiptConfig({...receiptConfig, address: e.target.value})}
                        className="w-full bg-[#f8f5f0] border border-[#e5dcd3] focus:border-[#4a3020] rounded-xl py-2.5 px-4 text-[#2C1E16] font-semibold transition-colors outline-none"
                        placeholder="Contoh: Jl. Kopi Lorong No. 1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-[#7a604a] mb-1.5 block">Pesan Penutup (Footer)</label>
                      <input 
                        type="text" 
                        value={receiptConfig.footerMessage}
                        onChange={(e) => setReceiptConfig({...receiptConfig, footerMessage: e.target.value})}
                        className="w-full bg-[#f8f5f0] border border-[#e5dcd3] focus:border-[#4a3020] rounded-xl py-2.5 px-4 text-[#2C1E16] font-semibold transition-colors outline-none"
                        placeholder="Contoh: * Terima Kasih *"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-bold text-[#7a604a] mb-1.5 block">WIFI SSID (Opsional)</label>
                        <input 
                          type="text" 
                          value={receiptConfig.wifiSsid}
                          onChange={(e) => setReceiptConfig({...receiptConfig, wifiSsid: e.target.value})}
                          className="w-full bg-[#f8f5f0] border border-[#e5dcd3] focus:border-[#4a3020] rounded-xl py-2.5 px-4 text-[#2C1E16] font-semibold transition-colors outline-none"
                          placeholder="Kosongkan jika tidak ada"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-[#7a604a] mb-1.5 block">WIFI Password</label>
                        <input 
                          type="text" 
                          value={receiptConfig.wifiPass}
                          onChange={(e) => setReceiptConfig({...receiptConfig, wifiPass: e.target.value})}
                          className="w-full bg-[#f8f5f0] border border-[#e5dcd3] focus:border-[#4a3020] rounded-xl py-2.5 px-4 text-[#2C1E16] font-semibold transition-colors outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-[#7a604a] mb-1.5 block">Sosial Media (Opsional)</label>
                      <input 
                        type="text" 
                        value={receiptConfig.socialMedia}
                        onChange={(e) => setReceiptConfig({...receiptConfig, socialMedia: e.target.value})}
                        className="w-full bg-[#f8f5f0] border border-[#e5dcd3] focus:border-[#4a3020] rounded-xl py-2.5 px-4 text-[#2C1E16] font-semibold transition-colors outline-none"
                        placeholder="Contoh: IG: @kopilorongmalang"
                      />
                    </div>
                    
                    <div className="mt-6 p-4 bg-[#f0eadd] rounded-xl border border-[#e5dcd3]">
                      <p className="text-xs text-[#7a604a] font-semibold mb-2">Preview Potongan Bawah Struk:</p>
                      <div className="font-mono text-xs text-center text-black bg-white p-4 rounded-lg border border-dashed border-gray-400">
                        <p className="mb-1">{receiptConfig.footerMessage}</p>
                        {receiptConfig.wifiSsid && <p className="font-bold">WIFI: {receiptConfig.wifiSsid}</p>}
                        {receiptConfig.wifiSsid && receiptConfig.wifiPass && <p>Pass: {receiptConfig.wifiPass}</p>}
                        {receiptConfig.socialMedia && <p className="mt-2">{receiptConfig.socialMedia}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </main>
        ) : (
          <>
            {/* CATEGORY FILTER (Scrollable horizontal) */}
            <div className="bg-white shadow-sm shrink-0 border-b border-[#e5dcd3]">
              <div className="flex overflow-x-auto hide-scrollbar px-4 py-3 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                      activeCategory === cat 
                        ? 'bg-[#4a3020] text-white shadow-md' 
                        : 'bg-[#f0eadd] text-[#7a604a] hover:bg-[#e6decf]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* MENU GRID */}
            <main className="flex-1 overflow-y-auto p-4 pb-40">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredMenu.map(item => {
                  const cartItem = cart.find(c => c.id === item.id);
                  const isStockManaged = item.stock !== undefined && item.stock !== null && item.stock !== '';
                  const currentStock = isStockManaged ? parseInt(item.stock) : Infinity;
                  const isOutOfStock = isStockManaged && currentStock <= 0;
                  const currentQtyInCart = cartItem ? cartItem.qty : 0;
                  const canAddMore = !isStockManaged || (currentQtyInCart < currentStock);

                  return (
                    <div 
                      key={item.id} 
                      className={`bg-white rounded-2xl shadow-sm border border-[#e5dcd3] overflow-hidden flex flex-col h-full transition-all duration-200 ${isOutOfStock ? 'opacity-60 grayscale-[50%]' : 'active:scale-95'}`}
                    >
                      <button 
                        onClick={() => canAddMore && addToCart(item)}
                        disabled={isOutOfStock}
                        className="p-3 text-left flex-1 flex flex-col relative"
                      >
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center backdrop-blur-[1px]">
                            <span className="bg-red-600 text-white font-black px-4 py-1 rounded-lg text-sm rotate-[-12deg] shadow-lg border-2 border-white tracking-widest">HABIS</span>
                          </div>
                        )}
                        <span className="text-[10px] font-bold text-[#a07c5a] mb-1 uppercase tracking-wider">{item.category}</span>
                        <span className="text-sm font-bold text-[#2C1E16] mb-3 leading-snug">{item.name}</span>
                        
                        <div className="mt-auto flex items-center justify-between">
                          <span className="inline-block text-xs font-mono font-bold bg-[#f8f5f0] text-[#4a3020] px-2 py-1 rounded-md">
                            Rp {item.price.toLocaleString('id-ID')}
                          </span>
                          {isStockManaged && (
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-sm ${currentStock - currentQtyInCart <= 3 ? 'text-red-500 bg-red-50' : 'text-[#a07c5a] bg-[#f0eadd]'}`}>
                              Sisa: {currentStock - currentQtyInCart}
                            </span>
                          )}
                        </div>
                      </button>
                      
                      {cartItem && (
                        <div className="bg-[#4a3020] text-white flex items-center justify-between px-2 py-1 mt-auto relative z-20">
                           <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 text-lg font-bold">
                             -
                           </button>
                           <span className="font-bold">{cartItem.qty}</span>
                           <button onClick={() => canAddMore && addToCart(item)} className={`w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold ${!canAddMore ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20'}`}>
                             +
                           </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </main>
          </>
        )}
      </div>

      {/* BOTTOM CART BAR (Sticky) */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5dcd3] p-4 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] transition-transform duration-300 print:hidden ${cart.length > 0 && viewMode === 'pos' ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-end mb-3">
            <div>
              <div className="text-xs text-[#7a604a] font-semibold mb-1">Total Pesanan</div>
              <div className="font-bold text-[#2C1E16]">{totalItems} Item</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-[#4a3020]">Rp {totalCart.toLocaleString('id-ID')}</div>
            </div>
          </div>
          <button 
            onClick={() => {
              setShowCheckout(true);
              setCheckoutStep('select');
              setCashAmount('');
            }}
            className="w-full bg-[#4a3020] hover:bg-[#2C1E16] text-[#F3E5D8] py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors active:scale-95"
          >
            LANJUT PEMBAYARAN
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>
      </div>

      {/* MODAL CHECKOUT */}
      {showCheckout && (
        <div className="fixed inset-0 bg-[#2C1E16]/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 print:hidden transition-opacity">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-extrabold text-[#2C1E16]">
                {checkoutStep === 'select' ? 'Pilih Pembayaran' : 'Pembayaran Tunai'}
              </h2>
              <button 
                onClick={() => {
                  if (checkoutStep === 'cash') {
                    setCheckoutStep('select');
                  } else {
                    setShowCheckout(false);
                    setCheckoutStep('select');
                    setCashAmount('');
                  }
                }} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 font-bold hover:bg-gray-200"
              >
                {checkoutStep === 'cash' ? '←' : '✕'}
              </button>
            </div>
            
            <div className="bg-[#f8f5f0] p-4 rounded-xl mb-6 flex justify-between items-center border border-[#e5dcd3]">
              <span className="font-semibold text-[#7a604a]">Total Tagihan</span>
              <span className="text-2xl font-black text-[#4a3020]">Rp {totalCart.toLocaleString('id-ID')}</span>
            </div>

            {checkoutStep === 'select' ? (
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => {
                    setCheckoutStep('cash');
                    setCashAmount(totalCart.toString()); // Set default ke Uang Pas
                  }}
                  disabled={isProcessing}
                  className="relative flex flex-col items-center justify-center gap-3 bg-white text-[#2C1E16] border-2 border-[#4a3020] p-5 rounded-2xl font-bold text-lg hover:bg-[#f8f5f0] active:scale-95 transition-all disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
                  CASH
                </button>
                <button 
                  onClick={() => handlePayment('QRIS')}
                  disabled={isProcessing}
                  className="relative flex flex-col items-center justify-center gap-3 bg-[#4a3020] text-white border-2 border-[#4a3020] p-5 rounded-2xl font-bold text-lg shadow-lg shadow-[#4a3020]/20 hover:bg-[#2C1E16] active:scale-95 transition-all disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>
                  QRIS
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4">
                <div>
                  <label className="text-sm font-semibold text-[#7a604a] mb-2 block">Uang Diterima (Rp)</label>
                  <input 
                    type="number" 
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="w-full text-2xl font-black text-[#2C1E16] bg-white border-2 border-[#e5dcd3] rounded-xl p-4 focus:outline-none focus:border-[#4a3020] transition-colors"
                    placeholder="0"
                    autoFocus
                  />
                </div>
                
                {/* Tombol Sugesti Nominal Cepat */}
                <div className="grid grid-cols-3 gap-2">
                  {[totalCart, 20000, 50000, 100000]
                    .filter((val, idx, self) => val >= totalCart && self.indexOf(val) === idx)
                    .slice(0, 3)
                    .map(amount => (
                    <button 
                      key={amount}
                      onClick={() => setCashAmount(amount.toString())}
                      className="bg-[#f8f5f0] hover:bg-[#e5dcd3] text-[#4a3020] font-bold py-2 rounded-lg text-sm transition-colors border border-[#e5dcd3]"
                    >
                      {amount === totalCart ? 'Uang Pas' : `${amount / 1000}k`}
                    </button>
                  ))}
                </div>

                <div className="border-t border-dashed border-[#e5dcd3] my-2"></div>

                {/* Info Kembalian */}
                <div className="flex justify-between items-center bg-[#4a3020]/5 p-4 rounded-xl border border-[#4a3020]/10">
                  <span className="font-semibold text-[#4a3020]">Kembalian</span>
                  <span className={`text-xl font-black ${parseInt(cashAmount || 0) < totalCart ? 'text-red-500' : 'text-green-600'}`}>
                    Rp {Math.max(0, parseInt(cashAmount || 0) - totalCart).toLocaleString('id-ID')}
                  </span>
                </div>

                <button 
                  onClick={() => handlePayment('CASH')}
                  disabled={isProcessing || parseInt(cashAmount || 0) < totalCart}
                  className="w-full bg-[#4a3020] hover:bg-[#2C1E16] text-[#F3E5D8] py-4 rounded-xl font-bold text-lg mt-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  SELESAIKAN & CETAK STRUK
                </button>
              </div>
            )}
            
            {}
            {isProcessing && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-t-3xl sm:rounded-3xl flex flex-col items-center justify-center z-10">
                <div className="w-12 h-12 border-4 border-[#4a3020] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-[#4a3020]">Memproses...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 
        ========================================
        AREA STRUK PRINT THERMAL 
        (Hanya muncul saat print)
        ========================================
      */}
      {}
      <div className="hidden print:block font-mono text-black leading-tight bg-white">
        <div className="text-center mb-4 border-b border-black pb-2 border-dashed">
          <h2 className="font-extrabold text-lg">KOPI LORONG</h2>
          <p className="text-[10px]">{receiptConfig.address}</p>
          <p className="text-[10px]">{new Date().toLocaleString('id-ID')}</p>
        </div>
        
        <div className="mb-2">
          {cart.map((item, idx) => (
            <div key={idx} className="mb-1">
              <div className="flex justify-between text-[12px]">
                <span className="truncate">{item.name}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span>{item.qty} x {item.price.toLocaleString('id-ID')}</span>
                <span>{(item.price * item.qty).toLocaleString('id-ID')}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-black pt-2 border-dashed mt-2">
          <div className="flex justify-between font-bold text-[14px] mb-1">
            <span>TOTAL</span>
            <span>Rp {totalCart.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-[12px] mb-1">
            <span>Tipe Bayar</span>
            <span>{paymentMethod || 'CASH'}</span>
          </div>
          
          {/* Tampil Kembalian hanya jika Cash */}
          {paymentMethod === 'CASH' && (
            <>
              <div className="flex justify-between text-[12px] mb-1">
                <span>Tunai</span>
                <span>Rp {parseInt(cashAmount || totalCart).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-[12px] font-bold">
                <span>Kembali</span>
                <span>Rp {Math.max(0, parseInt(cashAmount || totalCart) - totalCart).toLocaleString('id-ID')}</span>
              </div>
            </>
          )}
        </div>

        <div className="border-b border-black border-dashed my-2"></div>

        <div className="text-center mt-3 text-[10px]">
          <p className="mb-1">{receiptConfig.footerMessage}</p>
          {receiptConfig.wifiSsid && <p className="font-bold">WIFI: {receiptConfig.wifiSsid}</p>}
          {receiptConfig.wifiSsid && receiptConfig.wifiPass && <p>Pass: {receiptConfig.wifiPass}</p>}
          {receiptConfig.socialMedia && <p className="mt-2">{receiptConfig.socialMedia}</p>}
          <div className="mt-4 pb-4">.</div>
        </div>
      </div>
      
      {}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}