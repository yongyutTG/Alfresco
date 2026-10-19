# Folder deletion

The same three-dot menu also provides rename and move when canRename/canMove are
true. Both use PATCH /user-api/alfresco/folders/:id with JSON name or targetFolderPath
and the current Bearer token. Move choices exclude self, descendants and current
parent. The tree refreshes after submission; uncertain errors require checking
the refreshed state before retrying.

Select a folder, open the three-dot dropdown next to the create-folder button,
then choose "ลบโฟลเดอร์". It shares the file-row action menu styling. The delete
command is shown only when the API reports permissions.canDelete or
permissions.canDeleteTree. The document library root has no delete command.

Default: delete an empty folder. To delete contents, check the recursive option
and type the exact folder name. The API independently validates permissions and
the name. The dialog disables controls during submission and refreshes the tree
after the request, including partial and uncertain outcomes.

DELETE /user-api/alfresco/folders/:id?recursive=false

Recursive: DELETE /user-api/alfresco/folders/:id?recursive=true with JSON
{ "confirmName": "exact folder name" }. Both requests use the existing Bearer
token flow through requestJson. HTTP 207 is an incomplete deletion, not full success.
No automatic retries are performed. Do not promise restoration after deletion.
