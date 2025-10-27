<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

session_start();

// Check if user is authenticated
if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(array(
        "message" => "Unauthorized access.",
        "success" => false
    ));
    exit;
}

include_once '../config/database.php';

$data = json_decode(file_get_contents("php://input"));

if (empty($data->id) || !isset($data->payment_amount)) {
    http_response_code(400);
    echo json_encode(array(
        "message" => "ID and payment amount are required.",
        "success" => false
    ));
    exit;
}

$database = new Database();
$db = $database->getConnection();

$payment_amount = floatval($data->payment_amount);

// Update payment in unified rsvps table
$query = "UPDATE rsvps SET payment_amount = :payment_amount WHERE id = :id";
$stmt = $db->prepare($query);
$stmt->bindParam(":id", $data->id, PDO::PARAM_INT);
$stmt->bindParam(":payment_amount", $payment_amount);

if ($stmt->execute()) {
    echo json_encode(array(
        "message" => "Payment updated successfully.",
        "success" => true
    ));
} else {
    http_response_code(500);
    echo json_encode(array(
        "message" => "Unable to update payment.",
        "success" => false
    ));
}
?>
