# Sequential file uploads

## Upload dialog

While a request is active, Stop after this file requests a graceful pause.
The current upload is not aborted; its result is recorded before stopping.
Resume sends only pending files. Failed files use the separate Retry button;
unknown outcomes are never automatically replayed. The selected destination
and files remain in memory while the dialog is open. Closing and reopening or
reloading the page does not restore this queue. The delete workflow is unchanged.

Backdrop clicks and Escape do not dismiss the dialog. Close/Done must be
clicked explicitly; these buttons remain disabled while uploading.

Drag files onto the drop zone or select files with the Choose/Add button.
Selections accumulate across picks. Remove a pending or failed file with its
X button. Duplicate names are skipped with a notice. Empty and oversized files
remain visible with validation errors and are excluded from upload requests.
The Uppy-inspired list shows file-type icons, filenames, sizes, status and
per-file errors. A bottom status area shows aggregate progress and actions.
On narrow screens status moves below the filename without horizontal scrolling.
Selection and removal
are disabled during an upload. The progress bar measures resolved file results,
not transferred bytes. Successful files cannot be resent from the same dialog.
The dialog stays open after completion with success icons and a Done button.
Partial failures remain available for review and retry. Unknown results must
be checked at the destination first.

Select a folder with canUpload permission. Select up to 100 non-empty files,
each at most 25 MiB. The browser sends one file at a time to
POST /user-api/alfresco/documents using Bearer authentication.
The multipart fields are folderPath and file. Each response updates that file
before the next request starts. Pending files show a clock, the current file
a spinner, successful files a green check, and failures a warning.
The bulk-upload endpoint remains available to external API clients.

Progress counts completed files, not bytes transmitted.
Retry resends only explicit failures, never successes. For uncertain
network/server errors, inspect the target folder before selecting files again.
Keep the tab open until completion. Alfresco enforces actual user permissions.

After upload, the table reloads the upload destination on page one with an
empty search and creation date descending. This prevents an old search or
pagination setting from hiding newly uploaded documents.
