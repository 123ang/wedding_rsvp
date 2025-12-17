# Local API Setup - Fixed ✅

## API Configuration Updated

### Current Settings
- **Port**: Changed from `3002` to `3001` ✅
- **Base URL**: `http://192.168.100.3:3001/api`
- **Health Check**: `http://192.168.100.3:3001/health`

### Important Notes

1. **Don't use `localhost`** - Android devices can't access `localhost` on your computer
   - ❌ Wrong: `http://localhost:3001/api`
   - ✅ Correct: `http://192.168.100.3:3001/api` (use your computer's IP)

2. **Find Your IP Address**:
   - Windows: `ipconfig | findstr IPv4`
   - Mac/Linux: `ifconfig` or `ip addr`

3. **Update API Config** if your IP changes:
   - File: `mobile_app/src/config/api.js`
   - Change: `apiUrl: 'http://YOUR_IP:3001/api'`

### Testing

1. **Start your API**:
   ```bash
   cd api
   npm start
   # API should run on http://localhost:3001
   ```

2. **Verify API is running**:
   - Open browser: `http://localhost:3001/health`
   - Should return: `{ "status": "ok" }` or similar

3. **Test from mobile app**:
   - Open app → Settings → API 测试
   - Run "Health Check" test
   - Should connect to `http://192.168.100.3:3001/health`

### Troubleshooting

**"Cannot connect to API" error?**
- ✅ Check API is running: `http://localhost:3001/health`
- ✅ Check your IP hasn't changed: `ipconfig`
- ✅ Update `api.js` with correct IP
- ✅ Ensure phone and computer are on same WiFi network
- ✅ Check firewall isn't blocking port 3001

**Still not working?**
- Try accessing `http://YOUR_IP:3001/health` from your phone's browser
- If that works, the mobile app should work too
- If that doesn't work, check firewall/network settings

