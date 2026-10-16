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
