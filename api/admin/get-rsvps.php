<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
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

$database = new Database();
$db = $database->getConnection();

// Get all RSVPs from unified table
$query = "
    SELECT wedding_type as type, id, name, email, phone, attending, number_of_guests, payment_amount, created_at 
    FROM rsvps
    ORDER BY created_at DESC
";

$stmt = $db->prepare($query);
$stmt->execute();

$rsvps = array();

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $rsvps[] = array(
        'type' => $row['type'],
        'id' => $row['id'],
        'name' => $row['name'],
        'email' => $row['email'],
        'phone' => $row['phone'],
        'attending' => (bool)$row['attending'],
        'number_of_guests' => (int)$row['number_of_guests'],
        'payment_amount' => floatval($row['payment_amount']),
        'created_at' => $row['created_at']
    );
}

// Calculate totals
$totalAttending = 0;
$totalNotAttending = 0;
$totalGuests = 0;
$totalPayment = 0;

foreach ($rsvps as $rsvp) {
    if ($rsvp['attending']) {
        $totalAttending++;
        $totalGuests += $rsvp['number_of_guests'];
    } else {
        $totalNotAttending++;
    }
    $totalPayment += $rsvp['payment_amount'];
}

echo json_encode(array(
    "success" => true,
    "rsvps" => $rsvps,
    "summary" => array(
        "total_rsvps" => count($rsvps),
        "total_attending" => $totalAttending,
        "total_not_attending" => $totalNotAttending,
        "total_guests" => $totalGuests,
        "total_payment" => $totalPayment
    )
));
?>
