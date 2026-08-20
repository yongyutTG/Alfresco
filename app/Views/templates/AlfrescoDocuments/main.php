<!DOCTYPE html>
<html lang="th">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= esc($title ?? 'ระบบจัดการเครื่องคอมพิวเตอร์') ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>

<body>
    <!-- ✅ Header -->
    <?= $this->include('templates/Pc/header') ?>


    <?= $this->renderSection('content') ?>


    <!-- ✅ Footer -->
    <?= $this->include('templates/Pc/footer') ?>

    <!-- ✅ Script ตรวจ session timeout -->
    <script>
    // ตรวจ session timeout ทุก 10 วินาที
    // async function checkSession() {
    //   try {
    //     const res = await fetch('<?= site_url('check-session') ?>');
    //     const data = await res.json();

    //     if (data.status === 'timeout') {
    //       Swal.fire({
    //         title: 'หมดเวลาการใช้งาน',
    //         text: 'กรุณาเข้าสู่ระบบใหม่',
    //         icon: 'warning',
    //         confirmButtonText: 'ตกลง',
    //         allowOutsideClick: false
    //       }).then(() => {
    //         window.location.href = '<?= site_url('logout') ?>';
    //       });
    //     }
    //   } catch (err) {
    //     console.error(err);
    //   }
    // }

    // setInterval(checkSession, 10000); // ทุก 10 วินาที
    </script>
</body>

</html>