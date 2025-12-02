/**
 * EXXEED BLOG SYSTEM V5
 * Features: Dynamic Timeline, Pagination, Stealth Theme, Mobile Nav
 */

// --- 1. CONFIGURATION & DATA ---

// Edit this list to change your "About" section timeline
const TIMELINE_DATA = [
  {
    year: "2025 - PRESENT",
    title: "Freelance Developer & Creator",
    desc: "Building 'Exceed'. Learning publicly. Mastering the MERN stack.",
  },
  {
    year: "2021 - 2024",
    title: "Philippine Military Academy",
    desc: "Cadet. Learned leadership, resilience, and how to polish shoes until they mirrored the soul.",
  },
  {
    year: "ORIGIN",
    title: "The Spark",
    desc: "Realized that code is the ultimate weapon for creation.",
  },
  // To add more, copy the format above and paste here...
];

const DEFAULT_POSTS = [
  {
    id: "1",
    date: "DEC 01",
    title: "I Finally Did It",
    tag: "LOG_001",
    teaser:
      "Breaking the cycle of perfectionism. The site is live, flaws and all.",
    content:
      "I wasn't able to do everything on my checklist today. The perfectionist wants to scrub the mission and start over. But the developer in me knows better. <br><br> I decided to stop tweaking the CSS framework. It was fighting me. Sometimes you have to strip it all down to the basics.",
  },
  {
    id: "2",
    date: "NOV 29",
    title: "Docker Chaos",
    tag: "LOG_002",
    teaser:
      "Sometimes learning feels like drowning. Today was one of those days.",
    content:
      "I discovered a better Figma alternative today called Penpot. Being open-source, I had to install it using Docker. I spent 4 hours just fighting with containers. <br><br> It felt like a waste of time, but looking back at the logs, I realized I learned more about port forwarding in those 4 hours than I did in the last month of tutorials.",
  },
  {
    id: "3",
    date: "NOV 25",
    title: "Origin Point",
    tag: "LOG_003",
    teaser:
      "Defining the mission parameters before writing a single line of code.",
    content:
      "Every project needs a North Star. For Exceed, it is about discipline in code. No bloat. No frameworks unless necessary. Pure creative control.",
  },
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // --- API ROUTES ---
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

    if (url.pathname === "/api/timeline" && request.method === "GET") {
      return new Response(JSON.stringify(TIMELINE_DATA), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (
      url.pathname === "/api/posts" &&
      (request.method === "POST" || request.method === "PUT")
    ) {
      const auth = request.headers.get("Authorization");
      if (auth !== env.ADMIN_PASS)
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        });

      try {
        const incomingPost = await request.json();
        if (!incomingPost.title || !incomingPost.content)
          return new Response("Invalid Data", { status: 400 });

        let posts =
          (await env.BLOG_KV.get("posts", { type: "json" })) || DEFAULT_POSTS;

        if (request.method === "POST") posts.unshift(incomingPost);
        else {
          const index = posts.findIndex((p) => p.id === incomingPost.id);
          if (index !== -1) posts[index] = incomingPost;
        }

        await env.BLOG_KV.put("posts", JSON.stringify(posts));
        return new Response("Saved", { status: 200 });
      } catch (e) {
        return new Response("Server Error", { status: 500 });
      }
    }

    // --- SERVE HTML ---
    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
      },
    });
  },
};

