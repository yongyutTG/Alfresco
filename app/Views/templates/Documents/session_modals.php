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
