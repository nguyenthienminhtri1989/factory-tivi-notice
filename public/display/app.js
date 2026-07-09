const slide = document.querySelector("#slide");
const groupLabel = document.querySelector("#groupLabel");
const clock = document.querySelector("#clock");
const syncStatus = document.querySelector("#syncStatus");

const params = new URLSearchParams(window.location.search);
const groupCode = params.get("group") || "xuong-a";
const pollMs = 5000;

let notices = [];
let currentIndex = 0;
let slideTimer = null;
let lastSignature = "";

groupLabel.textContent = `Nhóm: ${groupCode}`;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function levelLabel(level) {
  if (level === "URGENT") return "Khẩn cấp";
  if (level === "IMPORTANT") return "Quan trọng";
  return "Thông báo";
}

function renderSlide() {
  window.clearTimeout(slideTimer);

  if (!notices.length) {
    slide.className = "slide";
    slide.style.backgroundColor = "#111827";
    slide.style.color = "#f8fafc";
    slide.innerHTML = '<p class="empty">Chưa có thông báo đang hiển thị</p>';
    return;
  }

  if (currentIndex >= notices.length) currentIndex = 0;
  const notice = notices[currentIndex];

  slide.style.backgroundColor = notice.backgroundColor;
  slide.style.color = notice.textColor;

  if (notice.type === "IMAGE" && notice.imageUrl) {
    slide.className = `slide image-slide ${notice.fitMode === "contain" ? "contain" : ""}`;
    slide.innerHTML = `<img src="${escapeHtml(notice.imageUrl)}" alt="${escapeHtml(notice.title || "Thông báo")}">`;
  } else if (notice.type === "MIXED" && notice.imageUrl) {
    slide.className = "slide";
    slide.innerHTML = `
      <div class="mixed-layout">
        <img src="${escapeHtml(notice.imageUrl)}" alt="${escapeHtml(notice.title || "Thông báo")}">
        <div class="slide-content">
          <div class="badge">${levelLabel(notice.level)}</div>
          <h1 class="title">${escapeHtml(notice.title)}</h1>
          <p class="body">${escapeHtml(notice.content)}</p>
        </div>
      </div>
    `;
  } else {
    slide.className = "slide";
    slide.innerHTML = `
      <div class="slide-content">
        <div class="badge">${levelLabel(notice.level)}</div>
        <h1 class="title">${escapeHtml(notice.title)}</h1>
        <p class="body">${escapeHtml(notice.content)}</p>
      </div>
    `;
  }

  const durationMs = Math.max(Number(notice.durationSeconds || 30), 5) * 1000;
  slideTimer = window.setTimeout(() => {
    currentIndex = (currentIndex + 1) % notices.length;
    renderSlide();
  }, durationMs);
}

async function loadNotices() {
  try {
    const response = await fetch(`/api/display/${encodeURIComponent(groupCode)}/notices`, {
      cache: "no-store"
    });
    if (!response.ok) throw new Error("Không tải được dữ liệu");
    const data = await response.json();
    const nextNotices = data.notices || [];
    const nextSignature = JSON.stringify(nextNotices);

    syncStatus.textContent = `Đồng bộ: ${new Date(data.serverTime).toLocaleTimeString("vi-VN")}`;

    if (nextSignature !== lastSignature) {
      notices = nextNotices;
      currentIndex = 0;
      lastSignature = nextSignature;
      renderSlide();
    }
  } catch (error) {
    syncStatus.textContent = "Mất kết nối, đang giữ nội dung cũ";
  }
}

function tickClock() {
  clock.textContent = new Date().toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

loadNotices();
window.setInterval(loadNotices, pollMs);
tickClock();
window.setInterval(tickClock, 1000);
