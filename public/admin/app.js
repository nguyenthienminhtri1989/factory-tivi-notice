const form = document.querySelector("#noticeForm");
const message = document.querySelector("#message");
const noticeList = document.querySelector("#noticeList");
const lastUpdated = document.querySelector("#lastUpdated");
const formTitle = document.querySelector("#formTitle");
const resetButton = document.querySelector("#resetButton");
const refreshButton = document.querySelector("#refreshButton");

let notices = [];

function formValue(id) {
  return document.querySelector(`#${id}`).value;
}

function setMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}

function resetForm() {
  form.reset();
  document.querySelector("#noticeId").value = "";
  document.querySelector("#displayGroup").value = "xuong-a";
  document.querySelector("#sortOrder").value = "1";
  document.querySelector("#durationSeconds").value = "30";
  document.querySelector("#backgroundColor").value = "#111827";
  document.querySelector("#textColor").value = "#f9fafb";
  document.querySelector("#isActive").checked = true;
  formTitle.textContent = "Tạo thông báo";
  setMessage("");
}

function getPayload() {
  return {
    type: formValue("type"),
    title: formValue("title"),
    content: formValue("content"),
    displayGroup: formValue("displayGroup"),
    level: formValue("level"),
    durationSeconds: Number(formValue("durationSeconds")),
    isActive: document.querySelector("#isActive").checked,
    sortOrder: Number(formValue("sortOrder")),
    backgroundColor: formValue("backgroundColor"),
    textColor: formValue("textColor"),
    imageUrl: formValue("imageUrl"),
    fitMode: formValue("fitMode")
  };
}

function fillForm(notice) {
  document.querySelector("#noticeId").value = notice.id;
  document.querySelector("#type").value = notice.type;
  document.querySelector("#title").value = notice.title;
  document.querySelector("#content").value = notice.content;
  document.querySelector("#displayGroup").value = notice.displayGroup;
  document.querySelector("#level").value = notice.level;
  document.querySelector("#durationSeconds").value = notice.durationSeconds;
  document.querySelector("#isActive").checked = notice.isActive;
  document.querySelector("#sortOrder").value = notice.sortOrder;
  document.querySelector("#backgroundColor").value = notice.backgroundColor;
  document.querySelector("#textColor").value = notice.textColor;
  document.querySelector("#imageUrl").value = notice.imageUrl;
  document.querySelector("#fitMode").value = notice.fitMode;
  formTitle.textContent = "Sửa thông báo";
  setMessage("Đang sửa slide đã chọn.");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Co loi xay ra.");
  }
  return data;
}

function renderList() {
  const sorted = [...notices].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));

  if (!sorted.length) {
    noticeList.innerHTML = "<p>Chưa có thông báo nào.</p>";
    return;
  }

  noticeList.innerHTML = sorted
    .map((notice) => {
      const status = notice.isActive ? "Đang hiển thị" : "Đang tắt";
      const content = notice.content || notice.imageUrl || "(không có nội dung)";
      return `
        <article class="notice-card">
          <div>
            <div class="notice-title">${escapeHtml(notice.title || "(không tiêu đề)")}</div>
            <p class="notice-meta">
              ${escapeHtml(notice.displayGroup)} · ${notice.type} · ${notice.level} · ${notice.durationSeconds}s · ${status} · thu tu ${notice.sortOrder}
            </p>
            <p class="notice-content">${escapeHtml(content)}</p>
          </div>
          <div class="notice-actions">
            <button class="small-button" type="button" data-action="edit" data-id="${notice.id}">Sửa</button>
            <button class="small-button" type="button" data-action="toggle" data-id="${notice.id}">
              ${notice.isActive ? "Tắt" : "Bật"}
            </button>
            <button class="small-button danger-button" type="button" data-action="delete" data-id="${notice.id}">Xóa</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadNotices() {
  const store = await api("/api/notices");
  notices = store.notices || [];
  lastUpdated.textContent = `Cập nhật lần cuối: ${new Date(store.updatedAt).toLocaleString("vi-VN")}`;
  renderList();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = document.querySelector("#noticeId").value;
  const payload = getPayload();

  try {
    if (id) {
      await api(`/api/notices/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      setMessage("Đã cập nhật thông báo.");
    } else {
      await api("/api/notices", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setMessage("Đã tạo thông báo mới.");
    }

    resetForm();
    await loadNotices();
  } catch (error) {
    setMessage(error.message, true);
  }
});

noticeList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const notice = notices.find((item) => item.id === button.dataset.id);
  if (!notice) return;

  if (button.dataset.action === "edit") {
    fillForm(notice);
    return;
  }

  try {
    if (button.dataset.action === "toggle") {
      await api(`/api/notices/${encodeURIComponent(notice.id)}`, {
        method: "PUT",
        body: JSON.stringify({ ...notice, isActive: !notice.isActive })
      });
      setMessage(notice.isActive ? "Đã tắt thông báo." : "Đã bật thông báo.");
    }

    if (button.dataset.action === "delete") {
      const ok = window.confirm("Xóa thông báo này?");
      if (!ok) return;
      await api(`/api/notices/${encodeURIComponent(notice.id)}`, { method: "DELETE" });
      setMessage("Đã xóa thông báo.");
    }

    await loadNotices();
  } catch (error) {
    setMessage(error.message, true);
  }
});

resetButton.addEventListener("click", resetForm);
refreshButton.addEventListener("click", loadNotices);

loadNotices().catch((error) => setMessage(error.message, true));
