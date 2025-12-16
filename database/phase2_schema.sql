-- Phase 2: Database Schema for Photos, Comments, Likes, Tags, Videos, Timeline
-- Run this after the basic wedding_rsvp database is set up

USE wedding_rsvp;

-- Photos table
CREATE TABLE IF NOT EXISTS photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(255) NOT NULL,
    user_phone VARCHAR(50) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    caption TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at),
    INDEX idx_user_phone (user_phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Photo tags (many-to-many relationship)
CREATE TABLE IF NOT EXISTS photo_tags (
    photo_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (photo_id, tag_id),
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    photo_id INT NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_phone VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
    INDEX idx_photo_id (photo_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Likes table (for photos and comments)
CREATE TABLE IF NOT EXISTS likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_phone VARCHAR(50) NOT NULL,
    photo_id INT NULL,
    comment_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_photo_like (user_phone, photo_id),
    UNIQUE KEY unique_comment_like (user_phone, comment_id),
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    INDEX idx_photo_id (photo_id),
    INDEX idx_comment_id (comment_id),
    CHECK ((photo_id IS NOT NULL AND comment_id IS NULL) OR (photo_id IS NULL AND comment_id IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    duration INT DEFAULT 0, -- in seconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Timeline events table
CREATE TABLE IF NOT EXISTS timeline_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    time VARCHAR(20) NOT NULL, -- e.g., "10:00 AM"
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    icon VARCHAR(50), -- emoji or icon name
    event_order INT DEFAULT 0, -- for custom ordering
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_event_order (event_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seats table
CREATE TABLE IF NOT EXISTS seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_number INT NOT NULL,
    seat_number INT NOT NULL,
    guest_name VARCHAR(255),
    guest_phone VARCHAR(50),
    rsvp_id INT NULL,
    status ENUM('empty', 'occupied', 'reserved') DEFAULT 'empty',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_seat (table_number, seat_number),
    FOREIGN KEY (rsvp_id) REFERENCES rsvps(id) ON DELETE SET NULL,
    INDEX idx_table_number (table_number),
    INDEX idx_guest_phone (guest_phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample timeline events
INSERT INTO timeline_events (time, title, description, location, icon, event_order) VALUES
('10:00 AM', '宾客到达', '欢迎宾客到达婚礼现场', 'Starview Restaurant', '🎊', 1),
('10:30 AM', '签到', '宾客签到并领取座位号', '接待处', '✍️', 2),
('11:00 AM', '婚礼仪式', '新人交换誓言', '主厅', '💒', 3),
('12:00 PM', '午宴开始', '享用美味佳肴', '宴会厅', '🍽️', 4),
('1:00 PM', '敬酒', '新人向宾客敬酒', '宴会厅', '🥂', 5),
('2:00 PM', '游戏环节', '互动游戏和抽奖', '宴会厅', '🎮', 6),
('3:00 PM', '切蛋糕', '新人切婚礼蛋糕', '主舞台', '🎂', 7),
('3:30 PM', '合影留念', '集体合影', '主舞台', '📸', 8),
('4:00 PM', '婚礼结束', '感谢宾客光临', 'Starview Restaurant', '👋', 9);

-- Insert sample videos
INSERT INTO videos (title, description, video_url, thumbnail_url, duration) VALUES
('婚礼预告片', '我们的爱情故事', 'https://example.com/video1.mp4', 'https://example.com/thumb1.jpg', 120),
('求婚瞬间', '他终于向我求婚了！', 'https://example.com/video2.mp4', 'https://example.com/thumb2.jpg', 180),
('婚纱照花絮', '拍摄婚纱照的幸福时光', 'https://example.com/video3.mp4', 'https://example.com/thumb3.jpg', 240);

-- Create sample seats (10 tables, 10 seats each)
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS create_sample_seats()
BEGIN
    DECLARE table_num INT DEFAULT 1;
    DECLARE seat_num INT DEFAULT 1;
    
    WHILE table_num <= 10 DO
        SET seat_num = 1;
        WHILE seat_num <= 10 DO
            INSERT INTO seats (table_number, seat_number, status) 
            VALUES (table_num, seat_num, 'empty');
            SET seat_num = seat_num + 1;
        END WHILE;
        SET table_num = table_num + 1;
    END WHILE;
END$$
DELIMITER ;

CALL create_sample_seats();
DROP PROCEDURE IF EXISTS create_sample_seats;

-- Insert sample tags
INSERT INTO tags (name, usage_count) VALUES
('#婚礼现场', 0),
('#美好瞬间', 0),
('#新郎新娘', 0),
('#幸福时刻', 0),
('#爱情故事', 0),
('#婚礼花絮', 0),
('#宾客合影', 0),
('#婚礼布置', 0);

