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

    <div id="renameFileModal" class="session-modal" role="dialog" aria-modal="true" aria-labelledby="renameFileTitle" hidden>
        <form id="renameFileForm" class="session-dialog rename-dialog">
            <div class="rename-icon" aria-hidden="true">
                <i class="fa-regular fa-pen-to-square"></i>
            </div>
            <h2 id="renameFileTitle">แก้ไขชื่อไฟล์</h2>
            <p id="renameFileCurrentName" class="rename-current-name">-</p>
            <label class="rename-field">
                <span>ชื่อไฟล์ใหม่</span>
                <span class="rename-input-group">
                    <input id="renameFileInput" type="text" autocomplete="off" required>
                    <span id="renameFileExtension" class="rename-extension"></span>
                </span>
            </label>
            <div class="session-actions split-actions">
                <button id="renameFileSaveBtn" type="submit">
                    <i class="fa-solid fa-floppy-disk" aria-hidden="true"></i>
                    <span>บันทึก</span>
                </button>
                <button id="renameFileCancelBtn" type="button" class="secondary-btn">ยกเลิก</button>
            </div>
        </form>
    </div>

    <div id="updateFileModal" class="session-modal" role="dialog" aria-modal="true" aria-labelledby="updateFileTitle" hidden>
        <form id="updateFileForm" class="session-dialog update-file-dialog">
            <div class="update-file-icon" aria-hidden="true">
                <i class="fa-solid fa-file-arrow-up"></i>
            </div>
            <h2 id="updateFileTitle">Update ไฟล์</h2>
            <p id="updateFileCurrentName" class="rename-current-name">-</p>
            <label class="rename-field">
                <span>เลือกไฟล์ใหม่</span>
                <input id="updateFileInput" type="file" required>
            </label>
            <div class="session-actions split-actions">
                <button id="updateFileSaveBtn" type="submit">
                    <i class="fa-solid fa-file-arrow-up" aria-hidden="true"></i>
                    <span>Update</span>
                </button>
                <button id="updateFileCancelBtn" type="button" class="secondary-btn">ยกเลิก</button>
            </div>
        </form>
    </div>

    <div id="deleteFileModal" class="session-modal" role="dialog" aria-modal="true" aria-labelledby="deleteFileTitle" hidden>
        <div class="session-dialog delete-file-dialog">
            <div class="delete-file-icon" aria-hidden="true">
                <i class="fa-regular fa-trash-can"></i>
            </div>
            <h2 id="deleteFileTitle">ยืนยันการลบไฟล์</h2>
            <p>ต้องการลบไฟล์นี้หรือไม่?</p>
            <p id="deleteFileCurrentName" class="rename-current-name">-</p>
            <div class="session-actions split-actions">
                <button id="deleteFileConfirmBtn" type="button" class="danger-btn">
                    <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
                    <span>ลบไฟล์</span>
                </button>
                <button id="deleteFileCancelBtn" type="button" class="secondary-btn">ยกเลิก</button>
            </div>
        </div>
    </div>

    <div id="fileInfoModal" class="session-modal" role="dialog" aria-modal="true" aria-labelledby="fileInfoTitle" hidden>
        <div class="session-dialog file-info-dialog">
            <div class="file-info-icon" aria-hidden="true">
                <i class="fa-solid fa-circle-info"></i>
            </div>
            <h2 id="fileInfoTitle">รายละเอียดไฟล์</h2>
            <div class="file-info-tabs" role="tablist" aria-label="รายละเอียดไฟล์">
                <button id="fileInfoDetailsTab" type="button" class="file-info-tab active" role="tab" aria-selected="true" aria-controls="fileInfoDetailsPanel" data-file-info-tab="details">
                    <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
                    <span>ข้อมูลไฟล์</span>
                </button>
                <button id="fileInfoVersionsTab" type="button" class="file-info-tab" role="tab" aria-selected="false" aria-controls="fileInfoVersionsPanel" data-file-info-tab="versions">
                    <i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i>
                    <span>ประวัติเวอร์ชัน</span>
                </button>
            </div>
            <div id="fileInfoDetailsPanel" class="file-info-panel active" role="tabpanel" aria-labelledby="fileInfoDetailsTab">
                <dl id="fileInfoList" class="file-info-list"></dl>
            </div>
            <div id="fileInfoVersionsPanel" class="file-info-panel" role="tabpanel" aria-labelledby="fileInfoVersionsTab" hidden>
                <section class="file-version-section" aria-labelledby="fileVersionTitle">
                    <h3 id="fileVersionTitle">ประวัติเวอร์ชัน</h3>
                    <div id="fileVersionList" class="file-version-list">
                        <div class="file-version-state">กำลังโหลดประวัติเวอร์ชัน...</div>
                    </div>
                </section>
            </div>
            <div class="session-actions">
                <button id="fileInfoCloseBtn" type="button" class="secondary-btn">ปิด</button>
            </div>
        </div>
    </div>

    <header class="topbar">
        <a class="app-title" href="<?= site_url('documents') ?>">
            <img class="brand-logo small" src="<?= base_url('images/logo_coop.png') ?>" alt="Logo">
            <span>
                <strong class="coop-title">สหกรณ์ออมทรัพย์พนักงานบริษัท การบินไทย จำกัด</strong>
                <small class="coop-subtitle">เป็นสหกรณ์ออมทรัพย์ที่มั่นคง โปร่งใส ก้าวไกลด้วยเทคโนโลยี เอื้ออาทรต่อสมาชิกและสังคม</small>
            </span>
        </a>

        <div class="user-box">
            <span class="user-badge" aria-hidden="true">
                <i class="fa-solid fa-user" aria-hidden="true"></i>
            </span>
            <span class="user-meta">
                <span class="user-label">ยินดีต้อนรับ</span>
                <span id="userName" class="user-name">-</span>
            </span>
            <button id="logoutBtn" type="button" class="logout-icon-btn" aria-label="ออกจากระบบ" title="ออกจากระบบ">
                <i class="fa-solid fa-power-off" aria-hidden="true"></i>
            </button>
        </div>
    </header>

    <main class="app-layout">
        <aside class="sidebar">
            <div class="side-section">
                <div class="section-title">
                    <!-- <span class="section-icon">F</span> -->
                    <div>
                        <!-- <h2>Folder ตามสิทธิ์</h2> -->
                        <!-- <p>เลือก folder ที่ต้องการดูเอกสาร</p> -->
                    </div>
                </div>
                <div id="folderList" class="folder-list"></div>
                <div class="sidebar-version">
                    <strong>Alfresco ci4</strong>
                    <span>v<?= esc($appVersion) ?></span>
                </div>
            </div>
            <div id="sidebarResizeHandle" class="sidebar-resize-handle" role="separator" aria-orientation="vertical" aria-label="ปรับความกว้างแถบ folder" title="ลากเพื่อปรับความกว้าง" tabindex="0"></div>
        </aside>

        <section class="content">
            <div class="toolbar">
                <div>
                    <div id="folderCrumb" class="breadcrumb-line">หน้าหลัก</div>
                    <h1 id="selectedFolder">เลือกโฟลเดอร์เอกสาร</h1>
                    <div id="folderResultBadge" class="folder-result-badge" hidden></div>
                </div>
                <button id="reloadFoldersBtn" type="button" class="secondary-btn" title="โหลดรายการ folder ใหม่">
                    <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>
                    <span class="sr-only">โหลดรายการ folder ใหม่</span>
                </button>
            </div>

            <form id="searchForm" class="search-panel">
                <input type="hidden" id="folderPath" value="<?= esc($rootPath) ?>">

                <label>
                    <span class="search-input-wrap">
                        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                        <input id="keyword" type="search" placeholder="ค้นหาชื่อไฟล์ เช่น EVLPS701-0001">
                    </span>
                </label>

                <div class="actions">
                    <button type="submit" title="ค้นหาเอกสาร">
                        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                        <span>ค้นหา</span>
                    </button>
                    <button id="clearBtn" type="button" class="secondary-btn" title="ล้างคำค้น">
                        <i class="fa-solid fa-eraser" aria-hidden="true"></i>
                        <span>ล้าง</span>
                    </button>
                </div>

                <label class="page-size-field">
                    <!-- <span>จำนวนต่อหน้า</span> -->
                    <select id="pageSize" title="จำนวนรายการต่อหน้า" aria-label="จำนวนรายการต่อหน้า">
                        <option value="25" selected>25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                    </select>
                </label>
            </form>

            <div class="summary-strip">
                <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
                <span id="message">เลือก folder เพื่อโหลดเอกสาร</span>
            </div>

            <div class="table-wrap">
                <table>
                    <colgroup>
                        <col class="col-file-name">
                        <col class="col-file-created">
                        <col class="col-file-size">
                        <col class="col-file-meta">
                        <col class="col-file-actions">
                    </colgroup>
                    <thead>
                        <tr>
                            <th>
                                <button id="sortNameBtn" type="button" class="sort-header" aria-label="เรียงชื่อไฟล์" title="เรียงชื่อไฟล์">
                                    <span>ชื่อไฟล์</span>
                                    <i class="fa-solid fa-arrow-down-a-z" aria-hidden="true"></i>
                                </button>
                            </th>
                            <th>
                                <button id="sortCreatedBtn" type="button" class="sort-header" aria-label="เรียงวันที่สร้าง" title="เรียงวันที่สร้างล่าสุดก่อน">
                                    <span>วันที่สร้าง</span>
                                    <i class="fa-solid fa-arrow-down-wide-short" aria-hidden="true"></i>
                                </button>
                            </th>
                            <th>ขนาด</th>
                            <th>ข้อมูลไฟล์</th>
                            <th>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody id="documentRows">
                        <tr>
                            <td colspan="5" class="empty-state-cell">
                                <div class="empty-state">
                                    <i class="fa-solid fa-folder-open" aria-hidden="true"></i>
                                    <p>กรุณาเลือก folder เพื่อแสดงข้อมูลเอกสาร</p>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <nav class="pagination" aria-label="Document pagination">
                <div id="pageRangeInfo" class="page-range-info">แสดง 0 ถึง 0 จากทั้งหมด 0 รายการ</div>
                <div class="page-actions">
                    <button id="firstBtn" type="button" title="ไปหน้าแรก">
                        <i class="fa-solid fa-angles-left" aria-hidden="true"></i>
                        <span>หน้าแรก</span>
                    </button>
                    <button id="prevBtn" type="button" title="ไปหน้าก่อนหน้า">
                        <i class="fa-solid fa-angle-left" aria-hidden="true"></i>
                        <span>ก่อนหน้า</span>
                    </button>
                    <strong id="pageInfo">หน้า 1 / 1</strong>
                    <button id="nextBtn" type="button" title="ไปหน้าถัดไป">
                        <span>ถัดไป</span>
                        <i class="fa-solid fa-angle-right" aria-hidden="true"></i>
                    </button>
                    <button id="lastBtn" type="button" title="ไปหน้าสุดท้าย">
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
    <script src="<?= base_url('assets/js/direct-documents.js') ?>?v=<?= filemtime(FCPATH . 'assets/js/direct-documents.js') ?>"></script>
</body>
</html>
