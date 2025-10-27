<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

session_start();

if (isset($_SESSION['admin_id']) && isset($_SESSION['admin_email'])) {
    echo json_encode(array(
        "authenticated" => true,
        "email" => $_SESSION['admin_email']
    ));
} else {
    http_response_code(401);
    echo json_encode(array(
        "authenticated" => false
    ));
}
?>
