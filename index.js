/**
 * EXXEED BLOG SYSTEM V10 (Optimized)
 * deployed on Cloudflare Workers
 */

const DEFAULT_POSTS = []; // Empty default state
const TIMELINE_DATA = [
  {
    year: "2025 - PRESENT",
    title: "Upcoming Full-stack Developer",
    desc: "Crunching The Odin Project and Scrimba.",
  },
  {
    year: "2024",
    title: "The Spark",
    desc: "Enrolled in a degree for IT. Found my calling.",
  },
  {
    year: "2021 - 2024",
    title: "Philippine Military Academy",
    desc: "Cadet. Warshocked into a military way of life. (Discharged due to injury)",
  },
  {
    year: "2018-2021",
    title: "The Valley of Confusion",
    desc: "College at Ateneo De Naga, jumped from one course to another.",
  },
];

// --- WORKER BACKEND ---
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. SERVICE WORKER SERVING
    if (url.pathname === "/sw.js") {
      return new Response(serviceWorkerCode, {
        headers: { "Content-Type": "application/javascript" },
      });
    }

    // 2. API: SEARCH INDEX (Lightweight for autocomplete/filtering)
    if (url.pathname === "/api/search-index" && request.method === "GET") {
      let posts =
        (await env.BLOG_KV.get("posts", { type: "json" })) || DEFAULT_POSTS;
      // Return only what's needed for search
      const index = posts.map((p) => ({
        id: p.id,
        title: p.title,
        tag: p.tag,
        date: p.date,
      }));
      return new Response(JSON.stringify(index), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=120",
        },
      });
    }

    // 3. API: GET POSTS (Full Data)
    if (url.pathname === "/api/posts" && request.method === "GET") {
      let posts = await env.BLOG_KV.get("posts", { type: "json" });
      if (!posts) {
        posts = DEFAULT_POSTS;
        await env.BLOG_KV.put("posts", JSON.stringify(posts));
      }
      return new Response(JSON.stringify(posts), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60",
        },
      });
    }

    // 4. API: GET TIMELINE
    if (url.pathname === "/api/timeline" && request.method === "GET") {
      return new Response(JSON.stringify(TIMELINE_DATA), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // 5. API: SAVE POST (Secure)
    if (
      url.pathname === "/api/posts" &&
      (request.method === "POST" || request.method === "PUT")
    ) {
      const auth = request.headers.get("Authorization");
      if (auth !== env.ADMIN_PASS) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        });
      }

      try {
        const incoming = await request.json();
        if (!incoming.title || !incoming.content)
          return new Response("Invalid Data", { status: 400 });

        let posts =
          (await env.BLOG_KV.get("posts", { type: "json" })) || DEFAULT_POSTS;

        if (request.method === "POST") {
          // Server-side UUID generation
          const newId = crypto.randomUUID();

          // Validation: Check for duplicate Tags (IDs are now safe due to UUID)
          if (
            incoming.tag &&
            posts.some(
              (p) => p.tag.toLowerCase() === incoming.tag.toLowerCase()
            )
          ) {
            return new Response("Duplicate Tag", { status: 409 });
          }

          const newPost = { ...incoming, id: newId };
          posts.unshift(newPost);
        } else {
          // PUT (Update)
          const index = posts.findIndex((p) => p.id === incoming.id);
          if (index !== -1) posts[index] = incoming;
          else return new Response("Post not found", { status: 404 });
        }

        await env.BLOG_KV.put("posts", JSON.stringify(posts));
        return new Response("Saved", { status: 200 });
      } catch (e) {
        return new Response("Server Error", { status: 500 });
      }
    }

    // 6. SERVE HTML
    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        Link: "</sw.js>; rel=preload; as=script", // Resource Hint
      },
    });
  },
};

