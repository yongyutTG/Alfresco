<?php

namespace App\Controllers;

class AuthController extends BaseController
{
    public function loginForm()
    {
        return view('auth/login', [
            'apiBaseUrl' => rtrim((string) env('userAlfrescoApi.baseUrl'), '/'),
            'appVersion' => (string) env('app.version'),
            'idleTimeoutSeconds' => (int) env('SESSION_IDLE_TIMEOUT'),
        ]);
    }
}
