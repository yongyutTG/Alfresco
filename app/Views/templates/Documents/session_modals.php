<div id="sessionTimeoutModal" class="session-modal" role="dialog" aria-modal="true" aria-labelledby="sessionTimeoutTitle" hidden>
    <div class="session-dialog">
        <div class="session-icon" aria-hidden="true">!</div>
        <h2 id="sessionTimeoutTitle">เซสชันหมดอายุ</h2>
        <p id="sessionTimeoutMessage">เซสชันหมดอายุเนื่องจากไม่มีการใช้งาน กรุณาเข้าสู่ระบบใหม่</p>
        <div class="session-actions">
            <button id="sessionTimeoutOkBtn" type="button" title="กลับไปยังหน้าเข้าสู่ระบบ">ตกลง</button>
        </div>
    </div>
</div>

<div id="logoutConfirmModal" class="session-modal" role="dialog" aria-modal="true" aria-labelledby="logoutConfirmTitle" hidden>
    <div class="session-dialog logout-dialog">
        <div class="logout-icon" aria-hidden="true">?</div>
        <h2 id="logoutConfirmTitle">ยืนยันการออกจากระบบ</h2>
        <p>คุณต้องการออกจากระบบหรือไม่ ?</p>
        <div class="session-actions split-actions">
            <button id="logoutConfirmBtn" type="button" class="danger-btn" title="ยืนยันการออกจากระบบ">ออกจากระบบ</button>
            <button id="logoutCancelBtn" type="button" class="secondary-btn" title="ยกเลิกการออกจากระบบ">ยกเลิก</button>
        </div>
    </div>
</div>
