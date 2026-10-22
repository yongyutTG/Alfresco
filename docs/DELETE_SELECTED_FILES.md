# Delete selected files

Backdrop clicks and Escape do not close the confirmation/results dialog.
Only its explicit Cancel/Close/Done button dismisses it, and that button is
disabled while requests are in progress. This also applies to the shared
selected-file/folder move dialog.

The user selects files and confirms the names/count once. The browser calls
DELETE /user-api/alfresco/documents/:id sequentially with the current Bearer
token. The bulk-delete endpoint is not used by this button anymore.

The confirmation dialog shows waiting, deleting, success, failure or unknown
for each file. Only a response with deleted=true confirms success. Confirmed
files are removed from the selection; the table refreshes after the queue.
The dialog remains open for review. Alfresco enforces each user's permissions.

A bottom progress bar counts resolved requests (success, failure or unknown),
not only successful deletions. The text separately reports the success count
and the currently deleting filename. If the queue stops early, the bar remains
partially filled. Results remain visible until the user clicks Done.

No request is retried automatically. Network/5xx errors or unexpected responses
stop the queue because deletion may already have happened. A 401 or 429 also
stops remaining requests. Other explicit rejection responses are shown and the
queue continues. Unsent files remain selected. Inspect the refreshed folder
before confirming another delete. There is no rollback of successful deletes.

Bulk moves and the backend bulk-delete endpoint remain unchanged.
