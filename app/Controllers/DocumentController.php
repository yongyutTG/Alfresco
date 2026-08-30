<?php

namespace App\Controllers;

class DocumentController extends BaseController
{
    private string $rootPath = '/Sites/tg-saving/documentLibrary';

    public function index()
    {
        return view('documents/index', [
            'apiBaseUrl' => rtrim((string) env('userAlfrescoApi.baseUrl', 'http://localhost:3001'), '/'),
            'rootPath'   => $this->rootPath,
            'appVersion' => (string) env('app.version', '1.0.0'),
            'idleTimeoutSeconds' => (int) env('SESSION_IDLE_TIMEOUT'),
        ]);
    }
}
