<aside class="sidebar">
    <div class="side-section">
        <button id="bulkFolderMode" type="button" class="secondary-btn" aria-expanded="false" aria-controls="bulkFolderPanel" hidden disabled>เลือกโฟลเดอร์เพื่อย้าย</button>
        <div id="bulkFolderPanel" hidden>
            <p>เมื่อเลือกโฟลเดอร์แม่ จะย้ายโฟลเดอร์ลูกไปด้วย</p>
            <div id="bulkFolderChoices" class="bulk-folder-choices"></div>
            <div class="bulk-actions">
                <span id="bulkFolderCount" aria-live="polite">เลือก 0 โฟลเดอร์</span>
                <button id="bulkMoveFolders" type="button" disabled>ย้ายโฟลเดอร์</button>
                <button id="bulkClearFolders" type="button" class="secondary-btn">ล้างการเลือก</button>
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
