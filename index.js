/**
 * EXXEED BLOG SYSTEM V9
 * Features: Custom Toast Notifications, A11y, History API, Custom Favicon
 */

// --- 1. DATA ---
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
    desc: "Cadet. Warshocked into a military way of life, polished shoes until they mirrored the soul. (Got injured then was discharged)",
  },
  {
    year: "2018-2021",
    title: "The Valley of Confusion",
    desc: "College at Ateneo De Naga, jumped from one course to another.",
  },
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

    // API: GET POSTS
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

    // API: GET TIMELINE
    if (url.pathname === "/api/timeline" && request.method === "GET") {
      return new Response(JSON.stringify(TIMELINE_DATA), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // API: SAVE POST
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

    // SERVE HTML
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
    
    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=JetBrains+Mono:wght@400;700&family=Manrope:wght@300;400;700&family=Major+Mono+Display&display=swap" rel="stylesheet" />
    
    <!-- Custom Favicon -->
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cstyle%3E text %7B font-family: monospace; font-weight: bold; fill: %23ff3333; font-size: 80px; %7D %3C/style%3E%3Ctext x='50' y='75' text-anchor='middle'%3EX%3C/text%3E%3C/svg%3E">

    <style>
      /* --- THEME --- */
      :root {
        --bg-main: #e0e0e0; --bg-panel: #888888;
        --text-main: #0a0a0a; --text-muted: #111111;
        --accent: #ff3333; --border: #222222;
        --input-bg: rgba(255,255,255,0.1);
        --card-hover: rgba(0,0,0,0.05); 
        --logo-x: #00f0ff;
        --focus-ring: #ff3333;
        --toast-bg: rgba(0,0,0,0.9);
      }
      [data-theme="dark"] {
        --bg-main: #222222; --bg-panel: #282828;
        --text-main: #e6edf3; --text-muted: #8b949e;
        --accent: #00f0ff; --border: #21262d;
        --input-bg: #30363d; --card-hover: rgba(0, 240, 255, 0.05);
        --focus-ring: #00f0ff;
        --toast-bg: rgba(255,255,255,0.9);
      }

      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      /* Accessibility Focus Styles */
      :focus-visible {
        outline: 3px solid var(--focus-ring);
        outline-offset: 2px;
      }

      body {
        background-color: var(--bg-main); color: var(--text-main);
        font-family: "Manrope", sans-serif; height: 100vh; width: 100vw;
        overflow: hidden; display: flex; transition: background 0.5s, color 0.5s;
      }
      
      .noise-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 999; opacity: 0.04;
        background: url('data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noise)" opacity="1"/%3E%3C/svg%3E');
      }

      /* --- TOAST NOTIFICATIONS (CUSTOM ALERTS) --- */
      #toast-container {
          position: fixed; bottom: 2rem; right: 2rem; z-index: 2000;
          display: flex; flex-direction: column; gap: 0.8rem; pointer-events: none;
      }
      .toast {
          background: #1a1a1a;
          color: #fff;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.9rem;
          padding: 1rem 1.5rem;
          border-left: 4px solid var(--accent);
          box-shadow: 0 5px 15px rgba(0,0,0,0.5);
          min-width: 250px;
          opacity: 0;
          transform: translateY(20px);
          animation: slideUpFade 0.3s forwards;
          pointer-events: all;
          display: flex; align-items: center;
      }
      [data-theme="dark"] .toast { background: #000; border: 1px solid #333; border-left: 4px solid var(--accent); }
      
      .toast.success { border-left-color: #4caf50; }
      .toast.error { border-left-color: #ff3333; }
      
      @keyframes slideUpFade {
          to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeOut {
          to { opacity: 0; transform: translateX(20px); }
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
        border: none; background: none;
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
      .theme-switch:hover, .theme-switch:focus { opacity: 1; transform: rotate(15deg); }
      .theme-switch svg { width: 24px; height: 24px; fill: currentColor; }

      /* --- BRANDING --- */
      .brand-vertical {
        font-family: "Cinzel", serif; font-size: 8rem; line-height: 0.8; color: #fff; opacity: 0.08;
        position: absolute; bottom: -2rem; left: -1rem; z-index: 0; pointer-events: none;
        writing-mode: vertical-rl; transform: rotate(180deg);
      }
      .brand-x {
        font-family: "Major Mono Display", monospace; color: var(--accent);
        font-size: 1.2em; font-weight: bold; display: inline-block; transform: translateY(2px);
      }
      .mission-stat { font-family: "JetBrains Mono", monospace; border-left: 2px solid var(--accent); padding-left: 1rem; margin-bottom: 2rem; }
      .stat-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; }
      .stat-val { font-size: 1.2rem; font-weight: 700; color: #fff; }

      .content-container { padding: 8rem 6rem 4rem 6rem; max-width: 900px; margin: 0 auto; display: none; opacity: 0; animation: fadeIn 0.4s forwards; }
      .content-container.active-view { display: block; }
      @keyframes fadeIn { to { opacity: 1; transform: translateY(0); } }

      h1.article-title { font-family: "Cinzel", serif; font-size: 4rem; line-height: 1.1; margin-bottom: 2rem; }
      .meta-tag { font-family: "JetBrains Mono"; font-size: 0.8rem; color: var(--accent); border: 1px solid var(--accent); padding: 4px 12px; display: inline-block; margin-bottom: 2rem; }

      /* --- DOSSIER & AVATAR --- */
      .dossier-section { margin-top: 6rem; padding-top: 4rem; border-top: 2px solid var(--border); }
      .dossier-grid { display: flex; gap: 3rem; align-items: flex-start; margin-bottom: 3rem; }
      .dossier-avatar {
        width: 150px; height: 150px; border-radius: 50%; border: 2px solid var(--accent);
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.3); object-fit: cover; flex-shrink: 0; transition: all 0.3s ease;
      }
      [data-theme="dark"] .dossier-avatar { box-shadow: 0 0 20px rgba(0, 240, 255, 0.3); }
      .dossier-avatar:hover { transform: scale(1.05); }
      
      .timeline-container { position: relative; }
      .timeline-item {
        border-left: 1px solid var(--border); padding-left: 2rem; padding-bottom: 3rem; position: relative; transition: opacity 0.3s;
      }
      .timeline-item::before {
        content: ""; position: absolute; left: -5px; top: 5px; width: 9px; height: 9px; background: var(--bg-main);
        border: 2px solid var(--accent); border-radius: 50%; transition: background 0.3s, box-shadow 0.3s;
      }
      .timeline-item:hover::before { background: var(--accent); box-shadow: 0 0 10px var(--accent); }
      .timeline-year { font-family: "JetBrains Mono"; color: var(--accent); margin-bottom: 0.5rem; display: block; font-weight: bold; }
      .timeline-title { font-size: 1.5rem; margin-bottom: 0.5rem; font-family: "Manrope"; font-weight: 700; }
      .timeline-desc { color: var(--text-muted); font-size: 1.1rem; line-height: 1.6; }

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
      .see-more-btn:hover, .see-more-btn:focus { background: var(--accent); color: #000; border-color: var(--accent); }

      /* --- ADMIN --- */
      .admin-gate { text-align: center; padding: 4rem 0; }
      .admin-gate input {
          width: 60%; max-width: 300px; padding: 1rem; background: var(--input-bg);
          border: 1px solid var(--border); color: var(--text-main); font-family: "JetBrains Mono";
          margin-bottom: 1rem; outline: none; text-align: center;
      }
      .admin-gate input:focus { border-color: var(--accent); }
      .admin-panel { display: none; }
      .admin-panel.unlocked { display: block; }

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
      .btn:hover, .btn:focus { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.3); }

      .admin-list-item { 
          display: flex; justify-content: space-between; align-items: center; 
          padding: 1rem; border: 1px solid var(--border); margin-bottom: 0.5rem; 
          background: var(--input-bg); transition: transform 0.2s;
      }
      .admin-list-item:hover { transform: scale(1.01); border-color: var(--accent); }

      @media (max-width: 900px) {
        body { flex-direction: column; overflow-y: auto; height: auto; }
        .left-pane { width: 100%; padding: 2rem; border-bottom: 1px solid var(--border); height: auto; }
        .right-pane { width: 100%; overflow: visible; }
        .content-container { padding: 4rem 2rem; }
        .brand-vertical { display: none; }
        .mobile-toggle { display: block; }
        .dossier-grid { flex-direction: column; align-items: center; text-align: center; }
        
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
    
    <!-- Notification Container -->
    <div id="toast-container"></div>

    <button class="theme-switch" onclick="toggleTheme()" aria-label="Toggle Theme">
        <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
    </button>
    
    <button class="mobile-toggle" onclick="toggleMobileNav()" aria-label="Menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
    </button>

    <nav class="nav-dock" id="mainNav">
      <button class="nav-link active" onclick="switchView('home')" aria-label="Go to Home Log">Log</button>
      <button class="nav-link" onclick="switchView('archive')" aria-label="Go to Archive">Archive</button>
      <button class="nav-link" onclick="switchView('admin')" aria-label="Admin Access">
         <svg style="width:18px; height:18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
      </button>
    </nav>

    <aside class="left-pane">
        <div style="margin-top: auto;">
            <div class="mission-stat"><div class="stat-label">OPERATOR</div><div class="stat-val">EX<span class="brand-x">X</span>EED</div></div>
            <div class="mission-stat"><div class="stat-label">CURRENT OBJ</div><div class="stat-val">BUILD IN PUBLIC</div></div>
            <div class="mission-stat"><div class="stat-label">STATUS</div><div class="stat-val" style="color: #4caf50;">ONLINE</div></div>
        </div>
        <div class="brand-vertical">EX<span class="brand-x">X</span>EED</div>
    </aside>

    <main class="right-pane" id="rightPane">
      
      <!-- VIEW 1: HOME -->
      <div id="view-home" class="content-container active-view" role="tabpanel">
        <span class="meta-tag">MISSION LOG // LATEST</span>
        <h1 class="article-title">The Journey <br />So Far.</h1>
        <div id="home-posts" style="margin-top: 4rem;">Loading...</div>
        
        <div class="dossier-section">
            <h2 class="article-title" style="font-size: 2.5rem;">About EX<span class="brand-x">X</span>EED</h2>
            
            <div class="dossier-grid">
                 <img src="https://i.imgur.com/3x1dKUX.jpeg" class="dossier-avatar" alt="Operator Avatar" onerror="this.src='https://via.placeholder.com/150/ff3333/000000?text=EXXEED'">
                 <div>
                    <p style="font-size: 1.2rem; line-height: 1.6; color: var(--text-muted);">
                      Former PMA Cadet turned Full-Stack Developer. I traded my rifle for a keyboard, but kept the discipline.
                    </p>
                 </div>
            </div>

            <div id="timeline-container" class="timeline-container"></div>
            <button id="timeline-btn" class="see-more-btn" style="display:none" onclick="toggleLimit('timeline')">See More Experience [ + ]</button>
        </div>
      </div>

      <!-- VIEW 2: ARCHIVE -->
      <div id="view-archive" class="content-container" role="tabpanel">
        <span class="meta-tag">FULL DATABASE</span>
        <h1 class="article-title">All Logs.</h1>
        <div class="search-wrapper">
             <span class="search-icon">></span>
             <input type="text" class="search-input" placeholder="Search parameters..." onkeyup="filterList(this.value, 'archive')" aria-label="Search posts">
        </div>
        <div id="archive-posts"></div>
        <button id="archive-btn" class="see-more-btn" style="display:none" onclick="toggleLimit('archive')">See More [ + ]</button>
      </div>

      <!-- VIEW 3: SINGLE -->
      <div id="view-single" class="content-container" role="tabpanel">
        <a class="back-btn" onclick="switchView('home')" tabindex="0" role="button" onkeydown="handleKey(event, () => switchView('home'))" aria-label="Return to previous page"><< RETURN</a>
        <div id="single-post-content"></div>
      </div>

      <!-- VIEW 4: ADMIN -->
      <div id="view-admin" class="content-container" role="tabpanel">
        <span class="meta-tag">RESTRICTED ACCESS</span>
        <h1 class="article-title" id="admin-header">Admin Link</h1>
        
        <div id="admin-gate" class="admin-gate">
            <p style="font-family:'JetBrains Mono'; margin-bottom:1rem; color:var(--text-muted);">ENCRYPTED CONNECTION REQUIRED</p>
            <input type="password" id="gate-pass" placeholder="Enter Passkey" aria-label="Password">
            <br>
            <button class="btn" onclick="unlockAdmin()">Authenticate</button>
        </div>

        <div id="admin-panel" class="admin-panel">
            <div class="admin-form">
                <input type="hidden" id="post-id"> 
                <input type="password" id="admin-pass" placeholder="Access Code Confirm" style="display:none;">
                <input type="text" id="post-title" placeholder="Mission Title" aria-label="Post Title">
                <div style="display: flex; gap: 1rem;">
                    <input type="text" id="post-tag" placeholder="ID (LOG_005)" style="flex:1" aria-label="Log ID">
                    <input type="text" id="post-date" placeholder="Date (DEC 05)" style="flex:1" aria-label="Post Date">
                </div>
                <input type="text" id="post-teaser" placeholder="Teaser" aria-label="Teaser">
                <textarea id="post-content" placeholder="Content (HTML Allowed)" aria-label="Content"></textarea>
                <button class="btn" onclick="submitPost()" id="submit-btn">Submit Log</button>
                <button class="btn" style="background:#555; color:#fff;" onclick="resetForm()">Clear</button>
            </div>

            <div style="margin-top: 4rem; border-top: 1px solid var(--border); padding-top: 2rem;">
                <h3 style="font-family: 'Cinzel'; margin-bottom: 1rem;">Manage Logs</h3>
                <div class="search-wrapper">
                    <span class="search-icon">></span>
                    <input type="text" class="search-input" placeholder="Search database..." onkeyup="filterList(this.value, 'admin')" aria-label="Search Admin DB">
                </div>
                <div id="admin-post-list"></div>
                <button id="admin-btn" class="see-more-btn" style="display:none" onclick="toggleLimit('admin')">See More [ + ]</button>
            </div>
        </div>
      </div>

    </main>

    <script>
      let allPosts = [];
      let timelineData = []; 
      let defaults = { archive: 5, admin: 5, timeline: 2 };
      let limits = { ...defaults };
      let filteredPosts = [];

      function initTheme() {
        const s = localStorage.getItem('theme');
        if(s === 'dark' || (!s && window.matchMedia('(prefers-color-scheme: dark)').matches)) 
            document.documentElement.setAttribute('data-theme', 'dark');
      }
      function toggleTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if(isDark) { document.documentElement.removeAttribute('data-theme'); localStorage.setItem('theme', 'light'); }
        else { document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem('theme', 'dark'); }
        showToast("THEME SETTINGS UPDATED", "info");
      }
      initTheme();

      function toggleMobileNav() { document.getElementById('mainNav').classList.toggle('active-mobile'); }

      // --- NOTIFICATION SYSTEM ---
      function showToast(msg, type = 'info') {
        const container = document.getElementById('toast-container');
        const el = document.createElement('div');
        el.className = \`toast \${type}\`;
        el.innerHTML = \`> SYSTEM: \${msg}\`;
        container.appendChild(el);
        // Animation handle
        setTimeout(() => {
            el.style.animation = "fadeOut 0.4s forwards";
            setTimeout(() => el.remove(), 400);
        }, 3000);
      }

      // --- HISTORY & A11Y ---
      window.addEventListener('popstate', (event) => {
        if(event.state) {
            if(event.state.view === 'single' && event.state.postId) {
                openPost(event.state.postId, false);
            } else {
                switchView(event.state.view || 'home', false);
            }
        } else {
            switchView('home', false);
        }
      });

      function handleKey(e, action) {
          if(e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              action();
          }
      }

      async function fetchData() {
        try {
          const resPosts = await fetch('/api/posts');
          allPosts = await resPosts.json();
          filteredPosts = [...allPosts];
          const resTime = await fetch('/api/timeline');
          timelineData = await resTime.json();
          renderViews();
        } catch (e) { 
            console.error("Error", e);
            showToast("DATA CONNECTION FAILED", "error");
        }
      }

      function renderViews() {
        const homeDiv = document.getElementById('home-posts');
        homeDiv.innerHTML = '';
        allPosts.slice(0, 3).forEach(p => homeDiv.appendChild(createPostHTML(p)));
        renderTimeline();
        renderList('archive');
        renderList('admin');
      }

      function renderTimeline() {
        const container = document.getElementById('timeline-container');
        const btn = document.getElementById('timeline-btn');
        container.innerHTML = '';
        
        const visible = timelineData.slice(0, limits.timeline);
        visible.forEach(item => {
            const div = document.createElement('div');
            div.className = 'timeline-item';
            div.innerHTML = \`<span class="timeline-year">\${item.year}</span><h3 class="timeline-title">\${item.title}</h3><p class="timeline-desc">\${item.desc}</p>\`;
            container.appendChild(div);
        });

        if (limits.timeline > defaults.timeline) btn.innerText = "See Less [ - ]";
        else btn.innerText = "See More Experience [ + ]";

        if(timelineData.length > defaults.timeline) btn.style.display = 'block';
        else btn.style.display = 'none';
      }

      function renderList(type) {
         const container = document.getElementById(type === 'archive' ? 'archive-posts' : 'admin-post-list');
         const btn = document.getElementById(type === 'archive' ? 'archive-btn' : 'admin-btn');
         container.innerHTML = '';
         
         const limit = limits[type];
         const visible = filteredPosts.slice(0, limit);
         visible.forEach(p => {
            if(type === 'archive') container.appendChild(createPostHTML(p));
            else {
                const div = document.createElement('div');
                div.className = 'admin-list-item';
                div.innerHTML = \`<span style="font-family:'JetBrains Mono'">\${p.tag} - \${p.title}</span><span style="cursor:pointer; text-decoration:underline" tabindex="0" role="button" onkeydown="handleKey(event, () => loadIntoForm('\${p.id}'))" onclick="loadIntoForm('\${p.id}')">[EDIT]</span>\`;
                container.appendChild(div);
            }
         });

         if (limits[type] > defaults[type]) btn.innerText = "See Less [ - ]";
         else btn.innerText = "See More [ + ]";

         if(filteredPosts.length > defaults[type]) btn.style.display = 'block';
         else btn.style.display = 'none';
      }

      function toggleLimit(type) {
        if(limits[type] > defaults[type]) limits[type] = defaults[type];
        else limits[type] += 5;
        if(type === 'timeline') renderTimeline();
        else renderList(type);
      }

      function filterList(query, type) {
         const q = query.toLowerCase();
         filteredPosts = allPosts.filter(p => p.title.toLowerCase().includes(q) || p.tag.toLowerCase().includes(q));
         limits[type] = defaults[type];
         renderList(type);
      }

      function createPostHTML(post) {
        const div = document.createElement('div');
        div.className = 'post-item';
        div.setAttribute('role', 'button');
        div.setAttribute('tabindex', '0');
        div.setAttribute('aria-label', 'Read ' + post.title);
        div.onclick = () => openPost(post.id);
        div.onkeydown = (e) => handleKey(e, () => openPost(post.id));
        div.innerHTML = \`<div class="post-meta"><span class="post-tag">\${post.tag}</span><span class="post-date">\${post.date}</span></div><h2 class="post-title">\${post.title}</h2><p class="post-teaser">\${post.teaser}</p>\`;
        return div;
      }

      function switchView(view, pushToHistory = true) {
        document.getElementById('mainNav').classList.remove('active-mobile');
        document.querySelectorAll(".nav-link").forEach(el => el.classList.remove("active"));
        
        const links = document.querySelectorAll(".nav-link");
        if (view === 'home') links[0].classList.add("active");
        if (view === 'archive') links[1].classList.add("active");
        if (view === 'admin') links[2].classList.add("active");

        document.querySelectorAll(".content-container").forEach(el => el.classList.remove("active-view"));
        
        let activeEl;
        if(view === 'single') activeEl = document.getElementById('view-single');
        else if (view === 'admin') activeEl = document.getElementById('view-admin');
        else if (view === 'archive') activeEl = document.getElementById('view-archive');
        else activeEl = document.getElementById('view-home');
        
        activeEl.classList.add('active-view');
        document.getElementById("rightPane").scrollTop = 0;

        if(pushToHistory) {
            history.pushState({ view: view }, "", "#" + view);
        }
      }

      function unlockAdmin() {
          const pass = document.getElementById('gate-pass').value;
          if(pass) {
              document.getElementById('admin-gate').style.display = 'none';
              document.getElementById('admin-panel').classList.add('unlocked');
              document.getElementById('admin-header').innerText = "Dashboard";
              document.getElementById('admin-pass').value = pass;
              showToast("ACCESS GRANTED", "success");
          } else { 
              showToast("INVALID PASSKEY", "error"); 
          }
      }

      function openPost(id, pushToHistory = true) {
        const p = allPosts.find(x => x.id === id);
        if(!p) return;
        document.getElementById('single-post-content').innerHTML = \`
            <span class="meta-tag">STATUS: ARCHIVED</span>
            <h1 class="article-title">\${p.title}</h1>
            <div class="article-body"><p>\${p.content}</p></div>
        \`;
        if(pushToHistory) {
             history.pushState({ view: 'single', postId: id }, "", "#post-" + id);
        }
        switchView('single', false);
      }

      function resetForm() {
        document.getElementById('post-id').value = '';
        document.getElementById('post-title').value = '';
        document.getElementById('post-tag').value = '';
        document.getElementById('post-date').value = '';
        document.getElementById('post-teaser').value = '';
        document.getElementById('post-content').value = '';
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

        if(!pass) { showToast("SESSION EXPIRED. REFRESH.", "error"); return; }
        if(!title) { showToast("MISSING PARAMETERS", "error"); return; }
        const method = id ? 'PUT' : 'POST';
        const payload = { id: id || Date.now().toString(), title, tag, date, teaser, content };

        try {
            const res = await fetch('/api/posts', {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': pass },
                body: JSON.stringify(payload)
            });
            if(res.status === 200 || res.status === 201) {
                showToast("ENTRY SAVED SUCCESSFULLY", "success");
                resetForm();
                await fetchData();
                if(method === 'POST') switchView('home'); 
            } else { showToast("AUTH FAILED", "error"); }
        } catch (e) { showToast("NETWORK ERROR", "error"); }
      }

      window.onload = () => {
         fetchData();
         if(window.location.hash) {
             const h = window.location.hash;
             if(h.startsWith('#post-')) {
                 // handled after fetch
             } else {
                 const v = h.replace('#', '');
                 switchView(v, false);
             }
         }
      };
    </script>
  </body>
</html>
`;
