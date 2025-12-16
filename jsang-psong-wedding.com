server {
    server_name jsang-psong-wedding.com www.jsang-psong-wedding.com;
    
    root /var/www/jsang-psong-wedding.com;
    index index.html;
    
    access_log /var/log/nginx/jsang-psong-wedding.com.access.log;
    error_log /var/log/nginx/jsang-psong-wedding.com.error.log;
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3002/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_send_timeout 5s;
        proxy_read_timeout 5s;
    }
    
    # Uploaded files (photos, etc.)
    location /uploads/ {
        alias /root/projects/wedding_rsvp/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
        
        # Allow CORS for uploaded files
        add_header 'Access-Control-Allow-Origin' '*' always;
    }
    
    # API Proxy (Node.js on port 3002)
    location /api/ {
        proxy_pass http://localhost:3002/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, x-admin-email, x-admin-id' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        
        # Handle OPTIONS requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, x-admin-email, x-admin-id';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
    
    # Frontend - React Router (SPA)
    location / {
        try_files $uri $uri/ /index.html;
        
        # Security headers for frontend
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|mp3|pdf|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
        
        # CORS for static assets
        add_header 'Access-Control-Allow-Origin' '*' always;
    }
    
    # Deny access to hidden files and directories
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Deny access to backup files
    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Security headers (applied to all responses)
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # SSL Configuration (managed by Certbot)
    listen [::]:443 ssl ipv6only=on;
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/jsang-psong-wedding.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jsang-psong-wedding.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name jsang-psong-wedding.com www.jsang-psong-wedding.com;
    
    # Redirect all HTTP to HTTPS
    return 301 https://$host$request_uri;
}
