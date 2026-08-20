<?php

namespace App\Controllers;

class AuthController extends BaseController
{
    public function loginForm()
    {
        return view('auth/login', [
            'apiBaseUrl' => rtrim((string) env('userAlfrescoApi.baseUrl', 'http://localhost:3001'), '/'),
        ]);
    }
}
