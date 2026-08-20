<?php
$db = \Config\Database::connect();
$dbName = $db->database;

$query = $db->query("SELECT CONVERT(varchar(19), GETDATE(), 120) AS [db_date]");
$row = $query->getRow();

if ($row && isset($row->db_date)) {
    $date = new \DateTime($row->db_date);
    $data['dbDate'] = $date->format('d/m/Y H:i:s'); // 20/10/2025 22:10:31
} else {
    $data['dbDate'] = '-';
}
?>

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>

    <script src="https://kit.fontawesome.com/347f221dac.js" crossorigin="anonymous"></script>

    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" rel="stylesheet">

    <link href="https://fonts.googleapis.com/css2?family=Kanit&display=swap" rel="stylesheet">

    <!-- toastr -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.css" rel="stylesheet" />
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js"></script>


    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>




    <script src="https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.19.0/js/md5.min.js"></script>

    <!-- Include flatpickr CSS & JS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
    <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>

    <!-- DataTables -->
    <link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css">
    <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap5.min.js"></script>

    <!-- โหลด Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <!-- ================= JS ================= -->
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2"></script>


    <link rel="stylesheet" href="<?= base_url('css/style.css') ?>">

    <!-- โหลด Api -->
    <script>
    window.BASE_URL = "<?= base_url() ?>";
    window.CSRF_TOKEN = "<?= csrf_hash() ?>";
    </script>
    <script src="<?= base_url('assets/js/api.js') ?>"></script>

    <title>PC Detail</title>

</head>

<body>
    <div class="sidebar active">
        <div class="logo-content">
            <div class="logo">
                <i class="fa-solid fa-c"></i>
                <div class="logo-name">PC Detail</div>
            </div>
            <!-- <i class="fa-solid fa-x hide" id="btn"></i> -->
            <i class="fa-solid fa-bars" id="btn"></i>
        </div>
        <ul class="nav-list">
            <li>
                <a href="<?= base_url('dashboard') ?>">
                    <i class="fa-solid fa-house-chimney"></i>
                    <span class="link-name">Dashboard</span>
                </a>
                <p class="tool">Dashboard</p>
            </li>
            <li>
                <a href="<?= base_url('all-listPC') ?>">
                    <i class="fa-solid fa-computer"></i>
                    <span class="link-name">listPC</span>
                </a>
                <p class="tool">listPC</p>
            </li>
            <li>
                <a href="<?= base_url('logPC') ?>">
                    <i class="fa-solid fa-file-lines"></i>
                    <span class="link-name">LogPC</span>
                </a>
                <p class="tool">LogPC</p>
            </li>
            <li>
                <a href="<?= base_url('ScanIP') ?>">
                    <i class="fa-solid fa-signal"></i>
                    <span class="link-name">ScanIP</span>
                </a>
                <p class="tool">ScanIP</p>
            </li>
            <li>
                <a href="javascript:void(0)" onclick="confirmLogout()">
                    <i class="fa-solid fa-right-from-bracket"></i>
                    <span class="link-name">Logout</span>
                </a>
                <p class="tool">Logout</p>
            </li>
        </ul>

    </div>
    <header>
        <nav class="navbar navbar-expand-lg bg-light p-0 fixed-top">
            <div class="container-fluid d-flex justify-content-between align-items-center">
                <!-- ฝั่งซ้าย: โลโก้และชื่อ -->
                <a class="navbar-brand text-dark fw-bold d-flex align-items-center">
                    <img src="<?= base_url('images/logo_coop.png') ?>" alt="Logo" width="50" height="50" class="me-3">
                    <div class="d-flex flex-column">
                        <span class="coop-title">สหกรณ์ออมทรัพย์พนักงานบริษัท การบินไทย จำกัด</span>
                        <small class="coop-subtitle">
                            เป็นสหกรณ์ออมทรัพย์ที่มั่นคง โปร่งใส ก้าวไกลด้วยเทคโนโลยี เอื้ออาทรต่อสมาชิกและสังคม
                        </small>
                    </div>
                </a>


                <!-- ฝั่งขวา: โปรไฟล์ -->
                <div class="dropdown">
                    <div class="dropdown ms-lg-3 mt-2 mt-lg-0">
                        <a class="btn btn-light dropdown-toggle w-100 d-flex flex-column align-items-end text-end"
                            href="#" data-bs-toggle="dropdown">
                            <div>
                                ชื่อผู้ใช้: <?= esc(session()->get('USER_NAME')) ?>
                                ฐานข้อมูล: <?= esc($dbName ?? '-') ?>
                                <!-- วันที่: <span class="text-success"><?= esc($dbDate ?? '-') ?></span> -->
                            </div>
                            <div class="fw-bold">
                                <?= esc(session()->get('FULL_NAME')) ?>
                                <i class="bi bi-person-circle fs-4 ms-2"></i> <!-- ไอคอนชิดขวา -->
                            </div>
                        </a>


                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <a class="dropdown-item" href="#" data-bs-toggle="modal"
                                    data-bs-target="#profileModal"><i class="bi bi-person"></i> โปรไฟล์</a>
                            </li>
                            <li>
                                <a class="dropdown-item" href="#" data-bs-toggle="modal"
                                    data-bs-target="#changPasswordModal"><i class="bi bi-key-fill"></i>
                                    เปลี่ยนรหัสผ่าน</a>
                            </li>
                            <li>
                                <a class="dropdown-item text-danger" href="javascript:void(0)"
                                    onclick="confirmLogout()">
                                    <i class="bi bi-box-arrow-right"></i> ออกจากระบบ
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
        </nav>
    </header>
