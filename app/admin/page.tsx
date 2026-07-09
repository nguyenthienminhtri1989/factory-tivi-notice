"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import styles from "./admin.module.css";
import type { Notice, NoticeStore } from "@/lib/notices";
import type { DisplayDevicePayload, DisplayGroupPayload, FactoryPayload } from "@/lib/admin-data";

type AdminTab = "notices" | "factories" | "groups" | "devices" | "users";

type FormState = {
  id: string;
  type: Notice["type"];
  title: string;
  content: string;
  displayGroups: string[];
  displayDevices: string[];
  level: Notice["level"];
  durationSeconds: number;
  isActive: boolean;
  sortOrder: number;
  backgroundColor: string;
  textColor: string;
  imageUrl: string;
  assets: Notice["assets"];
  fitMode: Notice["fitMode"];
};

type FactoryForm = {
  id: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
};

type DisplayGroupForm = {
  id: string;
  factoryId: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
};

type DisplayDeviceForm = {
  id: string;
  displayGroupId: string;
  code: string;
  name: string;
  location: string;
  isActive: boolean;
};

type UserPayload = {
  id: string;
  username: string;
  fullName: string;
  role: "ADMIN" | "EDITOR" | "VIEWER";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type UserForm = {
  id: string;
  username: string;
  fullName: string;
  role: "ADMIN" | "EDITOR" | "VIEWER";
  password: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  id: "",
  type: "TEXT",
  title: "",
  content: "",
  displayGroups: [],
  displayDevices: [],
  level: "NORMAL",
  durationSeconds: 30,
  isActive: true,
  sortOrder: 1,
  backgroundColor: "#111827",
  textColor: "#f9fafb",
  imageUrl: "",
  assets: [],
  fitMode: "cover"
};

const emptyFactoryForm: FactoryForm = {
  id: "",
  code: "",
  name: "",
  description: "",
  isActive: true
};

const emptyDisplayGroupForm: DisplayGroupForm = {
  id: "",
  factoryId: "",
  code: "",
  name: "",
  description: "",
  isActive: true
};

const emptyDisplayDeviceForm: DisplayDeviceForm = {
  id: "",
  displayGroupId: "",
  code: "",
  name: "",
  location: "",
  isActive: true
};

const emptyUserForm: UserForm = {
  id: "",
  username: "",
  fullName: "",
  role: "VIEWER",
  password: "",
  isActive: true
};

const typeLabels: Record<Notice["type"], string> = {
  TEXT: "Chữ",
  IMAGE: "Ảnh",
  MIXED: "Ảnh + chữ",
  DOCUMENT: "Tài liệu"
};

const levelLabels: Record<Notice["level"], string> = {
  NORMAL: "Thường",
  IMPORTANT: "Quan trọng",
  URGENT: "Khẩn cấp"
};

const tabLabels: Record<AdminTab, string> = {
  notices: "Thông báo",
  factories: "Xưởng",
  groups: "Nhóm TV",
  devices: "Thiết bị TV",
  users: "Tài khoản"
};

function targetLabel(notice: Notice) {
  const groups = notice.displayGroups.length ? notice.displayGroups.map((code) => `Nhóm ${code}`) : [];
  const devices = notice.displayDevices.length ? notice.displayDevices.map((code) => `TV ${code}`) : [];
  return [...groups, ...devices].join(", ") || "Chưa chọn nơi phát";
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("notices");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [factoryForm, setFactoryForm] = useState<FactoryForm>(emptyFactoryForm);
  const [displayGroupForm, setDisplayGroupForm] = useState<DisplayGroupForm>(emptyDisplayGroupForm);
  const [displayDeviceForm, setDisplayDeviceForm] = useState<DisplayDeviceForm>(emptyDisplayDeviceForm);
  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [factories, setFactories] = useState<FactoryPayload[]>([]);
  const [displayGroups, setDisplayGroups] = useState<DisplayGroupPayload[]>([]);
  const [displayDevices, setDisplayDevices] = useState<DisplayDevicePayload[]>([]);
  const [users, setUsers] = useState<UserPayload[]>([]);
  const [message, setMessage] = useState<{ text: string; isError: boolean }>({ text: "", isError: false });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [publicBaseUrl, setPublicBaseUrl] = useState("");

  const sortedNotices = useMemo(
    () => [...notices].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt)),
    [notices]
  );

  const activeDisplayGroups = useMemo(
    () => displayGroups.filter((group) => group.isActive),
    [displayGroups]
  );

  const activeDisplayDevices = useMemo(
    () => displayDevices.filter((device) => device.isActive),
    [displayDevices]
  );

  const tvUrlSuggestions = useMemo(() => {
    const baseUrl = publicBaseUrl || "http://SERVER_IP:3003";
    const groupUrls = form.displayGroups.map((code) => ({
      key: `group-${code}`,
      label: `Nhóm ${code}`,
      url: `${baseUrl}/display?group=${encodeURIComponent(code)}`
    }));
    const deviceUrls = activeDisplayDevices
      .filter((device) => form.displayDevices.includes(device.code))
      .map((device) => ({
        key: `device-${device.code}`,
        label: `TV ${device.name}`,
        url: `${baseUrl}/display?group=${encodeURIComponent(device.displayGroupCode)}&device=${encodeURIComponent(device.code)}`
      }));
    return [...groupUrls, ...deviceUrls];
  }, [activeDisplayDevices, form.displayDevices, form.displayGroups, publicBaseUrl]);

  const activeNoticeCount = notices.filter((notice) => notice.isActive).length;

  async function api<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      ...options
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Có lỗi xảy ra.");
    return data as T;
  }

  async function loadNotices() {
    const store = await api<NoticeStore>("/api/notices");
    setNotices(store.notices || []);
    setUpdatedAt(store.updatedAt);
  }

  async function loadAdminData() {
    const [factoryData, groupData, deviceData, userData] = await Promise.all([
      api<{ factories: FactoryPayload[] }>("/api/factories"),
      api<{ displayGroups: DisplayGroupPayload[] }>("/api/display-groups"),
      api<{ displayDevices: DisplayDevicePayload[] }>("/api/display-devices"),
      api<{ users: UserPayload[] }>("/api/users").catch(() => ({ users: [] }))
    ]);
    setFactories(factoryData.factories || []);
    setDisplayGroups(groupData.displayGroups || []);
    setDisplayDevices(deviceData.displayDevices || []);
    setUsers(userData.users || []);
  }

  async function refreshAll() {
    await Promise.all([loadNotices(), loadAdminData()]);
  }

  useEffect(() => {
    refreshAll().catch((error) => setMessage({ text: error.message, isError: true }));
  }, []);

  useEffect(() => {
    setPublicBaseUrl(window.location.origin);
  }, []);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function uploadNoticeFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setUploadingFile(true);

    try {
      const response = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không tải được tệp lên server.");

      const asset = data.asset as Notice["assets"][number];
      setForm((current) => {
        const nextType = asset.kind === "IMAGE" ? current.title || current.content ? "MIXED" : "IMAGE" : "DOCUMENT";
        return {
          ...current,
          type: nextType,
          imageUrl: asset.kind === "IMAGE" || asset.mimeType === "application/pdf" ? asset.url : current.imageUrl || asset.url,
          assets: [{ ...asset, id: asset.id || asset.url, createdAt: asset.createdAt || new Date().toISOString() }]
        };
      });
      setMessage({ text: "Đã tải tệp lên server.", isError: false });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Có lỗi xảy ra khi tải tệp.", isError: true });
    } finally {
      setUploadingFile(false);
    }
  }

  function removeNoticeAsset(assetUrl: string) {
    setForm((current) => ({
      ...current,
      imageUrl: current.imageUrl === assetUrl ? "" : current.imageUrl,
      assets: current.assets.filter((asset) => asset.url !== assetUrl)
    }));
  }

  function formatFileSize(size: number | null) {
    if (!size) return "";
    if (size < 1024 * 1024) return Math.round(size / 1024) + " KB";
    return (size / 1024 / 1024).toFixed(1) + " MB";
  }

  function toggleDisplayGroup(code: string) {
    setForm((current) => {
      const exists = current.displayGroups.includes(code);
      return {
        ...current,
        displayGroups: exists ? current.displayGroups.filter((item) => item !== code) : [...current.displayGroups, code]
      };
    });
  }

  function toggleDisplayDevice(code: string) {
    setForm((current) => {
      const exists = current.displayDevices.includes(code);
      return {
        ...current,
        displayDevices: exists ? current.displayDevices.filter((item) => item !== code) : [...current.displayDevices, code]
      };
    });
  }

  function resetForm() {
    setForm(emptyForm);
    setMessage({ text: "", isError: false });
  }

  function normalizeNoticePayload() {
    return {
      ...form,
      displayGroup: form.displayGroups[0] || "",
      displayGroups: form.displayGroups,
      displayDevices: form.displayDevices
    };
  }

  async function saveNotice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = normalizeNoticePayload();
    delete (payload as Partial<FormState>).id;

    if (payload.displayGroups.length === 0 && payload.displayDevices.length === 0) {
      setMessage({ text: "Cần chọn ít nhất một nhóm TV hoặc một thiết bị TV.", isError: true });
      return;
    }

    try {
      if (form.id) {
        await api<Notice>(`/api/notices/${encodeURIComponent(form.id)}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        setMessage({ text: "Đã cập nhật thông báo.", isError: false });
      } else {
        await api<Notice>("/api/notices", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        setMessage({ text: "Đã tạo thông báo mới.", isError: false });
      }

      resetForm();
      await loadNotices();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Có lỗi xảy ra.", isError: true });
    }
  }

  function editNotice(notice: Notice) {
    setActiveTab("notices");
    setForm({
      id: notice.id,
      type: notice.type,
      title: notice.title,
      content: notice.content,
      displayGroups: notice.displayGroups.length ? notice.displayGroups : notice.displayGroup ? [notice.displayGroup] : [],
      displayDevices: notice.displayDevices || [],
      level: notice.level,
      durationSeconds: notice.durationSeconds,
      isActive: notice.isActive,
      sortOrder: notice.sortOrder,
      backgroundColor: notice.backgroundColor,
      textColor: notice.textColor,
      imageUrl: notice.imageUrl,
      assets: notice.assets || [],
      fitMode: notice.fitMode
    });
    setMessage({ text: "Đang sửa thông báo đã chọn.", isError: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleNotice(notice: Notice) {
    await api<Notice>(`/api/notices/${encodeURIComponent(notice.id)}`, {
      method: "PUT",
      body: JSON.stringify({ ...notice, isActive: !notice.isActive })
    });
    setMessage({ text: notice.isActive ? "Đã tắt thông báo." : "Đã bật thông báo.", isError: false });
    await loadNotices();
  }

  async function deleteNotice(notice: Notice) {
    if (!window.confirm("Xóa thông báo này?")) return;
    await api<{ ok: boolean }>(`/api/notices/${encodeURIComponent(notice.id)}`, { method: "DELETE" });
    setMessage({ text: "Đã xóa thông báo.", isError: false });
    await loadNotices();
  }

  async function saveFactory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const method = factoryForm.id ? "PUT" : "POST";
    const url = factoryForm.id ? `/api/factories/${factoryForm.id}` : "/api/factories";
    await api(url, { method, body: JSON.stringify(factoryForm) });
    setFactoryForm(emptyFactoryForm);
    setMessage({ text: "Đã lưu xưởng.", isError: false });
    await loadAdminData();
  }

  async function saveDisplayGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const method = displayGroupForm.id ? "PUT" : "POST";
    const url = displayGroupForm.id ? `/api/display-groups/${displayGroupForm.id}` : "/api/display-groups";
    await api(url, { method, body: JSON.stringify(displayGroupForm) });
    setDisplayGroupForm(emptyDisplayGroupForm);
    setMessage({ text: "Đã lưu nhóm TV.", isError: false });
    await loadAdminData();
  }

  async function saveDisplayDevice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const method = displayDeviceForm.id ? "PUT" : "POST";
    const url = displayDeviceForm.id ? `/api/display-devices/${displayDeviceForm.id}` : "/api/display-devices";
    await api(url, { method, body: JSON.stringify(displayDeviceForm) });
    setDisplayDeviceForm(emptyDisplayDeviceForm);
    setMessage({ text: "Đã lưu thiết bị TV.", isError: false });
    await loadAdminData();
  }

  async function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const method = userForm.id ? "PUT" : "POST";
    const url = userForm.id ? "/api/users/" + userForm.id : "/api/users";
    await api(url, { method, body: JSON.stringify(userForm) });
    setUserForm(emptyUserForm);
    setMessage({ text: "Đã lưu tài khoản.", isError: false });
    await loadAdminData();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  async function deleteEntity(url: string, successMessage: string) {
    if (!window.confirm("Xóa dữ liệu này?")) return;
    await api(url, { method: "DELETE" });
    setMessage({ text: successMessage, isError: false });
    await refreshAll();
  }

  return (
    <main className={styles.appShell}>
      <section className={styles.topbar}>
        <div>
          <p className={styles.eyebrow}>Factory TV Notice</p>
          <h1>Quản trị bảng thông báo TV</h1>
        </div>
        <div className={styles.topActions}>
          <button type="button" className={styles.ghostButton} onClick={() => refreshAll()}>Tải lại dữ liệu</button>
          <button type="button" className={styles.ghostButton} onClick={logout}>Đăng xuất</button>
          <Link className={styles.displayLink} href="/display?group=xuong-a" target="_blank">Mở màn hình TV</Link>
        </div>
      </section>

      <section className={styles.summaryGrid}>
        <div className={styles.statBox}>
          <span>Thông báo đang phát</span>
          <strong>{activeNoticeCount}</strong>
        </div>
        <div className={styles.statBox}>
          <span>Nhóm TV</span>
          <strong>{displayGroups.length}</strong>
        </div>
        <div className={styles.statBox}>
          <span>Thiết bị TV</span>
          <strong>{displayDevices.length}</strong>
        </div>
        <div className={styles.statBox}>
          <span>Xưởng</span>
          <strong>{factories.length}</strong>
        </div>
        <div className={styles.statBox}>
          <span>Tài khoản</span>
          <strong>{users.length}</strong>
        </div>
      </section>

      <nav className={styles.tabs} aria-label="Khu vực quản trị">
        {(Object.keys(tabLabels) as AdminTab[]).map((tab) => (
          <button key={tab} type="button" className={activeTab === tab ? styles.activeTab : ""} onClick={() => setActiveTab(tab)}>
            {tabLabels[tab]}
          </button>
        ))}
      </nav>

      <div className={`${styles.message} ${message.isError ? styles.error : ""}`} role="status">{message.text}</div>

      {activeTab === "notices" ? (
        <section className={styles.workspace}>
          <form className={styles.editor} onSubmit={saveNotice}>
            <div className={styles.panelHead}>
              <div>
                <p className={styles.eyebrow}>Nội dung phát lên TV</p>
                <h2>{form.id ? "Sửa thông báo" : "Tạo thông báo mới"}</h2>
              </div>
              <button type="button" className={styles.ghostButton} onClick={resetForm}>Làm mới</button>
            </div>

            <label>
              Tiêu đề
              <input value={form.title} maxLength={80} placeholder="VD: THÔNG BÁO SẢN XUẤT" onChange={(event) => updateForm("title", event.target.value)} />
            </label>

            <label>
              Nội dung
              <textarea value={form.content} rows={7} maxLength={500} placeholder="Nhập nội dung ngắn gọn, dễ đọc từ xa" onChange={(event) => updateForm("content", event.target.value)} />
            </label>

            <div className={styles.groupPicker}>
              <div className={styles.labelText}>Nhóm TV nhận thông báo</div>
              {activeDisplayGroups.length === 0 ? (
                <p className={styles.helperText}>Chưa có nhóm TV. Vào tab Nhóm TV để tạo dữ liệu trước.</p>
              ) : (
                <div className={styles.checkGrid}>
                  {activeDisplayGroups.map((group) => (
                    <label className={styles.checkItem} key={group.id}>
                      <input type="checkbox" checked={form.displayGroups.includes(group.code)} onChange={() => toggleDisplayGroup(group.code)} />
                      <span>{group.name} <small>{group.code} - {group.factoryName}</small></span>
                    </label>
                  ))}
                </div>
              )}
            </div>


            <div className={styles.groupPicker}>
              <div className={styles.labelText}>Thiết bị TV nhận riêng</div>
              {activeDisplayDevices.length === 0 ? (
                <p className={styles.helperText}>Chưa có thiết bị TV. Vào tab Thiết bị TV để khai báo từng màn hình.</p>
              ) : (
                <div className={styles.checkGrid}>
                  {activeDisplayDevices.map((device) => (
                    <label className={styles.checkItem} key={device.id}>
                      <input type="checkbox" checked={form.displayDevices.includes(device.code)} onChange={() => toggleDisplayDevice(device.code)} />
                      <span>{device.name} <small>{device.code} - {device.displayGroupName}</small></span>
                    </label>
                  ))}
                </div>
              )}
            </div>


            <section className={styles.urlPanel}>
              <div>
                <p className={styles.eyebrow}>URL mở trên TV</p>
                <h3>Gợi ý theo nơi nhận đang chọn</h3>
              </div>
              {tvUrlSuggestions.length === 0 ? (
                <p className={styles.helperText}>Chọn nhóm TV hoặc thiết bị TV để hệ thống gợi ý URL cần nhập trên trình duyệt Smart TV.</p>
              ) : (
                <div className={styles.urlList}>
                  {tvUrlSuggestions.map((item) => (
                    <div className={styles.urlItem} key={item.key}>
                      <span>{item.label}</span>
                      <code>{item.url}</code>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className={styles.gridThree}>
              <label>
                Loại slide
                <select value={form.type} onChange={(event) => updateForm("type", event.target.value as Notice["type"])}>
                  <option value="TEXT">Chữ</option>
                  <option value="IMAGE">Ảnh</option>
                  <option value="MIXED">Ảnh + chữ</option>
                  <option value="DOCUMENT">Tài liệu</option>
                </select>
              </label>
              <label>
                Mức độ
                <select value={form.level} onChange={(event) => updateForm("level", event.target.value as Notice["level"])}>
                  <option value="NORMAL">Thường</option>
                  <option value="IMPORTANT">Quan trọng</option>
                  <option value="URGENT">Khẩn cấp</option>
                </select>
              </label>
              <label>
                Giây / slide
                <input type="number" min={5} max={600} value={form.durationSeconds} onChange={(event) => updateForm("durationSeconds", Number(event.target.value))} />
              </label>
            </div>

            <div className={styles.gridThree}>
              <label>
                Thứ tự
                <input type="number" value={form.sortOrder} onChange={(event) => updateForm("sortOrder", Number(event.target.value))} />
              </label>
              <label>
                Màu nền
                <input type="color" value={form.backgroundColor} onChange={(event) => updateForm("backgroundColor", event.target.value)} />
              </label>
              <label>
                Màu chữ
                <input type="color" value={form.textColor} onChange={(event) => updateForm("textColor", event.target.value)} />
              </label>
            </div>

            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={form.isActive} onChange={(event) => updateForm("isActive", event.target.checked)} />
              Đang hiển thị
            </label>

            <section className={styles.uploadPanel}>
              <div>
                <p className={styles.eyebrow}>Media</p>
                <h3>Ảnh hoặc tài liệu phát lên TV</h3>
                <p className={styles.uploadHint}>Hỗ trợ ảnh, PDF, Word, Excel và PowerPoint. Ảnh/PDF hiển thị trực tiếp tốt nhất trên Smart TV.</p>
              </div>
              <label className={styles.filePicker}>
                <input type="file" accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" onChange={uploadNoticeFile} disabled={uploadingFile} />
                <span>{uploadingFile ? "Đang tải tệp..." : "Chọn tệp từ máy tính"}</span>
              </label>
              {form.assets.length ? (
                <div className={styles.assetList}>
                  {form.assets.map((asset) => (
                    <div className={styles.assetItem} key={asset.url}>
                      <div>
                        <strong>{asset.originalName || asset.fileName}</strong>
                        <span>{asset.kind === "IMAGE" ? "Ảnh" : "Tài liệu"} {formatFileSize(asset.fileSize)}</span>
                        <code>{asset.url}</code>
                      </div>
                      <button type="button" className={styles.smallButton} onClick={() => removeNoticeAsset(asset.url)}>Gỡ</button>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <label>
              Đường dẫn ảnh/poster/tài liệu
              <input value={form.imageUrl} placeholder="Có thể nhập URL ngoài hoặc dùng tệp vừa upload" onChange={(event) => updateForm("imageUrl", event.target.value)} />
            </label>

            <label>
              Cách fit ảnh
              <select value={form.fitMode} onChange={(event) => updateForm("fitMode", event.target.value as Notice["fitMode"])}>
                <option value="cover">Phủ kín màn hình</option>
                <option value="contain">Hiện trọn ảnh</option>
              </select>
            </label>

            <div className={styles.actions}>
              <button type="submit" className={styles.primaryButton}>Lưu thông báo</button>
            </div>
          </form>

          <section className={styles.noticePanel}>
            <div className={styles.panelHead}>
              <div>
                <p className={styles.eyebrow}>Danh sách phát</p>
                <h2>Thông báo hiện có</h2>
                <p>{updatedAt ? `Cập nhật lần cuối: ${new Date(updatedAt).toLocaleString("vi-VN")}` : "Đang tải dữ liệu..."}</p>
              </div>
            </div>

            <div className={styles.noticeList}>
              {sortedNotices.length === 0 ? <p>Chưa có thông báo nào.</p> : null}
              {sortedNotices.map((notice) => (
                <article className={styles.noticeCard} key={notice.id}>
                  <div>
                    <div className={styles.noticeTitle}>{notice.title || "(không tiêu đề)"}</div>
                    <p className={styles.noticeMeta}>
                      {targetLabel(notice)} - {typeLabels[notice.type]} - {levelLabels[notice.level]} - {notice.durationSeconds}s - {notice.isActive ? "Đang hiển thị" : "Đang tắt"} - thứ tự {notice.sortOrder}
                    </p>
                    <p className={styles.noticeContent}>{notice.content || notice.imageUrl || "(không có nội dung)"}</p>
                  </div>
                  <div className={styles.noticeActions}>
                    <button className={styles.smallButton} type="button" onClick={() => editNotice(notice)}>Sửa</button>
                    <button className={styles.smallButton} type="button" onClick={() => toggleNotice(notice)}>{notice.isActive ? "Tắt" : "Bật"}</button>
                    <button className={`${styles.smallButton} ${styles.dangerButton}`} type="button" onClick={() => deleteNotice(notice)}>Xóa</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      ) : null}

      {activeTab === "factories" ? (
        <section className={styles.managementLayout}>
          <form onSubmit={saveFactory} className={styles.managerForm}>
            <div className={styles.panelHead}>
              <div>
                <p className={styles.eyebrow}>Dữ liệu nền</p>
                <h2>{factoryForm.id ? "Sửa xưởng" : "Tạo xưởng"}</h2>
              </div>
              {factoryForm.id ? <button className={styles.ghostButton} type="button" onClick={() => setFactoryForm(emptyFactoryForm)}>Hủy sửa</button> : null}
            </div>
            <input value={factoryForm.code} placeholder="Mã xưởng, VD: xuong-a" onChange={(event) => setFactoryForm((current) => ({ ...current, code: event.target.value }))} />
            <input value={factoryForm.name} placeholder="Tên xưởng" onChange={(event) => setFactoryForm((current) => ({ ...current, name: event.target.value }))} />
            <input value={factoryForm.description} placeholder="Ghi chú" onChange={(event) => setFactoryForm((current) => ({ ...current, description: event.target.value }))} />
            <label className={styles.inlineCheck}><input type="checkbox" checked={factoryForm.isActive} onChange={(event) => setFactoryForm((current) => ({ ...current, isActive: event.target.checked }))} /> Đang dùng</label>
            <button className={styles.primaryButton} type="submit">Lưu xưởng</button>
          </form>

          <section className={styles.tablePanel}>
            <h2>Danh sách xưởng</h2>
            <div className={styles.tableList}>
              {factories.map((factory) => (
                <article key={factory.id}>
                  <div>
                    <strong>{factory.name}</strong>
                    <span>{factory.code} - {factory.isActive ? "Đang dùng" : "Đang tắt"} - {factory.displayGroupCount || 0} nhóm</span>
                  </div>
                  <div>
                    <button type="button" onClick={() => setFactoryForm({ id: factory.id, code: factory.code, name: factory.name, description: factory.description || "", isActive: factory.isActive })}>Sửa</button>
                    <button type="button" onClick={() => deleteEntity(`/api/factories/${factory.id}`, "Đã xóa xưởng.")}>Xóa</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      ) : null}

      {activeTab === "groups" ? (
        <section className={styles.managementLayout}>
          <form onSubmit={saveDisplayGroup} className={styles.managerForm}>
            <div className={styles.panelHead}>
              <div>
                <p className={styles.eyebrow}>Dữ liệu nền</p>
                <h2>{displayGroupForm.id ? "Sửa nhóm TV" : "Tạo nhóm TV"}</h2>
              </div>
              {displayGroupForm.id ? <button className={styles.ghostButton} type="button" onClick={() => setDisplayGroupForm(emptyDisplayGroupForm)}>Hủy sửa</button> : null}
            </div>
            <select value={displayGroupForm.factoryId} onChange={(event) => setDisplayGroupForm((current) => ({ ...current, factoryId: event.target.value }))}>
              <option value="">Chọn xưởng</option>
              {factories.map((factory) => <option key={factory.id} value={factory.id}>{factory.name}</option>)}
            </select>
            <input value={displayGroupForm.code} placeholder="Mã nhóm, VD: xuong-a" onChange={(event) => setDisplayGroupForm((current) => ({ ...current, code: event.target.value }))} />
            <input value={displayGroupForm.name} placeholder="Tên nhóm TV" onChange={(event) => setDisplayGroupForm((current) => ({ ...current, name: event.target.value }))} />
            <input value={displayGroupForm.description} placeholder="Ghi chú" onChange={(event) => setDisplayGroupForm((current) => ({ ...current, description: event.target.value }))} />
            <label className={styles.inlineCheck}><input type="checkbox" checked={displayGroupForm.isActive} onChange={(event) => setDisplayGroupForm((current) => ({ ...current, isActive: event.target.checked }))} /> Đang dùng</label>
            <button className={styles.primaryButton} type="submit">Lưu nhóm TV</button>
          </form>

          <section className={styles.tablePanel}>
            <h2>Danh sách nhóm TV</h2>
            <div className={styles.tableList}>
              {displayGroups.map((group) => (
                <article key={group.id}>
                  <div>
                    <strong>{group.name}</strong>
                    <span>{group.code} - {group.factoryName} - {group.isActive ? "Đang dùng" : "Đang tắt"} - {group.deviceCount || 0} TV</span>
                  </div>
                  <div>
                    <button type="button" onClick={() => setDisplayGroupForm({ id: group.id, factoryId: group.factoryId, code: group.code, name: group.name, description: group.description || "", isActive: group.isActive })}>Sửa</button>
                    <button type="button" onClick={() => deleteEntity(`/api/display-groups/${group.id}`, "Đã xóa nhóm TV.")}>Xóa</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      ) : null}

      {activeTab === "devices" ? (
        <section className={styles.managementLayout}>
          <form onSubmit={saveDisplayDevice} className={styles.managerForm}>
            <div className={styles.panelHead}>
              <div>
                <p className={styles.eyebrow}>Dữ liệu nền</p>
                <h2>{displayDeviceForm.id ? "Sửa thiết bị TV" : "Tạo thiết bị TV"}</h2>
              </div>
              {displayDeviceForm.id ? <button className={styles.ghostButton} type="button" onClick={() => setDisplayDeviceForm(emptyDisplayDeviceForm)}>Hủy sửa</button> : null}
            </div>
            <select value={displayDeviceForm.displayGroupId} onChange={(event) => setDisplayDeviceForm((current) => ({ ...current, displayGroupId: event.target.value }))}>
              <option value="">Chọn nhóm TV</option>
              {displayGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
            </select>
            <input value={displayDeviceForm.code} placeholder="Mã TV, VD: tv-a-01" onChange={(event) => setDisplayDeviceForm((current) => ({ ...current, code: event.target.value }))} />
            <input value={displayDeviceForm.name} placeholder="Tên TV" onChange={(event) => setDisplayDeviceForm((current) => ({ ...current, name: event.target.value }))} />
            <input value={displayDeviceForm.location} placeholder="Vị trí lắp đặt" onChange={(event) => setDisplayDeviceForm((current) => ({ ...current, location: event.target.value }))} />
            <label className={styles.inlineCheck}><input type="checkbox" checked={displayDeviceForm.isActive} onChange={(event) => setDisplayDeviceForm((current) => ({ ...current, isActive: event.target.checked }))} /> Đang dùng</label>
            <button className={styles.primaryButton} type="submit">Lưu TV</button>
          </form>

          <section className={styles.tablePanel}>
            <h2>Danh sách thiết bị TV</h2>
            <div className={styles.tableList}>
              {displayDevices.map((device) => (
                <article key={device.id}>
                  <div>
                    <strong>{device.name}</strong>
                    <span>{device.code} - {device.displayGroupName} - URL: /display?group={device.displayGroupCode}&device={device.code} - {device.location || "Chưa có vị trí"} - {device.isActive ? "Đang dùng" : "Đang tắt"}</span>
                  </div>
                  <div>
                    <button type="button" onClick={() => setDisplayDeviceForm({ id: device.id, displayGroupId: device.displayGroupId, code: device.code, name: device.name, location: device.location || "", isActive: device.isActive })}>Sửa</button>
                    <button type="button" onClick={() => deleteEntity(`/api/display-devices/${device.id}`, "Đã xóa thiết bị TV.")}>Xóa</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      ) : null}

      {activeTab === "users" ? (
        <section className={styles.managementLayout}>
          <form onSubmit={saveUser} className={styles.managerForm}>
            <div className={styles.panelHead}>
              <div>
                <p className={styles.eyebrow}>Bảo mật</p>
                <h2>{userForm.id ? "Sửa tài khoản" : "Tạo tài khoản"}</h2>
              </div>
              {userForm.id ? <button className={styles.ghostButton} type="button" onClick={() => setUserForm(emptyUserForm)}>Hủy sửa</button> : null}
            </div>
            <input value={userForm.username} placeholder="Tên đăng nhập, VD: tv-nha-may-3" onChange={(event) => setUserForm((current) => ({ ...current, username: event.target.value }))} />
            <input value={userForm.fullName} placeholder="Tên hiển thị" onChange={(event) => setUserForm((current) => ({ ...current, fullName: event.target.value }))} />
            <select value={userForm.role} onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value as UserForm["role"] }))}>
              <option value="VIEWER">TV / Chỉ xem màn hình</option>
              <option value="EDITOR">Soạn thông báo</option>
              <option value="ADMIN">Quản trị hệ thống</option>
            </select>
            <input type="password" value={userForm.password} placeholder={userForm.id ? "Mật khẩu mới nếu muốn đổi" : "Mật khẩu tối thiểu 6 ký tự"} onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))} />
            <label className={styles.inlineCheck}><input type="checkbox" checked={userForm.isActive} onChange={(event) => setUserForm((current) => ({ ...current, isActive: event.target.checked }))} /> Đang dùng</label>
            <button className={styles.primaryButton} type="submit">Lưu tài khoản</button>
          </form>

          <section className={styles.tablePanel}>
            <h2>Danh sách tài khoản</h2>
            <div className={styles.tableList}>
              {users.map((user) => (
                <article key={user.id}>
                  <div>
                    <strong>{user.fullName}</strong>
                    <span>{user.username} - {user.role === "VIEWER" ? "TV / Chỉ xem" : user.role === "EDITOR" ? "Soạn thông báo" : "Quản trị"} - {user.isActive ? "Đang dùng" : "Đang khóa"}</span>
                  </div>
                  <div>
                    <button type="button" onClick={() => setUserForm({ id: user.id, username: user.username, fullName: user.fullName, role: user.role, password: "", isActive: user.isActive })}>Sửa</button>
                    <button type="button" onClick={() => deleteEntity("/api/users/" + user.id, "Đã khóa tài khoản.")}>Khóa</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      ) : null}
    </main>
  );
}
