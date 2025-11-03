<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once 'config/database.php';

// Get posted data
$data = json_decode(file_get_contents("php://input"));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Validate required fields
    if (
        !empty($data->name) &&
        !empty($data->phone) &&
        isset($data->attending) &&
        !empty($data->number_of_guests)
    ) {
        $database = new Database();
        $db = $database->getConnection();

        // Check if phone already exists for this wedding type
        $checkQuery = "SELECT id FROM rsvps WHERE phone = :phone AND wedding_type = :wedding_type";
        $checkStmt = $db->prepare($checkQuery);
        $phone = htmlspecialchars(strip_tags($data->phone));
        $wedding_type = 'bride';
        $checkStmt->bindParam(":phone", $phone);
        $checkStmt->bindParam(":wedding_type", $wedding_type);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() > 0) {
            http_response_code(409); // Conflict
            echo json_encode(array(
                "message" => "This phone number has already submitted an RSVP for the bride's wedding.",
                "success" => false
            ));
            exit;
        }

        // Insert new RSVP
        $query = "INSERT INTO rsvps 
                  (name, email, phone, attending, number_of_guests, wedding_type) 
                  VALUES 
                  (:name, :email, :phone, :attending, :number_of_guests, :wedding_type)";

        $stmt = $db->prepare($query);

        // Sanitize data
        $name = htmlspecialchars(strip_tags($data->name));
        $email = isset($data->email) && !empty($data->email) ? htmlspecialchars(strip_tags($data->email)) : null;
        $attending = (bool)$data->attending;
        $number_of_guests = (int)$data->number_of_guests;

        // Bind parameters
        $stmt->bindParam(":name", $name);
        $stmt->bindParam(":email", $email);
        $stmt->bindParam(":phone", $phone);
        $stmt->bindParam(":attending", $attending, PDO::PARAM_BOOL);
        $stmt->bindParam(":number_of_guests", $number_of_guests);
        $stmt->bindParam(":wedding_type", $wedding_type);

        // Execute query
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(array(
                "message" => "RSVP submitted successfully.",
                "success" => true
            ));
        } else {
            http_response_code(503);
            echo json_encode(array(
                "message" => "Unable to submit RSVP.",
                "success" => false
            ));
        }
    } else {
        http_response_code(400);
        echo json_encode(array(
            "message" => "Unable to submit RSVP. Data is incomplete.",
            "success" => false
        ));
    }
} else {
    http_response_code(405);
    echo json_encode(array(
        "message" => "Method not allowed.",
        "success" => false
    ));
}
?>