// --- SERVICE WORKER CODE ---
const serviceWorkerCode = `
const CACHE_NAME = 'exxeed-v10';
const ASSETS = ['/', '/api/timeline'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
  // Stale-while-revalidate strategy for API, Cache-first for static
  if(e.request.url.includes('/api/')) {
    e.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return fetch(e.request).then(response => {
          cache.put(e.request, response.clone());
          return response;
        }).catch(() => cache.match(e.request));
      })
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(response => response || fetch(e.request))
    );
  }
});
`;

// --- HTML TEMPLATE ---
const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Exceed Mission Log.">
    <title>EXXEED | The Mission Log</title>
    
    <!-- RESOURCE HINTS (Performance) -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/marked/11.1.1/marked.min.js" as="script" />

    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=JetBrains+Mono:wght@400;700&family=Manrope:wght@300;400;700&family=Major+Mono+Display&display=swap" rel="stylesheet" />
    
    <!-- Custom Favicon -->
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext x='50' y='75' text-anchor='middle' style='font-family:monospace;font-weight:bold;fill:%23ff3333;font-size:80px;'%3EX%3C/text%3E%3C/svg%3E">
    
    <!-- Markdown Parser -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/marked/11.1.1/marked.min.js"></script> 

    <style>
      /* CRITICAL CSS EXTRACTED */
      :root {
        --bg-main: #e0e0e0; --bg-panel: #888888;
        --text-main: #0a0a0a; --text-muted: #111111;
        --accent: #ff3333; --border: #222222;
        --input-bg: rgba(255,255,255,0.1);
        --card-hover: rgba(0,0,0,0.05); 
        --focus-ring: #ff3333;
      }
      [data-theme="dark"] {
        --bg-main: #222222; --bg-panel: #282828;
        --text-main: #e6edf3; --text-muted: #8b949e;
        --accent: #00f0ff; --border: #21262d;
        --input-bg: #30363d; --card-hover: rgba(0, 240, 255, 0.05);
        --focus-ring: #00f0ff;
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background-color: var(--bg-main); color: var(--text-main); font-family: "Manrope", sans-serif; height: 100vh; width: 100vw; overflow: hidden; display: flex; transition: background 0.5s, color 0.5s; }
      
      /* Accessibility */
      .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
      :focus-visible { outline: 3px solid var(--focus-ring); outline-offset: 2px; }

      /* Layout & Utilities */
      .noise-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 999; opacity: 0.04; background: url('data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noise)" opacity="1"/%3E%3C/svg%3E'); }
      
      /* Toast */
      #toast-container { position: fixed; bottom: 2rem; right: 2rem; z-index: 2000; display: flex; flex-direction: column; gap: 0.8rem; pointer-events: none; }
      .toast { background: #1a1a1a; color: #fff; font-family: 'JetBrains Mono', monospace; padding: 1rem 1.5rem; border-left: 4px solid var(--accent); min-width: 250px; opacity: 0; transform: translateY(20px); animation: slideUpFade 0.3s forwards; pointer-events: all; }
      .toast.success { border-left-color: #4caf50; } .toast.error { border-left-color: #ff3333; }
      @keyframes slideUpFade { to { opacity: 1; transform: translateY(0); } }
      @keyframes fadeOut { to { opacity: 0; transform: translateX(20px); } }

      /* Panels */
      .left-pane { width: 35%; height: 100%; background: var(--bg-panel); border-right: 1px solid var(--border); padding: 4rem; display: flex; flex-direction: column; justify-content: space-between; position: relative; }
      .right-pane { width: 65%; height: 100%; overflow-y: auto; position: relative; scroll-behavior: smooth; }

      /* Nav */
      .nav-dock { position: fixed; top: 2rem; right: 2rem; z-index: 100; display: flex; gap: 1.5rem; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(10px); padding: 0.8rem 2rem; border-radius: 50px; border: 1px solid var(--border); }
      .nav-link { color: #ccc; text-decoration: none; font-family: "JetBrains Mono"; text-transform: uppercase; cursor: pointer; border: none; background: none; }
      .nav-link.active { color: #fff; text-shadow: 0 0 8px var(--accent); }
      
      /* Typography & Content */
      .content-container { padding: 8rem 6rem; max-width: 900px; margin: 0 auto; display: none; opacity: 0; animation: fadeIn 0.4s forwards; }
      .content-container.active-view { display: block; }
      @keyframes fadeIn { to { opacity: 1; transform: translateY(0); } }
      
      h1.article-title { font-family: "Cinzel", serif; font-size: 4rem; line-height: 1.1; margin-bottom: 2rem; }
      .meta-tag { font-family: "JetBrains Mono"; color: var(--accent); border: 1px solid var(--accent); padding: 4px 12px; display: inline-block; margin-bottom: 2rem; }
      
      /* Virtual Scroll List */
      .virtual-list-container { height: 600px; overflow-y: auto; position: relative; border-top: 1px solid var(--border); }
      .virtual-spacer { height: 1px; }

      .post-item { padding: 1.5rem; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.2s; }
      .post-item:hover { background: var(--card-hover); border-left: 2px solid var(--accent); }
      .post-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
      .post-meta { font-family: 'JetBrains Mono'; color: var(--accent); font-size: 0.85rem; display: flex; justify-content: space-between; margin-bottom: 0.5rem; }

      /* Admin */
      .admin-gate { text-align: center; padding: 4rem 0; }
      .admin-panel { display: none; }
      .admin-panel.unlocked { display: block; }
      input, textarea { width: 100%; background: var(--input-bg); border: 1px solid var(--border); color: var(--text-main); padding: 1rem; margin-bottom: 1rem; font-family: "JetBrains Mono"; }
      .btn { background: var(--accent); color: #000; border: none; padding: 1rem 2rem; font-family: "JetBrains Mono"; font-weight: bold; cursor: pointer; }

      /* Mobile */
      @media (max-width: 900px) {
        body { flex-direction: column; overflow-y: auto; height: auto; }
        .left-pane { width: 100%; padding: 2rem; height: auto; }
        .right-pane { width: 100%; overflow: visible; }
        .content-container { padding: 4rem 2rem; }
        .nav-dock { display: none; } 
        .nav-dock.active-mobile { display: flex; flex-direction: column; position: fixed; inset: 0; height: 100%; justify-content: center; border-radius: 0; }
        .brand-vertical { display: none; }
        .mobile-toggle { position: fixed; top: 1.5rem; right: 1.5rem; z-index: 101; display: block; background: var(--bg-panel); padding: 0.5rem; border-radius: 4px; }
      }
      .mobile-toggle { display: none; }
      .theme-switch { position: fixed; top: 2rem; left: 2rem; z-index: 100; background: none; border: none; cursor: pointer; color: var(--text-main); }
    </style>
  </head>
  <body>
    <div class="noise-overlay"></div>
    <!-- ARIA Live Region for Accessibility -->
    <div id="toast-container" role="status" aria-live="polite"></div>

    <button class="theme-switch" id="themeBtn" aria-label="Toggle Theme">
        <svg style="width:24px;height:24px" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
    </button>
    
    <button class="mobile-toggle" id="mobileNavBtn" aria-label="Menu">
       <svg style="width:24px;height:24px" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
    </button>

    <nav class="nav-dock" id="mainNav">
      <button class="nav-link active" data-view="home">Log</button>
      <button class="nav-link" data-view="archive">Archive</button>
      <button class="nav-link" data-view="admin">Admin</button>
    </nav>

    <aside class="left-pane">
        <div style="margin-top: auto;">
            <div class="mission-stat"><div class="stat-label">OPERATOR</div><div class="stat-val">EXXEED</div></div>
            <div class="mission-stat"><div class="stat-label">STATUS</div><div class="stat-val" style="color: #4caf50;">ONLINE</div></div>
        </div>
        <div class="brand-vertical" style="position: absolute; bottom: -2rem; left: -1rem; font-family: Cinzel; font-size: 8rem; opacity: 0.08; writing-mode: vertical-rl; transform: rotate(180deg); pointer-events: none;">EXXEED</div>
    </aside>

    <main class="right-pane" id="rightPane">
      
      <!-- VIEW 1: HOME -->
      <div id="view-home" class="content-container active-view" role="tabpanel">
        <span class="meta-tag">MISSION LOG // LATEST</span>
        <h1 class="article-title">The Journey <br />So Far.</h1>
        <div id="home-posts" style="margin-top: 4rem; min-height: 200px;">
           <div class="skeleton-loader">Loading Mission Data...</div>
        </div>
        
        <div class="dossier-section" style="margin-top: 6rem; border-top: 1px solid var(--border); padding-top: 4rem;">
            <div style="display: flex; gap: 2rem; align-items: center; margin-bottom: 3rem;">
                 <!-- Optimization: Lazy Load Avatar -->
                 <img data-src="https://i.imgur.com/3x1dKUX.jpeg" class="dossier-avatar lazy-img" alt="Operator Avatar" 
                      style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent); opacity: 0; transition: opacity 0.5s;">
                 <p style="color: var(--text-muted);">Former PMA Cadet turned Full-Stack Developer. Building in public.</p>
            </div>
            <div id="timeline-container"></div>
        </div>
      </div>

      <!-- VIEW 2: ARCHIVE (Virtualized) -->
      <div id="view-archive" class="content-container" role="tabpanel">
        <span class="meta-tag">FULL DATABASE</span>
        <h1 class="article-title">All Logs.</h1>
        <input type="text" id="archive-search" placeholder="Filter parameters..." aria-label="Search posts">
        
        <!-- Virtual Scroll Container -->
        <div id="archive-list" class="virtual-list-container"></div>
      </div>

      <!-- VIEW 3: SINGLE -->
      <div id="view-single" class="content-container" role="tabpanel">
        <button class="back-btn nav-link" style="margin-bottom:2rem; display:inline-block;" data-view="home">&lt;&lt; RETURN</button>
        <div id="single-post-content"></div>
      </div>

      <!-- VIEW 4: ADMIN -->
      <div id="view-admin" class="content-container" role="tabpanel">
        <span class="meta-tag">RESTRICTED ACCESS</span>
        <h1 class="article-title">Admin Link</h1>
        
        <div id="admin-gate" class="admin-gate">
            <input type="password" id="gate-pass" placeholder="Enter Passkey" aria-label="Password">
            <br>
            <button class="btn" id="auth-btn">Authenticate</button>
        </div>

        <div id="admin-panel" class="admin-panel">
            <div class="admin-form">
                <input type="hidden" id="post-id"> 
                <input type="text" id="post-title" placeholder="Mission Title">
                <div style="display: flex; gap: 1rem;">
                    <input type="text" id="post-tag" placeholder="Tag (LOG_005)" style="flex:1">
                    <input type="text" id="post-date" placeholder="Date" style="flex:1">
                </div>
                <input type="text" id="post-teaser" placeholder="Teaser">
                <textarea id="post-content" placeholder="Content (Markdown/HTML)" style="min-height: 300px;"></textarea>
                <button class="btn" id="submit-post-btn">Submit Log</button>
                <button class="btn" id="reset-form-btn" style="background:#555;">Clear</button>
            </div>
            
            <!-- Missing Div Fixed Here -->
            <div style="margin-top: 3rem;">
                <h3>Manage Entries</h3>
                <div id="admin-post-list" class="virtual-list-container" style="height: 300px;"></div>
            </div>
        </div>
      </div>
    </main>

    <script>
      /**
       * CORE APPLICATION LOGIC
       * Uses IIFE/Class structure for better scope control
       */
      (function() {
        // --- STATE & CACHE ---
        const state = {
            posts: [],
            searchIndex: [],
            timeline: [],
            adminToken: null, // Stored in memory only, not DOM
            isFetching: false
        };
        
        const UI = {
            nav: document.getElementById('mainNav'),
            rightPane: document.getElementById('rightPane'),
            views: {
                home: document.getElementById('view-home'),
                archive: document.getElementById('view-archive'),
                admin: document.getElementById('view-admin'),
                single: document.getElementById('view-single')
            },
            homeList: document.getElementById('home-posts'),
            archiveList: document.getElementById('archive-list'),
            adminList: document.getElementById('admin-post-list'),
            singleContent: document.getElementById('single-post-content'),
            inputs: {
                search: document.getElementById('archive-search'),
                adminPass: document.getElementById('gate-pass'),
                formId: document.getElementById('post-id'),
                formTitle: document.getElementById('post-title'),
                formTag: document.getElementById('post-tag'),
                formDate: document.getElementById('post-date'),
                formTeaser: document.getElementById('post-teaser'),
                formContent: document.getElementById('post-content')
            }
        };

        const markedCache = new Map(); // Memoize markdown parsing

        // --- SERVICE WORKER REGISTRATION ---
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(
                    reg => console.log('SW Registered'), 
                    err => console.log('SW Failed', err)
                );
            });
        }

        // --- VIRTUAL SCROLL CLASS ---
        class VirtualScroller {
            constructor(container, items, renderRow) {
                this.container = container;
                this.items = items;
                this.renderRow = renderRow;
                this.rowHeight = 100; // Approx height per item
                this.buffer = 5;
                this.scroller = this.scroller.bind(this);
                
                this.container.addEventListener('scroll', this.scroller);
                this.refresh();
            }

            updateItems(newItems) {
                this.items = newItems;
                this.refresh();
            }

            refresh() {
                const totalHeight = this.items.length * this.rowHeight;
                // Create/Update spacer
                let spacer = this.container.querySelector('.virtual-spacer');
                if(!spacer) {
                    spacer = document.createElement('div');
                    spacer.className = 'virtual-spacer';
                    this.container.appendChild(spacer);
                }
                spacer.style.height = \`\${totalHeight}px\`;
                this.scroller();
            }

            scroller() {
                const scrollTop = this.container.scrollTop;
                const containerHeight = this.container.clientHeight;
                
                const startIndex = Math.max(0, Math.floor(scrollTop / this.rowHeight) - this.buffer);
                const endIndex = Math.min(this.items.length, Math.floor((scrollTop + containerHeight) / this.rowHeight) + this.buffer);

                // Clear visible items (except spacer)
                Array.from(this.container.children).forEach(child => {
                    if(!child.classList.contains('virtual-spacer')) child.remove();
                });

                for(let i = startIndex; i < endIndex; i++) {
                    const item = this.items[i];
                    if(!item) continue;
                    const row = this.renderRow(item);
                    row.style.position = 'absolute';
                    row.style.top = \`\${i * this.rowHeight}px\`;
                    row.style.width = '100%';
                    row.style.height = \`\${this.rowHeight}px\`;
                    this.container.appendChild(row);
                }
            }
        }

        let archiveScroller, adminScroller;

        // --- CORE FUNCTIONS ---
        
        async function init() {
            initTheme();
            setupEventListeners();
            loadLazyImages();
            
            // Deduplicated fetch
            if(state.isFetching) return;
            state.isFetching = true;

            try {
                // Fetch Timeline
                const tRes = await fetch('/api/timeline');
                state.timeline = await tRes.json();
                renderTimeline();

                // Fetch Posts
                const pRes = await fetch('/api/posts');
                state.posts = await pRes.json();
                
                renderHome();
                
                // Init Virtual Scrollers
                archiveScroller = new VirtualScroller(UI.archiveList, state.posts, createPostRow);
                
            } catch (e) {
                showToast("Network Error: Offline Mode?", "error");
            } finally {
                state.isFetching = false;
            }
        }

        function initTheme() {
            const stored = localStorage.getItem('theme');
            if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.setAttribute('data-theme', 'dark');
            }
        }

        function setupEventListeners() {
            // Navigation Delegation
            document.body.addEventListener('click', (e) => {
                const nav = e.target.closest('[data-view]');
                if (nav) {
                    e.preventDefault();
                    switchView(nav.dataset.view);
                    return;
                }
                
                const postLink = e.target.closest('.post-item');
                if(postLink && postLink.dataset.id) {
                    // Check if clicking edit in admin
                    if(e.target.classList.contains('edit-trigger')) {
                        loadIntoForm(postLink.dataset.id);
                    } else {
                        openPost(postLink.dataset.id);
                    }
                }
            });

            // Theme Toggle
            document.getElementById('themeBtn').addEventListener('click', () => {
                const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                if(isDark) { 
                    document.documentElement.removeAttribute('data-theme'); 
                    localStorage.setItem('theme', 'light');
                } else { 
                    document.documentElement.setAttribute('data-theme', 'dark'); 
                    localStorage.setItem('theme', 'dark');
                }
            });

            // Mobile Nav
            document.getElementById('mobileNavBtn').addEventListener('click', () => {
                UI.nav.classList.toggle('active-mobile');
            });

            // Admin Auth
            document.getElementById('auth-btn').addEventListener('click', unlockAdmin);
            
            // Admin Submit
            document.getElementById('submit-post-btn').addEventListener('click', submitPost);
            
            // Search Filtering
            UI.inputs.search.addEventListener('input', (e) => {
                const val = e.target.value.toLowerCase();
                const filtered = state.posts.filter(p => 
                    p.title.toLowerCase().includes(val) || p.tag.toLowerCase().includes(val)
                );
                archiveScroller.updateItems(filtered);
            });
        }

        // --- RENDERING ---

        function renderHome() {
            UI.homeList.innerHTML = '';
            state.posts.slice(0, 3).forEach(post => {
                const el = createPostRow(post);
                el.style.position = 'relative'; // Reset virtual scroll styles
                el.style.top = 'auto';
                el.style.height = 'auto';
                UI.homeList.appendChild(el);
            });
        }

        function renderTimeline() {
            const container = document.getElementById('timeline-container');
            container.innerHTML = state.timeline.map(t => \`
                <div style="border-left: 2px solid var(--border); padding-left: 1.5rem; margin-bottom: 2rem; position:relative;">
                    <div style="position:absolute; left:-5px; top:0; width:8px; height:8px; background:var(--accent); border-radius:50%;"></div>
                    <small style="font-family:'JetBrains Mono'; color:var(--accent);">\${t.year}</small>
                    <h3 style="margin:0.5rem 0;">\${t.title}</h3>
                    <p style="color:var(--text-muted);">\${t.desc}</p>
                </div>
            \`).join('');
        }

        function createPostRow(post) {
            const div = document.createElement('div');
            div.className = 'post-item';
            div.dataset.id = post.id;
            div.innerHTML = \`
                <div class="post-meta">
                    <span>\${post.tag}</span>
                    <span>\${post.date}</span>
                </div>
                <div class="post-title">\${post.title}</div>
                <div class="post-teaser" style="font-size:0.9rem; color:var(--text-muted);">\${post.teaser}</div>
            \`;
            return div;
        }

        // --- ADMIN LOGIC (Lazy Loaded Logic) ---
        
        function unlockAdmin() {
            const pass = UI.inputs.adminPass.value;
            if(!pass) return showToast("Enter Passkey", "error");
            
            // Store purely in memory state, not DOM
            state.adminToken = pass;
            
            // Show Panel
            document.getElementById('admin-gate').style.display = 'none';
            document.getElementById('admin-panel').classList.add('unlocked');
            showToast("Authenticated", "success");
            
            // Initialize Admin List Scroller
            // Re-use createPostRow but add edit functionality via class detection
            adminScroller = new VirtualScroller(UI.adminList, state.posts, (item) => {
                const el = createPostRow(item);
                const btn = document.createElement('span');
                btn.innerText = " [EDIT]";
                btn.className = "edit-trigger"; // Hook for event delegation
                btn.style.color = "var(--accent)";
                btn.style.fontWeight = "bold";
                el.querySelector('.post-meta').appendChild(btn);
                return el;
            });
        }

        function loadIntoForm(id) {
            const p = state.posts.find(x => x.id === id);
            if(!p) return;
            UI.inputs.formId.value = p.id;
            UI.inputs.formTitle.value = p.title;
            UI.inputs.formTag.value = p.tag;
            UI.inputs.formDate.value = p.date;
            UI.inputs.formTeaser.value = p.teaser;
            UI.inputs.formContent.value = p.content;
            document.getElementById('submit-post-btn').innerText = "Update Log";
            UI.rightPane.scrollTop = 0;
        }

        async function submitPost() {
            if(!state.adminToken) return showToast("Session Lost", "error");
            
            const payload = {
                id: UI.inputs.formId.value || undefined, // undefined triggers new ID on server
                title: UI.inputs.formTitle.value,
                tag: UI.inputs.formTag.value,
                date: UI.inputs.formDate.value,
                teaser: UI.inputs.formTeaser.value,
                content: UI.inputs.formContent.value
            };

            // Basic Client Validation
            if(!payload.title || !payload.content) return showToast("Missing Fields", "error");

            try {
                const method = payload.id ? 'PUT' : 'POST';
                const res = await fetch('/api/posts', {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': state.adminToken
                    },
                    body: JSON.stringify(payload)
                });

                if(res.ok) {
                    showToast("Saved Successfully", "success");
                    // Refresh Data
                    state.posts = await (await fetch('/api/posts')).json();
                    renderHome();
                    if(adminScroller) adminScroller.updateItems(state.posts);
                    if(archiveScroller) archiveScroller.updateItems(state.posts);
                    // Clear Form
                    UI.inputs.formId.value = "";
                    UI.inputs.formTitle.value = "";
                    UI.inputs.formContent.value = "";
                } else {
                    const txt = await res.text();
                    showToast("Error: " + txt, "error");
                }
            } catch(e) {
                showToast("Network Error", "error");
            }
        }

        // --- NAVIGATION & UTILS ---

        function switchView(viewName) {
            UI.nav.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            const activeLink = UI.nav.querySelector(\`[data-view="\${viewName}"]\`);
            if(activeLink) activeLink.classList.add('active');

            Object.values(UI.views).forEach(el => el.classList.remove('active-view'));
            
            if(UI.views[viewName]) {
                UI.views[viewName].classList.add('active-view');
                UI.rightPane.scrollTop = 0;
                history.pushState({view: viewName}, null, \`#\${viewName}\`);
            }
            UI.nav.classList.remove('active-mobile');
        }

        function openPost(id) {
            const p = state.posts.find(x => x.id === id);
            if(!p) return;
            
            // Memoize Markdown parsing
            let htmlContent;
            if(markedCache.has(id)) {
                htmlContent = markedCache.get(id);
            } else {
                htmlContent = marked.parse(p.content);
                markedCache.set(id, htmlContent);
            }

            UI.singleContent.innerHTML = \`
                <span class="meta-tag">\${p.tag} // \${p.date}</span>
                <h1 class="article-title">\${p.title}</h1>
                <div class="article-body" style="font-size:1.2rem; line-height:1.8; margin-top:2rem;">
                    \${htmlContent}
                </div>
            \`;
            switchView('single');
        }

        function showToast(msg, type) {
            const c = document.getElementById('toast-container');
            const t = document.createElement('div');
            t.className = \`toast \${type}\`;
            t.innerText = \`> SYSTEM: \${msg}\`;
            c.appendChild(t);
            setTimeout(() => t.remove(), 3500);
        }
        
        function loadLazyImages() {
             const images = document.querySelectorAll('img[data-src]');
             const observer = new IntersectionObserver((entries, obs) => {
                 entries.forEach(entry => {
                     if(entry.isIntersecting) {
                         const img = entry.target;
                         img.src = img.dataset.src;
                         img.onload = () => img.style.opacity = 1;
                         obs.unobserve(img);
                     }
                 });
             });
             images.forEach(img => observer.observe(img));
        }

        // Init
        window.addEventListener('popstate', (e) => {
            if(e.state && e.state.view) switchView(e.state.view);
        });
        init();

      })();
    </script>
  </body>
</html>
`;
