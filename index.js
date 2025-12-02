/**
 * EXXEED BLOG SYSTEM V3
 * Features: Theming, Search, Security, SEO, Optimizations
 */

// Default data for fresh databases
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

    // --- API: GET POSTS ---
    if (url.pathname === "/api/posts" && request.method === "GET") {
      // Cache Control for speed (cache for 60 seconds)
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

    // --- API: CREATE/UPDATE POST (Secure) ---
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
        const incomingPost = await request.json();

        // Basic Server-Side Validation
        if (!incomingPost.title || !incomingPost.content) {
          return new Response("Invalid Data", { status: 400 });
        }

        let posts =
          (await env.BLOG_KV.get("posts", { type: "json" })) || DEFAULT_POSTS;

        if (request.method === "POST") {
          posts.unshift(incomingPost);
        } else {
          const index = posts.findIndex((p) => p.id === incomingPost.id);
          if (index !== -1) posts[index] = incomingPost;
        }

        await env.BLOG_KV.put("posts", JSON.stringify(posts));
        return new Response("Saved", { status: 200 });
      } catch (e) {
        return new Response("Server Error", { status: 500 });
      }
    }

    // --- FRONTEND SERVING ---
    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
        "X-Frame-Options": "DENY", // Security Header
        "X-Content-Type-Options": "nosniff", // Security Header
      },
    });
  },
};

