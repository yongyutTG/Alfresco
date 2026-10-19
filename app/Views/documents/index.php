<!doctype html>
<html lang="th">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Alfresco </title>
    <link rel="stylesheet" href="<?= base_url('assets/css/app.css') ?>">

    <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.css">
</head>
<body>
    <div id="bulkModal" class="session-modal" role="dialog" aria-modal="true" aria-labelledby="bulkTitle" hidden>
        <form id="bulkForm" class="session-dialog bulk-dialog">
            <div id="bulkDeleteIcon" class="bulk-delete-icon" aria-hidden="true" hidden>
                <i class="fa-regular fa-trash-can"></i>
            </div>
            <h2 id="bulkTitle">จัดการหลายรายการ</h2>
            <p id="bulkDescription"></p>
            <div class="bulk-layout">
                <section class="bulk-panel bulk-selected-panel" aria-labelledby="bulkSelectedTitle">
                    <h3 id="bulkSelectedTitle"><i class="fa-regular fa-file-lines" aria-hidden="true"></i> รายการที่เลือก</h3>
                    <ul id="bulkItems" class="bulk-items"></ul>
                </section>
                <section id="bulkDestination" class="bulk-panel bulk-destination-panel" aria-labelledby="bulkDestinationTitle">
                    <h3 id="bulkDestinationTitle"><i class="fa-solid fa-folder-tree" aria-hidden="true"></i> โฟลเดอร์ปลายทาง</h3>
                    <label class="rename-field">ค้นหาโฟลเดอร์ปลายทาง
                        <input id="bulkFolderSearch" type="search" autocomplete="off" placeholder="ค้นหาชื่อหรือเส้นทางโฟลเดอร์">
                    </label>
                    <label class="rename-field">เลือกโฟลเดอร์ปลายทาง
                        <select id="bulkTarget" size="7"></select>
                    </label>
                </section>
            </div>
            <p id="bulkTargetPath" class="rename-current-name bulk-target-summary"></p>
            <p id="bulkDeleteWarning" class="bulk-delete-warning" hidden>
                <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
                <span>การลบไฟล์ไม่สามารถย้อนกลับได้</span>
            </p>
            <p id="bulkStatus" role="status" aria-live="polite"></p>
            <ul id="bulkResults" class="bulk-items" aria-label="ผลการดำเนินการ" hidden></ul>
            <div class="session-actions split-actions">
                <button id="bulkConfirm" type="submit" title="ยืนยันการดำเนินการกับรายการที่เลือก">ยืนยัน</button>
                <button id="bulkCancel" type="button" class="secondary-btn" title="ยกเลิกและปิดหน้าต่าง">ยกเลิก</button>
            </div>
        </form>
    </div>
    <?= $this->include('templates/Documents/session_modals') ?>

    <div id="folderEditModal" class="session-modal" role="dialog" aria-modal="true" aria-labelledby="folderEditTitle" hidden>
        <form id="folderEditForm" class="session-dialog rename-dialog">
            <h2 id="folderEditTitle"></h2>
            <dl id="folderEditPath" class="folder-action-details">
                <div>
                    <dt><i class="fa-regular fa-folder" aria-hidden="true"></i> ชื่อโฟลเดอร์</dt>
                    <dd id="folderEditNameDisplay">-</dd>
                </div>
                <div>
                    <dt><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ตำแหน่ง</dt>
                    <dd id="folderEditLocation">-</dd>
                </div>
            </dl>
            <label id="folderEditNameField" class="rename-field"><span>ชื่อโฟลเดอร์ใหม่</span><input id="folderEditName" type="text" autocomplete="off"></label>
            <label id="folderEditTargetField" class="rename-field"><span>โฟลเดอร์ปลายทาง</span><select id="folderEditTarget"></select></label>
            <p id="folderEditStatus" role="status" aria-live="polite"></p>
            <div class="session-actions split-actions">
                <button id="folderEditSave" type="submit" title="บันทึกการแก้ไขโฟลเดอร์">บันทึก</button>
                <button id="folderEditCancel" type="button" class="secondary-btn" title="ยกเลิกและปิดหน้าต่าง">ยกเลิก</button>
            </div>
        </form>
    </div>

    <div id="deleteFolderModal" class="session-modal" role="dialog" aria-modal="true" aria-labelledby="deleteFolderTitle" hidden>
        <form id="deleteFolderForm" class="session-dialog rename-dialog">
            <h2 id="deleteFolderTitle">ลบโฟลเดอร์</h2>
            <dl id="deleteFolderPath" class="folder-action-details">
                <div>
                    <dt><i class="fa-regular fa-folder" aria-hidden="true"></i> ชื่อโฟลเดอร์</dt>
                    <dd id="deleteFolderName">-</dd>
                </div>
                <div>
                    <dt><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ตำแหน่ง</dt>
                    <dd id="deleteFolderLocation">-</dd>
                </div>
            </dl>
            <label><input id="deleteFolderRecursive" type="checkbox"> ลบพร้อมไฟล์และโฟลเดอร์ย่อยทั้งหมด</label>
            <p>การลบพร้อมเนื้อหาอาจสำเร็จเพียงบางส่วนหากมีรายการที่ไม่มีสิทธิ์ลบ</p>
            <label id="deleteFolderConfirmField" class="rename-field" hidden>
                <span>พิมพ์ชื่อโฟลเดอร์เพื่อยืนยัน</span>
                <input id="deleteFolderConfirmName" type="text" autocomplete="off">
            </label>
            <p id="deleteFolderStatus" role="status" aria-live="polite"></p>
            <div class="session-actions split-actions">
                <button id="deleteFolderSubmit" type="submit" class="danger-btn" title="ลบโฟลเดอร์ที่เลือก">ลบโฟลเดอร์ว่าง</button>
                <button id="deleteFolderCancel" type="button" class="secondary-btn" title="ยกเลิกและปิดหน้าต่าง">ยกเลิก</button>
            </div>
        </form>
    </div>

    <div id="createFolderModal" class="session-modal" role="dialog" aria-modal="true" aria-labelledby="createFolderTitle" aria-describedby="createFolderParent" hidden>
        <form id="createFolderForm" class="session-dialog rename-dialog">
            <div class="rename-icon" aria-hidden="true"><i class="fa-solid fa-folder-plus"></i></div>
            <h2 id="createFolderTitle">สร้างโฟลเดอร์</h2>
            <p id="createFolderParent" class="rename-current-name"></p>
            <label class="rename-field">
                <span>ชื่อโฟลเดอร์</span>
                <input id="createFolderName" type="text" autocomplete="off" required>
            </label>
            <p id="createFolderError" role="alert" hidden></p>
            <div class="session-actions split-actions">
                <button id="createFolderSaveBtn" type="submit" title="สร้างโฟลเดอร์ใหม่">สร้างโฟลเดอร์</button>
                <button id="createFolderCancelBtn" type="button" class="secondary-btn" title="ยกเลิกและปิดหน้าต่าง">ยกเลิก</button>
            </div>
        </form>
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
                <button id="renameFileSaveBtn" type="submit" title="บันทึกชื่อไฟล์ใหม่">
                    <i class="fa-solid fa-floppy-disk" aria-hidden="true"></i>
                    <span>บันทึก</span>
                </button>
                <button id="renameFileCancelBtn" type="button" class="secondary-btn" title="ยกเลิกและปิดหน้าต่าง">ยกเลิก</button>
            </div>
        </form>
    </div>

    <div id="updateFileModal" class="session-modal" role="dialog" aria-modal="true" aria-labelledby="updateFileTitle" hidden>
        <form id="updateFileForm" class="session-dialog update-file-dialog">
            <div class="update-file-icon" aria-hidden="true">
                <i class="fa-solid fa-file-arrow-up"></i>
            </div>
            <h2 id="updateFileTitle">อัปเดตไฟล์</h2>
            <p id="updateFileCurrentName" class="rename-current-name">-</p>
            <label class="rename-field">
                <span>เลือกไฟล์ใหม่</span>
                <input id="updateFileInput" type="file" required>
            </label>
            <div class="session-actions split-actions">
                <button id="updateFileSaveBtn" type="submit" title="อัปเดตเนื้อหาไฟล์">
                    <i class="fa-solid fa-file-arrow-up" aria-hidden="true"></i>
                    <span>อัปเดต</span>
                </button>
                <button id="updateFileCancelBtn" type="button" class="secondary-btn" title="ยกเลิกและปิดหน้าต่าง">ยกเลิก</button>
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
                <button id="deleteFileConfirmBtn" type="button" class="danger-btn" title="ยืนยันการลบไฟล์">
                    <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
                    <span>ลบไฟล์</span>
                </button>
                <button id="deleteFileCancelBtn" type="button" class="secondary-btn" title="ยกเลิกและปิดหน้าต่าง">ยกเลิก</button>
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
                <button id="fileInfoDetailsTab" type="button" class="file-info-tab active" role="tab" aria-selected="true" aria-controls="fileInfoDetailsPanel" data-file-info-tab="details" title="ดูข้อมูลไฟล์">
                    <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
                    <span>ข้อมูลไฟล์</span>
                </button>
                <button id="fileInfoVersionsTab" type="button" class="file-info-tab" role="tab" aria-selected="false" aria-controls="fileInfoVersionsPanel" data-file-info-tab="versions" title="ดูประวัติเวอร์ชัน">
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
                <button id="fileInfoCloseBtn" type="button" class="secondary-btn" title="ปิดรายละเอียดไฟล์">ปิด</button>
            </div>
        </div>
    </div>

    <?= $this->include('templates/Documents/header') ?>

    <main class="app-layout">
        <?= $this->include('templates/Documents/sidebar') ?>

        <section class="content">
            <div class="toolbar">
                <div>
                    <div id="folderCrumb" class="breadcrumb-line">หน้าหลัก</div>
                    <h1 id="selectedFolder">เลือกโฟลเดอร์เอกสาร</h1>
                    <div id="folderResultBadge" class="folder-result-badge" hidden></div>
                </div>
                <div class="folder-toolbar-actions">
                    <span id="createFolderTooltip" class="button-tooltip-host" title="เลือกโฟลเดอร์ปลายทางก่อนสร้าง">
                        <button id="createFolderBtn" type="button" disabled title="เลือกโฟลเดอร์ปลายทางก่อนสร้าง">
                            <i class="fa-solid fa-folder-plus" aria-hidden="true"></i>
                            <span>สร้างโฟลเดอร์</span>
                        </button>
                    </span>
                    <div id="folderDeleteMenu" class="row-more-actions" hidden>
                        <button id="folderMoreBtn" type="button" class="row-more-btn icon-action-btn" aria-label="จัดการโฟลเดอร์ที่เลือก" title="จัดการโฟลเดอร์ที่เลือก" aria-haspopup="menu" aria-expanded="false" aria-controls="folderActionMenu"><i class="fa-solid fa-ellipsis-vertical" aria-hidden="true"></i></button>
                        <div id="folderActionMenu" class="row-action-menu" role="menu" hidden>
                            <button id="renameFolderBtn" type="button" class="row-action-menu-item" role="menuitem" title="เปลี่ยนชื่อโฟลเดอร์ที่เลือก"><i class="fa-regular fa-pen-to-square" aria-hidden="true"></i><span>เปลี่ยนชื่อโฟลเดอร์</span></button>
                            <button id="moveFolderBtn" type="button" class="row-action-menu-item" role="menuitem" title="ย้ายโฟลเดอร์ที่เลือก"><i class="fa-solid fa-folder-open" aria-hidden="true"></i><span>ย้ายโฟลเดอร์</span></button>
                            <button id="deleteFolderBtn" type="button" class="row-action-menu-item" role="menuitem" title="ลบโฟลเดอร์ที่เลือก"><i class="fa-regular fa-trash-can" aria-hidden="true"></i><span>ลบโฟลเดอร์</span></button>
                        </div>
                    </div>
                    <button id="uploadFilePlaceholderBtn" type="button" class="secondary-btn" disabled title="เตรียมไว้สำหรับฟังก์ชันอัปโหลดไฟล์" hidden>
                        <i class="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i>
                        <span>อัปโหลดไฟล์</span>
                    </button>
                </div>
            </div>

            <form id="searchForm" class="search-panel">
                <input type="hidden" id="folderPath" value="<?= esc($rootPath) ?>">

                <div class="search-primary-row">
                    <label class="search-keyword-field">
                        <span class="search-input-wrap">
                            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                            <input id="keyword" type="search" placeholder="ค้นหาชื่อไฟล์ เช่น EVLPS701-0001 หรือคำค้นอื่นๆ">
                        </span>
                    </label>
                    <button type="submit" title="ค้นหาเอกสาร">
                        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                        <span>ค้นหา</span>
                    </button>
                    <button id="reloadFoldersBtn" type="button" class="secondary-btn" title="โหลดรายการโฟลเดอร์และเอกสารใหม่">
                        <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>
                        <span>รีเฟรช</span>
                    </button>
                </div>

            </form>

            <div class="summary-strip">
                <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
                <span id="message">เลือกโฟลเดอร์เพื่อโหลดเอกสาร</span>
            </div>

            <div id="bulkDocumentActions" class="bulk-actions" hidden>
                <div class="bulk-selection-summary">
                    <span class="bulk-selection-check"><i class="fa-solid fa-check" aria-hidden="true"></i></span>
                    <strong id="bulkDocumentCount" aria-live="polite">เลือกแล้ว 0 ไฟล์</strong>
                </div>
                <div class="bulk-selection-commands">
                    <span id="bulkDownloadTooltip" class="button-tooltip-host" title="ดาวน์โหลดไฟล์ที่เลือก"><button id="bulkDownloadDocuments" type="button" class="secondary-btn" title="ดาวน์โหลดไฟล์ที่เลือก"><i class="fa-solid fa-download" aria-hidden="true"></i><span>ดาวน์โหลด</span></button></span>
                    <span id="bulkMoveTooltip" class="button-tooltip-host" title="ย้ายไฟล์ที่เลือกไปยังโฟลเดอร์อื่น"><button id="bulkMoveDocuments" type="button" class="secondary-btn" title="ย้ายไฟล์ที่เลือกไปยังโฟลเดอร์อื่น"><i class="fa-solid fa-folder-arrow-up" aria-hidden="true"></i><span>ย้ายไปโฟลเดอร์</span></button></span>
                    <span id="bulkDeleteTooltip" class="button-tooltip-host" title="ลบไฟล์ที่เลือก"><button id="bulkDeleteDocuments" type="button" class="danger-outline-btn" title="ลบไฟล์ที่เลือก"><i class="fa-regular fa-trash-can" aria-hidden="true"></i><span>ลบไฟล์</span></button></span>
                    <button id="bulkClearDocuments" type="button" class="secondary-btn" title="ล้างการเลือกไฟล์ทั้งหมด"><i class="fa-solid fa-xmark" aria-hidden="true"></i><span>ล้างการเลือก</span></button>
                </div>
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
                                <input id="bulkSelectPage" class="bulk-checkbox" type="checkbox" aria-label="เลือกไฟล์ทั้งหมดในหน้านี้" title="เลือกไฟล์ทั้งหมดในหน้านี้" disabled>
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
                                    <p>กรุณาเลือกโฟลเดอร์เพื่อแสดงข้อมูลเอกสาร</p>
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
                <label class="page-size-field">
                    <span>รายการต่อหน้า</span>
                    <select id="pageSize" title="จำนวนรายการต่อหน้า" aria-label="จำนวนรายการต่อหน้า">
                        <option value="25" selected>25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                    </select>
                </label>
            </nav>
        </section>
    </main>

    <?= $this->include('templates/Documents/scripts') ?>
</body>
</html>