</body>
/* ================== Modal profile ================== */
<div class="modal fade" id="profileModal" tabindex="-1" aria-labelledby="profileModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header custom-header">
                <h5 class="modal-title" id="profileModalLabel">โปรไฟล์</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <p><strong>ชื่อผู้ใช้:</strong> <?= esc(session()->get('USER_NAME')) ?></p>
                <p><strong>ฝ่าย:</strong> <?= esc(session()->get('GROUP_NAME')) ?></p>
                <p><strong>ชื่อ-นามสกุล:</strong> <?= esc(session()->get('FULL_NAME')) ?></p>

                <p><strong>Email:</strong> <?= esc(session()->get('EMAIL')) ?></p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ปิด</button>
            </div>
        </div>
    </div>
</div>

/* ================== Modal change password ================== */
<div class="modal fade" id="changPasswordModal" tabindex="-1" aria-labelledby="changPasswordModalLabel"
    aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header custom-header">
                <h5 class="modal-title" id="changPasswordModalLabel"><i class="bi bi-key-fill"></i> เปลี่ยนรหัสผ่าน</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"
                    aria-label="ปิด"></button>
            </div>
            <div class="modal-body">
                <form id="changePasswordForm">
                    <div class="mb-3">
                        <label>รหัสผ่านเดิม</label>
                        <input type="password" name="old_password" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label>รหัสผ่านใหม่</label>
                        <input type="password" name="new_password" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label>ยืนยันรหัสผ่านใหม่</label>
                        <input type="password" name="confirm_password" class="form-control" required>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" class="btn btn-save">บันทึกรหัสผ่านใหม่</button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ปิด</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>


<script>
document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("changePasswordForm");
    form.addEventListener("submit", async function(e) {
        e.preventDefault();
        const oldPass = form.old_password.value.trim();
        const newPass = form.new_password.value.trim();
        const confirmPass = form.confirm_password.value.trim();
        if (newPass !== confirmPass) {
            toastr.error("รหัสผ่านใหม่ไม่ตรงกัน");
            return;
        }

        // เข้ารหัสก่อนส่ง
        const md5oldPass = md5(oldPass);
        const md5newPass = md5(newPass);

        try {
            const response = await fetch("<?= site_url('user/changePassword') ?>", {
                method: "POST",
                headers: apiHeaders,
                body: JSON.stringify({
                    old_password: md5oldPass,
                    new_password: md5newPass
                }),
            });

            const result = await response.json();

            if (result.status === "success") {
                toastr.success(result.message);
                form.reset();
                const modal = bootstrap.Modal.getInstance(document.getElementById(
                    "changPasswordModal"));
                modal.hide();
            } else {
                toastr.error(result.message);
            }
        } catch (error) {
            toastr.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        }
    });
});
</script>

<script>
function confirmLogout() {
    toastr.info(
        '<div style="text-align:center;">คุณต้องการออกจากระบบหรือไม่ ?<br><br>' +
        '<button type="button" id="btnYes" class="btn btn-sm btn-danger">ออกจากระบบ</button> ' +
        '<button type="button" id="btnNo" class="btn btn-sm btn-secondary">ยกเลิก</button>' +
        '</div>',
        'ยืนยัน', {
            closeButton: true,
        }
    );
    $(document).on("click", "#btnYes", function() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = "<?= site_url('login') ?>";
    });
    $(document).on("click", "#btnNo", function() {
        toastr.close();
    });
}
</script>

<script>
let sessionTimeoutShown = false;
setInterval(checkSession, 30000);

async function checkSession() {
    try {
        const res = await fetch("<?= base_url('check-session') ?>", {
            method: "GET",
        });
        if (res.status === 401) {
            console.log("Session timeout (401)");
            showSessionExpired();
            return;
        }
        const result = await res.json();
        if (result.status === "timeout") {
            console.log("Session Timeout");
            showSessionExpired();
            return;
        }
        if (result.status === "active") {
            const loginTime = new Date().toLocaleString("th-TH", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });
            console.log("Session Active:", {
                datetime: loginTime
            });
        }

    } catch (error) {
        console.error(error);
    }
}

function showSessionExpired() {
    if (sessionTimeoutShown) return;
    sessionTimeoutShown = true;
    Swal.fire({
        icon: 'warning',
        title: 'Session หมดอายุ',
        text: 'ไม่มีการใช้งานเกิน 30 นาที กรุณาเข้าสู่ระบบใหม่',
        confirmButtonText: 'ตกลง',
        allowOutsideClick: false,
        allowEscapeKey: false
    }).then(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = "<?= site_url('login') ?>";
    });
    log_message(
        'info',
        "[SessionTimeout] for user: {$input_username}"
    );
}
</script>