// --- HTML TEMPLATE ---
const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Exceed Mission Log.">
    <title>EXXEED | The Mission Log</title>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=JetBrains+Mono:wght@400;700&family=Manrope:wght@300;400;700&display=swap" rel="stylesheet" />
    
    <style>
      /* --- THEME --- */
      :root {
        --bg-main: #e0e0e0; --bg-panel: #888888;
        --text-main: #0a0a0a; --text-muted: #111111;
        --accent: #ff3333; --border: #222222;
        --input-bg: rgba(255,255,255,0.1);
        --card-hover: rgba(0,0,0,0.05);
      }
      [data-theme="dark"] {
        --bg-main: #222222; --bg-panel: #282828;
        --text-main: #e6edf3; --text-muted: #8b949e;
        --accent: #00f0ff; --border: #21262d;
        --input-bg: #30363d; --card-hover: rgba(0, 240, 255, 0.05);
      }

      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        background-color: var(--bg-main); color: var(--text-main);
        font-family: "Manrope", sans-serif; height: 100vh; width: 100vw;
        overflow: hidden; display: flex; transition: background 0.5s, color 0.5s;
      }
      
      .noise-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 999; opacity: 0.04;
        background: url('data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noise)" opacity="1"/%3E%3C/svg%3E');
      }

      /* --- LAYOUT --- */
      .left-pane {
        width: 35%; height: 100%; background: var(--bg-panel); border-right: 1px solid var(--border); padding: 4rem;
        display: flex; flex-direction: column; justify-content: space-between; position: relative; transition: background 0.5s;
      }
      .right-pane { width: 65%; height: 100%; overflow-y: auto; position: relative; scroll-behavior: smooth; }

      /* --- NAV --- */
      .nav-dock {
        position: fixed; top: 2rem; right: 2rem; z-index: 100; display: flex; gap: 1.5rem; align-items: center;
        background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(10px); padding: 0.8rem 2rem; 
        border-radius: 50px; border: 1px solid var(--border);
        transition: transform 0.3s ease, opacity 0.3s ease;
      }
      .nav-link {
        color: #ccc; text-decoration: none; font-family: "JetBrains Mono", monospace; font-size: 0.8rem;
        text-transform: uppercase; letter-spacing: 1px; transition: all 0.3s; cursor: pointer; position: relative; display: flex; align-items: center;
      }
      .nav-link:hover, .nav-link.active { color: #fff; text-shadow: 0 0 8px var(--accent); }
      .nav-link.active::after {
        content: ''; position: absolute; bottom: -4px; left: 0; width: 100%; height: 2px; background: var(--accent); box-shadow: 0 0 5px var(--accent);
      }
      
      .mobile-toggle {
        position: fixed; top: 1.5rem; right: 1.5rem; z-index: 101; display: none;
        background: var(--bg-panel); border: 1px solid var(--border); padding: 0.8rem; border-radius: 8px; cursor: pointer;
      }
      .mobile-toggle svg { width: 24px; height: 24px; stroke: var(--text-main); }

      .theme-switch {
        position: fixed; top: 2rem; left: 2rem; z-index: 100;
        background: none; border: none; cursor: pointer; opacity: 0.2; transition: opacity 0.3s, transform 0.3s;
        color: var(--text-main);
      }
      .theme-switch:hover { opacity: 1; transform: rotate(15deg); }
      .theme-switch svg { width: 24px; height: 24px; fill: currentColor; }

      /* --- CONTENT --- */
      .brand-vertical {
        font-family: "Cinzel", serif; font-size: 8rem; line-height: 0.8; color: #fff; opacity: 0.08;
        position: absolute; bottom: -2rem; left: -1rem; z-index: 0; pointer-events: none;
        writing-mode: vertical-rl; transform: rotate(180deg);
      }
      .mission-stat { font-family: "JetBrains Mono", monospace; border-left: 2px solid var(--accent); padding-left: 1rem; margin-bottom: 2rem; }
      .stat-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; }
      .stat-val { font-size: 1.2rem; font-weight: 700; color: #fff; }

      .content-container { padding: 8rem 6rem 4rem 6rem; max-width: 900px; margin: 0 auto; display: none; opacity: 0; animation: fadeIn 0.4s forwards; }
      .content-container.active-view { display: block; }
      @keyframes fadeIn { to { opacity: 1; transform: translateY(0); } }

      h1.article-title { font-family: "Cinzel", serif; font-size: 4rem; line-height: 1.1; margin-bottom: 2rem; }
      .meta-tag { font-family: "JetBrains Mono"; font-size: 0.8rem; color: var(--accent); border: 1px solid var(--accent); padding: 4px 12px; display: inline-block; margin-bottom: 2rem; }

      /* --- TIMELINE (RESTORED DESIGN) --- */
      .dossier-section { margin-top: 6rem; padding-top: 4rem; border-top: 2px solid var(--border); }
      
      .timeline-container { position: relative; }
      
      .timeline-item {
        border-left: 1px solid var(--border); /* The line */
        padding-left: 2rem;
        padding-bottom: 3rem;
        position: relative;
        transition: opacity 0.3s;
      }
      /* The Dot */
      .timeline-item::before {
        content: "";
        position: absolute;
        left: -5px; /* Centers dot on 1px border */
        top: 5px;
        width: 9px;
        height: 9px;
        background: var(--bg-main);
        border: 2px solid var(--accent);
        border-radius: 50%;
        transition: background 0.3s, box-shadow 0.3s;
      }
      .timeline-item:hover::before {
        background: var(--accent);
        box-shadow: 0 0 10px var(--accent);
      }
      .timeline-year {
        font-family: "JetBrains Mono";
        color: var(--accent);
        margin-bottom: 0.5rem;
        display: block;
        font-weight: bold;
      }
      .timeline-title {
        font-size: 1.5rem; margin-bottom: 0.5rem; font-family: "Manrope"; font-weight: 700;
      }
      .timeline-desc {
        color: var(--text-muted); font-size: 1.1rem; line-height: 1.6;
      }

      /* --- POSTS --- */
      .post-item { 
        border-bottom: 1px solid var(--border); padding: 1.5rem; margin-bottom: 1.5rem; cursor: pointer; 
        transition: all 0.3s; border-radius: 4px; position: relative;
      }
      .post-item:hover { background: var(--card-hover); transform: translateX(10px); border-left: 2px solid var(--accent); }
      .post-meta { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
      .post-tag { font-family: 'JetBrains Mono'; color: var(--accent); }
      .post-date { font-family: 'JetBrains Mono'; color: var(--text-muted); opacity: 0.7; }
      .post-title { font-size: 1.8rem; margin-bottom: 0.8rem; font-weight: 700; }
      .post-teaser { color: var(--text-muted); font-size: 1rem; line-height: 1.5; }

      .see-more-btn {
        display: block; width: 100%; padding: 1rem; margin-top: 2rem;
        background: transparent; border: 1px solid var(--border); color: var(--text-muted);
        font-family: "JetBrains Mono"; cursor: pointer; text-transform: uppercase; transition: all 0.3s;
      }
      .see-more-btn:hover { background: var(--accent); color: #000; border-color: var(--accent); }

      /* Search & Admin */
      .search-wrapper { position: relative; margin-bottom: 2rem; }
      .search-input {
        width: 100%; background: var(--input-bg); border: 1px solid var(--border); color: var(--text-main);
        padding: 1rem 1rem 1rem 3rem; font-family: "JetBrains Mono"; font-size: 1rem; outline: none; transition: border-color 0.3s;
      }
      .search-input:focus { border-color: var(--accent); }
      .search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); }

      .admin-form input, .admin-form textarea {
        width: 100%; background: var(--input-bg); border: 1px solid var(--border); padding: 1rem; margin-bottom: 1rem;
        color: var(--text-main); font-family: "JetBrains Mono"; outline: none;
      }
      .btn { background: var(--accent); color: #000; border: none; padding: 1rem 2rem; font-family: "JetBrains Mono"; cursor: pointer; font-weight: bold; margin-right: 1rem; transition: transform 0.2s; }
      .btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.3); }

      .admin-list-item { 
          display: flex; justify-content: space-between; align-items: center; 
          padding: 1rem; border: 1px solid var(--border); margin-bottom: 0.5rem; 
          background: var(--input-bg); transition: transform 0.2s;
      }
      .admin-list-item:hover { transform: scale(1.01); border-color: var(--accent); }

      /* --- RESPONSIVE --- */
      @media (max-width: 900px) {
        body { flex-direction: column; overflow-y: auto; height: auto; }
        .left-pane { width: 100%; padding: 2rem; border-bottom: 1px solid var(--border); height: auto; }
        .right-pane { width: 100%; overflow: visible; }
        .content-container { padding: 4rem 2rem; }
        .brand-vertical { display: none; }
        
        .mobile-toggle { display: block; }
        .nav-dock { 
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            flex-direction: column; justify-content: center; background: rgba(0,0,0,0.95);
            border-radius: 0; opacity: 0; pointer-events: none; transform: translateY(-20px);
        }
        .nav-dock.active-mobile { opacity: 1; pointer-events: all; transform: translateY(0); }
        .nav-link { font-size: 1.5rem; margin-bottom: 2rem; }
        .theme-switch { top: 1.5rem; left: 1.5rem; opacity: 1; }
      }
    </style>
  </head>
  <body>
    <div class="noise-overlay"></div>

    <button class="theme-switch" onclick="toggleTheme()" aria-label="Toggle Theme">
        <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
    </button>
    
    <button class="mobile-toggle" onclick="toggleMobileNav()" aria-label="Menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
    </button>

    <nav class="nav-dock" id="mainNav">
      <a class="nav-link active" onclick="switchView('home')">Log</a>
      <a class="nav-link" onclick="switchView('archive')">Archive</a>
      <a class="nav-link" onclick="switchView('admin')" aria-label="Admin Access">
         <svg style="width:18px; height:18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
      </a>
    </nav>

    <aside class="left-pane">
        <div style="margin-top: auto;">
            <div class="mission-stat"><div class="stat-label">OPERATOR</div><div class="stat-val">EXXEED</div></div>
            <div class="mission-stat"><div class="stat-label">CURRENT OBJ</div><div class="stat-val">BUILD IN PUBLIC</div></div>
            <div class="mission-stat"><div class="stat-label">STATUS</div><div class="stat-val" style="color: #4caf50;">ONLINE</div></div>
        </div>
        <div class="brand-vertical">EXXEED</div>
    </aside>

    <main class="right-pane" id="rightPane">
      
      <!-- VIEW 1: HOME -->
      <div id="view-home" class="content-container active-view">
        <span class="meta-tag">MISSION LOG // LATEST</span>
        <h1 class="article-title">The Journey <br />So Far.</h1>
        <div id="home-posts" style="margin-top: 4rem;">Loading...</div>
        
        <div class="dossier-section">
            <h2 class="article-title" style="font-size: 2.5rem;">About EXXEED</h2>
            <p style="font-size: 1.2rem; line-height: 1.6; margin-bottom: 3rem; color: var(--text-muted);">
              Former PMA Cadet turned Full-Stack Developer. I traded a rifle for a keyboard, but kept the discipline.
            </p>
            
            <!-- Dynamic Timeline -->
            <div id="timeline-container" class="timeline-container">
                <!-- Timeline items injected via JS -->
            </div>
            <button id="timeline-more" class="see-more-btn" style="display:none" onclick="loadMoreTimeline()">See More Experience [ + ]</button>
        </div>
      </div>

      <!-- VIEW 2: ARCHIVE -->
      <div id="view-archive" class="content-container">
        <span class="meta-tag">FULL DATABASE</span>
        <h1 class="article-title">All Logs.</h1>
        <div class="search-wrapper">
             <span class="search-icon">></span>
             <input type="text" class="search-input" placeholder="Search parameters..." onkeyup="filterList(this.value, 'archive')">
        </div>
        <div id="archive-posts"></div>
        <button id="archive-more" class="see-more-btn" style="display:none" onclick="loadMore('archive')">See More [ + ]</button>
      </div>

      <!-- VIEW 3: SINGLE -->
      <div id="view-single" class="content-container">
        <a class="back-btn" onclick="switchView('home')"><< RETURN</a>
        <div id="single-post-content"></div>
      </div>

      <!-- VIEW 4: ADMIN -->
      <div id="view-admin" class="content-container">
        <span class="meta-tag">RESTRICTED ACCESS</span>
        <h1 class="article-title" id="admin-header">New Entry</h1>
        
        <div class="admin-form">
            <input type="hidden" id="post-id"> 
            <input type="password" id="admin-pass" placeholder="Enter Access Code">
            <input type="text" id="post-title" placeholder="Mission Title">
            <div style="display: flex; gap: 1rem;">
                <input type="text" id="post-tag" placeholder="ID (LOG_005)" style="flex:1">
                <input type="text" id="post-date" placeholder="Date (DEC 05)" style="flex:1">
            </div>
            <input type="text" id="post-teaser" placeholder="Teaser">
            <textarea id="post-content" placeholder="Content (HTML Allowed)"></textarea>
            
            <button class="btn" onclick="submitPost()" id="submit-btn">Submit Log</button>
            <button class="btn" style="background:#555; color:#fff;" onclick="resetForm()">Clear</button>
        </div>

        <div style="margin-top: 4rem; border-top: 1px solid var(--border); padding-top: 2rem;">
            <h3 style="font-family: 'Cinzel'; margin-bottom: 1rem;">Manage Logs</h3>
            <div class="search-wrapper">
                 <span class="search-icon">></span>
                 <input type="text" class="search-input" placeholder="Search database..." onkeyup="filterList(this.value, 'admin')">
            </div>
            <div id="admin-post-list"></div>
            <button id="admin-more" class="see-more-btn" style="display:none" onclick="loadMore('admin')">See More [ + ]</button>
        </div>
      </div>

    </main>

    <script>
      let allPosts = [];
      let timelineData = []; // Will be fetched from internal API or uses default
      let limits = { archive: 5, admin: 5, timeline: 2 }; // Start timeline with 2 items
      
      let filteredPosts = [];

      // --- THEME ---
      function initTheme() {
        const s = localStorage.getItem('theme');
        if(s === 'dark' || (!s && window.matchMedia('(prefers-color-scheme: dark)').matches)) 
            document.documentElement.setAttribute('data-theme', 'dark');
      }
      function toggleTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if(isDark) { document.documentElement.removeAttribute('data-theme'); localStorage.setItem('theme', 'light'); }
        else { document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem('theme', 'dark'); }
      }
      initTheme();

      function toggleMobileNav() { document.getElementById('mainNav').classList.toggle('active-mobile'); }

      // --- DATA FETCH ---
      async function fetchData() {
        try {
          // Get Posts
          const resPosts = await fetch('/api/posts');
          allPosts = await resPosts.json();
          filteredPosts = [...allPosts];
          
          // Get Timeline
          const resTime = await fetch('/api/timeline');
          timelineData = await resTime.json();

          renderViews();
        } catch (e) { console.error("Error", e); }
      }

      // --- RENDERING ---
      function renderViews() {
        // 1. Home Posts (Top 3)
        const homeDiv = document.getElementById('home-posts');
        homeDiv.innerHTML = '';
        allPosts.slice(0, 3).forEach(p => homeDiv.appendChild(createPostHTML(p)));

        // 2. Timeline
        renderTimeline();

        // 3. Lists
        renderList('archive');
        renderList('admin');
      }

      function renderTimeline() {
        const container = document.getElementById('timeline-container');
        const btn = document.getElementById('timeline-more');
        container.innerHTML = '';
        
        const visible = timelineData.slice(0, limits.timeline);
        
        visible.forEach(item => {
            const div = document.createElement('div');
            div.className = 'timeline-item';
            div.innerHTML = \`
                <span class="timeline-year">\${item.year}</span>
                <h3 class="timeline-title">\${item.title}</h3>
                <p class="timeline-desc">\${item.desc}</p>
            \`;
            container.appendChild(div);
        });

        if(timelineData.length > limits.timeline) btn.style.display = 'block';
        else btn.style.display = 'none';
      }

      function loadMoreTimeline() {
        limits.timeline += 5; // Show 5 more
        renderTimeline();
      }

      function renderList(type) {
         const container = document.getElementById(type === 'archive' ? 'archive-posts' : 'admin-post-list');
         const btn = document.getElementById(type === 'archive' ? 'archive-more' : 'admin-more');
         container.innerHTML = '';
         
         const limit = limits[type];
         const visible = filteredPosts.slice(0, limit);
         
         visible.forEach(p => {
            if(type === 'archive') container.appendChild(createPostHTML(p));
            else {
                const div = document.createElement('div');
                div.className = 'admin-list-item';
                div.innerHTML = \`<span style="font-family:'JetBrains Mono'">\${p.tag} - \${p.title}</span><span style="cursor:pointer; text-decoration:underline" onclick="loadIntoForm('\${p.id}')">[EDIT]</span>\`;
                container.appendChild(div);
            }
         });

         if(filteredPosts.length > limit) btn.style.display = 'block';
         else btn.style.display = 'none';
      }

      function loadMore(type) {
         limits[type] += 5;
         renderList(type);
      }

      function filterList(query, type) {
         const q = query.toLowerCase();
         filteredPosts = allPosts.filter(p => 
            p.title.toLowerCase().includes(q) || p.tag.toLowerCase().includes(q)
         );
         limits[type] = 5; 
         renderList(type);
      }

      function createPostHTML(post) {
        const div = document.createElement('div');
        div.className = 'post-item';
        div.onclick = () => openPost(post.id);
        div.innerHTML = \`
            <div class="post-meta"><span class="post-tag">\${post.tag}</span><span class="post-date">\${post.date}</span></div>
            <h2 class="post-title">\${post.title}</h2>
            <p class="post-teaser">\${post.teaser}</p>
        \`;
        return div;
      }

      function switchView(view) {
        document.getElementById('mainNav').classList.remove('active-mobile');
        document.querySelectorAll(".nav-link").forEach(el => el.classList.remove("active"));
        const links = document.querySelectorAll(".nav-link");
        if (view === 'home') links[0].classList.add("active");
        if (view === 'archive') links[1].classList.add("active");
        if (view === 'admin') links[2].classList.add("active");

        document.querySelectorAll(".content-container").forEach(el => el.classList.remove("active-view"));
        if(view === 'single') document.getElementById('view-single').classList.add('active-view');
        else if (view === 'admin') document.getElementById('view-admin').classList.add('active-view');
        else if (view === 'archive') document.getElementById('view-archive').classList.add('active-view');
        else document.getElementById('view-home').classList.add('active-view');

        document.getElementById("rightPane").scrollTop = 0;
      }

      function openPost(id) {
        const p = allPosts.find(x => x.id === id);
        if(!p) return;
        document.getElementById('single-post-content').innerHTML = \`
            <span class="meta-tag">STATUS: ARCHIVED</span>
            <h1 class="article-title">\${p.title}</h1>
            <div class="article-body"><p>\${p.content}</p></div>
        \`;
        switchView('single');
      }

      // --- ADMIN ---
      function resetForm() {
        document.getElementById('post-id').value = '';
        document.getElementById('post-title').value = '';
        document.getElementById('post-tag').value = '';
        document.getElementById('post-date').value = '';
        document.getElementById('post-teaser').value = '';
        document.getElementById('post-content').value = '';
        document.getElementById('admin-header').innerText = "New Entry";
        document.getElementById('submit-btn').innerText = "Submit Log";
      }

      function loadIntoForm(id) {
        const p = allPosts.find(x => x.id === id);
        if(!p) return;
        document.getElementById('post-id').value = p.id;
        document.getElementById('post-title').value = p.title;
        document.getElementById('post-tag').value = p.tag;
        document.getElementById('post-date').value = p.date;
        document.getElementById('post-teaser').value = p.teaser;
        document.getElementById('post-content').value = p.content;
        document.getElementById('admin-header').innerText = "Edit: " + p.tag;
        document.getElementById('submit-btn').innerText = "Update";
        document.getElementById("rightPane").scrollTop = 0;
      }

      async function submitPost() {
        const pass = document.getElementById('admin-pass').value;
        const id = document.getElementById('post-id').value; 
        const title = document.getElementById('post-title').value;
        const tag = document.getElementById('post-tag').value;
        const date = document.getElementById('post-date').value;
        const teaser = document.getElementById('post-teaser').value;
        const content = document.getElementById('post-content').value;

        if(!pass || !title) { alert("Missing Data"); return; }
        const method = id ? 'PUT' : 'POST';
        const payload = { id: id || Date.now().toString(), title, tag, date, teaser, content };

        try {
            const res = await fetch('/api/posts', {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': pass },
                body: JSON.stringify(payload)
            });
            if(res.status === 200 || res.status === 201) {
                alert("Success");
                resetForm();
                await fetchData();
                if(method === 'POST') switchView('home'); 
            } else { alert("Auth Failed"); }
        } catch (e) { alert("Error"); }
      }

      fetchData();
    </script>
  </body>
</html>
`;
