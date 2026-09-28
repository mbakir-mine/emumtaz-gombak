<?php

return [
    'paths' => ['api/*', 'api/auth/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_values(array_filter([
        env('FRONTEND_URL', 'https://emumtaz.ismp.my'),
    ])),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
