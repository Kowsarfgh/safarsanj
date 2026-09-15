/*برنامه‌ریز سفر تبریز — منطق محاسبه هزینه*/

/* 
   ۱) داده مقصدها
    */
   const destinations = [
    {
      id: 'kandovan', name: 'کندوان',
      query: 'Kandovan, East Azerbaijan, Iran',
      lat: 37.7954, lon: 46.2477, fallback: 65,
      attractions: 7,
      stay: { economic: 1200000, normal: 1800000, luxury: 3500000 },
      food: { economic: 300000,  normal: 480000,  luxury: 800000 },
      fun:  { economic: 120000,  normal: 220000,  luxury: 400000 },
      shop: { economic: 300000,  normal: 600000,  luxury: 1200000 }
    },
    {
      id: 'jolfa', name: 'جلفا و ارس',
      query: 'Jolfa, East Azerbaijan, Iran',
      lat: 38.9408, lon: 45.6315, fallback: 135,
      attractions: 11,
      stay: { economic: 1600000, normal: 2500000, luxury: 4500000 },
      food: { economic: 320000,  normal: 520000,  luxury: 900000 },
      fun:  { economic: 180000,  normal: 350000,  luxury: 700000 },
      shop: { economic: 500000,  normal: 1200000, luxury: 2500000 }
    },
    {
      id: 'ahar', name: 'اهر',
      query: 'Ahar, East Azerbaijan, Iran',
      lat: 38.4774, lon: 47.0699, fallback: 108,
      attractions: 8,
      stay: { economic: 900000, normal: 1500000, luxury: 2800000 },
      food: { economic: 270000, normal: 420000,  luxury: 700000 },
      fun:  { economic: 100000, normal: 180000,  luxury: 350000 },
      shop: { economic: 250000, normal: 500000,  luxury: 1000000 }
    },
    {
      id: 'kaleybar', name: 'کلیبر و ارسباران',
      query: 'Kaleybar, East Azerbaijan, Iran',
      lat: 38.8649, lon: 47.0405, fallback: 190,
      attractions: 12,
      stay: { economic: 1000000, normal: 1800000, luxury: 3300000 },
      food: { economic: 300000,  normal: 460000,  luxury: 800000 },
      fun:  { economic: 150000,  normal: 300000,  luxury: 600000 },
      shop: { economic: 300000,  normal: 650000,  luxury: 1300000 }
    },
    {
      id: 'maragheh', name: 'مراغه',
      query: 'Maragheh, East Azerbaijan, Iran',
      lat: 37.3893, lon: 46.2396, fallback: 141,
      attractions: 10,
      stay: { economic: 900000, normal: 1500000, luxury: 2800000 },
      food: { economic: 280000, normal: 420000,  luxury: 720000 },
      fun:  { economic: 120000, normal: 230000,  luxury: 450000 },
      shop: { economic: 300000, normal: 650000,  luxury: 1300000 }
    },
    {
      id: 'shabestar', name: 'شبستر',
      query: 'Shabestar, East Azerbaijan, Iran',
      lat: 38.1807, lon: 45.7026, fallback: 69,
      attractions: 6,
      stay: { economic: 700000, normal: 1200000, luxury: 2300000 },
      food: { economic: 250000, normal: 380000,  luxury: 650000 },
      fun:  { economic: 80000,  normal: 150000,  luxury: 300000 },
      shop: { economic: 220000, normal: 450000,  luxury: 900000 }
    },
    {
      id: 'osku', name: 'اسکو',
      query: 'Osku, East Azerbaijan, Iran',
      lat: 37.9158, lon: 46.1230, fallback: 40,
      attractions: 5,
      stay: { economic: 650000, normal: 1100000, luxury: 2100000 },
      food: { economic: 240000, normal: 370000,  luxury: 620000 },
      fun:  { economic: 60000,  normal: 120000,  luxury: 250000 },
      shop: { economic: 180000, normal: 380000,  luxury: 800000 }
    }
  ];
  
  const vehicles = [
    { id: 'bus',   name: 'اتوبوس' },
    { id: 'train', name: 'قطار' },
    { id: 'car',   name: 'خودرو شخصی' }
  ];
  
  /* 
     ۲) ثابت‌ها
      */
  const tiers = ['economic', 'normal', 'luxury'];
  const tierLabels = { economic: 'اقتصادی', normal: 'معمولی', luxury: 'لوکس' };
  
  /* نرخ کرایه هر کیلومتر به ازای هر نفر (تومان) */
  const busRate   = { economic: 900,  normal: 1250, luxury: 1800 };
  const trainRate = { economic: 1100, normal: 1600, luxury: 2400 };
  
  /* مصرف خودرو: لیتر در ۱۰۰ کیلومتر */
  const FUEL_CONSUMPTION = 7.5;
  
  /* مختصات تبریز (مبدأ) */
  const TABRIZ = { lat: 38.0962, lon: 46.2738 };
  
  /* 
     ۳) متغیرهای سراسری
      */
  const destinationSelect = document.getElementById('destination');
  const vehicleSelect     = document.getElementById('vehicle');
  
  const distanceCache = {};
  let currentDistance = null;
  
  /* پر کردن لیست‌ها */
  destinations.forEach(d => destinationSelect.add(new Option(d.name, d.id)));
  vehicles.forEach(v => vehicleSelect.add(new Option(v.name, v.id)));
  
  /* 
     ۴) ابزارها
      */
  function fmt(n) {
    return Math.round(n).toLocaleString('fa-IR') + ' تومان';
  }
  
  function setDistanceUI(km) {
    document.getElementById('distance-one-way').textContent =
      Math.round(km).toLocaleString('fa-IR') + ' کیلومتر';
    document.getElementById('distance-round').textContent =
      Math.round(km * 2).toLocaleString('fa-IR') + ' کیلومتر';
  }
  
  /* 
     ۵) دریافت فاصله جاده‌ای از OSRM
      */
  async function getRoadDistance(dest) {
    if (distanceCache[dest.id]) return distanceCache[dest.id];
  
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${TABRIZ.lon},${TABRIZ.lat};${dest.lon},${dest.lat}?overview=false`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('routing failed');
  
      const data = await res.json();
      if (data.code !== 'Ok' || !data.routes?.length) throw new Error('no route');
  
      const km = data.routes[0].distance / 1000;
      distanceCache[dest.id] = km;
      return km;
    } catch (e) {
      distanceCache[dest.id] = dest.fallback;
      return dest.fallback;
    }
  }
  
  /* 
     ۶) محاسبه هزینه‌ها
      */
  function transportCost(tier, vehicle, km, people, fuelPrice) {
    if (vehicle === 'car') {
      const liters = km * 2 * FUEL_CONSUMPTION / 100;
      return liters * fuelPrice;
    }
    const rate = vehicle === 'bus' ? busRate[tier] : trainRate[tier];
    return km * 2 * rate * people;
  }
  
  function calc(dest, tier, vehicle, km, people, days, fuelPrice) {
    const transport = transportCost(tier, vehicle, km, people, fuelPrice);
    const stay      = dest.stay[tier] * days * people;
    const food      = dest.food[tier] * days * people;
    const fun       = dest.fun[tier]  * people;
    const shop      = dest.shop[tier] * people;
    const total     = transport + stay + food + fun + shop;
  
    return {
      total,
      transport,
      stay,
      food,
      fun,
      shop,
      per: total / people
    };
  }
  
  /* امتیاز به‌صرفه بودن (۰ تا ۱۰۰) */
  function score(total, budget, dest, km) {
    const budgetScore     = Math.max(0, Math.min(100, budget > 0 ? (budget / total) * 60 : 0));
    const attractionScore = Math.min(100, (dest.attractions / 12) * 25);
    const distanceScore   = Math.max(0, 15 - Math.min(15, km / 20));
    return Math.round(Math.min(100, budgetScore + attractionScore + distanceScore));
  }
  
  /* 
     ۷) به‌روزرسانی فاصله
      */
  async function refreshDistance() {
    const dest   = destinations.find(d => d.id === destinationSelect.value);
    const status = document.getElementById('fetch-status');
  
    status.textContent = 'در حال محاسبه فاصله جاده‌ای از تبریز...';
    const km = await getRoadDistance(dest);
    currentDistance = km;
    setDistanceUI(km);
  
    status.textContent = km === dest.fallback
      ? 'فاصله تقریبی استفاده شد.'
      : 'فاصله جاده‌ای از OSRM/OpenStreetMap دریافت شد.';
  
    clearResults();
  }
  
  function clearResults() {
    document.getElementById('results').classList.remove('visible');
    document.getElementById('tier-grid').innerHTML      = '';
    document.getElementById('summary-grid').innerHTML   = '';
    document.getElementById('comparison-body').innerHTML = '';
    document.getElementById('recommend').innerHTML       = '';
  }
  
  /* 
     ۸) رویدادهای فرم
     */
  vehicleSelect.addEventListener('change', () => {
    const isCar = vehicleSelect.value === 'car';
    document.getElementById('fuel-field').classList.toggle('hidden', !isCar);
    clearResults();
    if (currentDistance !== null) setDistanceUI(currentDistance);
  });
  
  destinationSelect.addEventListener('change', refreshDistance);
  
  /* 
     ۹) رندر نتایج
     */
  async function render() {
    const dest      = destinations.find(d => d.id === destinationSelect.value);
    const vehicle   = vehicleSelect.value;
    const people    = +document.getElementById('people').value;
    const days      = +document.getElementById('days').value;
    const budget    = +document.getElementById('budget').value;
    const fuelPrice = +document.getElementById('fuelPrice').value || 0;
  
    const km = currentDistance ?? await getRoadDistance(dest);
    currentDistance = km;
    setDistanceUI(km);
  
    /* محاسبه هر سه سطح */
    const results = Object.fromEntries(
      tiers.map(t => [t, calc(dest, t, vehicle, km, people, days, fuelPrice)])
    );
    const normal = results.normal;
  
    /* زیرعنوان */
    document.getElementById('results-sub').textContent =
      `تبریز ← ${dest.name} — ${Math.round(km)} کیلومتر رفت — ${people} نفر — ${days} روز — وسیله: ${vehicles.find(v => v.id === vehicle).name}`;
  
    /* کارت‌های خلاصه */
    const summaries = [
      ['کمترین هزینه', Math.min(...tiers.map(t => results[t].total))],
      ['هزینه سطح معمولی', normal.total],
      ['بودجه مصرف‌شده', budget > 0 ? Math.round(normal.total / budget * 100) + '٪' : '—']
    ];
  
    document.getElementById('summary-grid').innerHTML = summaries
      .map(x => `<div class="summary-card">
                   <div class="label">${x[0]}</div>
                   <div class="value">${typeof x[1] === 'number' ? fmt(x[1]) : x[1]}</div>
                 </div>`)
      .join('');
  
    /* کارت‌های سه سطح */
    const grid = document.getElementById('tier-grid');
  
    grid.innerHTML = tiers.map(t => {
      const r  = results[t];
      const ok = r.total <= budget;
      const transportLabel = vehicle === 'car' ? 'بنزین خودرو' : 'حمل‌ونقل';
  
      const fuelLine = vehicle === 'car'
        ? `<li><span>مصرف بنزین</span><span>${(km * 2 * FUEL_CONSUMPTION / 100).toFixed(1)} لیتر</span></li>`
        : '';
  
      return `<div class="tier-card ${t}">
                <p class="tier-name">${tierLabels[t]}</p>
                <p class="total">${fmt(r.total)}</p>
                <p class="per">${fmt(r.per)} برای هر نفر</p>
                <ul>
                  <li><span>${transportLabel}</span><span>${fmt(r.transport)}</span></li>
                  ${fuelLine}
                  <li><span>اقامت</span><span>${fmt(r.stay)}</span></li>
                  <li><span>خوراک</span><span>${fmt(r.food)}</span></li>
                  <li><span>تفریح</span><span>${fmt(r.fun)}</span></li>
                  <li><span>خرید/سوغات</span><span>${fmt(r.shop)}</span></li>
                </ul>
                <span class="badge ${ok ? 'ok' : 'over'}">
                  ${ok ? 'در محدوده بودجه' : 'بیشتر از بودجه'}
                </span>
              </div>`;
    }).join('');
  
    /* پیشنهاد */
    const scored = tiers.map(t => ({
      tier: t,
      r: results[t],
      score: score(results[t].total, budget, dest, km)
    }));
    const best = scored.sort((a, b) => b.score - a.score)[0];
  
    document.getElementById('recommend').innerHTML = `
      <h3>پیشنهاد برای شما</h3>
      <div>
        با این بودجه، سطح <strong>${tierLabels[best.tier]}</strong>
        در مقصد <strong>${dest.name}</strong>
        امتیاز به‌صرفه بودن <strong>${best.score} از 100</strong> دارد.
      </div>
      <div class="note">
        این امتیاز از ترکیب تناسب هزینه با بودجه، تعداد جاذبه‌ها و فاصله مسیر
        به دست آمده و صرفاً یک شاخص مقایسه‌ای است.
      </div>
    `;
  
    /* جدول مقایسه همه مقصدها */
    const body = document.getElementById('comparison-body');
  
    body.innerHTML = destinations.map(d => {
      const dKm = d.id === dest.id ? km : d.fallback;
      const r   = calc(d, 'normal', vehicle, dKm, people, days, fuelPrice);
      const s   = score(r.total, budget, d, dKm);
  
      return `<tr>
                <td>${d.name}</td>
                <td>${Math.round(dKm).toLocaleString('fa-IR')} km</td>
                <td>${fmt(r.total)}</td>
                <td>${budget ? Math.round(r.total / budget * 100) + '٪' : '—'}</td>
                <td class="${d.id === dest.id ? 'best' : ''}">${s}/100</td>
                <td>${d.attractions}</td>
              </tr>`;
    }).join('');
  
    document.getElementById('results').classList.add('visible');
  }
  
  /* 
     ۱۰) رویداد ارسال فرم
      */
  document.getElementById('trip-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    clearResults();
    try {
      await render();
    } finally {
      btn.disabled = false;
    }
  });
  
  /* 
     ۱۱) اجرای اولیه
      */
  refreshDistance();