import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabaseClient';

export default function App() {
  const [activeTab, setActiveTab] = useState('wallet'); // 'wallet' | 'sports' | 'saving'
  const [isSyncing, setIsSyncing] = useState(false);

  // Date utilities
  const getTodayDateISO = () => new Date().toISOString().split('T')[0];
  const getTodayDateDisplay = () => new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  // --- SAVINGS CALCULATOR & MANUAL EXTRA SAVINGS ---
  const [bonusSavingsList, setBonusSavingsList] = useState(() => {
    const saved = localStorage.getItem('my_bonus_savings_list');
    return saved ? JSON.parse(saved) : [];
  });

  const [extraSavingAmount, setExtraSavingAmount] = useState('');
  const [extraSavingNote, setExtraSavingNote] = useState('');

  useEffect(() => {
    localStorage.setItem('my_bonus_savings_list', JSON.stringify(bonusSavingsList));
  }, [bonusSavingsList]);

  const manualBonusTotal = bonusSavingsList.reduce((sum, item) => sum + Number(item.amount), 0);

  const calculateAutoSavings = () => {
    const baseSavings = 37000000;
    const monthlyIncrement = 7000000;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    const startYear = 2026;
    const startMonth = 8; // September (0-indexed 8)

    let paydaysPassed = 0;
    let monthsDiff = (currentYear - startYear) * 12 + (currentMonth - startMonth);

    if (monthsDiff > 0) {
      paydaysPassed = monthsDiff;
      if (currentDay >= 24) {
        paydaysPassed += 1;
      }
    } else if (monthsDiff === 0 && currentDay >= 24) {
      paydaysPassed = 1;
    }

    paydaysPassed = Math.max(0, Math.min(9, paydaysPassed));

    return baseSavings + (paydaysPassed * monthlyIncrement) + manualBonusTotal;
  };

  const autoSavingsTotal = calculateAutoSavings();
  const targetSavingsAmount = 100000000;
  const remainingSavingsAmount = Math.max(0, targetSavingsAmount - autoSavingsTotal);
  const savingsProgressPercent = Math.min(100, Math.round((autoSavingsTotal / targetSavingsAmount) * 100));

  const handleAddExtraSaving = async (amount, note) => {
    if (!amount) return;
    const id = Date.now().toString();
    const amt = parseInt(amount, 10);
    const dateFormatted = getTodayDateDisplay();

    const newItem = { id, date: dateFormatted, amount: amt, note: note || 'Tabungan Ekstra' };
    setBonusSavingsList([newItem, ...bonusSavingsList]);
    setExtraSavingAmount('');
    setExtraSavingNote('');

    try { await supabase.from('bonus_savings').insert([{ id, date: dateFormatted, amount: amt, note: note || 'Tabungan Ekstra' }]); } catch (e) {}
  };

  const handleDeleteExtraSaving = async (id) => {
    setBonusSavingsList(bonusSavingsList.filter(item => item.id !== id));
    try { await supabase.from('bonus_savings').delete().eq('id', id); } catch (e) {}
  };

  // --- TAB 1: SALDO & PENGELUARAN ---
  const [currentBalance, setCurrentBalance] = useState(() => {
    const saved = localStorage.getItem('my_current_balance');
    return saved ? parseInt(saved, 10) : 1000000;
  });
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [tempBalanceInput, setTempBalanceInput] = useState('');

  // Initial Expense List
  const defaultExpenseItems = [
    { id: '1', date: getTodayDateDisplay(), category: 'Makanan', title: 'Makan Siang Warteg', amount: 25000 },
    { id: '2', date: getTodayDateDisplay(), category: 'Bensin', title: 'Isi Pertamax', amount: 50000 },
    { id: '3', date: getTodayDateDisplay(), category: 'Minuman', title: 'Kopi Kenangan', amount: 20000 },
    { id: '4', date: '12 Sep 2026', category: 'Cukur Rambut', title: 'Potong Rambut', amount: 45000 }
  ];

  const [expenseList, setExpenseList] = useState(() => {
    const saved = localStorage.getItem('my_expenses_data');
    if (!saved) return defaultExpenseItems;
    const parsed = JSON.parse(saved);
    if (!parsed || parsed.length === 0) return defaultExpenseItems;
    return parsed.map(item => {
      if (item.category && item.category !== 'Lainnya') return item;
      const titleLower = (item.title || '').toLowerCase();
      if (titleLower.includes('makan') || titleLower.includes('warteg')) return { ...item, category: 'Makanan' };
      if (titleLower.includes('bensin') || titleLower.includes('pertamax')) return { ...item, category: 'Bensin' };
      if (titleLower.includes('kopi') || titleLower.includes('minum')) return { ...item, category: 'Minuman' };
      if (titleLower.includes('cukur') || titleLower.includes('rambut')) return { ...item, category: 'Cukur Rambut' };
      if (titleLower.includes('parkir')) return { ...item, category: 'Parkir' };
      return { ...item, category: 'Makanan' };
    });
  });

  const [expDate, setExpDate] = useState(getTodayDateISO());
  const [expCategory, setExpCategory] = useState('Makanan');
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');

  // --- TAB 2: OLAHRAGA ---
  const [sportsList, setSportsList] = useState(() => {
    const saved = localStorage.getItem('my_sports_data');
    return saved ? JSON.parse(saved) : [
      { id: '1', date: getTodayDateDisplay(), sport: 'Gym', note: 'Push Day - Benchpress 4 Set' },
      { id: '2', date: getTodayDateDisplay(), sport: 'Lari', note: 'Lari Pagi 5 KM Pace 6:00' },
      { id: '3', date: '12 Sep 2026', sport: 'Bola', note: 'Futsal 1 Jam' }
    ];
  });
  const [sportDate, setSportDate] = useState(getTodayDateISO());
  const [sportType, setSportType] = useState('Gym');
  const [sportNote, setSportNote] = useState('');

  // Backup LocalStorage
  useEffect(() => {
    localStorage.setItem('my_current_balance', currentBalance.toString());
  }, [currentBalance]);

  useEffect(() => {
    localStorage.setItem('my_expenses_data', JSON.stringify(expenseList));
  }, [expenseList]);

  useEffect(() => {
    localStorage.setItem('my_sports_data', JSON.stringify(sportsList));
  }, [sportsList]);

  // Sync Supabase
  useEffect(() => {
    fetchFromSupabase();
  }, []);

  const fetchFromSupabase = async () => {
    try {
      setIsSyncing(true);
      const { data: eData } = await supabase.from('daily_expenses').select('*').order('created_at', { ascending: false });
      if (eData && eData.length > 0) setExpenseList(eData);

      const { data: spData } = await supabase.from('daily_sports').select('*').order('created_at', { ascending: false });
      if (spData && spData.length > 0) setSportsList(spData);

      const { data: savData } = await supabase.from('bonus_savings').select('*').order('created_at', { ascending: false });
      if (savData && savData.length > 0) setBonusSavingsList(savData);
    } catch (err) {
      console.log('Sync info:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const totalExpenseAmount = expenseList.reduce((s, i) => s + Number(i.amount), 0);
  const formatIDR = (num) => 'Rp ' + new Intl.NumberFormat('id-ID').format(num);

  const formatDisplayDate = (isoString) => {
    if (!isoString) return getTodayDateDisplay();
    const parts = isoString.split('-');
    if (parts.length !== 3) return isoString;
    return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const categoryIcons = {
    'Makanan': '🍔',
    'Minuman': '🥤',
    'Bensin': '⛽',
    'Parkir': '🅿️',
    'Cukur Rambut': '💈',
    'Olahraga': '🏃',
    'Belanja': '🛒',
    'Lainnya': '📝'
  };

  // Pokémon Type Palette Colors
  const categoryColors = {
    'Makanan': '#A8A77A',       // Snorlax Normal Type (Olive Gold)
    'Minuman': '#6390F0',       // Squirtle Water Type (Cyan Blue)
    'Bensin': '#EE8130',        // Charmander Fire Type (Vibrant Orange)
    'Parkir': '#B6A136',        // Geodude Rock Type (Gold Ochre)
    'Cukur Rambut': '#F45895',   // Jigglypuff Fairy Type (Vibrant Pink)
    'Olahraga': '#C22E28',       // Machop Fighting Type (Crimson Red)
    'Belanja': '#7AC74C',       // Bulbasaur Grass Type (Emerald Green)
    'Lainnya': '#F7D02C'        // Pikachu Electric Type (Bright Yellow)
  };

  const sportIcons = {
    'Bola': '⚽',
    'Lari': '🏃',
    'Renang': '🏊',
    'Gym': '🏋️',
    'Badminton': '🏸',
    'Lainnya': '📝'
  };

  const sportColors = {
    'Gym': '#C22E28',        // Machop Fighting Type (Crimson Red)
    'Lari': '#F7D02C',       // Jolteon Speed Electric (Bright Yellow)
    'Bola': '#EE8130',       // Cinderace Fire Type (Vibrant Orange)
    'Renang': '#6390F0',     // Gyarados Water Type (Cyan Blue)
    'Badminton': '#A98FF3',  // Pidgeot Flying Type (Purple Violet)
    'Lainnya': '#A8A77A'     // Eevee Normal Type (Olive Gold)
  };

  // Handlers Wallet & Expenses
  const handleSaveBalance = () => {
    if (!tempBalanceInput) { setIsEditingBalance(false); return; }
    setCurrentBalance(parseInt(tempBalanceInput, 10));
    setIsEditingBalance(false);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expTitle || !expAmount) return;
    const id = Date.now().toString();
    const amt = parseInt(expAmount, 10);
    const dateFormatted = formatDisplayDate(expDate);

    setCurrentBalance(prev => Math.max(0, prev - amt));
    const newItem = { id, date: dateFormatted, category: expCategory, title: expTitle, amount: amt };
    setExpenseList([newItem, ...expenseList]);
    setExpTitle('');
    setExpAmount('');

    try { await supabase.from('daily_expenses').insert([{ id, date: dateFormatted, category: expCategory, title: expTitle, amount: amt }]); } catch (e) {}
  };

  const handleDeleteExpense = async (id) => {
    const exp = expenseList.find(e => e.id === id);
    if (exp) setCurrentBalance(prev => prev + Number(exp.amount));
    setExpenseList(expenseList.filter(e => e.id !== id));
    try { await supabase.from('daily_expenses').delete().eq('id', id); } catch (e) {}
  };

  // Handlers Sports
  const handleAddSport = async (e) => {
    e.preventDefault();
    const id = Date.now().toString();
    const dateFormatted = formatDisplayDate(sportDate);
    const item = { id, date: dateFormatted, sport: sportType, note: sportNote || 'Latihan' };

    setSportsList([item, ...sportsList]);
    setSportNote('');

    try { await supabase.from('daily_sports').insert([{ id, date: dateFormatted, sport: sportType, note: sportNote || 'Latihan' }]); } catch (e) {}
  };

  const handleDeleteSport = async (id) => {
    setSportsList(sportsList.filter(s => s.id !== id));
    try { await supabase.from('daily_sports').delete().eq('id', id); } catch (e) {}
  };

  // --- EXPENSE CATEGORY BREAKDOWN DATA ---
  const calculateExpenseDistribution = () => {
    if (totalExpenseAmount === 0) return [];

    const categoryTotals = {};
    expenseList.forEach(item => {
      const cat = item.category || 'Makanan';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(item.amount);
    });

    const entries = Object.entries(categoryTotals).map(([cat, total]) => {
      const percentage = Math.round((total / totalExpenseAmount) * 100);
      return {
        name: cat,
        value: total,
        percentage,
        icon: categoryIcons[cat] || '📝',
        color: categoryColors[cat] || '#FFCB05'
      };
    });

    return entries.sort((a, b) => b.value - a.value);
  };

  const expenseDistribution = calculateExpenseDistribution();

  // --- SPORTS DISTRIBUTION BREAKDOWN DATA ---
  const calculateSportsDistribution = () => {
    const totalCount = sportsList.length;
    if (totalCount === 0) return [];

    const counts = {};
    sportsList.forEach(item => {
      counts[item.sport] = (counts[item.sport] || 0) + 1;
    });

    const entries = Object.entries(counts).map(([sport, count]) => {
      const percentage = Math.round((count / totalCount) * 100);
      return {
        name: sport,
        value: count,
        percentage,
        icon: sportIcons[sport] || '📝',
        color: sportColors[sport] || '#FFCB05'
      };
    });

    return entries.sort((a, b) => b.value - a.value);
  };

  const sportsDistribution = calculateSportsDistribution();

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-[#2A2B2E] font-sans antialiased selection:bg-[#FFCB05]/40">
      
      <main className="max-w-3xl mx-auto px-5 py-8 space-y-6">

        {/* Clean Header Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2">
          <div>
            <h1 className="font-black text-base tracking-widest uppercase text-[#2A2B2E] font-['Plus_Jakarta_Sans',sans-serif]">
              NOTES DUTA
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Segmented Control Navigation Tabs (Saldo & Pengeluaran, Olahraga, Saving) */}
            <div className="bg-[#FFF3CD] p-1 rounded-2xl border border-[#FFE082] flex gap-1 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('wallet')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'wallet' ? 'bg-[#FFCB05] text-[#2A2B2E] shadow-xs' : 'text-[#8C6D1F] hover:text-[#2A2B2E]'
                }`}
              >
                Saldo & Pengeluaran
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sports')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'sports' ? 'bg-[#FFCB05] text-[#2A2B2E] shadow-xs' : 'text-[#8C6D1F] hover:text-[#2A2B2E]'
                }`}
              >
                Olahraga
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('saving')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'saving' ? 'bg-[#FFCB05] text-[#2A2B2E] shadow-xs' : 'text-[#8C6D1F] hover:text-[#2A2B2E]'
                }`}
              >
                Saving
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: SALDO & PENGELUARAN HARIAN */}
        {activeTab === 'wallet' && (
          <AnimatePresence mode="wait">
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* Wallet Saldo Card */}
              <div className="bg-[#FFF9E6] p-6 sm:p-7 rounded-3xl border border-[#FFE082] shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#FFE082]/70 pb-5">
                  <div>
                    <span className="text-[11px] text-[#D97706] font-extrabold uppercase tracking-wider block mb-1">
                      💳 SALDO GUA SEKARANG
                    </span>
                    
                    {isEditingBalance ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input 
                          type="number" 
                          placeholder="Set Saldo Baru"
                          value={tempBalanceInput}
                          onChange={(e) => setTempBalanceInput(e.target.value)}
                          className="bg-white border border-[#FFE082] rounded-xl px-3.5 py-1.5 text-sm text-[#2A2B2E] focus:outline-none font-medium"
                        />
                        <button 
                          onClick={handleSaveBalance}
                          className="px-4 py-1.5 bg-[#FFCB05] hover:bg-[#E5B700] text-[#2A2B2E] font-extrabold text-xs rounded-xl cursor-pointer shadow-xs transition-all"
                        >
                          Simpan
                        </button>
                      </div>
                    ) : (
                      <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#2A2B2E]">{formatIDR(currentBalance)}</h1>
                    )}
                  </div>

                  <button 
                    onClick={() => {
                      setTempBalanceInput(currentBalance.toString());
                      setIsEditingBalance(!isEditingBalance);
                    }}
                    className="px-4 py-2 bg-white text-[#2A2B2E] border border-[#FFE082] rounded-2xl text-xs font-extrabold cursor-pointer transition-all shadow-xs"
                  >
                    {isEditingBalance ? 'Batal' : 'Edit Saldo'}
                  </button>
                </div>

                {/* Progress Bar Only Expense Breakdown */}
                {expenseDistribution.length > 0 && (
                  <div className="space-y-3 pt-1">
                    <span className="text-xs text-[#8C6D1F] font-extrabold tracking-wider uppercase block text-center">
                      📊 Diagram Pengeluaran Per Kategori
                    </span>

                    <div className="space-y-2.5 pt-2">
                      {expenseDistribution.map((cat) => (
                        <div key={cat.name} className="bg-white p-3.5 rounded-2xl border border-[#FFE082] shadow-xs space-y-2 hover:border-[#D97706]/60 transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: cat.color }}></span>
                              <span className="text-xs font-extrabold text-[#2A2B2E]">{cat.icon} {cat.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black text-[#B45309] bg-[#FFE57F] px-2 py-0.5 rounded-lg border border-[#FFE082]">{cat.percentage}%</span>
                              <span className="text-xs font-bold text-[#2A2B2E] font-mono">{formatIDR(cat.value)}</span>
                            </div>
                          </div>

                          <div className="w-full h-2.5 bg-[#FFFDF5] rounded-full overflow-hidden border border-[#FFE082]/60 p-0.5">
                            <div 
                              className="h-full rounded-full transition-all duration-500 shadow-xs" 
                              style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Input Pengeluaran */}
              <div className="bg-[#FFF9E6] p-6 rounded-3xl border border-[#FFE082] space-y-4 shadow-sm">
                <h2 className="text-xs font-extrabold tracking-wider uppercase text-[#2A2B2E] flex items-center gap-2">
                  <span>💸</span> Catat Pengeluaran Baru
                </h2>
                
                <form onSubmit={handleAddExpense} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input 
                      type="date" 
                      value={expDate}
                      onChange={(e) => setExpDate(e.target.value)}
                      className="bg-white border border-[#FFE082] rounded-2xl px-4 py-2.5 text-xs text-[#2A2B2E] focus:outline-none font-medium"
                    />

                    <select 
                      value={expCategory}
                      onChange={(e) => setExpCategory(e.target.value)}
                      className="bg-white border border-[#FFE082] rounded-2xl px-4 py-2.5 text-xs text-[#2A2B2E] focus:outline-none font-bold"
                    >
                      <option value="Makanan">🍔 Makanan</option>
                      <option value="Minuman">🥤 Minuman</option>
                      <option value="Bensin">⛽ Bensin</option>
                      <option value="Parkir">🅿️ Parkir</option>
                      <option value="Cukur Rambut">💈 Cukur Rambut</option>
                      <option value="Olahraga">🏃 Olahraga</option>
                      <option value="Belanja">🛒 Belanja</option>
                      <option value="Lainnya">📝 Lainnya</option>
                    </select>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text" 
                      placeholder="Nama Pengeluaran (misal: Makan Siang)"
                      value={expTitle}
                      onChange={(e) => setExpTitle(e.target.value)}
                      className="flex-1 bg-white border border-[#FFE082] rounded-2xl px-4 py-2.5 text-xs text-[#2A2B2E] focus:outline-none font-medium"
                    />

                    <input 
                      type="number" 
                      placeholder="Nominal (Rp)"
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      className="sm:w-36 bg-white border border-[#FFE082] rounded-2xl px-4 py-2.5 text-xs text-[#2A2B2E] focus:outline-none font-medium"
                    />

                    <button 
                      type="submit"
                      className="px-6 py-2.5 bg-[#FFCB05] hover:bg-[#E5B700] text-[#2A2B2E] font-extrabold text-xs rounded-2xl transition-all cursor-pointer shadow-md active:scale-95"
                    >
                      + Catat
                    </button>
                  </div>
                </form>
              </div>

              {/* List Pengeluaran */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h2 className="text-xs font-extrabold tracking-wider uppercase text-[#8C6D1F]">Riwayat Pengeluaran</h2>
                  <span className="text-[11px] text-[#D97706] font-mono font-bold">Total: {formatIDR(totalExpenseAmount)}</span>
                </div>

                <div className="bg-[#FFF9E6] rounded-3xl border border-[#FFE082] divide-y divide-[#FFE082]/60 overflow-hidden shadow-sm">
                  {expenseList.length === 0 ? (
                    <p className="text-xs text-[#8C6D1F] py-6 text-center">Belum ada catatan pengeluaran.</p>
                  ) : (
                    expenseList.map((item) => (
                      <div key={item.id} className="p-4 flex items-center justify-between hover:bg-white/60 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xl p-2 rounded-2xl bg-white border border-[#FFE082]">
                            {categoryIcons[item.category] || '📝'}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-[#2A2B2E]">{item.title}</span>
                              <span className="text-[10px] font-bold text-[#B45309] bg-[#FFE57F] px-2 py-0.5 rounded-full border border-[#FFE082]">
                                {item.category || 'Lainnya'}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#8C6D1F] block mt-0.5">{item.date}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-xs font-extrabold text-red-500">{formatIDR(item.amount)}</span>
                          <button 
                            onClick={() => handleDeleteExpense(item.id)}
                            className="text-xs text-[#8C6D1F] hover:text-red-500 cursor-pointer transition-colors font-medium"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* TAB 2: OLAHRAGA */}
        {activeTab === 'sports' && (
          <AnimatePresence mode="wait">
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* Progress Bar Sports Breakdown */}
              {sportsDistribution.length > 0 && (
                <div className="bg-[#FFF9E6] p-6 rounded-3xl border border-[#FFE082] space-y-4 shadow-sm">
                  <div className="border-b border-[#FFE082]/70 pb-3">
                    <h2 className="text-sm font-extrabold text-[#2A2B2E] flex items-center gap-2">
                      <span>🏃</span> Aktivitas Olahraga Duta
                    </h2>
                  </div>
                  
                  <div className="space-y-3 pt-1">
                    {sportsDistribution.map((sp) => (
                      <div key={sp.name} className="bg-white p-3.5 rounded-2xl border border-[#FFE082] shadow-xs space-y-2 hover:border-[#D97706]/60 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: sp.color }}></span>
                            <span className="text-xs font-extrabold text-[#2A2B2E]">{sp.icon} {sp.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-[#B45309] bg-[#FFE57F] px-2 py-0.5 rounded-lg border border-[#FFE082]">
                              {sp.value} Sesi ({sp.percentage}%)
                            </span>
                          </div>
                        </div>

                        <div className="w-full h-2.5 bg-[#FFFDF5] rounded-full overflow-hidden border border-[#FFE082]/60 p-0.5">
                          <div 
                            className="h-full rounded-full transition-all duration-500 shadow-xs" 
                            style={{ width: `${sp.percentage}%`, backgroundColor: sp.color }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Input Olahraga */}
              <div className="bg-[#FFF9E6] p-6 rounded-3xl border border-[#FFE082] space-y-4 shadow-sm">
                <h2 className="text-xs font-extrabold tracking-wider uppercase text-[#2A2B2E]">Catat Olahraga Hari Ini</h2>
                
                <form onSubmit={handleAddSport} className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="date" 
                    value={sportDate}
                    onChange={(e) => setSportDate(e.target.value)}
                    className="sm:w-36 bg-white border border-[#FFE082] rounded-2xl px-4 py-2.5 text-xs text-[#2A2B2E] focus:outline-none font-medium"
                  />

                  <select 
                    value={sportType}
                    onChange={(e) => setSportType(e.target.value)}
                    className="sm:w-40 bg-white border border-[#FFE082] rounded-2xl px-4 py-2.5 text-xs text-[#2A2B2E] focus:outline-none font-bold"
                  >
                    <option value="Bola">⚽ Bola</option>
                    <option value="Lari">🏃 Lari</option>
                    <option value="Renang">🏊 Renang</option>
                    <option value="Gym">🏋️ Gym</option>
                    <option value="Badminton">🏸 Badminton</option>
                    <option value="Lainnya">📝 Lainnya</option>
                  </select>

                  <input 
                    type="text" 
                    placeholder="Catatan / Detail Latihan (misal: Push Day)"
                    value={sportNote}
                    onChange={(e) => setSportNote(e.target.value)}
                    className="flex-1 bg-white border border-[#FFE082] rounded-2xl px-4 py-2.5 text-xs text-[#2A2B2E] focus:outline-none font-medium"
                  />

                  <button 
                    type="submit"
                    className="px-6 py-2.5 bg-[#FFCB05] hover:bg-[#E5B700] text-[#2A2B2E] font-extrabold text-xs rounded-2xl transition-all cursor-pointer shadow-md active:scale-95"
                  >
                    + Simpan
                  </button>
                </form>
              </div>

              {/* List Olahraga */}
              <div className="space-y-3">
                <h2 className="text-xs font-extrabold tracking-wider uppercase text-[#8C6D1F] px-1">Riwayat Olahraga</h2>
                
                <div className="bg-[#FFF9E6] rounded-3xl border border-[#FFE082] divide-y divide-[#FFE082]/60 overflow-hidden shadow-sm">
                  {sportsList.length === 0 ? (
                    <p className="text-xs text-[#8C6D1F] py-6 text-center">Belum ada catatan olahraga.</p>
                  ) : (
                    sportsList.map((item) => (
                      <div key={item.id} className="p-4 flex items-center justify-between hover:bg-white/60 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xl p-2 rounded-2xl bg-white border border-[#FFE082]">
                            {sportIcons[item.sport] || '📝'}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-[#2A2B2E]">{item.sport}</span>
                              <span className="text-[10px] text-[#8C6D1F] font-mono">• {item.date}</span>
                            </div>
                            {item.note && <p className="text-xs text-[#8C6D1F] font-medium mt-0.5">{item.note}</p>}
                          </div>
                        </div>

                        <button 
                          onClick={() => handleDeleteSport(item.id)}
                          className="text-xs text-[#8C6D1F] hover:text-red-500 cursor-pointer transition-colors font-medium ml-4"
                        >
                          Hapus
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* TAB 3: SAVING MENU (DEDICATED FULL TAB) */}
        {activeTab === 'saving' && (
          <AnimatePresence mode="wait">
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* Progress 100M Overview Card */}
              <div className="bg-[#FFF9E6] p-6 sm:p-7 rounded-3xl border border-[#FFE082] shadow-sm space-y-5">
                <div className="flex justify-between items-center border-b border-[#FFE082]/70 pb-4">
                  <div>
                    <span className="text-[10px] text-[#D97706] font-black uppercase tracking-widest block">OTOMATIS TANGGAL 24 + TABUNGAN EKSTRA</span>
                    <h2 className="text-xl font-black text-[#2A2B2E]">Progress Saving Target 100M</h2>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-[#8C6D1F] font-medium block">Total Saving Terkumpul Saat Ini:</span>
                    <span className="text-3xl sm:text-4xl font-black text-[#2A2B2E] block">{formatIDR(autoSavingsTotal)}</span>
                    <span className="text-xs text-[#8C6D1F] font-medium block mt-1">Sisa menuju 100M: <strong className="text-[#D97706]">{formatIDR(remainingSavingsAmount)}</strong></span>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-mono font-bold text-[#8C6D1F] mb-1.5">
                      <span>Progress: {savingsProgressPercent}%</span>
                      <span>{formatIDR(autoSavingsTotal)} / 100M</span>
                    </div>
                    <div className="w-full h-4 bg-white rounded-full overflow-hidden border border-[#FFE082] p-0.5 shadow-inner">
                      <div className="h-full bg-[#FFCB05] rounded-full transition-all duration-500 shadow-xs" style={{ width: `${savingsProgressPercent}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Tambah Tabungan Ekstra / Bonus */}
              <div className="bg-[#FFF9E6] p-6 rounded-3xl border border-[#FFE082] space-y-4 shadow-sm">
                <h2 className="text-xs font-extrabold tracking-wider uppercase text-[#2A2B2E] flex items-center gap-2">
                  <span>💰</span> Input Tabungan Ekstra / Bonus
                </h2>

                {/* Quick Shortcut Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button 
                    type="button"
                    onClick={() => handleAddExtraSaving(500000, 'Tabungan Ekstra 500rb')}
                    className="px-3 py-1.5 bg-white hover:bg-[#FFE57F] border border-[#FFE082] rounded-xl text-xs font-extrabold text-[#2A2B2E] transition-all cursor-pointer active:scale-95"
                  >
                    + Rp 500rb
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleAddExtraSaving(1000000, 'Tabungan Ekstra 1 Juta')}
                    className="px-3 py-1.5 bg-white hover:bg-[#FFE57F] border border-[#FFE082] rounded-xl text-xs font-extrabold text-[#2A2B2E] transition-all cursor-pointer active:scale-95"
                  >
                    + Rp 1 Juta
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleAddExtraSaving(2000000, 'Tabungan Ekstra 2 Juta')}
                    className="px-3 py-1.5 bg-white hover:bg-[#FFE57F] border border-[#FFE082] rounded-xl text-xs font-extrabold text-[#2A2B2E] transition-all cursor-pointer active:scale-95"
                  >
                    + Rp 2 Juta
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleAddExtraSaving(5000000, 'Tabungan Ekstra 5 Juta')}
                    className="px-3 py-1.5 bg-[#FFCB05] hover:bg-[#E5B700] border border-[#F59E0B] rounded-xl text-xs font-extrabold text-[#2A2B2E] transition-all cursor-pointer active:scale-95"
                  >
                    + Rp 5 Juta
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleAddExtraSaving(extraSavingAmount, extraSavingNote); }} className="space-y-3 pt-1">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="number" 
                      placeholder="Nominal Ekstra (Rp)"
                      value={extraSavingAmount}
                      onChange={(e) => setExtraSavingAmount(e.target.value)}
                      className="sm:w-48 bg-white border border-[#FFE082] rounded-2xl px-4 py-2.5 text-xs text-[#2A2B2E] focus:outline-none font-medium"
                    />

                    <input 
                      type="text" 
                      placeholder="Catatan (misal: Bonus Freelance, Sisa Gajian)"
                      value={extraSavingNote}
                      onChange={(e) => setExtraSavingNote(e.target.value)}
                      className="flex-1 bg-white border border-[#FFE082] rounded-2xl px-4 py-2.5 text-xs text-[#2A2B2E] focus:outline-none font-medium"
                    />

                    <button 
                      type="submit"
                      className="px-6 py-2.5 bg-[#FFCB05] hover:bg-[#E5B700] text-[#2A2B2E] font-extrabold text-xs rounded-2xl transition-all cursor-pointer shadow-md active:scale-95"
                    >
                      + Simpan Tabungan
                    </button>
                  </div>
                </form>
              </div>

              {/* Riwayat Tabungan Ekstra */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h2 className="text-xs font-extrabold tracking-wider uppercase text-[#8C6D1F]">Riwayat Tabungan Ekstra</h2>
                  <span className="text-[11px] text-[#D97706] font-mono font-bold">Total Ekstra: {formatIDR(manualBonusTotal)}</span>
                </div>

                <div className="bg-[#FFF9E6] rounded-3xl border border-[#FFE082] divide-y divide-[#FFE082]/60 overflow-hidden shadow-sm">
                  {bonusSavingsList.length === 0 ? (
                    <p className="text-xs text-[#8C6D1F] py-6 text-center">Belum ada rincian tabungan ekstra. Kamu bisa input jika menyisihkan lebih dari 7 juta!</p>
                  ) : (
                    bonusSavingsList.map((item) => (
                      <div key={item.id} className="p-4 flex items-center justify-between hover:bg-white/60 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xl p-2 rounded-2xl bg-white border border-[#FFE082]">
                            💎
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-[#2A2B2E]">{item.note || 'Tabungan Ekstra'}</span>
                              <span className="text-[10px] font-bold text-[#B45309] bg-[#FFE57F] px-2 py-0.5 rounded-full border border-[#FFE082]">
                                Ekstra
                              </span>
                            </div>
                            <span className="text-[10px] text-[#8C6D1F] block mt-0.5">{item.date}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-xs font-extrabold text-emerald-600">+{formatIDR(item.amount)}</span>
                          <button 
                            onClick={() => handleDeleteExtraSaving(item.id)}
                            className="text-xs text-[#8C6D1F] hover:text-red-500 cursor-pointer transition-colors font-medium"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

      </main>
    </div>
  );
}
