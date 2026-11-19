import React, { useEffect, useRef, useState } from "react";
import InfoSections, { FormatMarquee } from "./InfoSections.jsx";

const formats = ["PNG", "JPG", "HEIC", "AVIF", "WEBP", "GIF", "TIFF"];
const navigation = [
  { label: "Конвертер", href: "#converter" },
  { label: "Возможности", href: "#features" },
  { label: "Сценарии", href: "#scenarios" },
  { label: "Инструкция", href: "#instructions" },
];

function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    image: <><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
    upload: <><path d="M12 16V4m-5 5 5-5 5 5" /><path d="M20 16.5v2A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5v-2" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
    moon: <path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z" />,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    sparkles: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>,
    file: <><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" /><path d="M13 2v7h7M8 14h8m-8 4h8" /></>,
    trash: <><path d="M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2m-5 4v6m4-6v6" /></>,
    chevron: <path d="m7 10 5 5 5-5" />,
    user: <><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="8" r="4" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    film: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 4v16m10-16v16M3 9h4m-4 6h4m10-6h4m-4 6h4" /></>,
    github: <><path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 6v-3.9a3.4 3.4 0 0 0-.9-2.7c3-.3 6.2-1.5 6.2-6.7a5.2 5.2 0 0 0-1.4-3.6 4.8 4.8 0 0 0-.1-3.6s-1.2-.4-3.8 1.4a13.3 13.3 0 0 0-6.9 0C5.5 1.1 4.3 1.5 4.3 1.5a4.8 4.8 0 0 0-.1 3.6 5.2 5.2 0 0 0-1.4 3.6c0 5.2 3.2 6.4 6.2 6.7A3.4 3.4 0 0 0 8 18v4" /></>,
    arrowDown: <><path d="M12 4v15m-6-6 6 6 6-6" /></>,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function getFileFormat(file) {
  const fromType = file.type.split("/")[1];
  const fromName = file.name.split(".").pop();
  return (fromType || fromName || "IMG").replace("jpeg", "jpg").toUpperCase();
}

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [files, setFiles] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [format, setFormat] = useState("JPG");
  const [quality, setQuality] = useState(82);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef(null);
  const filesRef = useRef([]);

  useEffect(() => {
    const updateScrollState = () => setScrolled(window.scrollY > 12);
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => () => {
    filesRef.current.forEach((file) => URL.revokeObjectURL(file.url));
  }, []);

  useEffect(() => {
    if (!isProcessing) return undefined;
    const timer = window.setInterval(() => {
      setProgress((value) => {
        if (value >= 100) {
          window.clearInterval(timer);
          return 100;
        }
        return Math.min(value + 4, 100);
      });
    }, 100);
    return () => window.clearInterval(timer);
  }, [isProcessing]);

  const addFiles = (incoming) => {
    const accepted = Array.from(incoming).filter((file) => file.type.startsWith("image/"));
    if (!accepted.length) return;
    const next = accepted.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
      name: file.name,
      size: file.size,
      format: getFileFormat(file),
      url: URL.createObjectURL(file),
    }));
    setFiles((current) => [...current, ...next]);
    setSelectedIds((current) => [...current, ...next.map((file) => file.id)]);
  };

  const removeFile = (id) => {
    const file = files.find((item) => item.id === id);
    if (file) URL.revokeObjectURL(file.url);
    setFiles((current) => current.filter((item) => item.id !== id));
    setSelectedIds((current) => current.filter((item) => item !== id));
  };

  const toggleFile = (id) => {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
  };

  const selectedFiles = files.filter((file) => selectedIds.includes(file.id));
  const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
  const singleFile = files.length === 1 ? files[0] : null;

  const startProcessing = () => {
    if (!selectedFiles.length) return;
    setProgress(0);
    setIsProcessing(true);
  };

  return (
    <main className="app-shell" data-theme={theme}>
      <header className={`topbar ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          <nav className={`topbar-inner ${scrolled ? "glass" : ""}`} aria-label="Основная навигация">
            <a className="brand" href="#top" aria-label="Конвертер изображений — на главную">
              <span className="brand-mark">
                <Icon name="film" size={18} />
                <span className="brand-shimmer" />
              </span>
              <span className="brand-copy"><strong>Converter</strong><small>Фото конвертер</small></span>
            </a>
            <div className="top-nav">
              {navigation.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
            </div>
            <div className="top-actions">
              <a className="nav-icon-button" href="#limits" aria-label="Войти в аккаунт" title="Войти в аккаунт">
                <Icon name="user" size={17} />
              </a>
              <button
                className="theme-toggle"
                type="button"
                onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
                aria-label={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
                title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
              >
                <span key={theme} className="theme-icon">
                  <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
                </span>
              </button>
              <a className="button button-primary header-cta" href="#converter">
                <Icon name="sparkles" size={14} /> Конвертировать
              </a>
              <button
                className="mobile-menu-toggle"
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
                aria-expanded={menuOpen}
              >
                <Icon name={menuOpen ? "close" : "menu"} size={18} />
              </button>
            </div>
          </nav>
          {menuOpen && (
            <div className="mobile-menu">
              {navigation.map((item, index) => (
                <a
                  key={item.href}
                  href={item.href}
                  style={{ animationDelay: `${50 + index * 50}ms` }}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid" />
        <div className="hero-float" />
        <a className="hero-badge" href="#features">
          <span className="hero-version">v2.0</span>
          <span>Конвертация в пару кликов</span>
          <Icon name="arrow" size={13} />
        </a>
        <h1 className="hero-title">Фото в любой формат<br /><span>за пару секунд</span></h1>
        <p className="hero-copy">
          Перетащите изображения, выберите формат и настройте сжатие.<br />
          Всё необходимое — в одном простом окне.
        </p>
        <div className="hero-actions">
          <a className="button button-primary hero-button" href="#converter">
            <Icon name="upload" size={16} /> Загрузить изображения
          </a>
          <a className="button button-secondary hero-button" href="#instructions">Как это работает</a>
        </div>
        <ul className="hero-highlights">
          <li><Icon name="lock" size={15} /> Файлы остаются на устройстве</li>
          <li><Icon name="image" size={15} /> 7 форматов на выбор</li>
          <li><Icon name="sparkles" size={15} /> Пакетная обработка</li>
        </ul>
        <a className="scroll-cue" href="#converter">
          <span>ЛИСТАЙТЕ ВНИЗ</span>
          <Icon name="arrowDown" size={15} />
        </a>
      </section>

      <FormatMarquee />

      <section className="workspace" id="converter" aria-label="Конвертация изображений">
        <div className="workspace-heading">
          <div>
            <span className="section-kicker">РАБОЧЕЕ ПРОСТРАНСТВО</span>
            <h2>Подготовьте изображения</h2>
          </div>
          {files.length > 0 && (
            <button className="text-button clear-button" type="button" onClick={() => {
              files.forEach((file) => URL.revokeObjectURL(file.url));
              setFiles([]);
              setSelectedIds([]);
            }}>
              <Icon name="trash" size={15} /> Очистить
            </button>
          )}
        </div>

        <div className="workspace-grid">
          <section className="file-panel panel">
            {!files.length ? (
              <div
                className={`dropzone ${isDragging ? "dragging" : ""}`}
                onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setIsDragging(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  addFiles(event.dataTransfer.files);
                }}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
                }}
                role="button"
                tabIndex={0}
                aria-label="Выбрать или перетащить изображения"
              >
                <div className="upload-illustration">
                  <span className="upload-image"><Icon name="image" size={25} /></span>
                  <span className="upload-plus">+</span>
                </div>
                <h3>Перетащите изображения сюда</h3>
                <p>или выберите файлы на устройстве</p>
                <button className="button button-secondary browse-button" type="button" onClick={(event) => {
                  event.stopPropagation();
                  inputRef.current?.click();
                }}>
                  <Icon name="upload" size={16} /> Выбрать изображения
                </button>
                <span className="dropzone-caption">PNG, JPG, WEBP, HEIC и другие · до 50 МБ на файл</span>
              </div>
            ) : singleFile ? (
              <div className="single-preview">
                <div className="preview-toolbar">
                  <div className="preview-label"><span className="live-dot" /> ПРЕДПРОСМОТР</div>
                  <button className="icon-button" type="button" aria-label="Удалить файл" onClick={() => removeFile(singleFile.id)}>
                    <Icon name="trash" size={16} />
                  </button>
                </div>
                <div className="preview-image-wrap">
                  <img className="preview-image" src={singleFile.url} alt={`Предпросмотр ${singleFile.name}`} />
                </div>
                <div className="single-file-info">
                  <span className="file-type-icon"><Icon name="image" size={18} /></span>
                  <span className="single-file-name">{singleFile.name}</span>
                  <span className="file-size">{formatBytes(singleFile.size)}</span>
                  <span className="format-badge">{singleFile.format}</span>
                </div>
              </div>
            ) : (
              <div className="file-list-view">
                <div className="list-heading">
                  <div>
                    <div className="preview-label"><span className="live-dot" /> СПИСОК ФАЙЛОВ</div>
                    <h3>{files.length} изображений</h3>
                  </div>
                  <button className="button button-small button-quiet" type="button" onClick={() => {
                    setSelectedIds(selectedIds.length === files.length ? [] : files.map((file) => file.id));
                  }}>
                    {selectedIds.length === files.length ? "Снять выделение" : "Выбрать все"}
                  </button>
                </div>
                <div className="file-list">
                  {files.map((file) => (
                    <div className={`file-row ${selectedIds.includes(file.id) ? "checked" : ""}`} key={file.id}>
                      <label className="file-select">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(file.id)}
                          onChange={() => toggleFile(file.id)}
                          aria-label={`Выбрать ${file.name}`}
                        />
                        <span className="custom-checkbox"><Icon name="check" size={12} /></span>
                      </label>
                      <img className="file-thumb" src={file.url} alt="" />
                      <span className="list-file-name" title={file.name}>{file.name}</span>
                      <span className="list-file-size">{formatBytes(file.size)}</span>
                      <span className="format-badge">{file.format}</span>
                      <button className="row-remove" type="button" aria-label={`Удалить ${file.name}`} onClick={() => removeFile(file.id)}>
                        <Icon name="close" size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                <button className="add-more-button" type="button" onClick={() => inputRef.current?.click()}>
                  <span>+</span> Добавить ещё изображения
                </button>
              </div>
            )}
            <input
              ref={inputRef}
              className="visually-hidden"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                addFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </section>

          <aside className="settings-panel panel">
            <div className="settings-heading">
              <div className="settings-title-icon"><Icon name="sparkles" size={17} /></div>
              <div><h2>Настройки</h2><p>Настройте результат под себя</p></div>
            </div>

            <div className="setting-block">
              <div className="setting-label-row">
                <label className="setting-label" htmlFor="format">Формат конвертации</label>
                <span className="setting-index">01</span>
              </div>
              <div className="select-wrap">
                <select id="format" value={format} onChange={(event) => setFormat(event.target.value)}>
                  {formats.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <Icon name="chevron" size={16} />
              </div>
              <div className="format-hint"><span className="format-hint-dot" /> На выходе: <strong>.{format.toLowerCase()}</strong></div>
            </div>

            <div className="setting-block compression-block">
              <div className="setting-label-row">
                <label className="setting-label" htmlFor="quality">Сжатие</label>
                <span className="setting-index">02</span>
              </div>
              <div className="quality-heading">
                <span>Степень сжатия</span>
                <strong>{quality}<small>%</small></strong>
              </div>
              <input
                className="quality-slider"
                id="quality"
                type="range"
                min="0"
                max="100"
                value={quality}
                style={{ "--range-progress": `${quality}%` }}
                onChange={(event) => setQuality(Number(event.target.value))}
              />
              <div className="range-labels"><span>Меньше</span><span>Лучшее качество</span></div>
            </div>

            <div className="settings-divider" />

            <div className="quota-card" id="limits">
              <div className="quota-topline">
                <span className="quota-label">ВАШ ТАРИФ</span>
                <span className="guest-pill"><span /> Бесплатно</span>
              </div>
              <div className="quota-stats">
                <div><strong>10</strong><span>обработок</span></div>
                <i />
                <div><strong>50 <small>МБ</small></strong><span>на файл</span></div>
              </div>
              <div className="quota-meter"><span /></div>
              <div className="quota-foot"><span>Доступно обработок</span><strong>10 из 10</strong></div>
              <div className="member-note">
                <Icon name="lock" size={14} />
                <span>После входа — до <strong>150 обработок</strong><br />и файлы размером до <strong>500 МБ</strong></span>
                <Icon name="arrow" size={13} />
              </div>
            </div>

            <div className="action-footer">
              <div className="selection-summary">
                <span>{selectedFiles.length} {selectedFiles.length === 1 ? "файл" : "файлов"} выбрано</span>
                <span>{formatBytes(totalSize)} всего</span>
              </div>
              <button
                className="button button-primary convert-button"
                type="button"
                disabled={!selectedFiles.length}
                onClick={startProcessing}
              >
                <Icon name="sparkles" size={17} /> Конвертировать <Icon name="arrow" size={16} />
              </button>
              <p className="privacy-note"><Icon name="lock" size={12} /> Ваши файлы остаются на вашем устройстве</p>
            </div>
          </aside>
        </div>
      </section>

      <InfoSections />

      <footer className="page-footer">
        <div className="footer-content">
          <a
            className="github-link"
            href="https://github.com/ut0ku/video-converter"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
          </a>
          <p>© {new Date().getFullYear()} Converter. Сделано с заботой о приватности.</p>
        </div>
      </footer>

      {isProcessing && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && progress === 100) setIsProcessing(false);
        }}>
          <section className="processing-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button className="modal-close icon-button" type="button" onClick={() => setIsProcessing(false)} aria-label="Закрыть">
              <Icon name="close" size={18} />
            </button>
            <div className={`processing-icon ${progress === 100 ? "complete" : ""}`}>
              <Icon name={progress === 100 ? "check" : "sparkles"} size={24} />
            </div>
            <span className="section-kicker">{progress === 100 ? "ДЕМО ЗАВЕРШЕНО" : "ПОДГОТОВКА ФАЙЛОВ"}</span>
            <h2 id="modal-title">{progress === 100 ? "Всё готово!" : "Создаём ваш результат"}</h2>
            <p className="modal-description">
              {progress === 100
                ? "Это демонстрация интерфейса — конвертация файлов пока не выполняется."
                : `${selectedFiles.length} ${selectedFiles.length === 1 ? "изображение" : "изображений"} · формат ${format}`}
            </p>
            <div className="progress-info"><span>{progress === 100 ? "Предпросмотр завершён" : "Обработка изображений"}</span><strong>{progress}%</strong></div>
            <div
              className="progress-track"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Демонстрационный прогресс"
            ><span style={{ width: `${progress}%` }} /></div>
            <div className="modal-file-list">
              {selectedFiles.slice(0, 3).map((file) => (
                <div className="modal-file" key={file.id}>
                  <img src={file.url} alt="" />
                  <span>{file.name}</span>
                  <span className="modal-file-format">{format}</span>
                </div>
              ))}
              {selectedFiles.length > 3 && <span className="more-files">и ещё {selectedFiles.length - 3}</span>}
            </div>
            {progress === 100 && <button className="button button-primary modal-done" type="button" onClick={() => setIsProcessing(false)}>Понятно</button>}
          </section>
        </div>
      )}
    </main>
  );
}
