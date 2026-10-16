<script {csp-script-nonce}>
    window.AlfrescoDirect = {
        apiBaseUrl: <?= json_encode($apiBaseUrl) ?>,
        rootPath: <?= json_encode($rootPath, JSON_UNESCAPED_UNICODE) ?>,
        loginUrl: <?= json_encode(site_url('login')) ?>,
        idleTimeoutSeconds: <?= json_encode($idleTimeoutSeconds) ?>
    };
</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js"></script>
<script src="<?= base_url('assets/js/direct-bulk.js') ?>?v=<?= filemtime(FCPATH . 'assets/js/direct-bulk.js') ?>"></script>
<script src="<?= base_url('assets/js/direct-documents.js') ?>?v=<?= filemtime(FCPATH . 'assets/js/direct-documents.js') ?>"></script>
