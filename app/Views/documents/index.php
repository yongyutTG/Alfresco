<!doctype html>
<html lang="th">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>เอกสาร Alfresco | Direct API</title>
    <link rel="stylesheet" href="<?= base_url('assets/css/app.css') ?>">
</head>
<body>
    <header class="topbar">
        <a class="app-title" href="<?= site_url('documents') ?>">
            <span class="brand-mark small">A</span>
            <span>
                <strong>Alfresco Direct</strong>
                <small>Document Browser</small>
            </span>
        </a>

        <div class="user-box">
            <span id="userAvatar" class="user-avatar">A</span>
            <span id="userName" class="user-name">-</span>
            <a id="logoutBtn" href="<?= site_url('login') ?>">Logout</a>
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
                <button id="reloadFoldersBtn" type="button" class="secondary-btn">Reload Folder</button>
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
                    <button type="submit">ค้นหา</button>
                    <button id="clearBtn" type="button" class="secondary-btn">ล้าง</button>
                </div>
            </form>

            <div class="summary-strip">
                <div>
                    <span class="summary-label">สถานะ</span>
                    <strong id="message">กรุณาเลือก folder หรือกดค้นหาเพื่อแสดงเอกสาร</strong>
                </div>
                <div>
                    <span class="summary-label">รายการที่แสดง</span>
                    <strong id="resultCount">0</strong>
                </div>
            </div>

            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>ชื่อไฟล์</th>
                            <th>ชนิดไฟล์</th>
                            <th>ขนาด</th>
                            <th>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody id="documentRows"></tbody>
                </table>
            </div>

            <nav class="pagination">
                <button id="firstBtn" type="button">หน้าแรก</button>
                <button id="prevBtn" type="button">«</button>
                <span id="pageInfo">หน้า 1</span>
                <button id="nextBtn" type="button">»</button>
            </nav>
        </section>
    </main>

    <script {csp-script-nonce}>
        window.AlfrescoDirect = {
            apiBaseUrl: <?= json_encode($apiBaseUrl) ?>,
            rootPath: <?= json_encode($rootPath, JSON_UNESCAPED_UNICODE) ?>,
            loginUrl: <?= json_encode(site_url('login')) ?>
        };
    </script>
    <script src="<?= base_url('assets/js/direct-documents.js') ?>"></script>
</body>
</html>
