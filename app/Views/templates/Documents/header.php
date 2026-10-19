<header class="topbar">
    <div class="topbar-brand">
        <button id="sidebarToggleBtn" type="button" class="sidebar-toggle-btn" aria-controls="documentSidebar" aria-expanded="true" aria-label="ซ่อนเมนูโฟลเดอร์" title="ซ่อนเมนูโฟลเดอร์">
            <i class="fa-solid fa-bars" aria-hidden="true"></i>
        </button>
        <a class="app-title" href="<?= site_url('documents') ?>">
            <img class="brand-logo small" src="<?= base_url('images/logo_coop.png') ?>" alt="Logo">
            <span>
                <strong class="coop-title">สหกรณ์ออมทรัพย์พนักงานบริษัท การบินไทย จำกัด</strong>
                <small class="coop-subtitle">เป็นสหกรณ์ออมทรัพย์ที่มั่นคง โปร่งใส ก้าวไกลด้วยเทคโนโลยี เอื้ออาทรต่อสมาชิกและสังคม</small>
            </span>
        </a>
    </div>

    <div class="user-box">
        <div class="user-menu-wrap">
            <button id="userMenuBtn" type="button" class="user-menu-trigger" aria-haspopup="menu" aria-expanded="false" aria-controls="userPermissionMenu" title="ดูสิทธิ์ในโฟลเดอร์ปัจจุบัน">
                <span class="user-meta">
                    <span class="user-primary">
                        <span class="user-label">ยินดีต้อนรับ</span>
                        <span id="userName" class="user-name">-</span>
                        <i class="fa-solid fa-chevron-down user-menu-chevron" aria-hidden="true"></i>
                    </span>
                    <span class="user-context" title="เซิร์ฟเวอร์และเวลาปัจจุบัน">
                        <span class="user-server"><i class="fa-solid fa-server" aria-hidden="true"></i><span id="serverName"><?= esc($serverLabel) ?></span></span>
                        <span class="user-context-divider" aria-hidden="true">•</span>
                        <time id="currentDateTime" datetime="">--/--/---- --:--</time>
                    </span>
                </span>
            </button>
            <div id="userPermissionMenu" class="user-permission-menu" role="menu" hidden>
                <div class="user-permission-heading">
                    <strong>สิทธิ์ในโฟลเดอร์ปัจจุบัน</strong>
                    <span id="permissionFolderName">กรุณาเลือกโฟลเดอร์</span>
                </div>
                <div id="permissionMenuStatus" class="user-permission-status" role="status" aria-live="polite">เปิดเมนูเพื่อโหลดข้อมูลสิทธิ์</div>
                <ul id="permissionMenuList" class="user-permission-list"></ul>
                <div class="user-permission-subheading">
                    <strong>สิทธิ์เอกสารในหน้าปัจจุบัน</strong>
                    <span>สรุปจากรายการเอกสารที่โหลดแล้ว</span>
                </div>
                <div id="documentPermissionStatus" class="user-permission-status">ยังไม่มีรายการเอกสาร</div>
                <ul id="documentPermissionList" class="user-permission-list"></ul>
            </div>
        </div>
        <button id="logoutBtn" type="button" class="logout-icon-btn" aria-label="ออกจากระบบ" title="ออกจากระบบ">
            <i class="fa-solid fa-power-off" aria-hidden="true"></i>
        </button>
    </div>
</header>
