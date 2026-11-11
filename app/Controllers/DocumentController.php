<?php

namespace App\Controllers;

class DocumentController extends BaseController
{
    private string $rootPath = '/Sites/tg-saving/documentLibrary';

    public function index()
    {
        return view('documents/index', [
            'apiBaseUrl' => rtrim((string) env('userAlfrescoApi.baseUrl'), '/'),
            'rootPath'   => $this->rootPath,
            'appVersion' => (string) env('app.version'),
            'serverLabel' => (string) env('app.serverLabel'),
            'idleTimeoutSeconds' => (int) env('SESSION_IDLE_TIMEOUT'),
        ]);
    }
}
