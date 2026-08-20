<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

// CI4 ทำหน้าที่เสิร์ฟหน้าเว็บเท่านั้น
// JavaScript ในหน้าเว็บจะ fetch ไป UserAlfresco-api โดยตรง
$routes->get('login', 'AuthController::loginForm');

$routes->get('documents', 'DocumentController::index');
