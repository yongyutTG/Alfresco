<!doctype html>
<html lang="th">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Alfresco </title>
    <link rel="stylesheet" href="<?= base_url('assets/css/app.css') ?>">
    <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
</head>
<body>
    <div id="sessionTimeoutModal" class="session-modal" role="dialog" aria-modal="true" aria-labelledby="sessionTimeoutTitle" hidden>
        <div class="session-dialog">
            <div class="session-icon" aria-hidden="true">!</div>
            <h2 id="sessionTimeoutTitle">Session หมดอายุ</h2>
            <p id="sessionTimeoutMessage">Session หมดอายุ เนื่องจากไม่มีการใช้งาน กรุณาเข้าสู่ระบบใหม่</p>
            <div class="session-actions">
                <button id="sessionTimeoutOkBtn" type="button">ตกลง</button>
            </div>
        </div>
    </div>

    <div id="logoutConfirmModal" class="session-modal" role="dialog" aria-modal="true" aria-labelledby="logoutConfirmTitle" hidden>
        <div class="session-dialog logout-dialog">
            <div class="logout-icon" aria-hidden="true">?</div>
            <h2 id="logoutConfirmTitle">ยืนยันการออกจากระบบ</h2>
            <p>คุณต้องการออกจากระบบหรือไม่ ?</p>
            <div class="session-actions split-actions">
                <button id="logoutConfirmBtn" type="button" class="danger-btn">ออกจากระบบ</button>
                <button id="logoutCancelBtn" type="button" class="secondary-btn">ยกเลิก</button>
            </div>
        </div>
    </div>

    <header class="topbar">
        <a class="app-title" href="<?= site_url('documents') ?>">
            <span class="brand-mark small">A</span>
            <span>
                <strong>Alfresco</strong>
                <small>Document Browser</small>
            </span>
        </a>

        <div class="user-box">
            <span id="userAvatar" class="user-avatar">A</span>
            <span id="userName" class="user-name">-</span>
            <button id="logoutBtn" type="button" class="logout-action">ออกจากระบบ</button>
        </div>
    </header>

    <main class="app-layout">
        <aside class="sidebar">
            <div class="side-section">
                <div class="section-title">
                    <span class="section-icon">F</span>
                    <div>
                        <h2>Folder ตามสิทธิ์</h2>
                        <p>เลือก folder ที่ต้องการดูเอกสาร</p>
                    </div>
                </div>
                <div id="folderList" class="folder-list"></div>
                <div class="sidebar-version">
                    <strong>Alfresco Direct</strong>
                    <span>v<?= esc($appVersion) ?></span>
                </div>
            </div>
        </aside>

        <section class="content">
            <div class="toolbar">
                <div>
                    <div class="eyebrow">Current Location</div>
                    <h1 id="selectedFolder"><?= esc($rootPath) ?></h1>
                </div>
                <button id="reloadFoldersBtn" type="button" class="secondary-btn">
                    <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>
                    <span>Reload Folder</span>
                </button>
            </div>

            <form id="searchForm" class="search-panel">
                <input type="hidden" id="folderPath" value="<?= esc($rootPath) ?>">

                <label>
                    <span>ค้นหาชื่อไฟล์</span>
                    <input id="keyword" type="search">
                </label>

                <label>
                    <span>จำนวนต่อหน้า</span>
                    <select id="pageSize">
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100" selected>100</option>
                    </select>
                </label>

                <div class="actions">
                    <button type="submit">
                        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                        <span>ค้นหา</span>
                    </button>
                    <button id="clearBtn" type="button" class="secondary-btn">
                        <i class="fa-solid fa-eraser" aria-hidden="true"></i>
                        <span>ล้าง</span>
                    </button>
                </div>
            </form>

            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>
                                <button id="sortNameBtn" type="button" class="sort-header" aria-label="เรียงชื่อไฟล์">
                                    <span>ชื่อไฟล์</span>
                                    <i class="fa-solid fa-arrow-down-a-z" aria-hidden="true"></i>
                                </button>
                            </th>
                            <th>ชนิดไฟล์</th>
                            <th>ขนาด</th>
                            <th>ข้อมูลไฟล์</th>
                            <th>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody id="documentRows"></tbody>
                </table>
            </div>

            <nav class="pagination" aria-label="Document pagination">
                <div id="pageRangeInfo" class="page-range-info">แสดง 0 ถึง 0 จากทั้งหมด 0 รายการ</div>
                <div class="page-actions">
                    <button id="firstBtn" type="button">
                        <i class="fa-solid fa-angles-left" aria-hidden="true"></i>
                        <span>หน้าแรก</span>
                    </button>
                    <button id="prevBtn" type="button">
                        <i class="fa-solid fa-angle-left" aria-hidden="true"></i>
                        <span>ก่อนหน้า</span>
                    </button>
                    <strong id="pageInfo">หน้า 1 / 1</strong>
                    <button id="nextBtn" type="button">
                        <span>ถัดไป</span>
                        <i class="fa-solid fa-angle-right" aria-hidden="true"></i>
                    </button>
                    <button id="lastBtn" type="button">
                        <span>หน้าสุดท้าย</span>
                        <i class="fa-solid fa-angles-right" aria-hidden="true"></i>
                    </button>
                </div>
            </nav>
        </section>
    </main>

    <script {csp-script-nonce}>
        window.AlfrescoDirect = {
            apiBaseUrl: <?= json_encode($apiBaseUrl) ?>,
            rootPath: <?= json_encode($rootPath, JSON_UNESCAPED_UNICODE) ?>,
            loginUrl: <?= json_encode(site_url('login')) ?>,
            idleTimeoutSeconds: <?= json_encode($idleTimeoutSeconds) ?>
        };
    </script>
    <script src="<?= base_url('assets/js/direct-documents.js') ?>"></script>
</body>
</html>
