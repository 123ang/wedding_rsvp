server {
    
    server_name jsang-psong-wedding.com www.jsang-psong-wedding.com;
    
    root /var/www/jsang-psong-wedding.com;
    index index.html;
    
    access_log /var/log/nginx/jsang-psong-wedding.com.access.log;
    error_log /var/log/nginx/jsang-psong-wedding.com.error.log;
    
    # Frontend - React Router (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|mp3|pdf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/jsang-psong-wedding.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/jsang-psong-wedding.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot


}

server {
    if ($host = www.jsang-psong-wedding.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    if ($host = jsang-psong-wedding.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    listen 80;
    listen [::]:80;
    
    server_name jsang-psong-wedding.com www.jsang-psong-wedding.com;
    return 404; # managed by Certbot




}