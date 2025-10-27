<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

session_start();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->email) || empty($data->password)) {
        http_response_code(400);
        echo json_encode(array(
            "message" => "Email and password are required.",
            "success" => false
        ));
        exit;
    }

    $database = new Database();
    $db = $database->getConnection();

    // Get user from database
    $query = "SELECT id, email, password FROM admin_users WHERE email = :email LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":email", $data->email);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Verify password (simple comparison for demo, in production use password_verify)
        // For now, checking against specific credentials
        if (
            ($data->email === 'angjinsheng@gmail.com' && $data->password === '920214') ||
            ($data->email === 'psong32@hotmail.com' && $data->password === '921119')
        ) {
            // Set session
            $_SESSION['admin_id'] = $row['id'];
            $_SESSION['admin_email'] = $row['email'];
            
            http_response_code(200);
            echo json_encode(array(
                "message" => "Login successful.",
                "success" => true,
                "email" => $row['email']
            ));
        } else {
            http_response_code(401);
            echo json_encode(array(
                "message" => "Invalid credentials.",
                "success" => false
            ));
        }
    } else {
        http_response_code(401);
        echo json_encode(array(
            "message" => "Invalid credentials.",
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
