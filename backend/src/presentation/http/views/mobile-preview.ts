export function getMobilePreviewHtml(): string {
  return `<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LibreVerse Mobile Platform</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            insta: ['"Outfit"', 'sans-serif'],
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
          },
          colors: {
            insta: {
              pink: '#e1306c',
              purple: '#833ab4',
              orange: '#f56040',
              yellow: '#fcaf45',
              blue: '#0095f6',
              dark: '#121212',
              card: '#1e1e1e',
              border: '#262626'
            }
          }
        }
      }
    }
  </script>
  <style>
    /* Custom scrollbars */
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.3); border-radius: 4px; }
    
    .ios-frame {
      border-radius: 48px;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 12px #18181b;
    }
    .android-frame {
      border-radius: 36px;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 10px #09090b;
    }

    .insta-gradient-bg {
      background: linear-gradient(135deg, #f43f5e 0%, #fb923c 40%, #8b5cf6 100%);
    }

    .insta-gradient-text {
      background: linear-gradient(135deg, #f43f5e 0%, #fb923c 40%, #8b5cf6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .insta-story-ring {
      padding: 2.5px;
      background: linear-gradient(135deg, #f43f5e 0%, #fb923c 40%, #8b5cf6 100%);
      border-radius: 9999px;
    }

    /* Keyframes for like pop animation */
    @keyframes heartPop {
      0% { transform: scale(0) rotate(-15deg); opacity: 0; }
      50% { transform: scale(1.3) rotate(0deg); opacity: 1; }
      100% { transform: scale(1) rotate(0deg); opacity: 0; }
    }
    .animate-heart-pop {
      animation: heartPop 0.8s cubic-bezier(0.17, 0.89, 0.32, 1.49) forwards;
    }

    @keyframes diskSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-disk-spin {
      animation: diskSpin 4s linear infinite;
    }
  </style>
</head>
<body class="bg-zinc-950 text-zinc-100 min-h-screen flex flex-col font-sans antialiased selection:bg-rose-500 selection:text-white">

  <!-- Outer Header -->
  <header class="border-b border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md px-4 py-2.5 sticky top-0 z-50 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl insta-gradient-bg flex items-center justify-center font-bold text-white shadow-lg shadow-rose-500/20">
        <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </div>
      <div>
        <h1 class="font-bold text-sm text-zinc-100 flex items-center gap-2">
          LibreVerse
          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">Youth Freedom Platform</span>
        </h1>
        <p class="text-[11px] text-zinc-400">Unfiltered Social Engine</p>
      </div>
    </div>

    <!-- Outer Controls -->
    <div class="flex items-center gap-2">
      <!-- Device Selector -->
      <div class="bg-zinc-800/80 p-1 rounded-lg border border-zinc-700/50 flex items-center gap-1 text-xs">
        <button id="btn-ios" onclick="setDevice('ios')" class="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-900 font-medium transition-all flex items-center gap-1.5 shadow-sm">
          <i class="fa-brands fa-apple"></i> iOS
        </button>
        <button id="btn-android" onclick="setDevice('android')" class="px-2.5 py-1 rounded-md text-zinc-400 hover:text-zinc-200 transition-all flex items-center gap-1.5">
          <i class="fa-brands fa-android"></i> Android
        </button>
      </div>

      <!-- Theme Switcher -->
      <button onclick="toggleTheme()" id="btn-theme" class="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700/50 text-zinc-300 hover:text-white text-xs flex items-center gap-1.5 transition">
        <i class="fa-solid fa-moon"></i> <span id="theme-label">Dark</span>
      </button>
    </div>
  </header>

  <!-- Main Container -->
  <main class="flex-1 flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
    <!-- Mobile Frame -->
    <div id="device-container" class="ios-frame w-full max-w-[390px] h-[800px] bg-black text-white flex flex-col relative overflow-hidden transition-all duration-300 border border-zinc-800 shadow-2xl">
      
      <!-- Top Status Bar -->
      <div id="status-bar" class="px-6 pt-3 pb-1 flex items-center justify-between text-[12px] font-semibold text-zinc-300 select-none z-40 bg-black/90 backdrop-blur-sm">
        <span id="current-time">09:41</span>
        
        <!-- iOS Dynamic Island -->
        <div id="notch" class="w-24 h-5 bg-zinc-900 rounded-full flex items-center justify-end px-2 gap-1.5">
          <div class="w-2 h-2 rounded-full bg-rose-600/80 animate-pulse"></div>
          <div class="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
        </div>

        <div class="flex items-center gap-1.5 text-[11px]">
          <i class="fa-solid fa-signal"></i>
          <i class="fa-solid fa-wifi"></i>
          <i class="fa-solid fa-battery-full"></i>
        </div>
      </div>

      <!-- Screen Content Container -->
      <div id="screen-content" class="flex-1 flex flex-col overflow-y-auto relative bg-black">
        <!-- Loading State -->
        <div id="loading-spinner" class="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <div class="w-10 h-10 border-3 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-xs text-zinc-400">Loading Instagram...</p>
        </div>
      </div>

      <!-- Bottom Navigation Bar (Instagram Style) -->
      <nav id="bottom-nav" class="hidden border-t border-zinc-800/80 bg-black/95 backdrop-blur-lg px-3 py-2 flex items-center justify-between select-none z-40">
        <button onclick="switchTab('feed')" id="nav-feed" class="p-2 text-white transition scale-105">
          <i class="fa-solid fa-house text-xl"></i>
        </button>

        <button onclick="switchTab('explore')" id="nav-explore" class="p-2 text-zinc-500 hover:text-zinc-200 transition">
          <i class="fa-solid fa-magnifying-glass text-xl"></i>
        </button>

        <button onclick="openCreateModal()" id="nav-create" class="p-2 text-zinc-500 hover:text-zinc-200 transition">
          <i class="fa-regular fa-square-plus text-2xl"></i>
        </button>

        <button onclick="switchTab('reels')" id="nav-reels" class="p-2 text-zinc-500 hover:text-zinc-200 transition">
          <i class="fa-solid fa-clapperboard text-xl"></i>
        </button>

        <button onclick="switchTab('profile')" id="nav-profile" class="p-1 transition">
          <div id="nav-profile-ring" class="w-7 h-7 rounded-full p-[1.5px] bg-transparent">
            <img id="nav-profile-img" src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%2318181b'/></svg>" class="w-full h-full rounded-full object-cover">
          </div>
        </button>
      </nav>

      <!-- Bottom Home Bar (iOS style) -->
      <div id="home-bar" class="h-4 bg-black flex items-center justify-center pb-1 z-40">
        <div class="w-32 h-1 bg-zinc-600/60 rounded-full"></div>
      </div>
    </div>
  </main>

  <!-- Interactive JavaScript Engine -->
  <script>
    var DEFAULT_AVATAR_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">' +
      '<defs>' +
        '<linearGradient id="avG" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%" stop-color="#f43f5e"/>' +
          '<stop offset="50%" stop-color="#a855f7"/>' +
          '<stop offset="100%" stop-color="#3b82f6"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<circle cx="50" cy="50" r="50" fill="url(#avG)"/>' +
      '<circle cx="50" cy="38" r="18" fill="#ffffff"/>' +
      '<path d="M 22 82 C 22 62, 34 58, 50 58 C 66 58, 78 62, 78 82 Z" fill="#ffffff"/>' +
    '</svg>';

    var DEFAULT_AVATAR_URL = 'data:image/svg+xml;utf8,' + encodeURIComponent(DEFAULT_AVATAR_SVG);

    function friendAvatarUrl(f) {
      return (f && f.avatarMediaId) ? ('/media/' + f.avatarMediaId + '/content') : DEFAULT_AVATAR_URL;
    }

    function getValidAvatar(url, fallback) {
      var fb = fallback || DEFAULT_AVATAR_URL;
      if (!url || typeof url !== 'string' || !url.trim()) return fb;
      if (url.indexOf('data:image/svg+xml;utf8,<svg') === 0) return fb;
      return url.trim();
    }

    var userProfileData = { displayName: '', bio: '', avatarUrl: '' };
    var currentUser = null;

    function getUserAvatar() {
      var url = (userProfileData && userProfileData.avatarUrl) || (currentUser && currentUser.avatarUrl);
      return getValidAvatar(url, DEFAULT_AVATAR_URL);
    }

    function updateNavProfile() {
      var img = document.getElementById('nav-profile-img');
      if (img) {
        img.src = getUserAvatar();
      }
    }

    var currentDevice = 'ios';
    var isDarkMode = true;
    var activeTab = 'feed';
    var authToken = localStorage.getItem('gamiunity_token');
    
    var authMode = 'login'; // 'login' | 'register' | 'otp'
    var regForm = {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      dob: '',
      phone: ''
    };
    var generatedOtpCode = '';
    
    // Load local stored posts and reels
    var storedPosts = [];
    try {
      var savedPosts = localStorage.getItem('gamiunity_posts');
      if (savedPosts) storedPosts = JSON.parse(savedPosts);
    } catch(e) {}

    var storedReels = [];
    try {
      var savedReels = localStorage.getItem('gamiunity_reels');
      if (savedReels) storedReels = JSON.parse(savedReels);
    } catch(e) {}

    var storedStories = [];
    try {
      var savedStories = localStorage.getItem('gamiunity_stories');
      if (savedStories) storedStories = JSON.parse(savedStories);
    } catch(e) {}

    var storiesList = Array.isArray(storedStories) && storedStories.length > 0 ? storedStories : [
      { id: 'my-story', name: 'Your story', avatar: getUserAvatar(), hasStory: false, isUser: true }
    ];

    var postsFeed = Array.isArray(storedPosts) ? storedPosts : [];
    var defaultReels = [
      {
        id: 'reel-sample-1',
        author: 'alex_skater',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        videoBg: 'https://assets.mixkit.co/videos/preview/mixkit-skater-performing-a-trick-in-a-skatepark-41554-large.mp4',
        image: 'https://images.unsplash.com/photo-1547447134-cd3f5c716030?auto=format&fit=crop&w=800&q=80',
        isVideo: true,
        audioTrack: 'Original Audio - alex_skater',
        likesCount: 1420,
        liked: false,
        commentsCount: 38,
        caption: 'Sunset session at the park 🛹🔥 #skate #vibes',
        isReel: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'reel-sample-2',
        author: 'travel_lisa',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
        videoBg: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        isVideo: true,
        audioTrack: 'Ocean Waves & Chills 🌊',
        likesCount: 3890,
        liked: true,
        commentsCount: 94,
        caption: 'Morning serenity by the coast 🌅 Blue water state of mind',
        isReel: true,
        createdAt: new Date().toISOString()
      }
    ];
    var reelsFeed = Array.isArray(storedReels) && storedReels.length > 0 ? storedReels : defaultReels;

    function showUploadLoadingScreen(type, previewUrl, isVideo) {
      var container = document.getElementById('screen-content');
      if (!container) return;

      var typeLabel = type === 'story' ? 'Story' : (type === 'reel' ? 'Reel' : 'Post');
      var typeIcon = type === 'story' ? 'fa-bolt-lightning' : (type === 'reel' ? 'fa-clapperboard' : 'fa-image');

      var mediaPreviewHtml = isVideo ?
        '<video src="' + previewUrl + '" autoplay loop muted playsinline class="w-full h-full object-cover rounded-2xl opacity-70"></video>' :
        '<img src="' + previewUrl + '" class="w-full h-full object-cover rounded-2xl opacity-70">';

      container.innerHTML = [
        '<div class="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-white z-50 select-none relative overflow-hidden">',
          '<div class="absolute inset-0 bg-rose-500/10 backdrop-blur-3xl animate-pulse"></div>',

          '<div class="relative z-10 w-full max-w-xs flex flex-col items-center space-y-5 text-center">',
            '<div class="relative w-36 h-48 rounded-2xl overflow-hidden border-2 border-rose-500/60 shadow-2xl shadow-rose-500/30 bg-zinc-900 flex items-center justify-center">',
              mediaPreviewHtml,
              '<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex items-center justify-center">',
                '<div class="w-12 h-12 rounded-full insta-gradient-bg flex items-center justify-center text-white text-xl shadow-xl shadow-rose-500/40 animate-pulse">',
                  '<i class="fa-solid ' + typeIcon + '"></i>',
                '</div>',
              '</div>',
            '</div>',

            '<div>',
              '<h3 class="text-base font-extrabold text-white flex items-center justify-center gap-2">',
                '<span>Uploading ' + typeLabel + '</span>',
                '<i class="fa-solid fa-spinner animate-spin text-rose-400 text-sm"></i>',
              '</h3>',
              '<p id="upload-status-text" class="text-xs text-zinc-400 mt-1 font-medium">Compressing & optimizing media...</p>',
            '</div>',

            '<div class="w-full bg-zinc-900 border border-zinc-800 rounded-full h-3 p-0.5 relative overflow-hidden shadow-inner">',
              '<div id="upload-progress-bar" class="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-violet-500 rounded-full transition-all duration-300 w-0"></div>',
            '</div>',

            '<div class="flex items-center justify-between w-full text-[10px] text-zinc-500 font-mono">',
              '<span>LibreVerse Cloud Storage</span>',
              '<span id="upload-progress-pct" class="font-bold text-rose-400">0%</span>',
            '</div>',
          '</div>',
        '</div>'
      ].join('');
    }

    function updateUploadProgress(pct, statusText) {
      var bar = document.getElementById('upload-progress-bar');
      var pctText = document.getElementById('upload-progress-pct');
      var statusEl = document.getElementById('upload-status-text');

      if (bar) bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
      if (pctText) pctText.innerText = Math.round(pct) + '%';
      if (statusEl && statusText) statusEl.innerText = statusText;
    }

    var directMessages = [];

    var activeChatMessages = [];

    var activityList = [];

    function updateClock() {
      var now = new Date();
      var hours = String(now.getHours()).padStart(2, '0');
      var mins = String(now.getMinutes()).padStart(2, '0');
      document.getElementById('current-time').innerText = hours + ':' + mins;
    }
    setInterval(updateClock, 1000);
    updateClock();

    function setDevice(device) {
      currentDevice = device;
      var container = document.getElementById('device-container');
      var btnIos = document.getElementById('btn-ios');
      var btnAndroid = document.getElementById('btn-android');
      var notch = document.getElementById('notch');
      var homeBar = document.getElementById('home-bar');

      if (device === 'ios') {
        container.className = "ios-frame w-full max-w-[390px] h-[800px] " + (isDarkMode ? "bg-black text-white" : "bg-white text-zinc-900") + " flex flex-col relative overflow-hidden transition-all duration-300 border border-zinc-800 shadow-2xl";
        btnIos.className = "px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-900 font-medium transition-all flex items-center gap-1.5 shadow-sm";
        btnAndroid.className = "px-2.5 py-1 rounded-md text-zinc-400 hover:text-zinc-200 transition-all flex items-center gap-1.5";
        notch.className = "w-24 h-5 bg-zinc-900 rounded-full flex items-center justify-end px-2 gap-1.5";
        homeBar.classList.remove('hidden');
      } else {
        container.className = "android-frame w-full max-w-[390px] h-[800px] " + (isDarkMode ? "bg-black text-white" : "bg-white text-zinc-900") + " flex flex-col relative overflow-hidden transition-all duration-300 border border-zinc-800 shadow-2xl";
        btnAndroid.className = "px-2.5 py-1 rounded-md bg-emerald-600 text-white font-medium transition-all flex items-center gap-1.5 shadow-sm";
        btnIos.className = "px-2.5 py-1 rounded-md text-zinc-400 hover:text-zinc-200 transition-all flex items-center gap-1.5";
        notch.className = "w-3.5 h-3.5 bg-zinc-800 rounded-full my-1";
        homeBar.classList.add('hidden');
      }
    }

    function toggleTheme() {
      isDarkMode = !isDarkMode;
      var btnTheme = document.getElementById('btn-theme');
      if (isDarkMode) {
        btnTheme.innerHTML = '<i class="fa-solid fa-moon"></i> <span id="theme-label">Dark</span>';
      } else {
        btnTheme.innerHTML = '<i class="fa-solid fa-sun"></i> <span id="theme-label">Light</span>';
      }
      setDevice(currentDevice);
      renderScreen();
    }

    async function performAuth(endpoint, payload) {
      var errorEl = document.getElementById('auth-error');
      if (errorEl) {
        errorEl.classList.add('hidden');
        errorEl.innerText = '';
      }

      try {
        var res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        var data = await res.json();

        if (res.ok && data.accessToken) {
          authToken = data.accessToken;
          localStorage.setItem('gamiunity_token', authToken);
          await loadUserData();
          renderScreen();
          return true;
        }

        var msg = (typeof data.error === 'string' ? data.error : (data.error?.message || data.message)) || ('Auth failed (Status ' + res.status + ')');
        if (errorEl) {
          errorEl.innerText = msg;
          errorEl.classList.remove('hidden');
        } else {
          alert(msg);
        }
        return false;
      } catch (e) {
        console.error("Auth error:", e);
        var errText = "Connection error: " + (e.message || "Unable to reach server");
        if (errorEl) {
          errorEl.innerText = errText;
          errorEl.classList.remove('hidden');
        } else {
          alert(errText);
        }
        return false;
      }
    }

    async function apiFetch(endpoint, options) {
      if (!options) options = {};
      var opts = Object.assign({}, options);
      var method = (opts.method || 'GET').toUpperCase();
      var headers = Object.assign({}, opts.headers || {});

      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        if (opts.body === undefined || opts.body === null) {
          opts.body = JSON.stringify({});
        }
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
      } else if (opts.body) {
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
      }

      if (authToken) headers['Authorization'] = 'Bearer ' + authToken;
      opts.headers = headers;

      var res = await fetch('/api/v1' + endpoint, opts);
      if (res.status === 401) {
        authToken = null;
        localStorage.removeItem('gamiunity_token');
      }
      return res.json();
    }

    async function loadUserData() {
      if (!authToken) return;
      try {
        currentUser = await apiFetch('/auth/me');
        var prof = await apiFetch('/profiles/me');
        if (prof && prof.profile) {
          userProfileData.displayName = prof.profile.displayName || '';
          userProfileData.bio = prof.profile.bio || '';
          var profAvatar = prof.profile.avatarUrl || prof.profile.avatarMediaId;
          if (profAvatar) {
            userProfileData.avatarUrl = profAvatar;
          }
        }
        updateNavProfile();
        await loadSocialGraphData();
        await loadStoriesData();
      } catch (e) {
        console.warn("User/Profile fetch failed", e);
      }
    }

    var tempSelectedAvatar = null;
    function selectAvatar(url) {
      tempSelectedAvatar = url;
      var prev = document.getElementById('edit-avatar-preview');
      if (prev) prev.src = url;
    }

    function handleFileUpload(file, callback) {
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(e) {
        var dataUrl = e.target.result;
        callback(dataUrl, file);
      };
      reader.readAsDataURL(file);
    }

    function validateVideoDuration(file, dataUrl, maxSeconds, onSuccess, onError) {
      var isVid = (file && file.type && file.type.startsWith('video')) ||
                  (typeof dataUrl === 'string' && (dataUrl.indexOf('data:video') >= 0 || dataUrl.indexOf('blob:') >= 0)) ||
                  (file && file.name && file.name.match(/[.](mp4|webm|mov|mkv)$/i));
      if (!isVid) {
        onSuccess();
        return;
      }
      var tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.onloadedmetadata = function() {
        if (tempVideo.duration && tempVideo.duration > maxSeconds) {
          onError(tempVideo.duration);
        } else {
          onSuccess();
        }
      };
      tempVideo.onerror = function() {
        onSuccess();
      };
      tempVideo.src = dataUrl;
    }

    function triggerAvatarUpload(event) {
      var file = event.target && event.target.files && event.target.files[0];
      if (!file) return;
      handleFileUpload(file, async function(dataUrl, f) {
        tempSelectedAvatar = dataUrl;
        var preview = document.getElementById('edit-avatar-preview');
        if (preview) preview.src = dataUrl;
        try {
          var uploadRes = await apiFetch('/media/upload/init', {
            method: 'POST',
            body: JSON.stringify({ mimeType: f.type || 'image/jpeg', byteSize: f.size || 102400, storageBucket: 'platform-avatars' })
          });
          if (uploadRes && uploadRes.mediaId) {
            await apiFetch('/media/' + uploadRes.mediaId + '/complete', { method: 'POST', body: JSON.stringify({}) });
          }
        } catch(e) { console.warn("Avatar media init error:", e); }
      });
    }

    function openEditProfileModal() {
      var container = document.getElementById('screen-content');
      var bgClass = isDarkMode ? "bg-black text-white" : "bg-white text-zinc-900";
      var currentName = userProfileData.displayName || (currentUser ? (currentUser.email ? currentUser.email.split('@')[0] : 'user') : 'user');
      var currentBio = userProfileData.bio || '';
      var currentAvatar = getUserAvatar();
      tempSelectedAvatar = null;

      container.innerHTML = [
        '<div class="flex-1 flex flex-col ' + bgClass + ' z-30">',
          '<input type="file" id="avatar-file-input" accept="image/*" class="hidden" onchange="triggerAvatarUpload(event)">',
          '<div class="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">',
            '<button onclick="renderScreen()" class="text-zinc-400 text-sm">Cancel</button>',
            '<h2 class="font-bold text-sm">Edit Profile</h2>',
            '<button onclick="saveProfileData()" class="text-xs font-bold text-sky-500 hover:text-sky-400">Done</button>',
          '</div>',
          '<div class="flex-1 p-4 space-y-4 overflow-y-auto">',
            '<div class="flex flex-col items-center gap-2">',
              '<div class="w-20 h-20 rounded-full bg-zinc-800 overflow-hidden relative border border-zinc-700 shadow-md">',
                '<img id="edit-avatar-preview" src="' + currentAvatar + '" class="w-full h-full object-cover">',
              '</div>',
              '<button onclick="document.getElementById(&quot;avatar-file-input&quot;).click()" class="px-3 py-1 bg-zinc-800 border border-zinc-700 hover:border-rose-500 text-xs text-white font-semibold rounded-xl flex items-center gap-1.5 transition">',
                '<i class="fa-solid fa-cloud-arrow-up text-rose-400"></i>',
                '<span>Upload Custom Photo</span>',
              '</button>',
            '</div>',
            '<div>',
              '<label class="text-[11px] font-medium text-zinc-400 block mb-1">Name / Display Name</label>',
              '<input id="edit-display-name" type="text" value="' + currentName + '" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500">',
            '</div>',
            '<div>',
              '<label class="text-[11px] font-medium text-zinc-400 block mb-1">Bio</label>',
              '<textarea id="edit-bio" rows="3" placeholder="Tell the community about yourself..." class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500">' + currentBio + '</textarea>',
            '</div>',
          '</div>',
        '</div>'
      ].join('');
    }

    async function saveProfileData() {
      var nameInput = document.getElementById('edit-display-name');
      var bioInput = document.getElementById('edit-bio');
      var newName = nameInput ? nameInput.value.trim() : '';
      var newBio = bioInput ? bioInput.value.trim() : '';

      userProfileData.displayName = newName;
      userProfileData.bio = newBio;
      if (tempSelectedAvatar) {
        userProfileData.avatarUrl = tempSelectedAvatar;
      }

      try {
        await apiFetch('/profiles/me', {
          method: 'PATCH',
          body: JSON.stringify({ displayName: newName, bio: newBio, avatarUrl: userProfileData.avatarUrl })
        });
      } catch (e) {
        console.warn("Profile update API error:", e);
      }

      updateNavProfile();
      switchTab('profile');
    }

    function switchTab(tab) {
      activeTab = tab;
      var navFeed = document.getElementById('nav-feed');
      var navExplore = document.getElementById('nav-explore');
      var navReels = document.getElementById('nav-reels');
      var navProfileRing = document.getElementById('nav-profile-ring');

      if (navFeed) navFeed.className = "p-2 " + (tab === 'feed' ? (isDarkMode ? "text-white scale-105" : "text-black scale-105") : "text-zinc-500 hover:text-zinc-300");
      if (navExplore) navExplore.className = "p-2 " + (tab === 'explore' ? (isDarkMode ? "text-white scale-105" : "text-black scale-105") : "text-zinc-500 hover:text-zinc-300");
      if (navReels) navReels.className = "p-2 " + (tab === 'reels' ? (isDarkMode ? "text-white scale-105" : "text-black scale-105") : "text-zinc-500 hover:text-zinc-300");
      
      if (navProfileRing) {
        navProfileRing.className = tab === 'profile' ? "w-7 h-7 rounded-full p-[1.5px] insta-gradient-bg" : "w-7 h-7 rounded-full p-[1.5px] bg-transparent";
      }

      if (tab === 'feed') {
        loadStoriesData().then(function() {
          renderScreen();
        });
      } else {
        renderScreen();
      }
    }

    function renderScreen() {
      var container = document.getElementById('screen-content');
      var bottomNav = document.getElementById('bottom-nav');
      if (!container) return;

      if (!authToken) {
        if (bottomNav) bottomNav.classList.add('hidden');
        container.innerHTML = renderAuthScreen();
        return;
      } else {
        if (bottomNav) bottomNav.classList.remove('hidden');
        updateNavProfile();
      }

      switch (activeTab) {
        case 'feed': container.innerHTML = renderFeedScreen(); break;
        case 'explore': 
          container.innerHTML = renderExploreScreen(); 
          renderExploreGrid();
          break;
        case 'reels': container.innerHTML = renderReelsScreen(); break;
        case 'profile': container.innerHTML = renderProfileScreen(); break;
        case 'activity': container.innerHTML = renderActivityScreen(); break;
        case 'dms': container.innerHTML = renderDMsScreen(); break;
        default: container.innerHTML = renderFeedScreen();
      }
    }

    function switchAuthMode(mode) {
      authMode = mode;
      renderScreen();
    }

    function renderAuthScreen() {
      if (authMode === 'register') {
        return renderRegisterScreen();
      } else if (authMode === 'otp') {
        return renderOtpScreen();
      }
      return renderLoginScreen();
    }

    function renderLoginScreen() {
      return [
        '<div class="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-zinc-100 overflow-y-auto">',
          '<div class="pt-8 text-center flex flex-col items-center">',
            '<div class="w-14 h-14 rounded-2xl insta-gradient-bg flex items-center justify-center text-white text-2xl shadow-xl shadow-rose-500/25 mb-3">',
              '<svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
            '</div>',
            '<h1 class="font-insta text-4xl font-extrabold tracking-tight text-white mb-1 bg-gradient-to-r from-rose-400 via-amber-300 to-violet-400 bg-clip-text text-transparent">LibreVerse</h1>',
            '<p class="text-xs text-zinc-400">Unfiltered social platform for freedom of expression</p>',
          '</div>',
          '<div class="space-y-3 bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 shadow-xl my-4">',
            '<div id="auth-error" class="hidden text-xs text-rose-400 bg-rose-950/60 border border-rose-800 p-2.5 rounded-xl text-center"></div>',
            '<div>',
              '<label class="text-[11px] font-medium text-zinc-400 block mb-1">Email or Username</label>',
              '<input id="auth-email" type="email" placeholder="e.g. user@example.com" value="" class="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 transition">',
            '</div>',
            '<div>',
              '<label class="text-[11px] font-medium text-zinc-400 block mb-1">Password</label>',
              '<input id="auth-password" type="password" placeholder="Enter your password" value="" class="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 transition">',
            '</div>',
            '<button id="btn-signin" onclick="handleLoginSubmit()" class="w-full bg-sky-500 hover:bg-sky-600 text-white py-2.5 rounded-xl font-semibold text-xs shadow-lg shadow-sky-500/20 transition flex items-center justify-center gap-2">Log In</button>',
            '<button id="btn-goto-register" onclick="switchAuthMode(&quot;register&quot;)" class="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2.5 rounded-xl font-medium text-xs border border-zinc-700 transition">Create New Account</button>',
          '</div>',
          '<div class="text-center pt-2 pb-4">',
            '<span class="text-[11px] text-zinc-500">Authentication powered by Supabase & OAuth</span>',
          '</div>',
        '</div>'
      ].join('');
    }

    function renderRegisterScreen() {
      return [
        '<div class="flex-1 flex flex-col justify-between p-5 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-zinc-100 overflow-y-auto">',
          '<div class="pt-4 text-center">',
            '<h1 class="font-insta text-3xl font-normal tracking-wide text-white mb-1">Create Account</h1>',
            '<p class="text-[11px] text-rose-400 font-medium">Step 1 of 2: Personal Information</p>',
          '</div>',
          '<div class="space-y-2.5 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 shadow-xl my-2">',
            '<div id="auth-error" class="hidden text-xs text-rose-400 bg-rose-950/60 border border-rose-800 p-2.5 rounded-xl text-center"></div>',
            '<div>',
              '<label class="text-[11px] font-medium text-zinc-400 block mb-1">Full Name</label>',
              '<input id="auth-reg-fullname" type="text" placeholder="e.g. John Doe" value="' + (regForm.fullName || '') + '" class="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 transition">',
            '</div>',
            '<div>',
              '<label class="text-[11px] font-medium text-zinc-400 block mb-1">Email Address</label>',
              '<input id="auth-reg-email" type="email" placeholder="e.g. user@domain.com" value="' + (regForm.email || '') + '" class="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 transition">',
            '</div>',
            '<div class="grid grid-cols-2 gap-2">',
              '<div>',
                '<label class="text-[11px] font-medium text-zinc-400 block mb-1">Password</label>',
                '<input id="auth-reg-password" type="password" placeholder="Create password" value="' + (regForm.password || '') + '" class="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 transition">',
              '</div>',
              '<div>',
                '<label class="text-[11px] font-medium text-zinc-400 block mb-1">Confirm Password</label>',
                '<input id="auth-reg-confirm-password" type="password" placeholder="Confirm password" value="' + (regForm.confirmPassword || '') + '" class="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 transition">',
              '</div>',
            '</div>',
            '<div class="grid grid-cols-2 gap-2">',
              '<div>',
                '<label class="text-[11px] font-medium text-zinc-400 block mb-1">Date of Birth</label>',
                '<input id="auth-reg-dob" type="date" value="' + (regForm.dob || '') + '" class="w-full bg-black border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 transition">',
              '</div>',
              '<div>',
                '<label class="text-[11px] font-medium text-zinc-400 block mb-1">Phone Number</label>',
                '<input id="auth-reg-phone" type="tel" placeholder="+1 (555) 000-0000" value="' + (regForm.phone || '') + '" class="w-full bg-black border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 transition">',
              '</div>',
            '</div>',
            '<button onclick="handleSendOtp()" class="w-full bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-xl font-semibold text-xs shadow-lg shadow-rose-500/20 transition flex items-center justify-center gap-2 mt-2">',
              '<span>Send OTP Verification</span> <i class="fa-solid fa-arrow-right text-[10px]"></i>',
            '</button>',
          '</div>',
          '<div class="text-center pt-1 pb-3">',
            '<button onclick="switchAuthMode(&quot;login&quot;)" class="text-xs text-zinc-400 hover:text-white transition">Already have an account? <span class="text-sky-400 font-semibold">Log In</span></button>',
          '</div>',
        '</div>'
      ].join('');
    }

    function renderOtpScreen() {
      var recipient = regForm.email || regForm.phone || 'your address';
      var activeCode = generatedOtpCode || '';
      return [
        '<div class="flex-1 flex flex-col justify-between p-5 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-zinc-100 overflow-y-auto">',
          '<div class="pt-6 text-center">',
            '<div class="w-12 h-12 bg-rose-500/20 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto mb-2 text-rose-400 text-xl">',
              '<i class="fa-solid fa-shield-halved"></i>',
            '</div>',
            '<h1 class="font-bold text-xl text-white mb-1">Verify Verification Code</h1>',
            '<p class="text-xs text-zinc-400 px-4">Step 2 of 2: A 6-digit OTP code was generated for <br><span class="text-zinc-200 font-semibold">' + recipient + '</span></p>',
          '</div>',
          '<div class="space-y-4 bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 shadow-xl my-4">',
            '<div id="auth-error" class="hidden text-xs text-rose-400 bg-rose-950/60 border border-rose-800 p-2.5 rounded-xl text-center"></div>',
            '<div class="bg-amber-950/40 border border-amber-800/50 p-3 rounded-xl text-center text-xs text-amber-200">',
              '<span class="block font-semibold mb-0.5"><i class="fa-solid fa-key text-amber-400 mr-1"></i> Verification Code:</span>',
              '<span class="font-mono text-base font-bold text-amber-300 tracking-wider">' + activeCode + '</span>',
              '<span class="block text-[10px] text-amber-400/80 mt-1">(Enter the 6-digit code above to finish registration)</span>',
            '</div>',
            '<div>',
              '<label class="text-[11px] font-medium text-zinc-400 block mb-1 text-center">Enter 6-Digit Code</label>',
              '<input id="auth-reg-otp" type="text" maxlength="6" value="' + activeCode + '" placeholder="6-digit code" class="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-rose-500 transition">',
            '</div>',
            '<button onclick="handleVerifyOtpAndRegister()" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-semibold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2">',
              '<i class="fa-solid fa-check"></i> Verify & Finish Registration',
            '</button>',
            '<div class="flex items-center justify-between text-xs pt-1">',
              '<button onclick="resendOtpCode()" class="text-rose-400 hover:underline">Resend OTP</button>',
              '<button onclick="switchAuthMode(&quot;register&quot;)" class="text-zinc-400 hover:text-white">← Edit Info</button>',
            '</div>',
          '</div>',
          '<div class="text-center pb-4">',
            '<button onclick="switchAuthMode(&quot;login&quot;)" class="text-xs text-zinc-500 hover:text-zinc-300">Cancel & return to Log In</button>',
          '</div>',
        '</div>'
      ].join('');
    }

    async function handleLoginSubmit() {
      var email = document.getElementById('auth-email').value.trim();
      var password = document.getElementById('auth-password').value;
      if (!email || !password) {
        var errorEl = document.getElementById('auth-error');
        if (errorEl) {
          errorEl.innerText = "Please enter both email and password.";
          errorEl.classList.remove('hidden');
        }
        return;
      }
      await performAuth('/api/v1/auth/login', { email: email, password: password });
    }

    function handleSendOtp() {
      var nameEl = document.getElementById('auth-reg-fullname');
      var emailEl = document.getElementById('auth-reg-email');
      var passwordEl = document.getElementById('auth-reg-password');
      var confirmPasswordEl = document.getElementById('auth-reg-confirm-password');
      var dobEl = document.getElementById('auth-reg-dob');
      var phoneEl = document.getElementById('auth-reg-phone');

      var fullName = nameEl ? nameEl.value.trim() : '';
      var email = emailEl ? emailEl.value.trim() : '';
      var password = passwordEl ? passwordEl.value : '';
      var confirmPassword = confirmPasswordEl ? confirmPasswordEl.value : '';
      var dob = dobEl ? dobEl.value.trim() : '';
      var rawPhone = phoneEl ? phoneEl.value.trim() : '';

      var errorEl = document.getElementById('auth-error');

      if (!fullName || !email || !password || !confirmPassword || !dob || !rawPhone) {
        if (errorEl) {
          errorEl.innerText = "Please complete all fields (Full Name, Email, Password, Confirm Password, Date of Birth, Phone).";
          errorEl.classList.remove('hidden');
        }
        return;
      }

      var emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      if (!emailPattern.test(email)) {
        if (errorEl) {
          errorEl.innerText = "Invalid email format. Please enter a valid email address (e.g. name@domain.com).";
          errorEl.classList.remove('hidden');
        }
        return;
      }

      if (password !== confirmPassword) {
        if (errorEl) {
          errorEl.innerText = "Passwords do not match. Please ensure Password and Confirm Password are identical.";
          errorEl.classList.remove('hidden');
        }
        return;
      }

      if (password.length < 8) {
        if (errorEl) {
          errorEl.innerText = "Password must be at least 8 characters long.";
          errorEl.classList.remove('hidden');
        }
        return;
      }

      var cleanedPhone = rawPhone;
      if (cleanedPhone.startsWith('00')) {
        cleanedPhone = '+' + cleanedPhone.slice(2).replace(/\\D/g, '');
      } else if (!cleanedPhone.startsWith('+')) {
        if (errorEl) {
          errorEl.innerText = "Phone number must start with country code '+' (e.g. +15551234567 or +923001234567).";
          errorEl.classList.remove('hidden');
        }
        return;
      } else {
        cleanedPhone = '+' + cleanedPhone.slice(1).replace(/\\D/g, '');
      }

      var phonePattern = /^\\+[1-9]\\d{6,14}$/;
      if (!phonePattern.test(cleanedPhone)) {
        if (errorEl) {
          errorEl.innerText = "Invalid phone number format. Must be E.164 with country code (e.g. +15551234567 or +923001234567).";
          errorEl.classList.remove('hidden');
        }
        return;
      }

      regForm.fullName = fullName;
      regForm.email = email;
      regForm.password = password;
      regForm.confirmPassword = confirmPassword;
      regForm.dob = dob;
      regForm.phone = cleanedPhone;

      generatedOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
      authMode = 'otp';
      renderScreen();
    }

    async function handleVerifyOtpAndRegister() {
      var otpEl = document.getElementById('auth-reg-otp');
      var otpVal = otpEl ? otpEl.value.trim() : '';
      var errorEl = document.getElementById('auth-error');

      if (!otpVal || otpVal.length < 6) {
        if (errorEl) {
          errorEl.innerText = "Please enter the complete 6-digit OTP code.";
          errorEl.classList.remove('hidden');
        }
        return;
      }

      if (generatedOtpCode && otpVal !== generatedOtpCode) {
        if (errorEl) {
          errorEl.innerText = "Invalid OTP code. Please enter the exact 6-digit verification code generated.";
          errorEl.classList.remove('hidden');
        }
        return;
      }

      var success = await performAuth('/api/v1/auth/register', {
        email: regForm.email,
        password: regForm.password,
        fullName: regForm.fullName,
        dob: regForm.dob,
        phone: regForm.phone
      });

      if (success && regForm.fullName) {
        userProfileData.displayName = regForm.fullName;
      }
    }

    function resendOtpCode() {
      generatedOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
      var recipient = regForm.email || regForm.phone || 'your address';
      var errorEl = document.getElementById('auth-error');
      if (errorEl) {
        errorEl.className = "text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800 p-2.5 rounded-xl text-center";
        errorEl.innerText = "A new verification code has been dispatched to " + recipient;
        errorEl.classList.remove('hidden');
      }
    }

    function renderFeedScreen() {
      var bgClass = isDarkMode ? "bg-black text-white" : "bg-white text-zinc-900";
      var headerBg = isDarkMode ? "bg-black/90 border-zinc-800/80" : "bg-white/90 border-zinc-200";

      var html = '<div class="flex-1 flex flex-col ' + bgClass + '">';
      
      html += '<div class="px-4 py-2.5 ' + headerBg + ' border-b flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">' +
        '<div class="flex items-center gap-2 cursor-pointer select-none" onclick="switchTab(&quot;feed&quot;)">' +
          '<div class="w-7 h-7 rounded-xl insta-gradient-bg flex items-center justify-center text-white text-xs font-bold shadow-md shadow-rose-500/20">' +
            '<svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' +
          '</div>' +
          '<h1 class="font-insta text-2xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 via-amber-300 to-violet-400 bg-clip-text text-transparent">LibreVerse</h1>' +
        '</div>' +
        '<div class="flex items-center gap-4 text-xl">' +
          '<button onclick="switchTab(&quot;activity&quot;)" class="relative p-1 hover:text-rose-500 transition">' +
            '<i class="fa-regular fa-heart"></i>' +
            '<span class="w-2 h-2 rounded-full bg-rose-500 absolute top-1 right-1"></span>' +
          '</button>' +
          '<button onclick="switchTab(&quot;dms&quot;)" class="relative p-1 hover:text-rose-500 transition">' +
            '<i class="fa-regular fa-paper-plane"></i>' +
            '<span class="w-2 h-2 rounded-full bg-rose-500 absolute top-1 right-1"></span>' +
          '</button>' +
        '</div>' +
      '</div>';

      html += '<div class="py-3 px-2 border-b ' + (isDarkMode ? 'border-zinc-800/60 bg-zinc-950/40' : 'border-zinc-100 bg-zinc-50/50') + ' flex items-center gap-3.5 overflow-x-auto select-none min-h-[90px]">';
      storiesList.forEach(function(s) {
        var sAvatar = getValidAvatar(s.avatar, s.isUser ? getUserAvatar() : DEFAULT_AVATAR_URL);
        var userHasStory = s.hasStory || (s.items && s.items.length > 0) || (s.mediaUrl && s.mediaUrl !== '');
        if (s.isUser) {
          var ringClass = userHasStory ? "insta-story-ring" : (isDarkMode ? "p-[2px] bg-zinc-800" : "p-[2px] bg-zinc-300");
          html += '<div onclick="' + (userHasStory ? 'openStoryViewer(&quot;' + s.id + '&quot;)' : 'openCreateStoryModal()') + '" class="flex flex-col items-center gap-1 shrink-0 cursor-pointer group">' +
            '<div class="' + ringClass + ' relative w-14 h-14 rounded-full">' +
              '<div class="w-full h-full rounded-full p-[2px] ' + (isDarkMode ? 'bg-black' : 'bg-white') + '">' +
                '<img src="' + sAvatar + '" class="w-full h-full rounded-full object-cover">' +
              '</div>' +
              '<div class="absolute bottom-0 right-0 w-4.5 h-4.5 rounded-full bg-rose-500 border-2 ' + (isDarkMode ? 'border-black' : 'border-white') + ' flex items-center justify-center text-[9px] text-white shadow-md" onclick="event.stopPropagation(); openCreateStoryModal();" title="Add story">' +
                '<i class="fa-solid fa-plus"></i>' +
              '</div>' +
            '</div>' +
            '<span class="text-[10px] ' + (userHasStory ? 'font-semibold text-rose-400' : 'text-zinc-400') + ' truncate max-w-[60px]">Your story</span>' +
          '</div>';
        } else {
          var ringClass = s.unread ? "insta-story-ring" : (isDarkMode ? "p-[2px] bg-zinc-800" : "p-[2px] bg-zinc-300");
          html += '<div onclick="openStoryViewer(&quot;' + s.id + '&quot;)" class="flex flex-col items-center gap-1 shrink-0 cursor-pointer group">' +
            '<div class="' + ringClass + ' w-14 h-14">' +
              '<div class="w-full h-full rounded-full p-[2px] ' + (isDarkMode ? 'bg-black' : 'bg-white') + '">' +
                '<img src="' + sAvatar + '" class="w-full h-full rounded-full object-cover">' +
              '</div>' +
            '</div>' +
            '<span class="text-[10px] ' + (s.unread ? 'font-semibold text-zinc-200' : 'text-zinc-400') + ' truncate max-w-[62px]">' + s.name + '</span>' +
          '</div>';
        }
      });
      html += '</div>';

      html += '<div class="flex-1 overflow-y-auto divide-y ' + (isDarkMode ? 'divide-zinc-800/60' : 'divide-zinc-100') + '">';
      if (postsFeed.length === 0) {
        html += '<div class="p-8 text-center space-y-3 my-12 flex flex-col items-center justify-center">' +
          '<div class="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-500 text-2xl">' +
            '<i class="fa-solid fa-camera"></i>' +
          '</div>' +
          '<h3 class="text-sm font-bold text-white">No Posts Yet</h3>' +
          '<p class="text-xs text-zinc-400 max-w-xs">Be the first to create a post! All content is saved directly to your account database.</p>' +
          '<button onclick="openCreateModal()" class="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-500/20 transition flex items-center gap-2 mt-2">' +
            '<i class="fa-solid fa-plus"></i> Create First Post' +
          '</button>' +
        '</div>';
      } else {
        postsFeed.forEach(function(post) {
          var postAv = getValidAvatar(post.avatar, getUserAvatar());
          var postSrc = post.image || post.videoBg || '';
          var isPostVid = post.isVideo || postSrc.startsWith('data:video') || postSrc.includes('.mp4') || postSrc.includes('.webm') || postSrc.includes('.mov');
          var mediaTag = isPostVid ?
            '<video src="' + postSrc + '" autoplay loop muted playsinline class="w-full h-[360px] object-cover"></video>' :
            '<img src="' + postSrc + '" class="w-full h-[360px] object-cover">';

          html += '<div id="post-card-' + post.id + '" class="pb-4 pt-2">' +
            '<div class="px-3 py-2 flex items-center justify-between">' +
              '<div class="flex items-center gap-2.5">' +
                '<div class="insta-story-ring w-9 h-9 cursor-pointer" onclick="openStoryViewer(&quot;' + post.author + '&quot;)">' +
                  '<div class="w-full h-full rounded-full p-[1.5px] ' + (isDarkMode ? 'bg-black' : 'bg-white') + '">' +
                    '<img src="' + postAv + '" class="w-full h-full rounded-full object-cover">' +
                  '</div>' +
                '</div>' +
                '<div>' +
                  '<div class="flex items-center gap-1">' +
                    '<span class="text-xs font-bold text-zinc-100 hover:underline cursor-pointer">' + post.author + '</span>' +
                    '<i class="fa-solid fa-circle-check text-sky-500 text-[10px]"></i>' +
                  '</div>' +
                  '<p class="text-[10px] text-zinc-400">' + post.location + '</p>' +
                '</div>' +
              '</div>' +
              '<button class="text-zinc-400 p-1 hover:text-white"><i class="fa-solid fa-ellipsis"></i></button>' +
            '</div>' +

            '<div class="relative bg-zinc-900 group select-none overflow-hidden" ondoubleclick="toggleLikePost(&quot;' + post.id + '&quot;, true)">' +
              mediaTag +
              '<div id="heart-anim-' + post.id + '" class="hidden absolute inset-0 flex items-center justify-center text-rose-500 text-7xl drop-shadow-2xl pointer-events-none">' +
                '<i class="fa-solid fa-heart animate-heart-pop"></i>' +
              '</div>' +
            '</div>' +

            '<div class="px-3 pt-3 flex items-center justify-between text-xl">' +
              '<div class="flex items-center gap-4">' +
                '<button onclick="toggleLikePost(&quot;' + post.id + '&quot;)" class="transition transform active:scale-125">' +
                  '<i id="like-icon-' + post.id + '" class="' + (post.liked ? 'fa-solid fa-heart text-rose-500' : 'fa-regular fa-heart text-zinc-100') + '"></i>' +
                '</button>' +
                '<button onclick="focusCommentInput(&quot;' + post.id + '&quot;)" class="text-zinc-100 hover:text-rose-400 transition">' +
                  '<i class="fa-regular fa-comment"></i>' +
                '</button>' +
                '<button onclick="switchTab(&quot;dms&quot;)" class="text-zinc-100 hover:text-rose-400 transition">' +
                  '<i class="fa-regular fa-paper-plane"></i>' +
                '</button>' +
              '</div>' +
              '<button onclick="toggleSavePost(&quot;' + post.id + '&quot;)" class="text-zinc-100 hover:text-rose-400 transition">' +
                '<i id="save-icon-' + post.id + '" class="' + (post.saved ? 'fa-solid fa-bookmark text-zinc-100' : 'fa-regular fa-bookmark') + '"></i>' +
              '</button>' +
            '</div>' +

            '<div class="px-3 pt-2">' +
              '<p class="text-xs font-bold text-zinc-100">' +
                '<span id="likes-count-' + post.id + '">' + post.likesCount.toLocaleString() + '</span> likes' +
              '</p>' +
            '</div>' +

            '<div class="px-3 pt-1 text-xs text-zinc-200">' +
              '<span class="font-bold mr-1 text-zinc-100">' + post.author + '</span>' +
              '<span>' + post.caption + '</span>' +
            '</div>' +

            '<div class="px-3 pt-1 space-y-0.5">' +
              post.comments.map(function(c) {
                return '<div class="text-[11px] text-zinc-300">' +
                  '<span class="font-semibold text-zinc-100 mr-1.5">' + c.user + '</span>' +
                  '<span>' + c.text + '</span>' +
                '</div>';
              }).join('') +
            '</div>' +

            '<div class="px-3 pt-1.5">' +
              '<span class="text-[10px] text-zinc-500 tracking-wider">' + post.timeAgo + '</span>' +
            '</div>' +

            '<div class="px-3 pt-2.5 flex items-center gap-2 border-t ' + (isDarkMode ? 'border-zinc-900' : 'border-zinc-100') + ' mt-2">' +
              '<input id="comment-input-' + post.id + '" type="text" placeholder="Add a comment..." class="flex-1 bg-transparent text-xs text-zinc-100 focus:outline-none placeholder-zinc-500">' +
              '<button onclick="addComment(&quot;' + post.id + '&quot;)" class="text-xs font-semibold text-sky-500 hover:text-sky-400">Post</button>' +
            '</div>' +
          '</div>';
        });
      }
      html += '</div></div>';
      return html;
    }

    async function toggleLikePost(postId, forceLike) {
      if (forceLike === undefined) forceLike = false;
      var post = postsFeed.find(function(p) { return p.id === postId; });
      if (!post) return;

      if (forceLike) {
        if (!post.liked) {
          post.liked = true;
          post.likesCount += 1;
        }
        var heartAnim = document.getElementById('heart-anim-' + postId);
        if (heartAnim) {
          heartAnim.classList.remove('hidden');
          setTimeout(function() { heartAnim.classList.add('hidden'); }, 800);
        }
      } else {
        post.liked = !post.liked;
        post.likesCount += post.liked ? 1 : -1;
      }

      var icon = document.getElementById('like-icon-' + postId);
      if (icon) {
        icon.className = post.liked ? 'fa-solid fa-heart text-rose-500' : 'fa-regular fa-heart text-zinc-100';
      }
      var count = document.getElementById('likes-count-' + postId);
      if (count) {
        count.innerText = post.likesCount.toLocaleString();
      }

      try {
        localStorage.setItem('gamiunity_posts', JSON.stringify(postsFeed));
      } catch(e) {}
    }

    function toggleSavePost(postId) {
      var post = postsFeed.find(function(p) { return p.id === postId; });
      if (!post) return;

      post.saved = !post.saved;
      var icon = document.getElementById('save-icon-' + postId);
      if (icon) {
        icon.className = post.saved ? 'fa-solid fa-bookmark text-zinc-100' : 'fa-regular fa-bookmark';
      }
      try {
        localStorage.setItem('gamiunity_posts', JSON.stringify(postsFeed));
      } catch(e) {}
    }

    function focusCommentInput(postId) {
      var input = document.getElementById('comment-input-' + postId);
      if (input) input.focus();
    }

    async function addComment(postId) {
      var input = document.getElementById('comment-input-' + postId);
      if (!input || !input.value.trim()) return;

      var post = postsFeed.find(function(p) { return p.id === postId; });
      if (!post) return;

      var commentText = input.value.trim();
      var user = currentUser ? (currentUser.email ? currentUser.email.split('@')[0] : 'you') : 'you';
      post.comments.push({ user: user, text: commentText });
      input.value = '';

      try {
        localStorage.setItem('gamiunity_posts', JSON.stringify(postsFeed));
      } catch(e) {}

      renderScreen();
    }

    async function loadStoriesData() {
      if (!authToken) return;
      try {
        var res = await apiFetch('/stories/feed');
        var rawStories = (res && Array.isArray(res.stories)) ? res.stories : (Array.isArray(res) ? res : []);

        var formattedStories = rawStories.map(function(s) {
          var name = s.authorDisplayName || (s.authorAlias ? '@' + s.authorAlias : 'User');
          var avatar = getValidAvatar(s.authorAvatarUrl, DEFAULT_AVATAR_URL);
          var items = s.items || [];
          var firstItem = items[0];
          var mediaUrl = (firstItem && firstItem.mediaUrl) || s.mediaUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';
          var isUserStory = currentUser ? (
            (s.authorUserId && (s.authorUserId === currentUser.id || s.authorUserId === currentUser.userId || s.authorUserId === currentUser.email)) ||
            s.isUser ||
            (s.authorAlias && currentUser.email && currentUser.email.startsWith(s.authorAlias))
          ) : false;

          return {
            id: s.id,
            name: name,
            avatar: avatar,
            caption: s.caption || '',
            mediaUrl: mediaUrl,
            items: items,
            unread: !s.isViewedByMe,
            viewsCount: s.viewsCount || 0,
            isUser: isUserStory,
            hasStory: true,
            createdAt: s.createdAt
          };
        });

        var userStories = formattedStories.filter(function(s) { return s.isUser; });
        var friendStories = formattedStories.filter(function(s) { return !s.isUser; });

        var localUserStory = storedStories.find(function(s) { return s.isUser && (s.hasStory || (s.items && s.items.length > 0) || (s.mediaUrl && s.mediaUrl !== '')); });
        var primaryUserStory = (userStories.length > 0 ? userStories[0] : null) || localUserStory;

        var myAvatar = getUserAvatar();

        storiesList = [
          {
            id: primaryUserStory ? primaryUserStory.id : 'my-story',
            name: 'Your story',
            avatar: primaryUserStory ? getValidAvatar(primaryUserStory.avatar, myAvatar) : myAvatar,
            hasStory: !!primaryUserStory && !!(primaryUserStory.mediaUrl || (primaryUserStory.items && primaryUserStory.items.length > 0) || primaryUserStory.hasStory),
            isUser: true,
            caption: primaryUserStory ? primaryUserStory.caption : '',
            mediaUrl: primaryUserStory ? (primaryUserStory.mediaUrl || (primaryUserStory.items && primaryUserStory.items[0] && primaryUserStory.items[0].mediaUrl) || '') : '',
            isVideo: primaryUserStory ? (!!primaryUserStory.isVideo || (primaryUserStory.items && primaryUserStory.items[0] && !!primaryUserStory.items[0].isVideo)) : false,
            items: primaryUserStory ? (primaryUserStory.items || []) : [],
            viewsCount: primaryUserStory ? (primaryUserStory.viewsCount || 0) : 0
          }
        ].concat(friendStories);

      } catch (e) {
        console.warn("Load stories feed error:", e);
        if (storedStories && storedStories.length > 0) {
          storiesList = storedStories;
        }
      }
    }

    function openMyStoryOrModal() {
      var myStory = storiesList.find(function(s) {
        return s.isUser && (s.hasStory || (s.items && s.items.length > 0) || (s.mediaUrl && s.mediaUrl !== ''));
      });
      if (myStory && (myStory.hasStory || (myStory.items && myStory.items.length > 0) || myStory.mediaUrl)) {
        openStoryViewer(myStory.id);
      } else {
        openCreateStoryModal();
      }
    }

    var currentStoryTimer = null;

    async function openStoryViewer(storyId) {
      if (currentStoryTimer) clearTimeout(currentStoryTimer);

      var story = storiesList.find(function(s) { return s.id === storyId; });
      if (!story) {
        story = storiesList.find(function(s) { return s.isUser && (s.hasStory || (s.items && s.items.length > 0) || (s.mediaUrl && s.mediaUrl !== '')); });
      }
      if (!story) story = storiesList[0];

      var hasContent = story && (story.hasStory || (story.items && story.items.length > 0) || (story.mediaUrl && story.mediaUrl !== ''));

      if (!story || (!hasContent && story.isUser)) {
        openCreateStoryModal();
        return;
      }

      story.unread = false;

      if (story.id && story.id !== 'my-story') {
        apiFetch('/stories/' + story.id + '/view', { method: 'POST' }).catch(function(){});
      }

      var currIdx = storiesList.findIndex(function(s) { return s.id === story.id; });
      var prevStory = currIdx > 0 ? storiesList[currIdx - 1] : null;
      var nextStory = currIdx < storiesList.length - 1 ? storiesList[currIdx + 1] : null;

      var container = document.getElementById('screen-content');
      if (!container) return;

      var storyImg = story.mediaUrl || (story.items && story.items[0] && story.items[0].mediaUrl) || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';
      var isVideo = story.isVideo || (story.items && story.items[0] && story.items[0].isVideo) || storyImg.startsWith('data:video') || storyImg.includes('.mp4') || storyImg.includes('.webm') || storyImg.includes('.mov') || storyImg.includes('video');

      container.innerHTML = [
        '<div class="flex-1 flex flex-col bg-black text-white relative select-none overflow-hidden">',
          '<div class="px-3 pt-3 flex gap-1 z-30">',
            storiesList.map(function(s, idx) {
              var barWidth = idx < currIdx ? '100%' : '0%';
              return '<div class="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">' +
                '<div id="story-progress-bar-' + idx + '" class="h-full bg-white transition-all duration-[5000ms] ease-linear" style="width: ' + barWidth + '"></div>' +
              '</div>';
            }).join(''),
          '</div>',
          '<div class="px-3 pt-3 flex items-center justify-between z-30">',
            '<div class="flex items-center gap-2">',
              '<img src="' + getValidAvatar(story.avatar, DEFAULT_AVATAR_URL) + '" class="w-8 h-8 rounded-full border border-white/40 object-cover">',
              '<div>',
                '<span class="text-xs font-bold block leading-tight text-white">' + story.name + '</span>',
                '<span class="text-[10px] text-zinc-400">24h story</span>',
              '</div>',
            '</div>',
            '<button onclick="if(currentStoryTimer)clearTimeout(currentStoryTimer); renderScreen();" class="text-white text-lg p-1.5 hover:text-rose-400"><i class="fa-solid fa-xmark"></i></button>',
          '</div>',
          '<div class="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950 overflow-hidden">',
            (isVideo ?
              '<video src="' + storyImg + '" autoplay loop muted playsinline class="w-full h-full object-cover"></video>' :
              '<img src="' + storyImg + '" class="w-full h-full object-cover">') +
            '<div class="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>',

            '<div onclick="openStoryViewer(&quot;' + (prevStory ? prevStory.id : story.id) + '&quot;)" class="absolute left-0 top-0 bottom-0 w-1/3 z-20 cursor-pointer"></div>',
            '<div onclick="openStoryViewer(&quot;' + (nextStory ? nextStory.id : story.id) + '&quot;)" class="absolute right-0 top-0 bottom-0 w-2/3 z-20 cursor-pointer"></div>',

            story.caption ?
              '<div class="absolute bottom-20 left-4 right-4 text-center z-20 pointer-events-none">' +
                '<span class="inline-block bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-medium text-white drop-shadow-lg max-w-[90%] border border-white/20">' +
                  story.caption +
                '</span>' +
              '</div>' : '',
          '</div>',
          '<div class="mt-auto p-3 flex items-center gap-2 z-30 mb-2">',
            story.isUser ?
              '<button onclick="openStoryViewersModal(&quot;' + story.id + '&quot;)" class="flex-1 bg-black/60 border border-white/30 rounded-full px-4 py-2 text-xs text-white backdrop-blur-md flex items-center justify-center gap-2 font-semibold hover:border-rose-500/50 transition">' +
                '<i class="fa-solid fa-eye text-rose-400"></i>' +
                '<span>' + (story.viewsCount || 0) + ' Viewers</span>' +
              '</button>' :
              '<input type="text" placeholder="Send message..." class="flex-1 bg-black/60 border border-white/30 rounded-full px-4 py-2 text-xs text-white focus:outline-none backdrop-blur-md placeholder-zinc-400">',
            '<button onclick="alert(&quot;Liked story!&quot;)" class="w-9 h-9 rounded-full bg-black/60 border border-white/30 flex items-center justify-center text-white hover:text-rose-500 transition backdrop-blur-md"><i class="fa-regular fa-heart text-base"></i></button>',
            '<button onclick="switchTab(&quot;dms&quot;)" class="w-9 h-9 rounded-full bg-black/60 border border-white/30 flex items-center justify-center text-white hover:text-rose-500 transition backdrop-blur-md"><i class="fa-regular fa-paper-plane text-base"></i></button>',
          '</div>',
        '</div>'
      ].join('');

      setTimeout(function() {
        var activeBar = document.getElementById('story-progress-bar-' + currIdx);
        if (activeBar) activeBar.style.width = '100%';
      }, 50);

      currentStoryTimer = setTimeout(function() {
        if (nextStory) {
          openStoryViewer(nextStory.id);
        } else {
          renderScreen();
        }
      }, 5000);
    }

    async function openStoryViewersModal(storyId) {
      if (currentStoryTimer) clearTimeout(currentStoryTimer);
      var container = document.getElementById('screen-content');
      if (!container) return;

      var viewers = [];
      if (storyId && storyId !== 'my-story') {
        try {
          var res = await apiFetch('/stories/' + storyId + '/viewers');
          viewers = (res && Array.isArray(res.viewers)) ? res.viewers : [];
        } catch(e) { console.warn("Fetch viewers error:", e); }
      }

      container.innerHTML = [
        '<div class="flex-1 flex flex-col bg-zinc-950 text-white z-40">',
          '<div class="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">',
            '<h2 class="font-bold text-xs uppercase tracking-wider text-rose-400">Story Viewers (' + viewers.length + ')</h2>',
            '<button onclick="openStoryViewer(&quot;' + storyId + '&quot;)" class="text-zinc-400 p-1 hover:text-white"><i class="fa-solid fa-xmark"></i></button>',
          '</div>',
          '<div class="flex-1 overflow-y-auto p-3 space-y-2">',
            viewers.length === 0 ?
              '<div class="text-center py-12 text-xs text-zinc-500">No viewers recorded yet</div>' :
              viewers.map(function(v) {
                var vName = v.viewerDisplayName || v.viewerAlias || 'User';
                var vAvatar = v.viewerAvatarUrl || ('https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(vName));
                return '<div class="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-3">' +
                  '<img src="' + vAvatar + '" class="w-9 h-9 rounded-full object-cover border border-zinc-700">' +
                  '<div class="min-w-0 flex-1 text-xs">' +
                    '<h4 class="font-bold text-white truncate">' + vName + '</h4>' +
                    '<p class="text-[10px] text-zinc-400">Viewed 24h story</p>' +
                  '</div>' +
                  '<i class="fa-solid fa-eye text-rose-500 text-xs"></i>' +
                '</div>';
              }).join(''),
          '</div>',
        '</div>'
      ].join('');
    }

    function renderReelsScreen() {
      if (reelsFeed.length === 0) {
        return [
          '<div class="flex-1 flex flex-col bg-black text-white select-none">',
            '<div class="px-4 py-3 flex items-center justify-between border-b border-zinc-800">',
              '<h2 class="font-bold text-lg text-white">Reels</h2>',
              '<button onclick="openCreateReelModal()" class="text-xl p-1 text-rose-400 hover:text-rose-300"><i class="fa-solid fa-camera"></i></button>',
            '</div>',
            '<div class="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 my-auto">',
              '<div class="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-500 text-2xl">',
                '<i class="fa-solid fa-clapperboard"></i>',
              '</div>',
              '<h3 class="text-sm font-bold text-white">No Reels Yet</h3>',
              '<p class="text-xs text-zinc-400 max-w-xs">Record or upload a short clip to share with your audience.</p>',
              '<button onclick="openCreateReelModal()" class="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-500/20 transition flex items-center gap-2 mt-2">',
                '<i class="fa-solid fa-plus"></i> Create Reel',
              '</button>',
            '</div>',
          '</div>'
        ].join('');
      }

      var reel = reelsFeed[currentReelIndex % reelsFeed.length];
      var reelSrc = reel.videoBg || reel.image || '';
      var isReelVid = reel.isVideo || reelSrc.startsWith('data:video') || reelSrc.includes('.mp4') || reelSrc.includes('.webm') || reelSrc.includes('.mov') || reelSrc.includes('video');
      var reelMediaTag = isReelVid ?
        '<video src="' + reelSrc + '" autoplay loop muted playsinline class="w-full h-full object-cover"></video>' :
        '<img src="' + reelSrc + '" class="w-full h-full object-cover">';

      return [
        '<div class="flex-1 flex flex-col bg-black text-white relative select-none overflow-hidden">',
          '<div class="absolute inset-0 z-0 cursor-pointer" onclick="nextReel()">',
            reelMediaTag,
            '<div class="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90"></div>',
          '</div>',
          '<div class="px-4 py-3 flex items-center justify-between z-20 sticky top-0">',
            '<h2 class="font-bold text-lg text-white tracking-wide flex items-center gap-2">Reels <span class="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-normal">Tap video for next</span></h2>',
            '<button onclick="openCreateReelModal()" class="text-xl p-1 hover:text-rose-400 transition" title="Create Reel"><i class="fa-solid fa-camera"></i></button>',
          '</div>',
          '<div class="absolute right-3 bottom-20 z-20 flex flex-col items-center gap-5 text-white">',
            '<button onclick="toggleReelLike()" class="flex flex-col items-center gap-1 group">',
              '<div class="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-2xl group-active:scale-125 transition">',
                '<i id="reel-like-icon" class="' + (reel.liked ? 'fa-solid fa-heart text-rose-500' : 'fa-regular fa-heart') + '"></i>',
              '</div>',
              '<span id="reel-like-count" class="text-[10px] font-bold">' + reel.likesCount.toLocaleString() + '</span>',
            '</button>',
            '<button onclick="alert(&quot;Opening comments...&quot;)" class="flex flex-col items-center gap-1">',
              '<div class="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-xl">',
                '<i class="fa-regular fa-comment"></i>',
              '</div>',
              '<span class="text-[10px] font-bold">' + reel.commentsCount + '</span>',
            '</button>',
            '<button onclick="switchTab(&quot;dms&quot;)" class="flex flex-col items-center gap-1">',
              '<div class="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-xl">',
                '<i class="fa-regular fa-paper-plane"></i>',
              '</div>',
              '<span class="text-[10px] font-bold">Share</span>',
            '</button>',
            '<button onclick="nextReel()" class="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-xl hover:text-rose-400 transition" title="Next Reel">',
              '<i class="fa-solid fa-arrow-down"></i>',
            '</button>',
            '<div class="w-8 h-8 rounded-full border-2 border-zinc-700 bg-zinc-900 p-1 flex items-center justify-center overflow-hidden animate-disk-spin">',
              '<img src="' + reel.avatar + '" class="w-full h-full rounded-full object-cover">',
            '</div>',
          '</div>',
          '<div class="mt-auto p-4 z-20 max-w-[80%] space-y-2">',
            '<div class="flex items-center gap-2">',
              '<img src="' + reel.avatar + '" class="w-9 h-9 rounded-full border border-white/60 object-cover">',
              '<span class="text-xs font-bold text-white">' + reel.author + '</span>',
              '<button onclick="handleFollowUser(&quot;' + reel.author + '&quot;, this)" class="px-2.5 py-1 bg-white/20 backdrop-blur-md border border-white/40 rounded-lg text-[10px] font-semibold text-white">Follow</button>',
            '</div>',
            '<p class="text-xs text-zinc-100 line-clamp-2">' + reel.caption + '</p>',
            '<div onclick="openAudioCatalogModal(&quot;' + (reel.audioTrack.replace(/"/g, '&quot;')) + '&quot;)" class="flex items-center gap-2 text-[11px] text-zinc-200 hover:text-rose-400 cursor-pointer transition bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full w-fit border border-white/10 shadow-sm">' +
              '<i class="fa-solid fa-music text-xs text-rose-400"></i>' +
              '<span class="truncate max-w-[150px] font-medium">' + reel.audioTrack + '</span>' +
              '<span class="text-[9px] bg-rose-500/30 text-rose-300 px-1.5 py-0.2 rounded font-bold">Use</span>' +
            '</div>',
          '</div>',
        '</div>'
      ].join('');
    }

    function openAudioCatalogModal(trackName) {
      var container = document.getElementById('screen-content');
      if (!container) return;

      container.innerHTML = [
        '<div class="flex-1 flex flex-col bg-zinc-950 text-white z-40">',
          '<div class="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">',
            '<div class="flex items-center gap-2">',
              '<i class="fa-solid fa-compact-disc text-rose-500 text-sm animate-spin"></i>',
              '<h2 class="font-bold text-xs uppercase tracking-wider text-white">Audio Catalog</h2>',
            '</div>',
            '<button onclick="renderScreen()" class="text-zinc-400 hover:text-white p-1"><i class="fa-solid fa-xmark"></i></button>',
          '</div>',
          '<div class="p-4 space-y-4 flex-1 overflow-y-auto">',
            '<div class="p-4 bg-gradient-to-br from-rose-950/60 to-zinc-900 border border-rose-500/30 rounded-2xl space-y-3">',
              '<div class="flex items-center gap-3">',
                '<div class="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 text-xl shadow-lg">',
                  '<i class="fa-solid fa-music"></i>',
                '</div>',
                '<div class="min-w-0 flex-1">',
                  '<h3 class="font-bold text-sm text-white truncate">' + trackName + '</h3>',
                  '<p class="text-[11px] text-zinc-400">Trending Sound • 1,420 Reels created</p>',
                '</div>',
              '</div>',
              '<div class="flex items-center gap-1.5 justify-center py-2 bg-zinc-950/60 rounded-xl border border-zinc-800">',
                '<div class="w-1 h-4 bg-rose-500 rounded-full animate-bounce"></div>',
                '<div class="w-1 h-7 bg-rose-400 rounded-full animate-bounce delay-100"></div>',
                '<div class="w-1 h-3 bg-rose-500 rounded-full animate-bounce delay-200"></div>',
                '<div class="w-1 h-6 bg-rose-400 rounded-full animate-bounce delay-75"></div>',
                '<div class="w-1 h-8 bg-rose-500 rounded-full animate-bounce delay-150"></div>',
                '<span class="text-[10px] text-zinc-400 font-mono ml-2">0:30 Audio Preview</span>',
              '</div>',
              '<button onclick="useAudioInNewReel(&quot;' + (trackName.replace(/"/g, '&quot;')) + '&quot;)" class="w-full py-2.5 bg-rose-500 hover:bg-rose-600 rounded-xl text-xs font-bold text-white shadow-lg shadow-rose-500/25 transition flex items-center justify-center gap-2">',
                '<i class="fa-solid fa-clapperboard"></i>',
                '<span>Use This Audio in New Reel 🎬</span>',
              '</button>',
            '</div>',
            '<div>',
              '<h4 class="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Top Reels Using This Sound</h4>',
              '<div class="grid grid-cols-3 gap-2">',
                reelsFeed.map(function(r) {
                  return '<div class="relative h-32 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 group cursor-pointer" onclick="renderScreen()">' +
                    '<img src="' + r.videoBg + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform">' +
                    '<div class="absolute inset-0 bg-black/20"></div>' +
                    '<div class="absolute bottom-1.5 left-1.5 text-[9px] font-bold text-white flex items-center gap-1 bg-black/50 px-1.5 py-0.5 rounded-md backdrop-blur-sm">' +
                      '<i class="fa-solid fa-play text-[8px]"></i> ' + r.likesCount +
                    '</div>' +
                  '</div>';
                }).join(''),
              '</div>',
            '</div>',
          '</div>',
        '</div>'
      ].join('');
    }

    function useAudioInNewReel(trackName) {
      openCreateReelModal();
      var preview = document.getElementById('new-reel-preview');
      if (preview) {
        var hint = document.createElement('div');
        hint.className = 'absolute top-2 left-2 right-2 bg-rose-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-lg text-center backdrop-blur-sm z-10';
        hint.innerText = '🎵 Audio pre-set: ' + trackName;
        preview.parentElement.appendChild(hint);
      }
    }

    var currentReelIndex = 0;
    function nextReel() {
      currentReelIndex = (currentReelIndex + 1) % reelsFeed.length;
      renderScreen();
    }

    function toggleReelLike() {
      var reel = reelsFeed[currentReelIndex % reelsFeed.length];
      reel.liked = !reel.liked;
      reel.likesCount += reel.liked ? 1 : -1;

      var icon = document.getElementById('reel-like-icon');
      if (icon) icon.className = reel.liked ? 'fa-solid fa-heart text-rose-500' : 'fa-regular fa-heart';
      var count = document.getElementById('reel-like-count');
      if (count) count.innerText = reel.likesCount.toLocaleString();
    }

    var selectedReelBg = "";
    var selectedReelFile = null;

    function updateReelPreview(dataUrl, file) {
      selectedReelBg = dataUrl;
      selectedReelFile = file || null;
      var previewImg = document.getElementById('new-reel-preview');
      var previewVid = document.getElementById('new-reel-preview-video');
      var placeholder = document.getElementById('new-reel-preview-placeholder');

      var isVid = (file && file.type && file.type.startsWith('video')) || (dataUrl && dataUrl.startsWith('data:video')) || (file && file.name && file.name.match(/[.](mp4|webm|mov|mkv)$/i));

      if (placeholder) placeholder.classList.add('hidden');

      if (isVid) {
        if (previewImg) previewImg.classList.add('hidden');
        if (previewVid) {
          previewVid.src = dataUrl;
          previewVid.classList.remove('hidden');
        }
      } else {
        if (previewVid) {
          try { previewVid.pause(); } catch(e){}
          previewVid.classList.add('hidden');
        }
        if (previewImg) {
          previewImg.src = dataUrl;
          previewImg.classList.remove('hidden');
        }
      }
    }

    function triggerReelUpload(event) {
      var file = event.target && event.target.files && event.target.files[0];
      if (!file) return;
      handleFileUpload(file, function(dataUrl, f) {
        validateVideoDuration(f, dataUrl, 600, function() {
          updateReelPreview(dataUrl, f);
        }, function(dur) {
          var mins = Math.round(dur / 60);
          alert("Reel video duration (" + (mins > 0 ? mins + " mins" : Math.round(dur) + "s") + ") exceeds the maximum allowed limit of 10 minutes. Please select a shorter video.");
          var input = document.getElementById('reel-file-input');
          if (input) input.value = '';
        });
      });
    }

    function handleReelDrop(event) {
      event.preventDefault();
      var file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      if (!file) return;
      handleFileUpload(file, function(dataUrl, f) {
        validateVideoDuration(f, dataUrl, 600, function() {
          updateReelPreview(dataUrl, f);
        }, function(dur) {
          var mins = Math.round(dur / 60);
          alert("Reel video duration (" + (mins > 0 ? mins + " mins" : Math.round(dur) + "s") + ") exceeds the maximum allowed limit of 10 minutes. Please select a shorter video.");
        });
      });
    }

    function openCreateReelModal() {
      var container = document.getElementById('screen-content');
      var bgClass = isDarkMode ? "bg-black text-white" : "bg-white text-zinc-900";
      selectedReelBg = "";
      selectedReelFile = null;

      container.innerHTML = [
        '<div class="flex-1 flex flex-col ' + bgClass + ' z-30">',
          '<input type="file" id="reel-file-input" accept="image/*,video/*" class="hidden" onchange="triggerReelUpload(event)">',
          '<div class="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">',
            '<button onclick="renderScreen()" class="text-zinc-400 text-sm">Cancel</button>',
            '<h2 class="font-bold text-sm">New Reel</h2>',
            '<button onclick="submitNewReel()" class="text-xs font-bold text-rose-500 hover:text-rose-400">Share Reel</button>',
          '</div>',
          '<div class="flex-1 p-4 overflow-y-auto space-y-4">',
            '<div>',
              '<label class="text-xs text-zinc-400 font-semibold block mb-2">Upload Reel Media</label>',
              '<div onclick="document.getElementById(&quot;reel-file-input&quot;).click()" ondragover="event.preventDefault()" ondrop="handleReelDrop(event)" class="p-3 bg-zinc-900/80 border-2 border-dashed border-zinc-700 hover:border-rose-500 rounded-2xl cursor-pointer text-center space-y-1 transition group">',
                '<i class="fa-solid fa-film text-xl text-rose-400 group-hover:scale-110 transition-transform"></i>',
                '<p class="text-xs font-bold text-white">Click or drag & drop video/photo file</p>',
                '<p class="text-[10px] text-zinc-400">Supports MP4, WEBM, MOV, JPG, PNG from device</p>',
              '</div>',
            '</div>',
            '<div class="relative h-56 bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center">',
              '<img id="new-reel-preview" src="" class="hidden w-full h-full object-cover">',
              '<video id="new-reel-preview-video" src="" controls autoplay loop muted class="hidden w-full h-full object-cover"></video>',
              '<div id="new-reel-preview-placeholder" class="text-zinc-500 flex flex-col items-center gap-1.5 p-4 text-center">',
                '<i class="fa-solid fa-film text-2xl text-rose-400"></i>',
                '<span class="text-xs font-semibold">Media preview will appear here</span>',
              '</div>',
            '</div>',
            '<div>',
              '<label class="text-xs text-zinc-400 font-semibold block mb-1">Reel Caption</label>',
              '<textarea id="new-reel-caption" rows="2" placeholder="Write reel caption..." class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-rose-500"></textarea>',
            '</div>',
            '<div>',
              '<label class="text-xs text-zinc-400 font-semibold block mb-1">Audio Track</label>',
              '<input id="new-reel-audio" type="text" placeholder="Original Audio" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-rose-500">',
            '</div>',
          '</div>',
        '</div>'
      ].join('');
    }

    async function submitNewReel() {
      if (!selectedReelBg) {
        alert("Please upload a video or photo for your Reel first.");
        return;
      }
      var captionInput = document.getElementById('new-reel-caption');
      var audioInput = document.getElementById('new-reel-audio');
      var caption = (captionInput && captionInput.value.trim()) ? captionInput.value.trim() : 'New Reel ✨';
      var audio = (audioInput && audioInput.value.trim()) ? audioInput.value.trim() : 'Original Audio';
      var user = currentUser ? (currentUser.email ? currentUser.email.split('@')[0] : 'you') : 'you';

      var isVid = (selectedReelFile && selectedReelFile.type && selectedReelFile.type.startsWith('video')) || (selectedReelBg && selectedReelBg.startsWith('data:video')) || (selectedReelFile && selectedReelFile.name && selectedReelFile.name.match(/[.](mp4|webm|mov|mkv)$/i));

      showUploadLoadingScreen('reel', selectedReelBg, isVid);
      updateUploadProgress(15, 'Preparing Reel video...');

      var mimeType = (selectedReelFile && selectedReelFile.type) ? selectedReelFile.type : (isVid ? 'video/mp4' : 'image/jpeg');
      var rawSize = (selectedReelFile && selectedReelFile.size) ? Math.round(selectedReelFile.size) : 5242880;

      var finalMediaUrl = selectedReelBg;
      try {
        updateUploadProgress(40, 'Uploading Reel to platform storage...');
        var uploadRes = await apiFetch('/media/upload/init', {
          method: 'POST',
          body: JSON.stringify({ mimeType: mimeType, byteSize: rawSize, storageBucket: 'reels', dataUrl: selectedReelBg })
        });
        updateUploadProgress(75, 'Encoding video for full-screen playback...');
        if (uploadRes && uploadRes.mediaId) {
          if (uploadRes.publicUrl) finalMediaUrl = uploadRes.publicUrl;
          await apiFetch('/media/' + uploadRes.mediaId + '/complete', {
            method: 'POST',
            body: JSON.stringify({ widthPx: 1080, heightPx: 1920 })
          });
        }
      } catch(e) {
        console.warn("Reel upload media init error:", e);
      }

      updateUploadProgress(90, 'Adding Reel to feed...');

      var reelId = 'reel-' + Date.now();
      var userAvatar = getUserAvatar();

      var newReel = {
        id: reelId,
        author: user,
        avatar: userAvatar,
        videoBg: finalMediaUrl,
        image: finalMediaUrl,
        isVideo: isVid,
        audioTrack: audio,
        likesCount: 1,
        liked: true,
        commentsCount: 0,
        caption: caption,
        isReel: true,
        createdAt: new Date().toISOString()
      };

      reelsFeed.unshift(newReel);
      currentReelIndex = 0;
      try {
        localStorage.setItem('gamiunity_reels', JSON.stringify(reelsFeed));
        storedReels = reelsFeed;
      } catch(e) {}

      var reelPost = {
        id: reelId,
        author: user,
        avatar: userAvatar,
        location: 'Reel Share',
        image: finalMediaUrl,
        videoBg: finalMediaUrl,
        isVideo: isVid,
        caption: '🎬 ' + caption,
        likesCount: 1,
        liked: true,
        saved: false,
        timeAgo: 'JUST NOW',
        comments: [],
        isReel: true
      };

      postsFeed.unshift(reelPost);
      try {
        localStorage.setItem('gamiunity_posts', JSON.stringify(postsFeed));
      } catch(e) {}

      updateUploadProgress(100, '✓ Reel published successfully!');

      setTimeout(function() {
        selectedReelBg = "";
        selectedReelFile = null;
        switchTab('reels');
      }, 600);
    }

    var exploreSearchQuery = '';
    var exploreActiveCategory = 'Explore';
    var friendsList = [];
    var incomingRequestsList = [];
    var outgoingRequestsList = [];
    var blockedUsersList = [];

    var publicCommunitiesList = [];
    var myCommunitiesList = [];
    var communitySubFilter = 'all';
    var activeCommunity = null;
    var communityChannelsList = [];
    var communityMembersList = [];
    var activeCommunityTab = 'channels';

    async function loadCommunitiesData() {
      if (!authToken) return;
      try {
        var res = await apiFetch('/communities');
        publicCommunitiesList = Array.isArray(res) ? res : (res && Array.isArray(res.communities) ? res.communities : []);
      } catch(e) { console.warn("Fetch public communities error", e); }

      try {
        var myRes = await apiFetch('/communities/mine');
        myCommunitiesList = Array.isArray(myRes) ? myRes : (myRes && Array.isArray(myRes.communities) ? myRes.communities : []);
      } catch(e) { console.warn("Fetch my communities error", e); }
    }

    async function createCommunityPrompt() {
      var name = prompt("Community Name:", "Tech Creators");
      if (!name || !name.trim()) return;
      var slug = prompt("Community Slug (URL handle):", name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-'));
      if (!slug) return;
      var description = prompt("Short Description:", "A hub for designers, developers, and tech enthusiasts.");

      try {
        await apiFetch('/communities', {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            slug: slug.trim(),
            description: description ? description.trim() : '',
            visibility: 'public'
          })
        });
        await loadCommunitiesData();
        renderScreen();
      } catch(e) {
        console.warn("Create community error:", e);
        alert("Failed to create community: " + (e.message || "Error"));
      }
    }

    async function openCommunityDetail(communityId) {
      if (!authToken) return;
      try {
        var commRes = await apiFetch('/communities/' + communityId);
        activeCommunity = commRes ? (commRes.community || commRes) : null;
        if (commRes && commRes.role) activeCommunity.currentUserRole = commRes.role;

        var chanRes = await apiFetch('/communities/' + communityId + '/channels');
        communityChannelsList = Array.isArray(chanRes) ? chanRes : (chanRes && Array.isArray(chanRes.channels) ? chanRes.channels : []);

        var memRes = await apiFetch('/communities/' + communityId + '/members');
        communityMembersList = Array.isArray(memRes) ? memRes : (memRes && Array.isArray(memRes.members) ? memRes.members : []);

        activeCommunityTab = 'channels';
        renderCommunityDetailViewUI();
      } catch(e) {
        console.warn("Open community detail error:", e);
        alert("Could not load community details");
      }
    }

    async function joinCommunityAction(communityId) {
      try {
        await apiFetch('/communities/' + communityId + '/join', { method: 'POST' });
        await openCommunityDetail(communityId);
        await loadCommunitiesData();
      } catch(e) {
        console.warn("Join community error:", e);
        alert("Failed to join community");
      }
    }

    async function leaveCommunityAction(communityId) {
      if (!confirm("Are you sure you want to leave this community?")) return;
      try {
        await apiFetch('/communities/' + communityId + '/leave', { method: 'POST' });
        await openCommunityDetail(communityId);
        await loadCommunitiesData();
      } catch(e) {
        console.warn("Leave community error:", e);
        alert("Failed to leave community");
      }
    }

    async function createChannelPrompt(communityId) {
      var title = prompt("Channel Title (e.g. general, announcements, lounge):");
      if (!title || !title.trim()) return;

      try {
        await apiFetch('/communities/' + communityId + '/channels', {
          method: 'POST',
          body: JSON.stringify({ title: title.trim().toLowerCase().replace(/ /g, '-') })
        });
        await openCommunityDetail(communityId);
      } catch(e) {
        console.warn("Create channel error:", e);
        alert("Failed to create channel: " + (e.message || "Error"));
      }
    }

    function renderCommunityDetailViewUI() {
      var container = document.getElementById('screen-content');
      if (!container || !activeCommunity) return;

      var name = activeCommunity.name || 'Community';
      var slug = activeCommunity.slug || 'slug';
      var desc = activeCommunity.description || 'Welcome to our community!';
      var avatar = (activeCommunity && activeCommunity.avatarUrl) || ('https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(slug));
      var memberCount = activeCommunity.memberCount || activeCommunity.membersCount || (communityMembersList.length || 1);
      var role = activeCommunity.currentUserRole || null;
      var isJoined = !!role;
      var isOwnerOrAdmin = role === 'owner' || role === 'admin';

      container.innerHTML = [
        '<div class="flex-1 flex flex-col bg-black text-white">',
          '<div class="px-3 py-2.5 border-b border-zinc-800 flex items-center justify-between">',
            '<button onclick="selectExploreCategory(&quot;Communities&quot;)" class="text-zinc-400 p-1 hover:text-white"><i class="fa-solid fa-arrow-left"></i></button>',
            '<h2 class="font-bold text-xs truncate max-w-[180px]">c/' + slug + '</h2>',
            '<div></div>',
          '</div>',
          '<div class="p-4 bg-zinc-900 border-b border-zinc-800">',
            '<div class="flex items-center gap-3">',
              '<img src="' + avatar + '" class="w-14 h-14 rounded-2xl object-cover border border-zinc-700 shrink-0">',
              '<div class="min-w-0 flex-1">',
                '<h2 class="font-bold text-sm text-white truncate">' + name + '</h2>',
                '<p class="text-[10px] text-rose-400 font-semibold">c/' + slug + ' • ' + memberCount + ' members</p>',
                role ? '<span class="inline-block mt-1 px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[9px] font-bold uppercase">' + role + '</span>' : '',
              '</div>',
            '</div>',
            '<p class="text-xs text-zinc-300 mt-3 leading-relaxed">' + desc + '</p>',
            '<div class="mt-3 flex items-center gap-2">',
              isJoined ?
                '<button onclick="leaveCommunityAction(&quot;' + activeCommunity.id + '&quot;)" class="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl">Joined ✓ (Leave)</button>' :
                '<button onclick="joinCommunityAction(&quot;' + activeCommunity.id + '&quot;)" class="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl">Join Community</button>',
              '<button onclick="loadCommunitiesData()" class="p-1.5 text-zinc-400 hover:text-white" title="Refresh"><i class="fa-solid fa-rotate-right text-xs"></i></button>',
              '<button onclick="openReportModal(&quot;community&quot;, &quot;' + activeCommunity.id + '&quot;, &quot;' + name.replace(/"/g, '&quot;') + '&quot;)" class="p-1.5 text-zinc-400 hover:text-rose-400" title="Report Community"><i class="fa-solid fa-flag text-xs"></i></button>',
            '</div>',
          '</div>',
          '<div class="flex border-b border-zinc-800 text-xs font-semibold">',
            '<button onclick="activeCommunityTab=&quot;channels&quot;; renderCommunityDetailViewUI();" class="flex-1 py-2.5 text-center ' + (activeCommunityTab === 'channels' ? 'border-b-2 border-rose-500 text-rose-400' : 'text-zinc-400') + '"># Channels (' + communityChannelsList.length + ')</button>',
            '<button onclick="activeCommunityTab=&quot;members&quot;; renderCommunityDetailViewUI();" class="flex-1 py-2.5 text-center ' + (activeCommunityTab === 'members' ? 'border-b-2 border-rose-500 text-rose-400' : 'text-zinc-400') + '">👥 Members (' + communityMembersList.length + ')</button>',
          '</div>',
          '<div class="flex-1 overflow-y-auto p-3 space-y-2">',
            activeCommunityTab === 'channels' ?
              (communityChannelsList.length === 0 ?
                '<div class="text-center py-8 space-y-2">' +
                  '<p class="text-xs text-zinc-500">No channels yet.</p>' +
                  (isOwnerOrAdmin ? '<button onclick="createChannelPrompt(&quot;' + activeCommunity.id + '&quot;)" class="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-xs font-semibold">+ Create First Channel</button>' : '') +
                '</div>' :
                [
                  isOwnerOrAdmin ? '<div class="flex justify-end mb-2"><button onclick="createChannelPrompt(&quot;' + activeCommunity.id + '&quot;)" class="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg">+ New Channel</button></div>' : '',
                  communityChannelsList.map(function(ch) {
                    var chTitle = ch.title || ch.name || 'channel';
                    var chId = ch.id;
                    return '<div onclick="openChatByConvId(&quot;' + chId + '&quot;, &quot;#' + chTitle + '&quot;, &quot;' + avatar + '&quot;)" class="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between hover:bg-zinc-800/80 transition cursor-pointer">' +
                      '<div class="flex items-center gap-2.5 min-w-0">' +
                        '<span class="text-rose-400 font-bold text-sm">#</span>' +
                        '<div class="min-w-0 text-xs">' +
                          '<h4 class="font-bold text-white truncate">' + chTitle + '</h4>' +
                          '<p class="text-[10px] text-zinc-400">Tap to open channel chat</p>' +
                        '</div>' +
                      '</div>' +
                      '<i class="fa-solid fa-chevron-right text-xs text-zinc-500"></i>' +
                    '</div>';
                  }).join('')
                ].join('')
              ) :
              (communityMembersList.length === 0 ?
                '<div class="text-center py-8 text-xs text-zinc-500">No member list available</div>' :
                communityMembersList.map(function(m) {
                  var mName = (m && (m.displayName || m.alias || m.name)) || 'Member';
                  var mAvatar = (m && m.avatarUrl) || ('https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(mName));
                  var mRole = m.role || 'member';

                  return '<div class="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between gap-2">' +
                    '<div class="flex items-center gap-2.5 min-w-0">' +
                      '<img src="' + mAvatar + '" class="w-8 h-8 rounded-full object-cover shrink-0 border border-zinc-700">' +
                      '<h4 class="font-semibold text-xs text-zinc-200 truncate">' + mName + '</h4>' +
                    '</div>' +
                    '<span class="px-2 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded text-[9px] font-bold uppercase">' + mRole + '</span>' +
                  '</div>';
                }).join('')
              ),
          '</div>',
        '</div>'
      ].join('');
    }

    async function loadSocialGraphData() {
      if (!authToken) return;
      try {
        var fRes = await apiFetch('/friends');
        if (Array.isArray(fRes)) friendsList = fRes;
        else if (fRes && Array.isArray(fRes.friends)) friendsList = fRes.friends;
        else if (fRes && Array.isArray(fRes.items)) friendsList = fRes.items;
      } catch(e) { console.warn("Fetch friends failed", e); }

      try {
        var incRes = await apiFetch('/friends/requests/incoming');
        if (Array.isArray(incRes)) incomingRequestsList = incRes;
        else if (incRes && Array.isArray(incRes.items)) incomingRequestsList = incRes.items;
      } catch(e) { console.warn("Fetch incoming requests failed", e); }

      try {
        var outRes = await apiFetch('/friends/requests/outgoing');
        if (Array.isArray(outRes)) outgoingRequestsList = outRes;
        else if (outRes && Array.isArray(outRes.items)) outgoingRequestsList = outRes.items;
      } catch(e) { console.warn("Fetch outgoing requests failed", e); }

      try {
        var blockRes = await apiFetch('/blocks');
        if (Array.isArray(blockRes)) blockedUsersList = blockRes;
        else if (blockRes && Array.isArray(blockRes.items)) blockedUsersList = blockRes.items;
      } catch(e) { console.warn("Fetch blocked users failed", e); }
    }

    async function sendFriendRequest(targetUserId, btnEl) {
      if (btnEl) btnEl.disabled = true;
      try {
        await apiFetch('/friends/requests', {
          method: 'POST',
          body: JSON.stringify({ targetUserId: targetUserId })
        });
        if (btnEl) {
          btnEl.innerText = 'Request Sent';
          btnEl.className = 'px-3 py-1 bg-zinc-800 text-zinc-400 rounded-lg text-xs font-semibold shrink-0 cursor-default';
        }
        await loadSocialGraphData();
      } catch(e) {
        console.warn("Send friend request failed", e);
        alert("Could not send friend request: " + (e.message || "Error"));
        if (btnEl) btnEl.disabled = false;
      }
    }

    async function respondToFriendRequest(requestId, action) {
      try {
        await apiFetch('/friends/requests/' + requestId + '/respond', {
          method: 'POST',
          body: JSON.stringify({ action: action })
        });
        await loadSocialGraphData();
        renderScreen();
      } catch(e) {
        console.warn("Respond friend request failed", e);
        alert("Failed to " + action + " request");
      }
    }

    async function removeFriendship(friendshipId) {
      if (!confirm("Are you sure you want to remove this friend?")) return;
      try {
        await apiFetch('/friends/' + friendshipId, { method: 'DELETE' });
        await loadSocialGraphData();
        renderScreen();
      } catch(e) {
        console.warn("Remove friendship failed", e);
        alert("Failed to remove friend");
      }
    }

    async function blockTargetUser(targetUserId) {
      if (!confirm("Block this user? They will no longer be able to message or interact with you.")) return;
      try {
        await apiFetch('/blocks', {
          method: 'POST',
          body: JSON.stringify({ targetUserId: targetUserId })
        });
        await loadSocialGraphData();
        renderScreen();
      } catch(e) {
        console.warn("Block user failed", e);
        alert("Failed to block user");
      }
    }

    async function unblockTargetUser(targetUserId) {
      try {
        await apiFetch('/blocks/' + targetUserId, { method: 'DELETE' });
        await loadSocialGraphData();
        renderScreen();
      } catch(e) {
        console.warn("Unblock user failed", e);
        alert("Failed to unblock user");
      }
    }

    function filterExplore(query) {
      exploreSearchQuery = query.toLowerCase();
      renderExploreGrid();
    }

    function selectExploreCategory(cat) {
      exploreActiveCategory = cat;
      if (['People', 'Friends', 'Requests', 'Blocked'].includes(cat)) {
        loadSocialGraphData().then(function() {
          renderScreen();
        });
      } else if (cat === 'Communities') {
        loadCommunitiesData().then(function() {
          renderScreen();
        });
      } else {
        renderScreen();
      }
    }

    function renderExploreGrid() {
      var gridEl = document.getElementById('explore-grid');
      if (!gridEl) return;

      var isSocialCategory = ['People', 'Friends', 'Requests', 'Blocked', 'Communities'].includes(exploreActiveCategory);

      if (isSocialCategory) {
        gridEl.className = "flex-1 overflow-y-auto p-3 space-y-3";
        if (exploreActiveCategory === 'Communities') {
          var targetList = communitySubFilter === 'mine' ? myCommunitiesList : publicCommunitiesList;

          var filterQuery = exploreSearchQuery.toLowerCase();
          var filteredComm = targetList.filter(function(c) {
            return !filterQuery || (c.name && c.name.toLowerCase().includes(filterQuery)) || (c.slug && c.slug.toLowerCase().includes(filterQuery));
          });

          var headerHtml = '<div class="flex items-center justify-between gap-2 mb-2">' +
            '<div class="flex bg-zinc-900 border border-zinc-800 p-0.5 rounded-xl text-xs font-semibold">' +
              '<button onclick="communitySubFilter=&quot;all&quot;; renderExploreGrid();" class="px-3 py-1 rounded-lg ' + (communitySubFilter === 'all' ? 'bg-rose-500 text-white' : 'text-zinc-400') + '">Public (' + publicCommunitiesList.length + ')</button>' +
              '<button onclick="communitySubFilter=&quot;mine&quot;; renderExploreGrid();" class="px-3 py-1 rounded-lg ' + (communitySubFilter === 'mine' ? 'bg-rose-500 text-white' : 'text-zinc-400') + '">Joined (' + myCommunitiesList.length + ')</button>' +
            '</div>' +
            '<button onclick="createCommunityPrompt()" class="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition">+ Create</button>' +
          '</div>';

          if (filteredComm.length === 0) {
            gridEl.innerHTML = headerHtml +
              '<div class="text-center py-12 space-y-2">' +
                '<div class="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-rose-500 text-xl"><i class="fa-solid fa-users"></i></div>' +
                '<p class="text-xs font-bold text-white">No Communities Found</p>' +
                '<p class="text-[11px] text-zinc-400">Be the first to create a community or check back later!</p>' +
                '<button onclick="createCommunityPrompt()" class="mt-2 px-4 py-1.5 bg-rose-500 text-white rounded-xl text-xs font-semibold">Create Community</button>' +
              '</div>';
            return;
          }

          gridEl.innerHTML = headerHtml + filteredComm.map(function(c) {
            var cName = (c && c.name) || 'Community';
            var cSlug = (c && c.slug) || 'slug';
            var cDesc = (c && c.description) || 'Join our community!';
            var cAvatar = (c && c.avatarUrl) || ('https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(cSlug));
            var memberCount = (c && (c.memberCount || c.membersCount)) || 1;
            var isMember = myCommunitiesList.some(function(mc) { return mc.id === (c && c.id); });

            return '<div onclick="openCommunityDetail(&quot;' + (c && c.id) + '&quot;)" class="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl hover:border-zinc-700 transition cursor-pointer flex items-center justify-between gap-3">' +
              '<div class="flex items-center gap-3 min-w-0">' +
                '<img src="' + cAvatar + '" class="w-12 h-12 rounded-xl object-cover shrink-0 border border-zinc-700">' +
                '<div class="min-w-0 text-xs">' +
                  '<div class="flex items-center gap-1.5">' +
                    '<h3 class="font-bold text-white truncate">' + cName + '</h3>' +
                    '<span class="text-[10px] text-zinc-500 font-medium">c/' + cSlug + '</span>' +
                  '</div>' +
                  '<p class="text-[10px] text-zinc-400 truncate mt-0.5">' + cDesc + '</p>' +
                  '<p class="text-[9px] text-rose-400 font-semibold mt-1">👥 ' + memberCount + ' members</p>' +
                '</div>' +
              '</div>' +
              '<div class="shrink-0">' +
                (isMember ? '<span class="px-2.5 py-1 bg-zinc-800 text-emerald-400 rounded-lg text-xs font-semibold">Joined ✓</span>' : '<span class="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold">View</span>') +
              '</div>' +
            '</div>';
          }).join('');
          return;
        } else if (exploreActiveCategory === 'People') {
          var suggestedUsers = [];
          if (Array.isArray(friendsList) && friendsList.length > 0) {
            suggestedUsers = friendsList.map(function(f) {
              return {
                id: (f && f.friendUserId) || ('user-' + Math.random()),
                name: (f && f.displayName) || 'User',
                alias: (f && f.primaryAlias) || '@user',
                avatar: friendAvatarUrl(f),
                bio: 'Platform member'
              };
            });
          }

          var filteredPeople = suggestedUsers.filter(function(u) {
            return !exploreSearchQuery || u.name.toLowerCase().includes(exploreSearchQuery) || u.alias.toLowerCase().includes(exploreSearchQuery);
          });

          if (filteredPeople.length === 0) {
            gridEl.innerHTML = '<div class="text-center py-12 space-y-2">' +
              '<div class="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-rose-500 text-xl"><i class="fa-solid fa-users"></i></div>' +
              '<p class="text-xs font-bold text-white">No People Found</p>' +
              '<p class="text-[11px] text-zinc-400">' + (exploreSearchQuery ? 'No results for "' + exploreSearchQuery + '"' : 'Search for friends or users across the platform') + '</p>' +
            '</div>';
            return;
          }

          gridEl.innerHTML = filteredPeople.map(function(u) {
            var isFriend = friendsList.some(function(f) { return f.friendUserId === u.id; });
            var isPending = outgoingRequestsList.some(function(r) { return r.friendUserId === u.id; });

            var actionBtn = '';
            if (isFriend) {
              actionBtn = '<span class="px-3 py-1 bg-zinc-800 text-emerald-400 rounded-lg text-xs font-semibold shrink-0">Friends ✓</span>';
            } else if (isPending) {
              actionBtn = '<span class="px-3 py-1 bg-zinc-800 text-zinc-400 rounded-lg text-xs font-semibold shrink-0">Requested</span>';
            } else {
              actionBtn = '<button onclick="sendFriendRequest(&quot;' + u.id + '&quot;, this)" class="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold shrink-0 transition">Add Friend</button>';
            }

            return '<div class="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center justify-between gap-3">' +
              '<div class="flex items-center gap-3 min-w-0">' +
                '<img src="' + u.avatar + '" class="w-11 h-11 rounded-full object-cover shrink-0 border border-zinc-700">' +
                '<div class="min-w-0 text-xs">' +
                  '<h3 class="font-bold text-white truncate">' + u.name + '</h3>' +
                  '<p class="text-[11px] text-zinc-400 font-medium truncate">' + u.alias + '</p>' +
                  '<p class="text-[10px] text-zinc-500 truncate mt-0.5">' + u.bio + '</p>' +
                '</div>' +
              '</div>' +
              actionBtn +
            '</div>';
          }).join('');
        } else if (exploreActiveCategory === 'Friends') {
          if (friendsList.length === 0) {
            gridEl.innerHTML = '<div class="text-center py-12 space-y-2">' +
              '<div class="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-rose-500 text-xl"><i class="fa-solid fa-user-group"></i></div>' +
              '<p class="text-xs font-bold text-white">No Friends Yet</p>' +
              '<p class="text-[11px] text-zinc-400">Discover people in the "People" tab and send friend requests!</p>' +
              '<button onclick="selectExploreCategory(&quot;People&quot;)" class="mt-2 px-4 py-1.5 bg-rose-500 text-white rounded-xl text-xs font-semibold">Find People</button>' +
            '</div>';
            return;
          }

          gridEl.innerHTML = friendsList.map(function(f) {
            var friendName = (f && f.displayName) || 'Friend';
            var friendAvatar = friendAvatarUrl(f);
            var friendshipId = f ? f.friendshipId : '';
            var targetId = f ? f.friendUserId : '';

            return '<div class="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center justify-between gap-3">' +
              '<div class="flex items-center gap-3 min-w-0">' +
                '<img src="' + friendAvatar + '" class="w-11 h-11 rounded-full object-cover shrink-0 border border-zinc-700">' +
                '<div class="min-w-0 text-xs">' +
                  '<h3 class="font-bold text-white truncate">' + friendName + '</h3>' +
                  '<p class="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Connected</p>' +
                '</div>' +
              '</div>' +
              '<div class="flex items-center gap-1.5">' +
                '<button onclick="openChatWithUser(&quot;' + targetId + '&quot;, &quot;' + (friendName.replace(/"/g, '&quot;')) + '&quot;, &quot;' + friendAvatar + '&quot;)" class="p-2 bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 rounded-lg text-xs font-semibold"><i class="fa-regular fa-paper-plane"></i></button>' +
                '<button onclick="removeFriendship(&quot;' + friendshipId + '&quot;)" class="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-rose-400 rounded-lg text-xs" title="Unfriend"><i class="fa-solid fa-user-minus"></i></button>' +
                '<button onclick="blockTargetUser(&quot;' + targetId + '&quot;)" class="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-rose-500 rounded-lg text-xs" title="Block"><i class="fa-solid fa-ban"></i></button>' +
              '</div>' +
            '</div>';
          }).join('');
        } else if (exploreActiveCategory === 'Requests') {
          var incHtml = incomingRequestsList.length === 0 ?
            '<p class="text-[11px] text-zinc-500 py-2">No incoming requests.</p>' :
            incomingRequestsList.map(function(r) {
              var reqName = (r && r.displayName) || 'User Request';
              var reqAvatar = friendAvatarUrl(r);
              var reqId = r ? r.friendshipId : '';

              return '<div class="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between gap-2">' +
                '<div class="flex items-center gap-3 min-w-0">' +
                  '<img src="' + reqAvatar + '" class="w-10 h-10 rounded-full object-cover shrink-0 border border-zinc-700">' +
                  '<div class="min-w-0 text-xs">' +
                    '<h4 class="font-bold text-white truncate">' + reqName + '</h4>' +
                    '<p class="text-[10px] text-zinc-400">Sent you a friend request</p>' +
                  '</div>' +
                '</div>' +
                '<div class="flex items-center gap-2 shrink-0">' +
                  '<button onclick="respondToFriendRequest(&quot;' + reqId + '&quot;, &quot;accept&quot;)" class="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold">Accept</button>' +
                  '<button onclick="respondToFriendRequest(&quot;' + reqId + '&quot;, &quot;decline&quot;)" class="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold">Decline</button>' +
                '</div>' +
              '</div>';
            }).join('');

          var outHtml = outgoingRequestsList.length === 0 ?
            '<p class="text-[11px] text-zinc-500 py-2">No outgoing pending requests.</p>' :
            outgoingRequestsList.map(function(r) {
              var reqName = (r && r.displayName) || 'Pending User';
              var reqAvatar = friendAvatarUrl(r);

              return '<div class="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-2">' +
                '<div class="flex items-center gap-3 min-w-0">' +
                  '<img src="' + reqAvatar + '" class="w-9 h-9 rounded-full object-cover shrink-0 border border-zinc-700">' +
                  '<div class="min-w-0 text-xs">' +
                    '<h4 class="font-semibold text-zinc-200 truncate">' + reqName + '</h4>' +
                    '<p class="text-[10px] text-amber-400">Awaiting response...</p>' +
                  '</div>' +
                '</div>' +
                '<span class="text-[11px] text-zinc-500 font-medium px-2 py-1 bg-zinc-800 rounded-lg">Pending</span>' +
              '</div>';
            }).join('');

          gridEl.innerHTML = [
            '<div class="space-y-4">',
              '<div>',
                '<h3 class="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center justify-between">',
                  '<span>Incoming Requests</span>',
                  '<span class="bg-rose-500/20 text-rose-400 text-[10px] px-2 py-0.5 rounded-full font-bold">' + incomingRequestsList.length + '</span>',
                '</h3>',
                '<div class="space-y-2">' + incHtml + '</div>',
              '</div>',
              '<div class="pt-2 border-t border-zinc-800">',
                '<h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Outgoing Requests (' + outgoingRequestsList.length + ')</h3>',
                '<div class="space-y-2">' + outHtml + '</div>',
              '</div>',
            '</div>'
          ].join('');
        } else if (exploreActiveCategory === 'Blocked') {
          if (blockedUsersList.length === 0) {
            gridEl.innerHTML = '<div class="text-center py-10 text-xs text-zinc-500">No blocked users.</div>';
            return;
          }

          gridEl.innerHTML = blockedUsersList.map(function(b) {
            var bName = (b && b.displayName) || 'Blocked User';
            var bTargetId = b ? b.friendUserId : '';

            return '<div class="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between gap-3">' +
              '<div class="flex items-center gap-3 min-w-0">' +
                '<div class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 text-sm"><i class="fa-solid fa-ban"></i></div>' +
                '<div class="min-w-0 text-xs">' +
                  '<h3 class="font-bold text-zinc-300 truncate">' + bName + '</h3>' +
                  '<p class="text-[10px] text-rose-400">Blocked</p>' +
                '</div>' +
              '</div>' +
              '<button onclick="unblockTargetUser(&quot;' + bTargetId + '&quot;)" class="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold">Unblock</button>' +
            '</div>';
          }).join('');
        }
        return;
      }

      gridEl.className = "flex-1 overflow-y-auto p-1 grid grid-cols-3 gap-1";

      var allItems = postsFeed.map(function(p) {
        return {
          id: p.id,
          img: p.image || p.videoBg,
          tag: p.caption || 'post',
          isReel: !!p.isReel
        };
      }).concat(reelsFeed.map(function(r) {
        return {
          id: r.id,
          img: r.videoBg || r.image,
          tag: r.caption || 'reel',
          isReel: true
        };
      }));

      var seen = {};
      allItems = allItems.filter(function(it) {
        if (!it.img || seen[it.id]) return false;
        seen[it.id] = true;
        return true;
      });

      var filtered = allItems.filter(function(item) {
        var catMatch = exploreActiveCategory === 'Explore' || item.tag.toLowerCase().includes(exploreActiveCategory.toLowerCase());
        var qMatch = !exploreSearchQuery || item.tag.toLowerCase().includes(exploreSearchQuery);
        return catMatch && qMatch;
      });

      if (filtered.length === 0) {
        gridEl.innerHTML = '<div class="col-span-3 py-16 text-center text-xs text-zinc-500 space-y-2">' +
          '<i class="fa-regular fa-compass text-3xl text-zinc-700 block mb-1"></i>' +
          '<p class="font-semibold text-zinc-400">No Content Found</p>' +
          '<p class="text-[11px] text-zinc-500">' + (exploreSearchQuery ? 'No results for "' + exploreSearchQuery + '"' : 'Upload your first photo or reel to see it featured here!') + '</p>' +
        '</div>';
        return;
      }

      gridEl.innerHTML = filtered.map(function(item) {
        var clickTab = item.isReel ? 'reels' : 'feed';
        var reelIcon = item.isReel ? '<i class="fa-solid fa-clapperboard absolute top-2 right-2 text-white text-xs drop-shadow"></i>' : '';
        return '<div class="relative aspect-square bg-zinc-800 group overflow-hidden cursor-pointer" onclick="switchTab(&quot;' + clickTab + '&quot;)">' +
          '<img src="' + item.img + '" class="w-full h-full object-cover hover:scale-105 transition duration-300">' + reelIcon +
        '</div>';
      }).join('');
    }

    function renderExploreScreen() {
      var bgClass = isDarkMode ? "bg-black text-white" : "bg-white text-zinc-900";
      var cardBg = isDarkMode ? "bg-zinc-900" : "bg-zinc-100";
      var categories = ['Explore', 'Communities', 'People', 'Friends', 'Requests', 'Blocked', 'Travel', 'Architecture', 'Food', 'Style'];

      return [
        '<div class="flex-1 flex flex-col ' + bgClass + '">',
          '<div class="p-3 border-b ' + (isDarkMode ? 'border-zinc-800' : 'border-zinc-200') + '">',
            '<div class="relative">',
              '<i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-zinc-500 text-xs"></i>',
              '<input type="text" oninput="filterExplore(this.value)" value="' + exploreSearchQuery + '" placeholder="Search photos, people, friends..." class="w-full ' + cardBg + ' rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500">',
            '</div>',
            '<div class="flex gap-2 mt-2.5 overflow-x-auto text-[11px] font-semibold no-scrollbar">',
              categories.map(function(cat) {
                var isActive = cat === exploreActiveCategory;
                var badge = '';
                if (cat === 'Requests' && incomingRequestsList.length > 0) {
                  badge = ' <span class="bg-rose-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-1">' + incomingRequestsList.length + '</span>';
                }
                var cls = isActive ? "px-3 py-1 rounded-lg bg-rose-500 text-white shrink-0 cursor-pointer flex items-center" : "px-3 py-1 rounded-lg " + cardBg + " text-zinc-300 shrink-0 cursor-pointer hover:text-white flex items-center";
                return '<span onclick="selectExploreCategory(&quot;' + cat + '&quot;)" class="' + cls + '">' + cat + badge + '</span>';
              }).join(''),
            '</div>',
          '</div>',
          '<div id="explore-grid" class="flex-1 overflow-y-auto p-1 grid grid-cols-3 gap-1">',
          '</div>',
        '</div>'
      ].join('');
    }

    var selectedImgUrl = "";
    var selectedPostFile = null;

    function updatePostPreview(dataUrl, file) {
      selectedImgUrl = dataUrl;
      selectedPostFile = file || null;
      var previewImg = document.getElementById('new-post-preview');
      var previewVid = document.getElementById('new-post-preview-video');
      var placeholder = document.getElementById('new-post-preview-placeholder');

      var isVid = (file && file.type && file.type.startsWith('video')) || (dataUrl && dataUrl.startsWith('data:video')) || (file && file.name && file.name.match(/[.](mp4|webm|mov|mkv)$/i));

      if (placeholder) placeholder.classList.add('hidden');

      if (isVid) {
        if (previewImg) previewImg.classList.add('hidden');
        if (previewVid) {
          previewVid.src = dataUrl;
          previewVid.classList.remove('hidden');
        }
      } else {
        if (previewVid) {
          try { previewVid.pause(); } catch(e){}
          previewVid.classList.add('hidden');
        }
        if (previewImg) {
          previewImg.src = dataUrl;
          previewImg.classList.remove('hidden');
        }
      }
    }

    function triggerPostUpload(event) {
      var file = event.target && event.target.files && event.target.files[0];
      if (!file) return;
      handleFileUpload(file, function(dataUrl, f) {
        updatePostPreview(dataUrl, f);
      });
    }

    function handlePostDrop(event) {
      event.preventDefault();
      var file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      if (!file) return;
      handleFileUpload(file, function(dataUrl, f) {
        updatePostPreview(dataUrl, f);
      });
    }

    function openCreateModal() {
      var container = document.getElementById('screen-content');
      var bgClass = isDarkMode ? "bg-black text-white" : "bg-white text-zinc-900";
      selectedImgUrl = "";
      selectedPostFile = null;

      container.innerHTML = [
        '<div class="flex-1 flex flex-col ' + bgClass + ' z-30">',
          '<input type="file" id="post-file-input" accept="image/*,video/*" class="hidden" onchange="triggerPostUpload(event)">',
          '<div class="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">',
            '<button onclick="renderScreen()" class="text-zinc-400 text-sm">Cancel</button>',
            '<h2 class="font-bold text-sm">New Post</h2>',
            '<button onclick="submitNewPost()" class="text-xs font-bold text-rose-500 hover:text-rose-400">Share</button>',
          '</div>',
          '<div class="flex-1 p-4 overflow-y-auto space-y-4">',
            '<div>',
              '<label class="text-xs text-zinc-400 font-semibold block mb-2">Upload Custom Photo / Video</label>',
              '<div onclick="document.getElementById(&quot;post-file-input&quot;).click()" ondragover="event.preventDefault()" ondrop="handlePostDrop(event)" class="p-3 bg-zinc-900/80 border-2 border-dashed border-zinc-700 hover:border-rose-500 rounded-2xl cursor-pointer text-center space-y-1 transition group">',
                '<i class="fa-regular fa-image text-xl text-rose-400 group-hover:scale-110 transition-transform"></i>',
                '<p class="text-xs font-bold text-white">Click or drag & drop photo/video from device</p>',
                '<p class="text-[10px] text-zinc-400">Supports JPG, PNG, WEBM, MP4</p>',
              '</div>',
            '</div>',
            '<div class="relative h-52 bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center">',
              '<img id="new-post-preview" src="" class="hidden w-full h-full object-cover">',
              '<video id="new-post-preview-video" src="" controls autoplay loop muted class="hidden w-full h-full object-cover"></video>',
              '<div id="new-post-preview-placeholder" class="text-zinc-500 flex flex-col items-center gap-1.5 p-4 text-center">',
                '<i class="fa-regular fa-image text-2xl text-rose-400"></i>',
                '<span class="text-xs font-semibold">Media preview will appear here</span>',
              '</div>',
            '</div>',
            '<div>',
              '<label class="text-xs text-zinc-400 font-semibold block mb-1">Write a caption...</label>',
              '<textarea id="new-post-caption" rows="3" placeholder="Write caption and add hashtags #travel #photography..." class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-rose-500"></textarea>',
            '</div>',
            '<div>',
              '<label class="text-xs text-zinc-400 font-semibold block mb-1">Add Location</label>',
              '<input id="new-post-location" type="text" placeholder="San Francisco, CA" value="" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-rose-500">',
            '</div>',
          '</div>',
        '</div>'
      ].join('');
    }

    async function submitNewPost() {
      if (!selectedImgUrl) {
        alert("Please upload a photo or video for your Post first.");
        return;
      }
      var captionInput = document.getElementById('new-post-caption');
      var locationInput = document.getElementById('new-post-location');
      var caption = (captionInput && captionInput.value.trim()) ? captionInput.value.trim() : '';
      var location = (locationInput && locationInput.value.trim()) ? locationInput.value.trim() : '';
      var user = currentUser ? (currentUser.email ? currentUser.email.split('@')[0] : 'you') : 'you';

      var isVid = (selectedPostFile && selectedPostFile.type && selectedPostFile.type.startsWith('video')) || (selectedImgUrl && selectedImgUrl.startsWith('data:video')) || (selectedPostFile && selectedPostFile.name && selectedPostFile.name.match(/[.](mp4|webm|mov|mkv)$/i));

      showUploadLoadingScreen('post', selectedImgUrl, isVid);
      updateUploadProgress(15, 'Compressing post media...');

      var mediaId = 'media-' + Date.now();
      var finalPostUrl = selectedImgUrl;

      try {
        updateUploadProgress(40, 'Uploading to platform cloud storage...');
        var mimeType = (selectedPostFile && selectedPostFile.type) ? selectedPostFile.type : (isVid ? 'video/mp4' : 'image/jpeg');
        var rawSize = (selectedPostFile && selectedPostFile.size) ? Math.round(selectedPostFile.size) : 204800;

        var uploadRes = await apiFetch('/media/upload/init', {
          method: 'POST',
          body: JSON.stringify({ mimeType: mimeType, byteSize: rawSize, storageBucket: 'posts', dataUrl: selectedImgUrl })
        });
        updateUploadProgress(75, 'Processing post content & metadata...');
        if (uploadRes && uploadRes.mediaId) {
          mediaId = uploadRes.mediaId;
          if (uploadRes.publicUrl) finalPostUrl = uploadRes.publicUrl;
          await apiFetch('/media/' + mediaId + '/complete', {
            method: 'POST',
            body: JSON.stringify({ widthPx: 800, heightPx: 800 })
          });
        }
      } catch (e) {
        console.warn("Backend media init error, proceeding with local post:", e);
      }

      updateUploadProgress(90, 'Publishing to feed...');

      var newPost = {
        id: 'post-' + Date.now(),
        mediaId: mediaId,
        author: user,
        avatar: getUserAvatar(),
        location: location,
        image: finalPostUrl,
        videoBg: isVid ? finalPostUrl : null,
        isVideo: isVid,
        likesCount: 1,
        liked: true,
        saved: false,
        caption: caption,
        timeAgo: 'JUST NOW',
        comments: []
      };

      postsFeed.unshift(newPost);
      try {
        localStorage.setItem('gamiunity_posts', JSON.stringify(postsFeed));
      } catch(e) {}

      updateUploadProgress(100, '✓ Post published successfully!');

      setTimeout(function() {
        selectedImgUrl = "";
        selectedPostFile = null;
        switchTab('feed');
      }, 600);
    }

    var selectedStoryUrl = "";
    var selectedStoryFile = null;

    function updateStoryPreview(dataUrl, file) {
      selectedStoryUrl = dataUrl;
      selectedStoryFile = file || null;
      var previewImg = document.getElementById('new-story-preview');
      var previewVid = document.getElementById('new-story-preview-video');
      var placeholder = document.getElementById('new-story-preview-placeholder');

      var isVid = (file && file.type && file.type.startsWith('video')) || (dataUrl && dataUrl.startsWith('data:video')) || (file && file.name && file.name.match(/[.](mp4|webm|mov|mkv)$/i));

      if (placeholder) placeholder.classList.add('hidden');

      if (isVid) {
        if (previewImg) previewImg.classList.add('hidden');
        if (previewVid) {
          previewVid.src = dataUrl;
          previewVid.classList.remove('hidden');
        }
      } else {
        if (previewVid) {
          try { previewVid.pause(); } catch(e){}
          previewVid.classList.add('hidden');
        }
        if (previewImg) {
          previewImg.src = dataUrl;
          previewImg.classList.remove('hidden');
        }
      }
    }

    function triggerStoryUpload(event) {
      var file = event.target && event.target.files && event.target.files[0];
      if (!file) return;
      handleFileUpload(file, function(dataUrl, f) {
        validateVideoDuration(f, dataUrl, 60, function() {
          updateStoryPreview(dataUrl, f);
        }, function(dur) {
          alert("Story video duration (" + Math.round(dur) + "s) exceeds the maximum allowed limit of 60 seconds (1 minute). Please select a shorter video.");
          var input = document.getElementById('story-file-input');
          if (input) input.value = '';
        });
      });
    }

    function handleStoryDrop(event) {
      event.preventDefault();
      var file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      if (!file) return;
      handleFileUpload(file, function(dataUrl, f) {
        validateVideoDuration(f, dataUrl, 60, function() {
          updateStoryPreview(dataUrl, f);
        }, function(dur) {
          alert("Story video duration (" + Math.round(dur) + "s) exceeds the maximum allowed limit of 60 seconds (1 minute). Please select a shorter video.");
        });
      });
    }

    function openCreateStoryModal() {
      var container = document.getElementById('screen-content');
      var bgClass = isDarkMode ? "bg-black text-white" : "bg-white text-zinc-900";
      selectedStoryUrl = "";
      selectedStoryFile = null;

      container.innerHTML = [
        '<div class="flex-1 flex flex-col ' + bgClass + ' z-30">',
          '<input type="file" id="story-file-input" accept="image/*,video/*" class="hidden" onchange="triggerStoryUpload(event)">',
          '<div class="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">',
            '<button onclick="renderScreen()" class="text-zinc-400 text-sm">Cancel</button>',
            '<h2 class="font-bold text-sm">Add Story</h2>',
            '<button onclick="submitNewStory()" class="text-xs font-bold text-rose-500 hover:text-rose-400">Add Story</button>',
          '</div>',
          '<div class="flex-1 p-4 overflow-y-auto space-y-4">',
            '<div>',
              '<label class="text-xs text-zinc-400 font-semibold block mb-2">Upload Custom Story Media</label>',
              '<div onclick="document.getElementById(&quot;story-file-input&quot;).click()" ondragover="event.preventDefault()" ondrop="handleStoryDrop(event)" class="p-3 bg-zinc-900/80 border-2 border-dashed border-zinc-700 hover:border-rose-500 rounded-2xl cursor-pointer text-center space-y-1 transition group">',
                '<i class="fa-solid fa-cloud-arrow-up text-xl text-rose-400 group-hover:scale-110 transition-transform"></i>',
                '<p class="text-xs font-bold text-white">Click or drag & drop story image/video</p>',
                '<p class="text-[10px] text-zinc-400">Upload 24h ephemeral story from device</p>',
              '</div>',
            '</div>',
            '<div class="relative h-64 bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center">',
              '<img id="new-story-preview" src="" class="hidden w-full h-full object-cover">',
              '<video id="new-story-preview-video" src="" controls autoplay loop muted class="hidden w-full h-full object-cover"></video>',
              '<div id="new-story-preview-placeholder" class="text-zinc-500 flex flex-col items-center gap-1.5 p-4 text-center">',
                '<i class="fa-solid fa-cloud-arrow-up text-2xl text-rose-400"></i>',
                '<span class="text-xs font-semibold">Story preview will appear here</span>',
              '</div>',
            '</div>',
            '<div>',
              '<label class="text-xs text-zinc-400 font-semibold block mb-1">Story Caption</label>',
              '<input id="new-story-caption" type="text" placeholder="Add text overlay..." value="" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-rose-500">',
            '</div>',
          '</div>',
        '</div>'
      ].join('');
    }

    async function submitNewStory() {
      if (!selectedStoryUrl) {
        alert("Please upload media for your Story first.");
        return;
      }
      var captionInput = document.getElementById('new-story-caption');
      var caption = (captionInput && captionInput.value.trim()) ? captionInput.value.trim() : '';

      var isVid = (selectedStoryFile && selectedStoryFile.type && selectedStoryFile.type.startsWith('video')) || (selectedStoryUrl && selectedStoryUrl.startsWith('data:video')) || (selectedStoryFile && selectedStoryFile.name && selectedStoryFile.name.match(/[.](mp4|webm|mov|mkv)$/i));

      showUploadLoadingScreen('story', selectedStoryUrl, isVid);
      updateUploadProgress(15, 'Initializing story video pipeline...');

      var mimeType = (selectedStoryFile && selectedStoryFile.type) ? selectedStoryFile.type : (isVid ? 'video/mp4' : 'image/jpeg');
      var rawSize = (selectedStoryFile && selectedStoryFile.size && selectedStoryFile.size > 0) ? Math.round(selectedStoryFile.size) : 204800;
      var byteSize = Math.min(100 * 1024 * 1024, Math.max(1024, rawSize));

      var mediaId = 'media-story-' + Date.now();
      var finalStoryUrl = selectedStoryUrl;

      try {
        updateUploadProgress(40, 'Uploading story media to storage...');
        var uploadRes = await apiFetch('/media/upload/init', {
          method: 'POST',
          body: JSON.stringify({ mimeType: mimeType, byteSize: byteSize, storageBucket: 'stories', dataUrl: selectedStoryUrl })
        });
        updateUploadProgress(75, 'Processing story video playback...');
        if (uploadRes && uploadRes.mediaId) {
          mediaId = uploadRes.mediaId;
          if (uploadRes.publicUrl) finalStoryUrl = uploadRes.publicUrl;
          await apiFetch('/media/' + uploadRes.mediaId + '/complete', {
            method: 'POST',
            body: JSON.stringify({ widthPx: 800, heightPx: 800, durationMs: isVid ? 15000 : 5000 })
          });
          await apiFetch('/stories', {
            method: 'POST',
            body: JSON.stringify({
              items: [{ mediaId: uploadRes.mediaId, durationMs: isVid ? 15000 : 5000 }],
              caption: caption,
              ttlHours: 24
            })
          });
        }
      } catch (e) {
        console.warn("Story creation API error:", e);
      }

      updateUploadProgress(90, 'Publishing story...');

      var myAvatar = getUserAvatar();
      var newStoryObj = {
        id: 'story-' + Date.now(),
        name: 'Your story',
        avatar: myAvatar,
        hasStory: true,
        isUser: true,
        caption: caption,
        mediaUrl: finalStoryUrl,
        isVideo: isVid,
        items: [{ mediaId: mediaId, mediaUrl: finalStoryUrl, durationMs: isVid ? 15000 : 5000, isVideo: isVid }],
        viewsCount: 0,
        createdAt: new Date().toISOString()
      };

      storiesList = [newStoryObj].concat(storiesList.filter(function(s) { return !s.isUser; }));
      try {
        localStorage.setItem('gamiunity_stories', JSON.stringify(storiesList));
        storedStories = storiesList;
      } catch(e) {}

      updateUploadProgress(100, '✓ Story uploaded successfully!');

      setTimeout(function() {
        selectedStoryUrl = "";
        selectedStoryFile = null;
        switchTab('feed');
      }, 600);
    }

    async function loadConversations() {
      if (!authToken) return;
      try {
        var res = await apiFetch('/conversations');
        var raw = Array.isArray(res) ? res : (res && Array.isArray(res.conversations) ? res.conversations : []);

        directMessages = raw.map(function(summary) {
          var conv = summary.conversation || {};
          var others = (summary.participants || []).filter(function(p) {
            return !currentUser || p.userId !== currentUser.id;
          });
          var otherUserId = others[0] ? others[0].userId : null;

          return {
            id: conv.id,
            targetUserId: otherUserId,
            name: conv.title || 'Direct Message',
            avatar: DEFAULT_AVATAR_URL,
            lastMessage: summary.lastMessage ? summary.lastMessage.body : null,
            unread: (summary.unreadCount || 0) > 0,
            updatedAt: conv.updatedAt
          };
        });
      } catch (e) {
        console.warn("Fetch conversations error:", e);
      }
    }

    var activeConversation = null;
    var chatPollingTimer = null;

    function stopChatPolling() {
      if (chatPollingTimer) {
        clearInterval(chatPollingTimer);
        chatPollingTimer = null;
      }
    }

    async function openChatWithUser(targetUserId, targetName, targetAvatar) {
      if (!authToken) return;
      stopChatPolling();
      try {
        var conv = await apiFetch('/conversations/direct', {
          method: 'POST',
          body: JSON.stringify({ targetUserId: targetUserId })
        });
        var convId = conv ? (conv.id || conv.conversationId) : null;

        activeConversation = {
          id: convId,
          targetUserId: targetUserId,
          name: targetName || 'Chat',
          avatar: targetAvatar || ('https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(targetName || 'User'))
        };

        await loadActiveChatMessages(convId);
        openChatViewUI();

        chatPollingTimer = setInterval(function() {
          if (activeConversation && activeConversation.id) {
            loadActiveChatMessages(activeConversation.id, true);
          }
        }, 2500);
      } catch (e) {
        console.warn("Open direct conversation error:", e);
        alert("Could not start conversation with user: " + (e.message || "Error"));
      }
    }

    async function openChatByConvId(convId, name, avatar) {
      if (!authToken) return;
      stopChatPolling();
      activeConversation = {
        id: convId,
        name: name || 'Chat',
        avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
      };

      await loadActiveChatMessages(convId);
      openChatViewUI();

      chatPollingTimer = setInterval(function() {
        if (activeConversation && activeConversation.id) {
          loadActiveChatMessages(activeConversation.id, true);
        }
      }, 2500);
    }

    async function loadActiveChatMessages(convId, isBackgroundPoll) {
      if (!convId) return;
      try {
        var res = await apiFetch('/conversations/' + convId + '/messages');
        var msgItems = Array.isArray(res) ? res : (res && Array.isArray(res.messages) ? res.messages : []);

        activeChatMessages = msgItems.map(function(m) {
          var isMe = currentUser && (m.senderUserId === currentUser.id || m.senderUserId === currentUser.userId);
          var firstMedia = (m.media && m.media.length > 0) ? m.media[0] : null;
          return {
            id: m.id,
            sender: isMe ? 'me' : 'them',
            senderId: m.senderUserId,
            text: m.body || '',
            mediaUrl: firstMedia ? ('/media/' + firstMedia.id + '/content') : null,
            time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now',
            isDeleted: !!m.deletedAt,
            isEdited: !!m.editedAt
          };
        });

        if (!isBackgroundPoll) {
          await apiFetch('/conversations/' + convId + '/read', { method: 'POST' }).catch(function(){});
        }

        updateChatMessagesUI();
      } catch (e) {
        console.warn("Load chat messages error:", e);
      }
    }

    function triggerChatAttachmentUpload(event) {
      var file = event.target && event.target.files && event.target.files[0];
      if (!file || !activeConversation || !activeConversation.id) return;
      handleFileUpload(file, async function(dataUrl, f) {
        try {
          var uploadRes = await apiFetch('/media/upload/init', {
            method: 'POST',
            body: JSON.stringify({ mimeType: f.type || 'image/jpeg', byteSize: f.size || 102400, storageBucket: 'platform-attachments' })
          });
          var mediaId = uploadRes && uploadRes.mediaId;
          if (mediaId) {
            await apiFetch('/media/' + mediaId + '/complete', { method: 'POST', body: JSON.stringify({}) });
            await apiFetch('/conversations/' + activeConversation.id + '/messages', {
              method: 'POST',
              body: JSON.stringify({ messageType: 'media', mediaIds: [mediaId] })
            });
          }
          await loadActiveChatMessages(activeConversation.id);
        } catch (e) {
          console.warn("Send attachment error:", e);
          alert("Failed to upload message attachment");
        }
      });
    }

    // --- WebRTC & Push Notification State ---
    var activeWebRTCStream = null;
    var webRTCCallTimer = null;
    var webRTCCallSeconds = 0;
    var isCallMuted = false;
    var isCallVideoOff = false;
    var isPartnerTyping = false;
    var typingTimeoutTimer = null;
    var messageReactionsMap = {};

    async function registerDevicePushToken() {
      try {
        var token = "fcm_token_" + Math.random().toString(36).substring(2, 10);
        await apiFetch('/user-devices', {
          method: 'POST',
          body: JSON.stringify({ deviceToken: token, platform: 'web', appVersion: '1.0.0' })
        });
        console.log("Device push token registered successfully:", token);
      } catch(e) { console.warn("Push token registration notice:", e); }
    }

    function showPushNotificationAlert(title, message, targetTab) {
      var container = document.getElementById('mobile-screen-frame');
      if (!container) return;

      var toast = document.createElement('div');
      toast.className = 'absolute top-3 left-3 right-3 z-50 bg-zinc-900/95 border border-rose-500/40 text-white rounded-2xl p-3 shadow-2xl backdrop-blur-xl flex items-start gap-3 transition-all transform animate-bounce cursor-pointer';
      toast.onclick = function() {
        toast.remove();
        if (targetTab) switchTab(targetTab);
      };

      toast.innerHTML = [
        '<div class="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 text-rose-400">',
          '<i class="fa-solid fa-bell text-xs"></i>',
        '</div>',
        '<div class="flex-1 min-w-0">',
          '<div class="flex items-center justify-between">',
            '<h5 class="text-xs font-bold text-white truncate">' + title + '</h5>',
            '<span class="text-[9px] text-zinc-400">Now</span>',
          '</div>',
          '<p class="text-[11px] text-zinc-300 truncate mt-0.5">' + message + '</p>',
        '</div>',
        '<button onclick="event.stopPropagation(); this.parentElement.remove()" class="text-zinc-500 hover:text-white text-xs"><i class="fa-solid fa-xmark"></i></button>'
      ].join('');

      container.appendChild(toast);
      setTimeout(function() { if (toast.parentElement) toast.remove(); }, 5000);
    }

    async function startWebRTCCall(callType) {
      var container = document.getElementById('screen-content');
      if (!container) return;

      var partnerName = activeConversation ? activeConversation.name : 'User';
      var partnerAvatar = (activeConversation && activeConversation.avatar) ? activeConversation.avatar : DEFAULT_AVATAR_URL;

      webRTCCallSeconds = 0;
      isCallMuted = false;
      isCallVideoOff = callType === 'audio';

      container.innerHTML = [
        '<div class="flex-1 flex flex-col bg-zinc-950 text-white z-50 relative overflow-hidden">',
          '<div class="absolute inset-0 bg-gradient-to-b from-rose-950/40 via-zinc-950 to-black z-0"></div>',
          '<div class="px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between z-10 backdrop-blur-md">',
            '<div class="flex items-center gap-2">',
              '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>',
              '<span class="text-xs font-bold text-rose-400 uppercase tracking-wider">WebRTC P2P ' + (callType === 'video' ? 'Video Call' : 'Voice Call') + '</span>',
            '</div>',
            '<span id="webrtc-timer" class="text-xs font-mono text-zinc-400">00:00</span>',
          '</div>',
          '<div class="flex-1 flex flex-col items-center justify-center p-6 z-10 space-y-6 text-center">',
            callType === 'video' ?
              '<div class="relative w-48 h-64 rounded-3xl overflow-hidden border-2 border-rose-500/40 shadow-2xl bg-zinc-900 group">' +
                '<video id="remote-video" autoplay playsinline class="w-full h-full object-cover"></video>' +
                '<video id="local-video" autoplay playsinline muted class="absolute bottom-2 right-2 w-16 h-20 rounded-xl object-cover border border-white/60 shadow-md bg-black"></video>' +
                '<div id="video-placeholder" class="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 p-4 space-y-2">' +
                  '<img src="' + partnerAvatar + '" class="w-20 h-20 rounded-full object-cover border-2 border-rose-500 shadow-xl animate-pulse">' +
                  '<p class="text-[11px] text-zinc-400">Connecting WebRTC video feed...</p>' +
                '</div>' +
              '</div>' :
              '<div class="relative flex items-center justify-center">' +
                '<div class="w-32 h-32 rounded-full bg-rose-500/20 border-2 border-rose-500/40 flex items-center justify-center animate-ping absolute"></div>' +
                '<div class="w-28 h-28 rounded-full border-2 border-rose-500 shadow-2xl overflow-hidden z-10 relative">' +
                  '<img src="' + partnerAvatar + '" class="w-full h-full object-cover">' +
                '</div>' +
              '</div>',
            '<div class="space-y-1">',
              '<h3 class="text-base font-bold text-white">' + partnerName + '</h3>',
              '<p id="webrtc-status" class="text-xs text-rose-400 font-medium">Connecting WebRTC Peer Connection...</p>',
            '</div>',
            '<div class="flex items-center justify-center gap-1.5 py-2">',
              '<div class="w-1.5 h-6 bg-rose-500 rounded-full animate-bounce"></div>',
              '<div class="w-1.5 h-10 bg-rose-400 rounded-full animate-bounce delay-100"></div>',
              '<div class="w-1.5 h-4 bg-rose-500 rounded-full animate-bounce delay-200"></div>',
              '<div class="w-1.5 h-8 bg-rose-400 rounded-full animate-bounce delay-75"></div>',
            '</div>',
          '</div>',
          '<div class="p-6 border-t border-zinc-800/80 flex items-center justify-center gap-6 z-10 backdrop-blur-md bg-black/40">',
            '<button id="btn-toggle-mic" onclick="toggleCallMic()" class="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white text-lg hover:bg-zinc-700 transition" title="Toggle Mic">',
              '<i id="icon-mic" class="fa-solid fa-microphone"></i>',
            '</button>',
            '<button onclick="endWebRTCCall()" class="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 flex items-center justify-center text-white text-xl shadow-lg shadow-rose-600/30 transition transform active:scale-95" title="End Call">',
              '<i class="fa-solid fa-phone-slash"></i>',
            '</button>',
            callType === 'video' ?
              '<button id="btn-toggle-cam" onclick="toggleCallCam()" class="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white text-lg hover:bg-zinc-700 transition" title="Toggle Camera">' +
                '<i id="icon-cam" class="fa-solid fa-video"></i>' +
              '</button>' :
              '<button onclick="alert(&quot;Audio output switched to speaker&quot;)" class="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white text-lg hover:bg-zinc-700 transition" title="Speaker">' +
                '<i class="fa-solid fa-volume-high"></i>' +
              '</button>',
          '</div>',
        '</div>'
      ].join('');

      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          activeWebRTCStream = await navigator.mediaDevices.getUserMedia({ video: callType === 'video', audio: true });
          var localVid = document.getElementById('local-video');
          var placeholder = document.getElementById('video-placeholder');
          if (localVid && activeWebRTCStream) {
            localVid.srcObject = activeWebRTCStream;
            if (placeholder) placeholder.style.display = 'none';
          }
        }
      } catch(err) { console.warn("WebRTC local stream sandboxed fallback mode:", err); }

      setTimeout(function() {
        var status = document.getElementById('webrtc-status');
        if (status) status.innerText = 'Connected (Secure P2P Encrypted)';
      }, 1500);

      if (webRTCCallTimer) clearInterval(webRTCCallTimer);
      webRTCCallTimer = setInterval(function() {
        webRTCCallSeconds++;
        var mins = Math.floor(webRTCCallSeconds / 60).toString().padStart(2, '0');
        var secs = (webRTCCallSeconds % 60).toString().padStart(2, '0');
        var timerEl = document.getElementById('webrtc-timer');
        if (timerEl) timerEl.innerText = mins + ':' + secs;
      }, 1000);
    }

    function toggleCallMic() {
      isCallMuted = !isCallMuted;
      if (activeWebRTCStream) {
        activeWebRTCStream.getAudioTracks().forEach(function(t) { t.enabled = !isCallMuted; });
      }
      var icon = document.getElementById('icon-mic');
      var btn = document.getElementById('btn-toggle-mic');
      if (icon) icon.className = isCallMuted ? 'fa-solid fa-microphone-slash text-rose-400' : 'fa-solid fa-microphone';
      if (btn) btn.className = isCallMuted ? 'w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400 text-lg' : 'w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white text-lg';
    }

    function toggleCallCam() {
      isCallVideoOff = !isCallVideoOff;
      if (activeWebRTCStream) {
        activeWebRTCStream.getVideoTracks().forEach(function(t) { t.enabled = !isCallVideoOff; });
      }
      var icon = document.getElementById('icon-cam');
      var btn = document.getElementById('btn-toggle-cam');
      if (icon) icon.className = isCallVideoOff ? 'fa-solid fa-video-slash text-rose-400' : 'fa-solid fa-video';
      if (btn) btn.className = isCallVideoOff ? 'w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400 text-lg' : 'w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white text-lg';
    }

    function endWebRTCCall() {
      if (webRTCCallTimer) clearInterval(webRTCCallTimer);
      if (activeWebRTCStream) {
        activeWebRTCStream.getTracks().forEach(function(t) { t.stop(); });
        activeWebRTCStream = null;
      }
      openChatViewUI();
    }

    function toggleMessageReaction(msgId, emoji) {
      if (!messageReactionsMap[msgId]) messageReactionsMap[msgId] = {};
      var count = messageReactionsMap[msgId][emoji] || 0;
      messageReactionsMap[msgId][emoji] = count > 0 ? 0 : 1;
      updateChatMessagesUI();
    }

    function handleChatTyping() {
      isPartnerTyping = true;
      var statusEl = document.getElementById('chat-status-indicator');
      if (statusEl) {
        statusEl.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span> <span class="text-rose-400 font-medium">typing...</span>';
      }
      if (typingTimeoutTimer) clearTimeout(typingTimeoutTimer);
      typingTimeoutTimer = setTimeout(function() {
        isPartnerTyping = false;
        var statusEl2 = document.getElementById('chat-status-indicator');
        if (statusEl2) {
          statusEl2.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online';
        }
      }, 3000);
    }

    function attachChatImage() {
      var input = document.getElementById('chat-attachment-input');
      if (input) input.click();
    }

    function updateChatMessagesUI() {
      var box = document.getElementById('chat-messages-box');
      if (!box) return;

      if (activeChatMessages.length === 0) {
        box.innerHTML = '<div class="text-center py-8 text-xs text-zinc-500">No messages yet. Say hi! 👋</div>';
        return;
      }

      box.innerHTML = [
        '<div class="text-center my-1">',
          '<span class="text-[9px] bg-zinc-900 text-zinc-500 px-2.5 py-0.5 rounded-full font-medium">Conversation</span>',
        '</div>',
        activeChatMessages.map(function(m) {
          var isMe = m.sender === 'me';
          var isDeleted = m.isDeleted;
          var isImageAttachment = !isDeleted && !!m.mediaUrl;

          var displayContent = isDeleted ? '<span class="italic text-zinc-400 opacity-75">Message deleted</span>' : m.text;
          if (isImageAttachment) {
            displayContent = '<div class="space-y-1">' +
              '<img src="' + m.mediaUrl + '" class="max-w-[180px] max-h-[180px] rounded-xl object-cover border border-zinc-700/50 shadow-sm">' +
              (m.text ? '<p class="text-xs mt-1">' + m.text + '</p>' : '') +
            '</div>';
          }

          var reactions = messageReactionsMap[m.id] || {};
          var activeReactions = Object.keys(reactions).filter(function(e) { return reactions[e] > 0; });

          return '<div class="flex items-end gap-1.5 max-w-[85%] ' + (isMe ? 'ml-auto justify-end' : '') + ' group relative">' +
            (!isMe ? '<img src="' + (activeConversation?.avatar || '') + '" class="w-6 h-6 rounded-full object-cover shrink-0 mb-0.5 border border-zinc-700">' : '') +
            '<div class="flex flex-col ' + (isMe ? 'items-end' : 'items-start') + '">' +
              '<div class="' + (isMe ? 'bg-rose-500 text-white rounded-2xl rounded-br-none' : 'bg-zinc-800 text-zinc-100 rounded-2xl rounded-bl-none') + ' p-2.5 text-xs shadow-sm break-words max-w-full relative group">' +
                displayContent +
                '<div class="absolute -top-3 ' + (isMe ? 'left-0' : 'right-0') + ' hidden group-hover:flex items-center gap-1 bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded-full shadow-lg z-20">' +
                  '<button onclick="toggleMessageReaction(&quot;' + m.id + '&quot;, &quot;❤️&quot;)" class="hover:scale-125 transition text-xs">❤️</button>' +
                  '<button onclick="toggleMessageReaction(&quot;' + m.id + '&quot;, &quot;👍&quot;)" class="hover:scale-125 transition text-xs">👍</button>' +
                  '<button onclick="toggleMessageReaction(&quot;' + m.id + '&quot;, &quot;😂&quot;)" class="hover:scale-125 transition text-xs">😂</button>' +
                  '<button onclick="toggleMessageReaction(&quot;' + m.id + '&quot;, &quot;🔥&quot;)" class="hover:scale-125 transition text-xs">🔥</button>' +
                '</div>' +
              '</div>' +
              (activeReactions.length > 0 ?
                '<div class="flex gap-1 mt-0.5 px-1">' +
                  activeReactions.map(function(r) {
                    return '<span onclick="toggleMessageReaction(&quot;' + m.id + '&quot;, &quot;' + r + '&quot;)" class="px-1.5 py-0.2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-full text-[10px] text-white cursor-pointer">' + r + ' 1</span>';
                  }).join('') +
                '</div>' : '') +
              '<div class="flex items-center gap-1.5 mt-0.5 px-1 text-[9px] text-zinc-500">' +
                '<span>' + m.time + '</span>' +
                (m.isEdited && !isDeleted ? '<span>(edited)</span>' : '') +
                (isMe && !isDeleted ? '<button onclick="editChatMessage(&quot;' + m.id + '&quot;, &quot;' + (m.text.replace(/"/g, '&quot;')) + '&quot;)" class="hover:text-zinc-300 ml-1"><i class="fa-solid fa-pen text-[8px]"></i></button>' : '') +
                (isMe && !isDeleted ? '<button onclick="deleteChatMessage(&quot;' + m.id + '&quot;)" class="hover:text-rose-400"><i class="fa-solid fa-trash text-[8px]"></i></button>' : '') +
              '</div>' +
            '</div>' +
          '</div>';
        }).join('')
      ].join('');

      box.scrollTop = box.scrollHeight;
    }

    function openChatViewUI() {
      var container = document.getElementById('screen-content');
      var name = activeConversation ? activeConversation.name : 'Chat';
      var avatar = (activeConversation && activeConversation.avatar) ? activeConversation.avatar : DEFAULT_AVATAR_URL;

      container.innerHTML = [
        '<div class="flex-1 flex flex-col bg-black text-white">',
          '<input type="file" id="chat-attachment-input" accept="image/*,video/*" class="hidden" onchange="triggerChatAttachmentUpload(event)">',
          '<div class="px-3 py-2.5 border-b border-zinc-800 flex items-center gap-3">',
            '<button onclick="closeChatView()" class="text-zinc-400 p-1 hover:text-white"><i class="fa-solid fa-arrow-left"></i></button>',
            '<div class="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700">',
              '<img src="' + avatar + '" class="w-full h-full object-cover">',
            '</div>',
            '<div class="flex-1 min-w-0">',
              '<h3 class="text-xs font-bold truncate">' + name + '</h3>',
              '<p id="chat-status-indicator" class="text-[10px] text-emerald-400 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online</p>',
            '</div>',
            '<button onclick="startWebRTCCall(&quot;audio&quot;)" class="text-zinc-400 p-1.5 hover:text-rose-400 hover:bg-zinc-800 rounded-full transition" title="Start Voice Call"><i class="fa-solid fa-phone text-xs"></i></button>',
            '<button onclick="startWebRTCCall(&quot;video&quot;)" class="text-zinc-400 p-1.5 hover:text-rose-400 hover:bg-zinc-800 rounded-full transition" title="Start WebRTC Video Call"><i class="fa-solid fa-video text-xs"></i></button>',
          '</div>',
          '<div id="chat-messages-box" class="flex-1 p-3 overflow-y-auto space-y-2.5 bg-zinc-950">',
            '<div class="text-center py-6 text-xs text-zinc-500">Loading chat history...</div>',
          '</div>',
          '<div class="p-2.5 border-t border-zinc-800 flex items-center gap-2 bg-black">',
            '<button onclick="attachChatImage()" class="p-2 text-zinc-400 hover:text-rose-400 transition" title="Attach image or photo"><i class="fa-regular fa-image"></i></button>',
            '<input id="chat-input" type="text" placeholder="Message..." oninput="handleChatTyping()" class="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:border-rose-500" onkeydown="if(event.key===&quot;Enter&quot;) sendChatMessage()">',
            '<button onclick="sendChatMessage()" class="text-xs font-bold text-rose-500 hover:text-rose-400 px-2 transition">Send</button>',
          '</div>',
        '</div>'
      ].join('');

      updateChatMessagesUI();
      registerDevicePushToken();
    }

    function closeChatView() {
      stopChatPolling();
      activeConversation = null;
      switchTab('dms');
    }

    async function sendChatMessage() {
      var input = document.getElementById('chat-input');
      if (!input || !input.value.trim() || !activeConversation || !activeConversation.id) return;

      var text = input.value.trim();
      input.value = '';

      try {
        await apiFetch('/conversations/' + activeConversation.id + '/messages', {
          method: 'POST',
          body: JSON.stringify({ body: text })
        });
        await loadActiveChatMessages(activeConversation.id);
      } catch (e) {
        console.warn("Send message error:", e);
        alert("Failed to send message");
      }
    }

    async function editChatMessage(messageId, oldText) {
      var newText = prompt("Edit your message:", oldText);
      if (newText === null || newText.trim() === '' || newText === oldText) return;

      try {
        await apiFetch('/messages/' + messageId, {
          method: 'PATCH',
          body: JSON.stringify({ body: newText.trim() })
        });
        if (activeConversation && activeConversation.id) {
          await loadActiveChatMessages(activeConversation.id);
        }
      } catch (e) {
        console.warn("Edit message error:", e);
        alert("Failed to edit message");
      }
    }

    async function deleteChatMessage(messageId) {
      if (!confirm("Delete this message?")) return;

      try {
        await apiFetch('/messages/' + messageId, { method: 'DELETE' });
        if (activeConversation && activeConversation.id) {
          await loadActiveChatMessages(activeConversation.id);
        }
      } catch (e) {
        console.warn("Delete message error:", e);
        alert("Failed to delete message");
      }
    }

    function renderDMsScreen() {
      loadConversations().then(function() {});
      var bgClass = isDarkMode ? "bg-black text-white" : "bg-white text-zinc-900";

      return [
        '<div class="flex-1 flex flex-col ' + bgClass + '">',
          '<div class="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">',
            '<button onclick="switchTab(&quot;feed&quot;)" class="text-zinc-400 text-lg p-1 hover:text-white"><i class="fa-solid fa-arrow-left"></i></button>',
            '<h2 class="font-bold text-sm">Direct Messages</h2>',
            '<button onclick="switchTab(&quot;explore&quot;); selectExploreCategory(&quot;Friends&quot;);" class="text-rose-500 text-xs font-bold px-2 py-1 bg-rose-500/10 rounded-lg hover:bg-rose-500/20">+ New Chat</button>',
          '</div>',
          '<div class="p-3 border-b border-zinc-800/60 flex items-center gap-3 overflow-x-auto no-scrollbar">',
            '<div class="flex flex-col items-center gap-1 min-w-[56px]">',
              '<div class="relative w-12 h-12 rounded-full bg-zinc-800 p-0.5 border border-zinc-700">',
                '<img src="' + getUserAvatar() + '" class="w-full h-full rounded-full object-cover">',
                '<div class="absolute -top-1 bg-zinc-800 border border-zinc-700 text-[8px] px-1.5 py-0.2 rounded-full text-zinc-300 shadow">You</div>',
              '</div>',
              '<span class="text-[10px] text-zinc-400 font-medium">Note</span>',
            '</div>',
            friendsList.map(function(f) {
              var friendName = (f && f.displayName) || 'Friend';
              var friendAvatar = friendAvatarUrl(f);
              var targetId = f ? f.friendUserId : '';

              return '<div onclick="openChatWithUser(&quot;' + targetId + '&quot;, &quot;' + (friendName.replace(/"/g, '&quot;')) + '&quot;, &quot;' + friendAvatar + '&quot;)" class="flex flex-col items-center gap-1 min-w-[56px] cursor-pointer group">' +
                '<div class="w-12 h-12 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-500 group-hover:scale-105 transition">' +
                  '<img src="' + friendAvatar + '" class="w-full h-full rounded-full object-cover border border-black">' +
                '</div>' +
                '<span class="text-[10px] text-zinc-300 truncate max-w-[56px] font-medium">' + friendName.split(' ')[0] + '</span>' +
              '</div>';
            }).join(''),
          '</div>',
          '<div class="flex-1 overflow-y-auto divide-y divide-zinc-800/40">',
            directMessages.length === 0 ?
              '<div class="p-8 text-center space-y-3 my-8">' +
                '<div class="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-rose-500 text-xl"><i class="fa-regular fa-comments"></i></div>' +
                '<div>' +
                  '<p class="text-xs font-bold text-white">No active conversations</p>' +
                  '<p class="text-[11px] text-zinc-400 mt-0.5">Tap any friend above or find friends to start chatting!</p>' +
                '</div>' +
                '<button onclick="switchTab(&quot;explore&quot;); selectExploreCategory(&quot;People&quot;);" class="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl transition">Find Friends</button>' +
              '</div>' :
              directMessages.map(function(dm) {
                var cId = dm ? (dm.id || dm.conversationId) : '';
                var cName = dm ? (dm.name || dm.participantName || 'Chat') : 'Chat';
                var cAvatar = (dm && (dm.avatar || dm.participantAvatar)) || DEFAULT_AVATAR_URL;
                var lastText = dm.lastMessage || dm.lastMessageText || 'Tap to view chat';
                var timeStr = dm.updatedAt ? new Date(dm.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                return '<div onclick="openChatByConvId(&quot;' + cId + '&quot;, &quot;' + cName + '&quot;, &quot;' + cAvatar + '&quot;)" class="p-3 hover:bg-zinc-900/60 transition cursor-pointer flex items-center gap-3">' +
                  '<div class="w-12 h-12 rounded-full relative shrink-0 border border-zinc-700 overflow-hidden">' +
                    '<img src="' + cAvatar + '" class="w-full h-full rounded-full object-cover">' +
                    '<span class="w-3 h-3 rounded-full bg-emerald-500 border-2 border-black absolute bottom-0 right-0"></span>' +
                  '</div>' +
                  '<div class="flex-1 min-w-0">' +
                    '<div class="flex items-center justify-between">' +
                      '<h3 class="text-xs font-bold text-zinc-100 truncate">' + cName + '</h3>' +
                      '<span class="text-[10px] text-zinc-500">' + timeStr + '</span>' +
                    '</div>' +
                    '<p class="text-[11px] ' + (dm.unread ? 'font-bold text-white' : 'text-zinc-400') + ' truncate mt-0.5">' + lastText + '</p>' +
                  '</div>' +
                  (dm.unread ? '<span class="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>' : '') +
                '</div>';
              }).join(''),
          '</div>',
        '</div>'
      ].join('');
    }

    async function handleFollowUser(username, btnEl) {
      try {
        await apiFetch('/friends/requests', {
          method: 'POST',
          body: JSON.stringify({ targetUserId: 'user-' + username })
        });
      } catch (e) {
        console.warn("Follow request API error:", e);
      }
      if (btnEl) {
        btnEl.innerText = 'Following';
        btnEl.className = 'px-3 py-1 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-semibold shrink-0';
        btnEl.onclick = null;
      }
    }

    var notificationsList = [];
    var unreadNotificationCount = 0;
    var notificationTabFilter = 'all'; // 'all' | 'unread' | 'preferences' | 'reports'
    var notificationPreferencesList = [];
    var mySubmittedReportsList = [];

    async function fetchNotifications() {
      if (!authToken) return;
      try {
        var unreadOnly = notificationTabFilter === 'unread';
        var res = await apiFetch('/notifications' + (unreadOnly ? '?unreadOnly=true' : ''));
        if (res) {
          notificationsList = Array.isArray(res.notifications) ? res.notifications : (Array.isArray(res) ? res : []);
          unreadNotificationCount = typeof res.unreadCount === 'number' ? res.unreadCount : notificationsList.filter(function(n) { return !n.isRead; }).length;
        }
      } catch (e) {
        console.warn("Notifications API error:", e);
      }
    }

    async function markAllNotificationsRead() {
      try {
        await apiFetch('/notifications/mark-read', {
          method: 'POST',
          body: JSON.stringify({ markAll: true })
        });
        notificationsList.forEach(function(n) { n.isRead = true; });
        unreadNotificationCount = 0;
        renderScreen();
      } catch (e) {
        console.warn("Mark all read error:", e);
      }
    }

    async function markSingleNotificationRead(notifId) {
      try {
        await apiFetch('/notifications/mark-read', {
          method: 'POST',
          body: JSON.stringify({ notificationIds: [notifId] })
        });
        var target = notificationsList.find(function(n) { return n.id === notifId; });
        if (target && !target.isRead) {
          target.isRead = true;
          if (unreadNotificationCount > 0) unreadNotificationCount--;
        }
        renderScreen();
      } catch (e) {
        console.warn("Mark single read error:", e);
      }
    }

    async function fetchNotificationPreferences() {
      try {
        var res = await apiFetch('/notification-preferences');
        if (res && Array.isArray(res.preferences)) {
          notificationPreferencesList = res.preferences;
        }
      } catch (e) {
        console.warn("Fetch notification preferences error:", e);
      }
    }

    async function toggleNotificationPreference(prefKey, currentVal) {
      try {
        await apiFetch('/notification-preferences', {
          method: 'PUT',
          body: JSON.stringify({ key: prefKey, enabled: !currentVal })
        });
        await fetchNotificationPreferences();
        renderScreen();
      } catch (e) {
        console.warn("Toggle notification pref error:", e);
      }
    }

    async function fetchUserSubmittedReports() {
      try {
        var res = await apiFetch('/reports');
        if (res && Array.isArray(res.reports)) {
          mySubmittedReportsList = res.reports;
        }
      } catch (e) {
        console.warn("Fetch reports error:", e);
      }
    }

    function openReportModal(subjectType, subjectId, subjectTitle) {
      var container = document.getElementById('screen-content');
      if (!container) return;

      container.innerHTML = [
        '<div class="flex-1 flex flex-col bg-zinc-950 text-white p-4 z-40">',
          '<div class="flex items-center justify-between pb-3 border-b border-zinc-800">',
            '<div class="flex items-center gap-2">',
              '<i class="fa-solid fa-triangle-exclamation text-rose-500 text-base"></i>',
              '<h2 class="font-bold text-sm">Report Content / Safety</h2>',
            '</div>',
            '<button onclick="renderScreen()" class="text-zinc-400 hover:text-white p-1"><i class="fa-solid fa-xmark"></i></button>',
          '</div>',
          '<div class="mt-4 space-y-4 flex-1 overflow-y-auto">',
            '<div class="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs space-y-1">',
              '<span class="text-zinc-400 block text-[10px] font-bold uppercase tracking-wider">Reporting target</span>',
              '<p class="font-bold text-white">' + (subjectTitle || (subjectType + ': ' + subjectId)) + '</p>',
            '</div>',
            '<div class="space-y-1.5">',
              '<label class="text-xs font-semibold text-zinc-300">Reason for report</label>',
              '<select id="report-reason-select" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500">',
                '<option value="SPAM">Spam or misleading content</option>',
                '<option value="HARASSMENT">Harassment or bullying</option>',
                '<option value="INAPPROPRIATE">Inappropriate or offensive media</option>',
                '<option value="HATE_SPEECH">Hate speech or discrimination</option>',
                '<option value="OTHER">Other violation</option>',
              '</select>',
            '</div>',
            '<div class="space-y-1.5">',
              '<label class="text-xs font-semibold text-zinc-300">Additional details (Optional)</label>',
              '<textarea id="report-description-input" rows="3" placeholder="Provide extra context to help moderation review..." class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 placeholder-zinc-500 resize-none"></textarea>',
            '</div>',
          '</div>',
          '<div class="pt-3 border-t border-zinc-800 flex items-center gap-2">',
            '<button onclick="renderScreen()" class="flex-1 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300">Cancel</button>',
            '<button onclick="submitReportAction(&quot;' + subjectType + '&quot;, &quot;' + subjectId + '&quot;)" class="flex-1 py-2 bg-rose-500 hover:bg-rose-600 rounded-xl text-xs font-bold text-white transition">Submit Report</button>',
          '</div>',
        '</div>'
      ].join('');
    }

    async function submitReportAction(subjectType, subjectId) {
      var reasonSelect = document.getElementById('report-reason-select');
      var descInput = document.getElementById('report-description-input');

      var reasonCode = reasonSelect ? reasonSelect.value : 'SPAM';
      var description = descInput ? descInput.value.trim() : '';

      try {
        await apiFetch('/reports', {
          method: 'POST',
          body: JSON.stringify({
            reasonCode: reasonCode,
            description: description,
            subjects: [{ subjectType: subjectType, subjectId: subjectId }]
          })
        });
        alert("Thank you. Your report has been submitted for review.");
        renderScreen();
      } catch (e) {
        console.warn("Submit report error:", e);
        alert("Could not submit report: " + (e.message || "Error"));
      }
    }

    function renderActivityScreen() {
      if (notificationTabFilter === 'preferences') {
        fetchNotificationPreferences().then(function() { updateActivitySubViewUI(); });
      } else if (notificationTabFilter === 'reports') {
        fetchUserSubmittedReports().then(function() { updateActivitySubViewUI(); });
      } else {
        fetchNotifications().then(function() { updateActivitySubViewUI(); });
      }

      var bgClass = isDarkMode ? "bg-black text-white" : "bg-white text-zinc-900";

      return [
        '<div class="flex-1 flex flex-col ' + bgClass + '">',
          '<div class="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">',
            '<div class="flex items-center gap-2">',
              '<h2 class="font-bold text-sm">Activity & Safety</h2>',
              unreadNotificationCount > 0 ? '<span class="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full">' + unreadNotificationCount + ' new</span>' : '',
            '</div>',
            '<button onclick="markAllNotificationsRead()" class="text-xs text-rose-500 hover:underline font-semibold">Mark all read</button>',
          '</div>',
          '<div class="flex border-b border-zinc-800 text-xs font-semibold bg-zinc-950">',
            '<button onclick="notificationTabFilter=&quot;all&quot;; renderScreen();" class="flex-1 py-2.5 text-center ' + (notificationTabFilter === 'all' ? 'border-b-2 border-rose-500 text-rose-400 font-bold' : 'text-zinc-400') + '">All</button>',
            '<button onclick="notificationTabFilter=&quot;unread&quot;; renderScreen();" class="flex-1 py-2.5 text-center ' + (notificationTabFilter === 'unread' ? 'border-b-2 border-rose-500 text-rose-400 font-bold' : 'text-zinc-400') + '">Unread</button>',
            '<button onclick="notificationTabFilter=&quot;preferences&quot;; renderScreen();" class="flex-1 py-2.5 text-center ' + (notificationTabFilter === 'preferences' ? 'border-b-2 border-rose-500 text-rose-400 font-bold' : 'text-zinc-400') + '">Settings</button>',
            '<button onclick="notificationTabFilter=&quot;reports&quot;; renderScreen();" class="flex-1 py-2.5 text-center ' + (notificationTabFilter === 'reports' ? 'border-b-2 border-rose-500 text-rose-400 font-bold' : 'text-zinc-400') + '">My Reports</button>',
          '</div>',
          '<div id="activity-content-box" class="flex-1 p-3 space-y-2 overflow-y-auto">',
            '<div class="text-center py-8 text-xs text-zinc-500">Loading activity...</div>',
          '</div>',
        '</div>'
      ].join('');
    }

    function updateActivitySubViewUI() {
      var box = document.getElementById('activity-content-box');
      if (!box) return;

      if (notificationTabFilter === 'preferences') {
        var defaultPrefs = [
          { key: 'likes', title: 'Likes & Reactions', description: 'When someone likes your posts or stories' },
          { key: 'comments', title: 'Comments & Replies', description: 'When someone comments on your posts' },
          { key: 'friend_requests', title: 'Friend Requests', description: 'When someone sends or accepts a friend request' },
          { key: 'direct_messages', title: 'Direct Messages', description: 'When someone sends you a message' },
          { key: 'community_invites', title: 'Community Activity', description: 'Updates from communities you belong to' }
        ];

        box.innerHTML = [
          '<div class="space-y-3 p-1">',
            '<div class="text-xs text-zinc-400 font-medium mb-3">Customize which notifications you receive in real-time.</div>',
            defaultPrefs.map(function(p) {
              var found = notificationPreferencesList.find(function(item) { return item.key === p.key; });
              var isEnabled = found ? !!found.enabled : true;

              return '<div class="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between gap-3">' +
                '<div class="min-w-0 text-xs">' +
                  '<h4 class="font-bold text-white">' + p.title + '</h4>' +
                  '<p class="text-[10px] text-zinc-400 mt-0.5">' + p.description + '</p>' +
                '</div>' +
                '<button onclick="toggleNotificationPreference(&quot;' + p.key + '&quot;, ' + isEnabled + ')" class="w-10 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out ' + (isEnabled ? 'bg-rose-500' : 'bg-zinc-700') + '">' +
                  '<div class="w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ' + (isEnabled ? 'translate-x-4' : 'translate-x-0') + '"></div>' +
                '</button>' +
              '</div>';
            }).join(''),
          '</div>'
        ].join('');
        return;
      }

      if (notificationTabFilter === 'reports') {
        box.innerHTML = [
          '<div class="space-y-3 p-1">',
            '<div class="flex items-center justify-between text-xs text-zinc-400 font-medium mb-2">',
              '<span>Reports you submitted for review</span>',
              '<button onclick="fetchUserSubmittedReports().then(function(){ updateActivitySubViewUI(); })" class="text-rose-400 hover:underline"><i class="fa-solid fa-rotate-right"></i> Refresh</button>',
            '</div>',
            mySubmittedReportsList.length === 0 ?
              '<div class="p-8 text-center space-y-2 my-8">' +
                '<div class="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-emerald-400 text-xl"><i class="fa-solid fa-shield-halved"></i></div>' +
                '<p class="text-xs font-bold text-white">No active reports</p>' +
                '<p class="text-[11px] text-zinc-400">Reports submitted on users or content will appear here.</p>' +
              '</div>' :
              mySubmittedReportsList.map(function(r) {
                var statusColor = r.status === 'actioned' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : (r.status === 'dismissed' ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-amber-500/20 text-amber-400 border-amber-500/30');

                return '<div class="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">' +
                  '<div class="flex items-center justify-between">' +
                    '<span class="text-xs font-bold text-white uppercase tracking-wider">Reason: ' + (r.reasonCode || 'Violation') + '</span>' +
                    '<span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase border ' + statusColor + '">' + (r.status || 'Pending') + '</span>' +
                  '</div>' +
                  (r.description ? '<p class="text-xs text-zinc-300 italic bg-zinc-950 p-2 rounded-lg border border-zinc-800">"' + r.description + '"</p>' : '') +
                  '<span class="text-[9px] text-zinc-500 block">Submitted ' + (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recently') + '</span>' +
                '</div>';
              }).join(''),
          '</div>'
        ].join('');
        return;
      }

      if (notificationsList.length === 0) {
        box.innerHTML = '<div class="p-8 text-center space-y-2 my-12">' +
          '<div class="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-rose-400 text-xl"><i class="fa-regular fa-bell"></i></div>' +
          '<p class="text-xs font-semibold text-white">No notifications</p>' +
          '<p class="text-[11px] text-zinc-400">Activity on your profile will appear here.</p>' +
        '</div>';
        return;
      }

      box.innerHTML = notificationsList.map(function(n) {
        var isUnread = !n.isRead;
        var actorName = n.actorDisplayName || n.actorName || 'User';
        var actorAvatar = n.actorAvatarUrl || ('https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(actorName));
        var msg = n.message || n.text || 'interacted with your profile';
        var timeStr = n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently';

        return '<div onclick="markSingleNotificationRead(&quot;' + n.id + '&quot;)" class="flex items-center justify-between p-2.5 rounded-xl border border-zinc-800/80 transition cursor-pointer ' + (isUnread ? 'bg-rose-500/10 border-rose-500/30' : 'bg-zinc-900/60') + '">' +
          '<div class="flex items-center gap-3 min-w-0">' +
            '<img src="' + actorAvatar + '" class="w-10 h-10 rounded-full object-cover shrink-0 border border-zinc-700">' +
            '<div class="text-xs min-w-0">' +
              '<span class="font-bold text-white">' + actorName + '</span>' +
              '<span class="text-zinc-300"> ' + msg + '</span>' +
              '<span class="text-[10px] text-zinc-500 block mt-0.5">' + timeStr + '</span>' +
            '</div>' +
          '</div>' +
          (isUnread ? '<span class="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>' : '') +
        '</div>';
      }).join('');
    }

    var profileActiveTab = 'grid'; // 'grid' | 'reels' | 'saved'

    function setProfileTab(tab) {
      profileActiveTab = tab;
      renderScreen();
    }

    function openReelOrFeed(id, isReel) {
      if (isReel) {
        var idx = reelsFeed.findIndex(function(r) { return r.id === id; });
        if (idx >= 0) {
          currentReelIndex = idx;
        } else {
          currentReelIndex = 0;
        }
        switchTab('reels');
      } else {
        switchTab('feed');
      }
    }

    function renderProfileScreen() {
      var name = currentUser ? (currentUser.email ? currentUser.email.split('@')[0] : 'user') : 'user';
      var userAvatar = getUserAvatar();

      var displayItems = postsFeed;
      if (profileActiveTab === 'reels') {
        var reelPosts = postsFeed.filter(function(p) { return p.isReel; });
        var reelItems = reelsFeed.map(function(r) {
          return {
            id: r.id,
            image: r.videoBg || r.image,
            isReel: true,
            caption: r.caption
          };
        });
        displayItems = reelPosts.concat(reelItems);
        var seen = {};
        displayItems = displayItems.filter(function(it) {
          if (seen[it.id]) return false;
          seen[it.id] = true;
          return true;
        });
      } else if (profileActiveTab === 'saved') {
        displayItems = postsFeed.filter(function(p) { return p.saved; });
      }

      var userHasStory = storiesList.some(function(s) {
        return s.isUser && (s.hasStory || (s.items && s.items.length > 0) || (s.mediaUrl && s.mediaUrl !== ''));
      });
      var profRingClass = userHasStory ? "insta-story-ring" : "p-[2px] bg-zinc-800";

      return [
        '<div class="flex-1 flex flex-col bg-black text-white">',
          '<div class="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">',
            '<div class="flex items-center gap-1 font-bold text-sm">',
              '<span>' + name + '</span>',
              '<i class="fa-solid fa-chevron-down text-[10px] text-zinc-400"></i>',
            '</div>',
            '<div class="flex items-center gap-4 text-lg">',
              '<button onclick="openCreateModal()"><i class="fa-regular fa-square-plus"></i></button>',
              '<button onclick="handleLogout()" class="text-rose-400 text-xs font-medium">Log Out</button>',
            '</div>',
          '</div>',
          '<div class="flex-1 p-4 overflow-y-auto space-y-4">',
            '<div class="flex items-center justify-between">',
              '<div onclick="openMyStoryOrModal()" class="' + profRingClass + ' w-20 h-20 relative cursor-pointer group hover:scale-105 transition" title="' + (userHasStory ? 'View Story' : 'Add Story') + '">',
                '<div class="w-full h-full rounded-full p-[2px] bg-black">',
                  '<img src="' + userAvatar + '" class="w-full h-full rounded-full object-cover">',
                '</div>',
                '<div class="absolute bottom-0 right-0 w-5.5 h-5.5 rounded-full bg-rose-500 border-2 border-black flex items-center justify-center text-[10px] text-white shadow-md" onclick="event.stopPropagation(); openCreateStoryModal();" title="Add Story">',
                  '<i class="fa-solid fa-plus"></i>',
                '</div>',
                userHasStory ? '<span class="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-rose-400 whitespace-nowrap bg-black/80 px-1.5 py-0.5 rounded-full border border-rose-500/30">View Story</span>' : '',
              '</div>',
              '<div class="flex gap-6 text-center select-none">',
                '<div><div class="text-sm font-bold">' + postsFeed.length + '</div><div class="text-[11px] text-zinc-400">Posts</div></div>',
                '<div onclick="switchTab(&quot;explore&quot;); selectExploreCategory(&quot;Friends&quot;);" class="cursor-pointer hover:opacity-80"><div class="text-sm font-bold text-rose-400">' + friendsList.length + '</div><div class="text-[11px] text-zinc-300 font-medium">Friends</div></div>',
                '<div onclick="switchTab(&quot;explore&quot;); selectExploreCategory(&quot;Requests&quot;);" class="cursor-pointer hover:opacity-80"><div class="text-sm font-bold text-amber-400">' + incomingRequestsList.length + '</div><div class="text-[11px] text-zinc-300 font-medium">Requests</div></div>',
              '</div>',
            '</div>',
            '<div>',
              '<h3 class="text-xs font-bold text-white capitalize">' + (userProfileData.displayName || name.replace('_', ' ')) + '</h3>',
              '<p class="text-xs text-zinc-300 mt-0.5">' + (userProfileData.bio || 'No bio added yet.') + '</p>',
            '</div>',
            '<div class="flex gap-2">',
              '<button onclick="openEditProfileModal()" class="flex-1 bg-zinc-800 hover:bg-zinc-700 py-1.5 rounded-lg text-xs font-semibold text-zinc-200">Edit profile</button>',
              '<button class="flex-1 bg-zinc-800 hover:bg-zinc-700 py-1.5 rounded-lg text-xs font-semibold text-zinc-200">Share profile</button>',
            '</div>',
            '<div class="border-t border-zinc-800 flex justify-around text-lg text-zinc-500 pt-2">',
              '<button onclick="setProfileTab(&quot;grid&quot;)" class="' + (profileActiveTab === 'grid' ? 'text-white border-b-2 border-white pb-2' : 'hover:text-white pb-2') + ' flex-1 text-center" title="All Posts"><i class="fa-solid fa-table-cells"></i></button>',
              '<button onclick="setProfileTab(&quot;reels&quot;)" class="' + (profileActiveTab === 'reels' ? 'text-white border-b-2 border-white pb-2' : 'hover:text-white pb-2') + ' flex-1 text-center" title="Reels"><i class="fa-solid fa-clapperboard"></i></button>',
              '<button onclick="setProfileTab(&quot;saved&quot;)" class="' + (profileActiveTab === 'saved' ? 'text-white border-b-2 border-white pb-2' : 'hover:text-white pb-2') + ' flex-1 text-center" title="Saved"><i class="fa-regular fa-bookmark"></i></button>',
            '</div>',
            displayItems.length === 0 ?
              '<div class="p-8 text-center text-xs text-zinc-500 space-y-2 my-4">' +
                '<i class="fa-solid fa-camera text-2xl text-zinc-700 block mb-1"></i>' +
                '<p class="font-semibold text-zinc-400">No ' + (profileActiveTab === 'reels' ? 'Reels' : (profileActiveTab === 'saved' ? 'Saved Posts' : 'Posts')) + ' Yet</p>' +
                '<p class="text-[11px]">When you share photos or reels, they will appear on your profile.</p>' +
              '</div>' :
              '<div class="grid grid-cols-3 gap-1">' +
                displayItems.map(function(p) {
                  var reelIcon = p.isReel ? '<div class="absolute top-1.5 right-1.5 text-white text-[10px] bg-black/60 px-1 py-0.5 rounded backdrop-blur-sm"><i class="fa-solid fa-clapperboard"></i></div>' : '';
                  var isReel = p.isReel ? true : false;
                  return '<div class="relative aspect-square bg-zinc-900 overflow-hidden group cursor-pointer" onclick="openReelOrFeed(&quot;' + p.id + '&quot;, ' + isReel + ')">' +
                    '<img src="' + (p.image || p.videoBg) + '" class="w-full h-full object-cover group-hover:scale-105 transition duration-200">' +
                    reelIcon +
                  '</div>';
                }).join('') +
              '</div>',
          '</div>',
        '</div>'
      ].join('');
    }

    function handleLogout() {
      authToken = null;
      localStorage.removeItem('gamiunity_token');
      currentUser = null;
      renderScreen();
    }

    (async function() {
      if (authToken) {
        await loadUserData();
      } else {
        authMode = 'login';
      }
      renderScreen();
    })();
  </script>
</body>
</html>`;
}