// --- HTML/CSS/JS TEMPLATE ---
const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Exceed Mission Log. A developer journey building in public.">
    <meta name="theme-color" content="#222222">
    <title>EXXEED | The Mission Log</title>
    
    <!-- Preconnect for Speed -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=JetBrains+Mono:wght@400;700&family=Manrope:wght@300;400;700&display=swap" rel="stylesheet" />
    
    <style>
      /* --- THEME ENGINE --- */
      :root {
        /* Default (Light/Military) */
        --bg-main: #e0e0e0;
        --bg-panel: #888888;
        --text-main: #0a0a0a;
        --text-muted: #111111;
        --accent: #ff3333;
        --border: #222222;
        --input-bg: rgba(255,255,255,0.1);
        --card-hover: rgba(0,0,0,0.05);
      }

      [data-theme="dark"] {
        /* User Requested (Cyber/Dark) */
        --bg-main: #222222;
        --bg-panel: #282828;
        --text-main: #e6edf3;
        --text-muted: #8b949e;
        --accent: #00f0ff;
        --border: #21262d;
        --input-bg: #30363d;
        --card-hover: rgba(0, 240, 255, 0.05);
      }

      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body {
        background-color: var(--bg-main);
        color: var(--text-main);
        font-family: "Manrope", sans-serif;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
        display: flex;
        transition: background-color 0.5s ease, color 0.5s ease;
      }

      /* Noise Overlay (Optimized) */
      .noise-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 999; opacity: 0.04;
        background: url('data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noise)" opacity="1"/%3E%3C/svg%3E');
      }

      /* --- LAYOUT --- */
      .left-pane {
        width: 35%; height: 100%; 
        background: var(--bg-panel); 
        border-right: 1px solid var(--border); 
        padding: 4rem;
        display: flex; flex-direction: column; justify-content: space-between; position: relative;
        transition: background 0.5s ease;
      }
      .right-pane { width: 65%; height: 100%; overflow-y: auto; position: relative; scroll-behavior: smooth; }

      /* --- NAV & CONTROLS --- */
      .nav-dock {
        position: fixed; top: 2rem; right: 2rem; z-index: 100; display: flex; gap: 1.5rem; align-items: center;
        background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(10px); padding: 0.8rem 2rem; border-radius: 50px; border: 1px solid var(--border);
      }
      .nav-link {
        color: #ccc; text-decoration: none; font-family: "JetBrains Mono", monospace; font-size: 0.8rem;
        text-transform: uppercase; letter-spacing: 1px; transition: all 0.3s; cursor: pointer; position: relative;
      }
      .nav-link:hover, .nav-link.active { color: #fff; text-shadow: 0 0 8px var(--accent); }
      .nav-link.active::after {
        content: ''; position: absolute; bottom: -4px; left: 0; width: 100%; height: 2px; background: var(--accent);
        box-shadow: 0 0 5px var(--accent);
      }

      /* Theme Toggle */
      .theme-btn {
        background: none; border: 1px solid #555; color: #fff; padding: 4px 10px; border-radius: 4px;
        cursor: pointer; font-family: "JetBrains Mono"; font-size: 0.7rem; text-transform: uppercase;
        transition: all 0.3s;
      }
      .theme-btn:hover { border-color: var(--accent); color: var(--accent); box-shadow: 0 0 8px var(--accent); }

      /* --- BRANDING --- */
      .brand-vertical {
        font-family: "Cinzel", serif; font-size: 8rem; line-height: 0.8; color: #fff; opacity: 0.08;
        position: absolute; bottom: -2rem; left: -1rem; z-index: 0; pointer-events: none;
        writing-mode: vertical-rl; transform: rotate(180deg);
      }
      .mission-stat { 
        font-family: "JetBrains Mono", monospace; border-left: 2px solid var(--accent); padding-left: 1rem; margin-bottom: 2rem; 
        transition: border-color 0.5s;
      }
      .stat-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; }
      .stat-val { font-size: 1.2rem; font-weight: 700; color: #fff; text-shadow: 0 0 10px rgba(0,0,0,0.5); }

      /* --- CONTENT AREAS --- */
      .content-container { padding: 8rem 6rem 4rem 6rem; max-width: 900px; margin: 0 auto; display: none; opacity: 0; animation: fadeIn 0.4s forwards; }
      .content-container.active-view { display: block; }
      @keyframes fadeIn { to { opacity: 1; transform: translateY(0); } }

      h1.article-title { font-family: "Cinzel", serif; font-size: 4rem; line-height: 1.1; margin-bottom: 2rem; }
      .meta-tag { 
        font-family: "JetBrains Mono", monospace; font-size: 0.8rem; color: var(--accent); 
        border: 1px solid var(--accent); padding: 4px 12px; display: inline-block; margin-bottom: 2rem;
        box-shadow: 0 0 5px transparent; transition: all 0.3s;
      }
      .meta-tag:hover { box-shadow: 0 0 10px var(--accent); background: var(--accent); color: #000; }

      /* --- POST ITEMS (Hover & FX) --- */
      .post-item { 
        border-bottom: 1px solid var(--border); padding: 1.5rem; margin-bottom: 1.5rem; cursor: pointer; 
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 4px;
        position: relative; overflow: hidden;
      }
      .post-item:hover { 
        background: var(--card-hover); 
        transform: translateX(10px); 
        border-left: 2px solid var(--accent);
      }
      .post-meta { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
      .post-tag { font-family: 'JetBrains Mono'; color: var(--accent); }
      .post-date { font-family: 'JetBrains Mono'; color: var(--text-muted); opacity: 0.7; }
      .post-title { font-size: 1.8rem; margin-bottom: 0.8rem; font-weight: 700; }
      .post-teaser { color: var(--text-muted); font-size: 1rem; line-height: 1.5; }

      /* Search Bar */
      .search-wrapper { position: relative; margin-bottom: 2rem; }
      .search-input {
        width: 100%; background: var(--input-bg); border: 1px solid var(--border); color: var(--text-main);
        padding: 1rem 1rem 1rem 3rem; font-family: "JetBrains Mono"; font-size: 1rem; outline: none;
        transition: border-color 0.3s;
      }
      .search-input:focus { border-color: var(--accent); box-shadow: 0 0 8px var(--accent); }
      .search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); }

      /* Single Post */
      .article-body p { font-size: 1.15rem; line-height: 1.8; color: var(--text-muted); margin-bottom: 2rem; }
      .back-btn { 
        font-family: "JetBrains Mono"; cursor: pointer; color: var(--accent); margin-bottom: 2rem; display: inline-block; 
        transition: transform 0.2s;
      }
      .back-btn:hover { transform: translateX(-5px); text-decoration: underline; }

      /* Dossier */
      .dossier-section { margin-top: 6rem; padding-top: 4rem; border-top: 2px solid var(--border); }
      .timeline-item { border-left: 1px solid var(--border); padding-left: 2rem; padding-bottom: 3rem; position: relative; }
      .timeline-item::before { 
        content: ""; position: absolute; left: -5px; top: 5px; width: 9px; height: 9px; 
        background: var(--bg-main); border: 2px solid var(--accent); border-radius: 50%; 
        transition: background 0.3s;
      }
      .timeline-item:hover::before { background: var(--accent); box-shadow: 0 0 10px var(--accent); }
      .timeline-year { font-family: "JetBrains Mono"; color: var(--accent); margin-bottom: 0.5rem; display: block; }

      /* Admin */
      .admin-form input, .admin-form textarea {
        width: 100%; background: var(--input-bg); border: 1px solid var(--border); padding: 1rem; margin-bottom: 1rem;
        color: var(--text-main); font-family: "JetBrains Mono"; font-size: 1rem; outline: none; transition: all 0.3s;
      }
      .admin-form input:focus, .admin-form textarea:focus { border-color: var(--accent); }
      .admin-form textarea { min-height: 200px; resize: vertical; }
      
      .btn { 
        background: var(--accent); color: #000; border: none; padding: 1rem 2rem; 
        font-family: "JetBrains Mono"; cursor: pointer; text-transform: uppercase; font-weight: bold; margin-right: 1rem;
        transition: all 0.2s; box-shadow: 0 0 0 transparent;
      }
      .btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.3); color: #fff; background: #000; border: 1px solid var(--accent); }
      .btn-secondary { background: var(--bg-panel); color: #fff; border: 1px solid var(--border); }
      .btn-secondary:hover { background: #444; }
      
      .admin-list-item { 
          display: flex; justify-content: space-between; align-items: center; 
          padding: 1rem; border: 1px solid var(--border); margin-bottom: 0.5rem; 
          background: var(--input-bg); transition: transform 0.2s;
      }
      .admin-list-item:hover { transform: scale(1.01); border-color: var(--accent); }
      .edit-tag { font-family: "JetBrains Mono"; font-size: 0.8rem; color: var(--accent); cursor: pointer; text-decoration: underline; }

      /* Loading Animation */
      .loader {
        display: inline-block; width: 10px; height: 10px; background: var(--accent);
        animation: pulse 1s infinite; margin-right: 10px;
      }
      @keyframes pulse { 0% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0.2; transform: scale(0.8); } }

      /* Responsive */
      @media (max-width: 900px) {
        body { flex-direction: column; overflow-y: auto; height: auto; }
        .left-pane { width: 100%; padding: 2rem; border-bottom: 1px solid var(--border); height: auto; }
        .right-pane { width: 100%; overflow: visible; }
        .content-container { padding: 4rem 2rem; }
        .brand-vertical { display: none; }
        .nav-dock { width: 100%; top: auto; bottom: 0; right: 0; left: 0; border-radius: 0; justify-content: space-around; background: #000; border-top: 1px solid var(--border); }
      }
    </style>
  </head>
  <body>
    <div class="noise-overlay"></div>

    <nav class="nav-dock">
      <a class="nav-link active" onclick="switchView('home')" aria-label="Home">Log</a>
      <a class="nav-link" onclick="switchView('archive')" aria-label="Archive">Archive</a>
      <a class="nav-link" onclick="switchView('admin')" aria-label="Admin">Admin</a>
      <button class="theme-btn" onclick="toggleTheme()" aria-label="Toggle Theme">Theme</button>
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
        
        <div id="home-posts" style="margin-top: 4rem;">
            <div style="font-family:'JetBrains Mono'; color: var(--text-muted);"><span class="loader"></span>INITIALIZING DATA...</div>
        </div>

        <div class="dossier-section">
            <h2 class="article-title" style="font-size: 2.5rem;">The Dossier.</h2>
            <p style="font-size: 1.2rem; line-height: 1.6; margin-bottom: 3rem; color: var(--text-muted);">
              Former PMA Cadet turned Full-Stack Developer. I traded a rifle for a keyboard, but kept the discipline.
            </p>
            <div class="timeline">
              <div class="timeline-item"><span class="timeline-year">2025 - PRESENT</span><h3>Freelance Developer</h3><p style="color: var(--text-muted); margin-top: 0.5rem">Building "Exceed." Mastering MERN.</p></div>
              <div class="timeline-item"><span class="timeline-year">2021 - 2024</span><h3>PMA Cadet</h3><p style="color: var(--text-muted); margin-top: 0.5rem">Leadership, resilience, and attention to detail.</p></div>
            </div>
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
      </div>

      <!-- VIEW 3: SINGLE POST -->
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
            <button class="btn btn-secondary" onclick="resetForm()">Clear</button>
        </div>

        <div style="margin-top: 4rem; border-top: 1px solid var(--border); padding-top: 2rem;">
            <h3 style="font-family: 'Cinzel'; margin-bottom: 1rem;">Manage Logs</h3>
            <div class="search-wrapper">
                 <span class="search-icon">></span>
                 <input type="text" class="search-input" placeholder="Search database..." onkeyup="filterList(this.value, 'admin')">
            </div>
            <div id="admin-post-list"></div>
        </div>
      </div>

    </main>

    <script>
      let allPosts = [];

      // --- 1. THEME ENGINE ---
      function initTheme() {
        const saved = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (saved === 'dark' || (!saved && prefersDark)) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
      }
      
      function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        if (current === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
      }
      initTheme();

      // --- 2. DATA HANDLING ---
      async function fetchPosts() {
        try {
          const res = await fetch('/api/posts');
          allPosts = await res.json();
          renderViews(allPosts);
        } catch (e) { console.error("Comms failed", e); }
      }

      function sanitize(str) {
         // Basic XSS prevention (Allows basic HTML, blocks scripts)
         const temp = document.createElement('div');
         temp.innerHTML = str;
         const scripts = temp.getElementsByTagName('script');
         for (let i = scripts.length - 1; i >= 0; i--) {
            scripts[i].parentNode.removeChild(scripts[i]);
         }
         return temp.innerHTML;
      }

      // --- 3. RENDERING ---
      function renderViews(posts) {
        // Home (Top 3)
        const homeContainer = document.getElementById('home-posts');
        homeContainer.innerHTML = '';
        posts.slice(0, 3).forEach(post => homeContainer.appendChild(createPostHTML(post)));

        // Archive (All)
        renderList(posts, 'archive');

        // Admin (All)
        renderList(posts, 'admin');
      }

      function createPostHTML(post) {
        const item = document.createElement('div');
        item.className = 'post-item';
        item.onclick = () => openPost(post.id);
        item.innerHTML = \`
            <div class="post-meta">
              <span class="post-tag">\${sanitize(post.tag)}</span>
              <span class="post-date">\${sanitize(post.date)}</span>
            </div>
            <h2 class="post-title">\${sanitize(post.title)}</h2>
            <p class="post-teaser">\${sanitize(post.teaser)}</p>
        \`;
        return item;
      }

      // --- 4. SEARCH FUNCTION ---
      function filterList(query, type) {
        const lowerQ = query.toLowerCase();
        const filtered = allPosts.filter(p => 
            p.title.toLowerCase().includes(lowerQ) || 
            p.tag.toLowerCase().includes(lowerQ) || 
            p.content.toLowerCase().includes(lowerQ)
        );
        renderList(filtered, type);
      }

      function renderList(posts, type) {
         if(type === 'archive') {
             const container = document.getElementById('archive-posts');
             container.innerHTML = '';
             posts.forEach(post => container.appendChild(createPostHTML(post)));
             if(posts.length === 0) container.innerHTML = '<p style="font-family:JetBrains Mono; color:var(--text-muted)">NO MATCHES FOUND</p>';
         }
         
         if(type === 'admin') {
             const container = document.getElementById('admin-post-list');
             container.innerHTML = '';
             posts.forEach(post => {
                const div = document.createElement('div');
                div.className = 'admin-list-item';
                div.innerHTML = \`
                    <span style="font-family: 'JetBrains Mono';">\${sanitize(post.tag)} - \${sanitize(post.title)}</span>
                    <span class="edit-tag" onclick="loadIntoForm('\${post.id}')">[EDIT]</span>
                \`;
                container.appendChild(div);
            });
         }
      }

      // --- 5. NAVIGATION ---
      function switchView(viewName) {
        document.querySelectorAll(".nav-link").forEach(el => el.classList.remove("active"));
        const links = document.querySelectorAll(".nav-link");
        
        if (viewName === 'home') links[0].classList.add("active");
        if (viewName === 'archive') links[1].classList.add("active");
        if (viewName === 'admin') links[2].classList.add("active");

        document.querySelectorAll(".content-container").forEach(el => el.classList.remove("active-view"));
        
        if(viewName === 'single') document.getElementById('view-single').classList.add('active-view');
        else if (viewName === 'admin') document.getElementById('view-admin').classList.add('active-view');
        else if (viewName === 'archive') document.getElementById('view-archive').classList.add('active-view');
        else document.getElementById('view-home').classList.add('active-view');

        document.getElementById("rightPane").scrollTop = 0;
      }

      function openPost(id) {
        const post = allPosts.find(p => p.id === id);
        if(!post) return;
        document.getElementById('single-post-content').innerHTML = \`
            <span class="meta-tag">STATUS: ARCHIVED</span>
            <h1 class="article-title">\${sanitize(post.title)}</h1>
            <div class="article-body">
                <p><span style="font-family: 'Cinzel'; font-size: 3rem; float: left; line-height: 0.8; margin-right: 1rem; color: var(--accent);">\${post.content.charAt(0)}</span>\${sanitize(post.content.substring(1))}</p>
            </div>
        \`;
        switchView('single');
      }

      // --- 6. ADMIN CMS ---
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
        const post = allPosts.find(p => p.id === id);
        if(!post) return;
        document.getElementById('post-id').value = post.id;
        document.getElementById('post-title').value = post.title;
        document.getElementById('post-tag').value = post.tag;
        document.getElementById('post-date').value = post.date;
        document.getElementById('post-teaser').value = post.teaser;
        document.getElementById('post-content').value = post.content;
        document.getElementById('admin-header').innerText = "Edit: " + post.tag;
        document.getElementById('submit-btn').innerText = "Update Log";
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
                alert("Operation Successful");
                resetForm();
                await fetchPosts();
                if(method === 'POST') switchView('home'); 
            } else {
                alert("Access Denied");
            }
        } catch (e) { alert("Error"); }
      }

      // Initialize
      fetchPosts();
    </script>
  </body>
</html>
`;
