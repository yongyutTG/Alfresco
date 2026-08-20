<?php

namespace App\Libraries;

use CodeIgniter\HTTP\CURLRequest;
use Config\Services;

class UserAlfrescoApiClient
{
    private string $baseUrl;
    private CURLRequest $http;

    public function __construct()
    {
        $this->baseUrl = rtrim((string) env('userAlfrescoApi.baseUrl'), '/');

        $this->http = Services::curlrequest([
            'baseURI'     => $this->baseUrl,
            'http_errors' => false,
            'timeout'     => (int) env('userAlfrescoApi.timeout', 30),
        ]);
    }

    /**
     * Step 1: ส่ง username/password ไปที่ Node API
     * Node API จะนำไปตรวจ login กับ Alfresco และคืน accessToken กลับมา
     */
    public function login(string $username, string $password): array
    {
        return $this->jsonRequest('POST', '/auth/login', [
            'json' => [
                'username' => $username,
                'password' => $password,
            ],
        ]);
    }

    /**
     * Step 2: ดึง folder ที่ user มีสิทธิ์เห็น
     * CI4 แนบ Bearer token ให้ Node API โดยไม่ต้องให้ browser เห็น token
     */
    public function folders(string $accessToken, string $path): array
    {
        return $this->jsonRequest('GET', '/user-api/alfresco/folders', [
            'headers' => $this->bearerHeaders($accessToken),
            'query'   => ['path' => $path],
        ]);
    }

    /**
     * Step 3: ดึงหรือค้นหาเอกสารใน folder ที่เลือก
     * q ว่าง = แสดงเอกสารทั้งหมด, q มีค่า = ค้นหาชื่อไฟล์
     */
    public function documents(string $accessToken, array $params): array
    {
        return $this->jsonRequest('GET', '/user-api/alfresco/documents', [
            'headers' => $this->bearerHeaders($accessToken),
            'query'   => $params,
        ]);
    }

    /**
     * Step 4: เปิดไฟล์จาก document id
     * คืน response ดิบเพราะเป็น PDF/ไฟล์ ไม่ใช่ JSON
     */
    public function content(string $accessToken, string $documentId, ?string $name = null): array
    {
        $query = [];

        if ($name !== null && $name !== '') {
            $query['name'] = $name;
        }

        $response = $this->http->get('/user-api/alfresco/documents/' . rawurlencode($documentId) . '/content', [
            'headers' => $this->bearerHeaders($accessToken),
            'query'   => $query,
        ]);

        return [
            'status'  => $response->getStatusCode(),
            'body'    => $response->getBody(),
            'headers' => $response->getHeaders(),
        ];
    }

    private function jsonRequest(string $method, string $uri, array $options = []): array
    {
        $response = $this->http->request($method, $uri, $options);
        $body = $response->getBody();
        $json = json_decode($body, true);

        return [
            'status' => $response->getStatusCode(),
            'data'   => is_array($json) ? $json : null,
            'body'   => $body,
        ];
    }

    private function bearerHeaders(string $accessToken): array
    {
        return [
            'Authorization' => 'Bearer ' . $accessToken,
            'Accept'        => 'application/json',
        ];
    }
}
